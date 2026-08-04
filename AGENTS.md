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

## 2026-08-04 — Fix expansion de sigles dans `QUERY_EXPANSIONS` (`src/lib/rag-utils.ts`)
- **CAUSE RACINE** : `\bai\b` matche `"AI"` à l'intérieur d'un sigle composé comme `AI&DS` (le `&` est une frontière de mot `\b`) → `expandSearchQuery` ajoutait « intelligence artificielle artificial intelligence » → les chunks IA génériques envahissaient le top 10 et évinçaient les chunks de chapitres du module demandé (ex : question « chapitres du module NLP dans le programme AI&DS » → réponse limitée aux chapitres 4-5).
- **FIX** : tous les patterns de `QUERY_EXPANSIONS` passent par `acroPattern(term)` = `(?<![a-zA-Z0-9])term(?![a-zA-Z0-9&-])` (insensible casse) au lieu de `\bterm\b` — un sigle n'est plus étendu quand il est collé à `&` ou `-` (`AI&DS`), mais l'est toujours s'il est isolé (`programme AI`, `module IA`).
- **Vérifié** : question « Chapitres du module NLP dans le programme AI&DS » → 5 chunks TALN dans le top 10 hybride (objectifs, semestre, chapitres 1-3, 4-5, 7). Le Chapitre 6 (RAG, `chunk_410`) reste mal classé (cosine faible ~0.676, rank 190/500) — problème d'embedding distinct, non corrigé ici.

## 2026-08-04 — Récupération des chapitres manquants via gap-filling + stemming pluriel
- **CAUSE** : le Chapitre 6 (RAG, `chunk_410`) a un embedding faible (cosine ~0.676, rank 190/500) car son contenu (« Génération augmentée par récupération », « embeddings », « bases vectorielles ») ne partage aucun terme avec la requête « chapitres du module NLP ». Il n'entrait jamais dans les 40 candidats du re-ranking hybride.
- **FIX 1 — Gap-filling structurel** (`src/lib/vector-store.ts`) : quand la requête contient `chapitre` et que le topN hybride contient ≥2 chunks consécutifs d'un même document (même `docId`, indices `chunk_N` à ≤4 d'écart), on interroge les chunks `Chapitre N` manquants à l'intérieur du run (fenêtre ±2) et on les insère avec un bonus `+0.03`. Détection limitée au topN hybride (pas aux 40 candidats) pour ne pas combler les runs d'autres modules.
- **FIX 2 — Stemming pluriel dans `keywordMatch`** (`src/lib/chunk-utils.ts`) : singularisation légère (« chapitres »→« chapitre », « données »→« donnee ») pour que les mots-clés indexés au singulier matchent les pluriels de la question.
- **Vérifié** : question « Quels sont les chapitres du module NLP dans le programme AI&DS ? » → 6 chunks TALN dans le top 10 couvrant les chapitres 1 à 7 (407 objectifs, 406 semestre, 409 chap 4-5, 408 chap 1-3, 411 chap 7, 410 chap 6). Question « Comment fonctionne le RAG dans le module NLP ? » → `chunk_410` au rank 2. Pas de régression sur « Qu'est-ce que le deep learning ? ».
