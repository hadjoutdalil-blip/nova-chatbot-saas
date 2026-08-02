# Réorganisation UI

## Base de Connaissances → 3 onglets (`kb/page.tsx`)
- **KB Experte** : inchangé
- **Documents contextuels** : import direct vectoriel retiré (déplacé)
- **Base Vectorielle** (nouveau) : import direct + statut d'indexation + bouton "Indexer documents + KB" avec vérification du déjà-indexé

## Paramètres → 2 onglets (`settings/page.tsx`)
- **IA par défaut** : configuration provider/modèle/confiance
- **RAG Vectoriel** : embedding provider, clé API, test connexion, migration globale

## API
- `GET /api/vector-index-status?clientId=xxx` — retourne docs/KB avec leur état d'indexation
- `POST /api/migrate-vector` — accessible aux clients pour leur propre client (plus besoin d'être admin)

## Fix : `ensureTable()` ne droppe plus la table automatiquement (`vector-store.ts`)
- Suppression du `DROP TABLE` dans `ensureTable()` — la table n'est plus jamais détruite automatiquement
- Nouvelle fonction `recreateTable()` exportée, utilisée uniquement par `migrate-vector` lors d'une migration complète (admin, sans clientId)
- La migration par client (bouton "Indexer documents + KB") n'affecte que les chunks de ce client
- Les données vectorielles ne peuvent plus être perdues par un redémarrage serveur / cold start

## FIX CRITIQUE : `vercel-build` supprimé (`package.json`)
- **CAUSE RACINE** de toutes les pertes de données vectorielles : la commande `prisma db push --accept-data-loss` dans `vercel-build`
- À chaque déploiement Vercel, cette commande DROP `document_chunks` car cette table n'est pas dans le schéma Prisma
- Remplacé par `prisma generate && next build` — ne touche plus à la base
- Les futures modifications du schéma Prisma doivent être appliquées manuellement via des scripts SQL directs (Neon console) ou via `npx prisma db push` local en prenant soin d'ajouter `document_chunks` à `.gitignore` du schéma ou d'utiliser `--skip-drop`

## 2026-07-21 — Ajout `greetingMsg` à `WidgetConfig`
Exécuter dans la console Neon (ou tout client SQL PostgreSQL) :
\`\`\`sql
ALTER TABLE "WidgetConfig" ADD COLUMN IF NOT EXISTS "greetingMsg" TEXT NOT NULL DEFAULT '';
\`\`\`

## 2026-07-27 — Ajout `widgetWidth/Height/maxWidth/maxHeight` à `WidgetConfig`
\`\`\`sql
ALTER TABLE "WidgetConfig" ADD COLUMN IF NOT EXISTS "widgetWidth" INTEGER NOT NULL DEFAULT 420;
ALTER TABLE "WidgetConfig" ADD COLUMN IF NOT EXISTS "widgetHeight" INTEGER NOT NULL DEFAULT 700;
ALTER TABLE "WidgetConfig" ADD COLUMN IF NOT EXISTS "widgetMaxWidth" INTEGER NOT NULL DEFAULT 820;
ALTER TABLE "WidgetConfig" ADD COLUMN IF NOT EXISTS "widgetMaxHeight" INTEGER NOT NULL DEFAULT 820;
\`\`\`

## 2026-07-27 — Table `PublicProposal` (questions libres par client)
\`\`\`sql
CREATE TABLE IF NOT EXISTS "PublicProposal" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "clientId" TEXT NOT NULL REFERENCES "Client"("id") ON DELETE CASCADE,
  "question" TEXT NOT NULL,
  "answer" TEXT NOT NULL DEFAULT '',
  "theme" TEXT NOT NULL DEFAULT '',
  "confidence" REAL NOT NULL DEFAULT 0,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "submitter" TEXT NOT NULL DEFAULT '',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "PublicProposal_clientId_idx" ON "PublicProposal"("clientId");
CREATE INDEX IF NOT EXISTS "PublicProposal_status_idx" ON "PublicProposal"("status");
CREATE INDEX IF NOT EXISTS "PublicProposal_theme_idx" ON "PublicProposal"("theme");
CREATE INDEX IF NOT EXISTS "PublicProposal_createdAt_idx" ON "PublicProposal"("createdAt");
\`\`\`

## 2026-07-27 — Google OAuth pour page propositions (`/proposals/[slug]`)
- La page `/proposals/[slug]` nécessite désormais une connexion via Google Gmail
- L'email Google est automatiquement utilisé comme `submitter` (lecture seule)
- **Configuration obligatoire** dans Google Cloud Console avant utilisation :
  1. Aller sur https://console.cloud.google.com/apis/credentials
  2. Créer un OAuth 2.0 Client ID (type : Web application)
  3. Ajouter `http://localhost:3000` (dév) et `https://votresite.com` (prod) dans **Authorized JavaScript origins**
  4. Copier le **Client ID** dans `.env` :
     ```
     NEXT_PUBLIC_GOOGLE_CLIENT_ID="xxx.apps.googleusercontent.com"
     GOOGLE_CLIENT_SECRET="GOCSPX-..."
     ```
- Le `GOOGLE_CLIENT_SECRET` n'est pas utilisé côté frontend (uniquement pour validation future côté serveur)
- API : `POST /api/auth/google` — vérifie l'idToken via `tokeninfo` endpoint et retourne `{ email, name, picture }`
- Frontend : Google Identity Services (`accounts.google.com/gsi/client`) chargé dynamiquement ; callback appelle l'API de vérification ; le token utilisateur est stocké dans `localStorage`

## 2026-07-30 — Fix widget embed "Erreur de réponse" sur Vercel (`embed/route.ts`)
- **CAUSE RACINE** : `chatUrl` était relatif (`/api/chat/${slug}`) ; quand le widget est embarqué sur un site externe, `fetch()` résout l'URL relative vers l'origine du site externe, pas vers Nova → la requête arrive sur un endpoint inexistant → réponse HTML → `res.json()` échoue → "Erreur de réponse"
- **FIX** : `chatUrl` est maintenant absolu (`${origin}/api/chat/${slug}`) où `origin = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin`
- Même correctif appliqué à `/api/feedback` (feedback widget) : stocké dans `var FU` dans le script
- **Configuration recommandée** : définir `NEXT_PUBLIC_APP_URL` dans les env vars Vercel (ex: `https://nova.app.com`) pour les cas où `req.nextUrl.origin` ne reflète pas l'URL publique (reverse proxy, CDN, etc.)

## 2026-08-02 — Vectorisation PDF + base vectorielle optimisée
- **PDF supportés** : upload via `client-documents` (accepte `application/pdf`, max 20 Mo), import web (`web-import`), et dossier local (file-watcher). Extraction du texte page par page via `unpdf` (`src/lib/pdf-extractor.ts`), texte stocké avec marqueurs `===== PAGE N =====`
- **Chunking amélioré** (`rag-utils.ts`) : découpage par pages / titres markdown / paragraphes, coupe aux limites de mots, overlap 15%
- **Index HNSW** remplace ivfflat (`m=16, ef_construction=64`) — se construit sur table vide, meilleur rappel
- **Colonne `metadata` JSONB** ajoutée automatiquement par `ensureTable()` (rétro-compatible). Contient `{docType, page}` pour les documents, `{docType:"kb", tag}` pour les KB
- **Insertions par lots** (100 lignes/requête) — ~10x plus rapide
- **halfvec optionnel** : `PG_VECTOR_HALF=1` dans l'env → stockage 2x compact (nécessite pgvector ≥ 0.7 / Neon). Après activation, relancer une migration complète
- **Ré-indexation des données existantes** :
  ```
  node node_modules/tsx/dist/cli.mjs scripts/reindex-pdfs.ts            # PDFs + docs re-vectorisés
  node node_modules/tsx/dist/cli.mjs scripts/reindex-pdfs.ts --client=<id>
  node node_modules/tsx/dist/cli.mjs scripts/reindex-pdfs.ts --pdfs-only
  node node_modules/tsx/dist/cli.mjs scripts/reindex-pdfs.ts --kb
  ```
- **Recherche filtrée** : `searchChunks(..., filterMetadata)` filtre par `metadata->>'docType'`, `metadata->>'page'`, etc.

## 2026-08-02 — Recherche vectorielle multilingue FR / EN / AR
- **Principe** : la recherche vectorielle traduit la question si nécessaire. D'abord, recherche dans la langue d'origine ; si le meilleur score < 0.55, la question est traduite en FR/EN/AR (une seule requête LLM, `src/lib/query-translate.ts`) puis chaque variante est embedée avec le MÊME fournisseur embedding et les résultats sont fusionnés (`searchChunksMultilingual` dans `vector-store.ts`, meilleur score par chunk dédupliqué sur le contenu)
- **Traduction** : clé IA du client (`selectApiKey` / `resolveApiKey`), prompt JSON `{"fr":"...","en":"...","ar":"..."}`, sigles préservés. Sans clé IA → recherche mono-langue
- **Arabic** : `norm()` préserve `[\u0600-\u06FF]` ; `extractKeywords`/`keywordMatch`/`bilingualHitCount` matchent par tokens (le `\b` JS est incompatible avec l'arabe, non-`\w`)
- **Dictionnaire bilingue FR↔EN** dans `rag-utils.ts` (`BILINGUAL_TERMS`) : boost dans `findBestChunks` pour matcher une question française contre des docs anglais (et inversement)
- **Endpoints mis à jour** : `chat/[slug]` (4 chemins RAG : streaming/non-streaming × normal/ragOnly), `client-documents/test-rag`, `vector-store` POST (test recherche)
- Le `norm()` accepte désormais les lettres unicode (`\p{L}`)
