# Guide de déploiement — Nova Chatbot SaaS

> Serveur virtuel école — Ubuntu/Debian Linux

---

## 1. Prérequis

### Ressources serveur

| Ressource | Minimum | Recommandé |
|---|---|---|
| RAM | 1 Go | 2-4 Go |
| CPU | 1 vCPU | 2 vCPUs |
| Stockage | 5 Go | 10-20 Go |
| OS | Ubuntu 22.04+ / Debian 12 | Ubuntu 24.04 LTS |
| Domaine | Nom de domaine ou sous-domaine | Avec SSL (Let's Encrypt gratuit) |

### Outils à installer

| Outil | Version | Rôle |
|---|---|---|
| Node.js | 20.x LTS | Runtime de l'application |
| npm | (inclus avec Node) | Gestion des dépendances |
| PostgreSQL | 14+ | Base de données |
| Nginx | latest | Reverse proxy + SSL |
| PM2 | latest | Process manager (garde l'application alive) |
| certbot | latest | Certificat SSL gratuit (Let's Encrypt) |
| git | latest | Cloner le dépôt |

---

## 2. Installation du serveur

### 2.1 Mise à jour du système

```bash
sudo apt update && sudo apt upgrade -y
```

### 2.2 Node.js 20 LTS

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node --version   # v20.x
npm --version    # 10.x
```

### 2.3 PostgreSQL

```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 2.4 Nginx + Certbot

```bash
sudo apt install -y nginx certbot python3-certbot-nginx
```

### 2.5 Git

```bash
sudo apt install -y git
```

---

## 3. Configuration de la base de données

### 3.1 Créer l'utilisateur et la base

```bash
sudo -u postgres psql
```

Dans la console PostgreSQL :

```sql
CREATE USER nova_user WITH PASSWORD 'motdepassefort';
CREATE DATABASE nova_chatbot OWNER nova_user;
GRANT ALL PRIVILEGES ON DATABASE nova_chatbot TO nova_user;
\q
```

Tester la connexion :

```bash
psql -U nova_user -d nova_chatbot -h localhost
# (mot de passe demandé)
```

---

## 4. Déploiement de l'application

### 4.1 Cloner le dépôt

```bash
cd /var/www
sudo git clone <url-du-repo> nova-chatbot-saas
sudo chown -R $USER:$USER nova-chatbot-saas
cd nova-chatbot-saas
```

### 4.2 Fichier d'environnement

```bash
cat > .env << 'EOF'
DATABASE_URL="postgresql://nova_user:motdepassefort@localhost:5432/nova_chatbot?sslmode=disable"
JWT_SECRET="<generer-une-chaine-aleatoire-64-caracteres>"
NODE_ENV=production
EOF
```

Générer un `JWT_SECRET` fort :

```bash
openssl rand -base64 48
```

### 4.3 Installer les dépendances

```bash
npm install
```

Cette commande exécute automatiquement `prisma generate` (via `postinstall`).

### 4.4 Migrations de la base de données

```bash
npx prisma migrate deploy
```

> Utiliser `migrate deploy` (pas `db push`) pour un suivi d'historique en production.

### 4.5 Données initiales (seed)

```bash
npm run seed
```

Ce script crée :
- Un utilisateur admin
- Un client par défaut
- Les données de démonstration (si configurées)

### 4.6 Build

```bash
npm run build
```

> Le build Next.js peut consommer 1-2 Go de RAM. Prévoir du swap si nécessaire.

### 4.7 Lancement avec PM2

```bash
sudo npm install -g pm2
pm2 start npm --name "nova-chatbot" -- start
pm2 save
pm2 startup
```

La commande `pm2 startup` affiche une instruction à exécuter pour activer le redémarrage automatique au boot.

---

## 5. Reverse proxy Nginx + SSL

### 5.1 Configuration Nginx

Créer `/etc/nginx/sites-available/nova-chatbot` :

```nginx
server {
    listen 80;
    server_name chatbot.votreecole.fr;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name chatbot.votreecole.fr;

    ssl_certificate /etc/letsencrypt/live/chatbot.votreecole.fr/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/chatbot.votreecole.fr/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    client_max_body_size 50M;
}
```

> `client_max_body_size 50M` est nécessaire pour les uploads de documents (RAG).

### 5.2 Activer le site

```bash
sudo ln -s /etc/nginx/sites-available/nova-chatbot /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 5.3 Certificat SSL (Let's Encrypt)

```bash
sudo certbot --nginx -d chatbot.votreecole.fr
```

Renouvellement automatique (certbot l'installe par défaut) :

```bash
sudo certbot renew --dry-run
```

---

## 6. Vérification post-déploiement

### 6.1 Accès à l'application

| Accès | URL |
|---|---|
| Page de connexion | `https://chatbot.votreecole.fr/login` |
| Dashboard admin | `https://chatbot.votreecole.fr/dashboard` |
| Widget embed | `https://chatbot.votreecole.fr/api/widget/<slug>/embed` |
| API santé | `https://chatbot.votreecole.fr/api/health` (si existant) |

### 6.2 Commandes de diagnostic

```bash
# Statut des services
systemctl status postgresql
systemctl status nginx
pm2 status

# Logs de l'application
pm2 logs nova-chatbot

# Test de connexion à la base
psql -U nova_user -d nova_chatbot -h localhost -c "SELECT 1"
```

---

## 7. Points d'attention spécifiques

### 7.1 Adaptateur Neon

Le code utilise `@prisma/adapter-neon` (conçu pour Neon serverless). Sur un PostgreSQL standard, cela fonctionne mais si des erreurs de connexion apparaissent, modifier `src/lib/db.ts` :

```typescript
// AVANT (avec Neon)
import { PrismaNeon } from "@prisma/adapter-neon";
const adapter = new PrismaNeon({ connectionString });
return new PrismaClient({ adapter });

// APRÈS (sans Neon, PostgreSQL standard)
return new PrismaClient();
```

### 7.2 Géolocalisation

L'application appelle `ip-api.com` (gratuit, limité à 45 req/min). Si le réseau de l'école bloque cette API, la géolocalisation échoue silencieusement — l'application continue de fonctionner normalement sans elle.

### 7.3 Clés API IA

Le chatbot nécessite au moins **une clé API** pour fonctionner. Les providers supportés :

| Provider | Préfixe clé | Clé gratuite ? |
|---|---|---|
| **Groq** | `gsk_` | Oui (limitée en débit) |
| **Cerebras** | `csk_` | Oui |
| **xAI (Grok)** | `xai-` | Payant |
| **Google Gemini** | `AIza` | Oui (limite gratuite) |

Configuration après déploiement dans `/dashboard/clients/[id]` → onglet **"Clés API"**.

### 7.4 Swap (si mémoire insuffisante)

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

Ajouter dans `/etc/fstab` : `/swapfile none swap sw 0 0`

### 7.5 Firewall

```bash
sudo ufw allow 22/tcp       # SSH
sudo ufw allow 80/tcp       # HTTP
sudo ufw allow 443/tcp      # HTTPS
sudo ufw enable
```

---

## 8. Maintenance

### Mise à jour de l'application

```bash
cd /var/www/nova-chatbot-saas
git pull
npm install
npx prisma migrate deploy
npm run build
pm2 restart nova-chatbot
```

### Sauvegarde de la base de données

```bash
pg_dump -U nova_user -h localhost nova_chatbot > backup-$(date +%Y%m%d).sql
```

### Logs

```bash
# Application
pm2 logs nova-chatbot

# Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# PostgreSQL
sudo tail -f /var/log/postgresql/postgresql-*-main.log
```
