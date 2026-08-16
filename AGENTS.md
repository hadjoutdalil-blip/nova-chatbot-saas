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

## 2026-08-04 — Chunking sémantique par modules (en-têtes `Semestre`/`Unité`/`Matière`) (`src/lib/rag-utils.ts`)
- **CAUSE** : `splitIntoBlocks` ne reconnaissait que les marqueurs de page (`===== PAGE N =====`), les titres markdown (`#`) et les paragraphes. Les en-têtes d'offre de formation (`**Semestre : S4**`, `**Unité d'enseignement : UEM 1.4.1**`, `**Matière 5 : Systèmes multi-agents**`) n'étaient PAS des frontières → `chunk_354` mélangeait la fin du module précédent (Méthode d'évaluation + Références « représentation des connaissances ») avec l'en-tête du module SMA → mots-clés indexés `[methode, evaluation, examen, controle, continu, references, bibliographiques]` (sans « multi-agents »), embedding dilué, rank 7/10 → la réponse « Semestre : S4 » était noyée et le LLM s'est fié au chunk « Agents TALN » (rank 4).
- **FIX** : nouveaux patterns `MODULE_HEADER_RE` (`Semestre :` / `Unité d'enseignement :` / `Matière N :` = **frontière de chunk**, flag `moduleStart`) et `SECTION_HEADER_RE` (`Chapitre N :`, `Objectifs du cours`, `Méthode d'évaluation`, `Références bibliographiques`, `Connaissances préalables recommandées` = section sans frontière). Dans `chunkDocument`, `flush()` est forcé à chaque `moduleStart` → **un chunk ne contient plus jamais deux modules**. Les lignes d'en-tête consécutives (Semestre→Unité→Matière) restent dans le même bloc module.
- **Re-indexation nécessaire** : le contenu source du doc n'existant plus en base, reconstruction par concaténation des chunks existants (aucun overlap réel, join `\n\n`) puis `syncDocumentChunks`. Utiliser `node node_modules/tsx/dist/cli.mjs scripts/reindex-pdfs.ts --client=<id>` pour les docs dont le contenu est encore stocké.
- **Vérifié** : question « Dans quel semestre étudie-t-on les Multi-Agent Systems ? » → `chunk_294` (« Semestre : S4 … Matière 5 : Systèmes multi-agents ») au **rank 1** (avant : rank 7), keywords `[systemes, agents, cours, multi, semestre, unite, enseignement]`. 7 chunks SMA / 10 dans le top. Pas de régression : NLP chapitres (9 TALN / 10), RAG (chapitre 6 au rank 2), deep learning inchangé.

## 2026-08-04 — Fix classification d'intention AI + provider pour modèles "reasoning" (Cerebras `gpt-oss-120b`)
- **CAUSE RACINE (réponse "pas directement lié à notre solution SaaS… Nova Chatbot" à 13:26)** : la réponse provenait du chemin intent HORS_SUJET / RAG sans chunks pertinents — la base vectorielle n'était pas encore re-indexée à ce moment-là (les chunks mélangeaient les modules). Après re-indexation, le RAG répond correctement (Semestre S4). Le texte « Nova Chatbot — Solution SaaS de chatbot IA multi-tenant » vient du `pageTitle` (`layout.tsx`) injecté par `buildContext` dans les prompts RAG/intent/escalade.
- **Bug secondaire — classification IA inopérante** (`src/lib/intent-detector.ts`) : `classifyIntentWithAI` envoyait `max_tokens: 10`. Le modèle Cerebras `gpt-oss-120b` est un modèle *reasoning* : il consomme ~200-400 tokens de raisonnement avant de produire `content`. Avec 10 tokens → `content` toujours vide (`finish_reason:"length"`), vérifié 6x → la fonction retombait systématiquement sur `REQUETE_METIER`. **FIX** : `max_tokens: 300` + prompt de classification **générique** (plus durci CETIM « essais/normes/laboratoires ») : METIER = tout sujet de formation/programme/module/semestre/école, y compris les concepts techniques du domaine.
- **Bug — override intent trop agressif** (`route.ts`) : `classifyIntentWithAI` pouvait écraser une intention regex `REQUETE_METIER` (confiance 1.0) par un `HORS_SUJET` IA (confiance 0.8) et court-circuiter le RAG. **FIX** : nouvelle garde `shouldOverrideIntent()` — on ne remplace plus `REQUETE_METIER` par `HORS_SUJET`, ni par une IA moins confiante ; appliquée aux chemins streaming ET non-streaming.
- **Bug — `max_tokens` trop bas pour modèles reasoning** : `positionAndReformulate` (120), prompts intent (300), `compareWithAI` (10) → réponse tronquée/vide. **FIX** : 400 / 600 / 300.
- **Bug latent — provider incohérent** : `providerId = client.aiProvider || detectProvider(key).id` utilisait "groq" (valeur du client) alors que la clé résolue était cerebras → appel vers l'endpoint Groq avec une clé Cerebras → échec. **FIX** : toujours `detectProvider(keyEntry.key).id`.
- **À noter** : le client SAIEP LITAN a un champ déprécié `apiKey` (gsk_…) encore **prioritaire** dans `resolveApiKey` (fallback l.629) — les appels IA utilisent donc la clé Groq dépréciée, pas la clé Cerebras active de la table `ApiKey`. Fonctionnel mais incohérent ; nettoyer le champ `apiKey` du client si on veut utiliser la clé Cerebras.

## 2026-08-05 — Fix déploiement VM école : erreur `P2021` `public.ClientLocalDoc does not exist`
- **CAUSE RACINE** : la VM utilise `npx prisma migrate deploy` mais `prisma/migrations/` ne contient que **8 migrations historiques** (init, add_pgvector, add_widget_fields, add_embedding_usage, add_embedding_keys, add_keyword_threshold, add_embedding_provider, add_kb_source_fields). Tous les modèles ajoutés ensuite dans `schema.prisma` ont été appliqués en dev via `prisma db push` (commit `90efa66` « web import, local import, doc manager ») → **jamais migrés** → tables absentes sur la VM.
- **Tables manquantes sur la VM** : `ClientLocalDoc`, `ClientDocument`, `ApiKey`, `ActivityReport`, `QualityAlert`, `KnowledgeGap`, `PendingKBEntry`, `PublicProposal`, `AIUsageLog`, `MessageFeedback`, `LocalImportFile`.
- **Colonnes manquantes** : `Client.siteUrl`, `Client.useVectorRag`, `Client.hfApiKey`, `WidgetConfig.greetingMsg`/`buttonAnimation`/`buttonLabel`/`buttonLabelDuration`/`buttonIcon`/`aiColor`/`widgetWidth`/`widgetHeight`/`widgetMaxWidth`/`widgetMaxHeight`, `Conversation.title`/`ipAddress`/`country`/`city`/`updatedAt`.
- **FIX** : nouveau script **idempotent** `scripts/sync-schema.sql` (tout en `IF NOT EXISTS` + garde par `pg_constraint` pour les FK) qui resynchronise la base VM avec `schema.prisma` sans toucher `document_chunks`. À exécuter sur la VM après chaque `git pull` :
  ```
  PGPASSWORD='...' psql -U nova_user -h localhost -d nova_chatbot -f scripts/sync-schema.sql
  ```
- **NE PAS** lancer `prisma migrate deploy` ni `db push --accept-data-loss` avec la migration `add_pgvector` sur une base contenant `document_chunks` : `add_pgvector/migration.sql` fait `DROP TABLE IF EXISTS document_chunks` avant recréation → perte des vecteurs.
- **NON CORRIGÉ ici** : l'historique `_prisma_migrations` de la VM reste « dérivé » (migration locale `add_conversation_fields` supprimée du repo par commit `4c3a08d`). `prisma migrate status` sur la base Neon dev est en drift : 5 migrations locales non appliquées + 1 migration en base absente du repo. Si un jour on veut un historique propre, refaire un baseline `migrate reset`/squash — à faire avec prudence à cause de `document_chunks`.

## 2026-08-05 — Garde-fou anti-hallucination de la reformulation RAG (`positionAndReformulate`, `src/app/api/chat/[slug]/route.ts`)
- **CAUSE RACINE** : question « Dans quel semestre étudie-t-on les Multi-Agent Systems ? » → réponse ESCALADE (« je n'ai pas trouvé de réponse précise »). Le chunk SMA (`Matière 5 : Systèmes multi-agents`, Semestre S4) existe en base (LITAN, `Offre_de_formation_IA_DS_ESTIN_FR.txt`) et la recherche vectorielle sur la question **brute** le classe en **#1** (score 0.56). Mais la reformulation IA (`positionAndReformulate`) la transformait en « Quels sont les modules du **Semestre 3** (spécialisation IA & SD) ? » → le terme **multi-agents disparaît** et **Semestre 3 est halluciné** (faux, c'est S4) → le chunk SMA sort du top-10 → le LLM RAG renvoie NO_MATCH → ESCALADE.
- **FIX** : garde-fou dans `positionAndReformulate` — après parsing du JSON, on extrait les mots-clés de la question originale (`extractKeywords`, longueur > 3) et on vérifie qu'au moins **60%** sont présents dans la reformulation normalisée. Sinon la reformulation est **rejetée** : on conserve le `theme` mais la requête de recherche redevient la question brute.
- **Validé** : SMA → reformulation rejetée (2/6 mots gardés) → chunk SMA #1 ; « Quels sont les chapitres du module NLP dans le programme AI&DS ? » → gardée (3/4) → identique à avant ; « Comment fonctionne le RAG dans le module NLP ? » → gardée (2/2) ; « Qu'est-ce que le deep learning ? » → rejetée → question brute + expansion `apprentissage profond` → cohérent. `tsc --noEmit` + `next build` OK.

## 2026-08-05 — Fix RAG renvoyant la réponse KB brute à 60% : rate-limit Groq 429 avalé silencieusement
- **SYMPTÔME** : widget LITAN renvoie « ✓ 60% Base de connaissances » (réponse KB hors-sujet) au lieu d'une réponse RAG sourcée pour « Comment l'IA est-elle appliquée à la Smart Healthcare ? » et « Dans quel semestre… Multi-Agent Systems ? ».
- **CAUSE RACINE** : la clé IA de LITAN est le champ déprécié `client.apiKey` (Groq `gsk_…`, org `org_01kpk2…`, tier `on_demand`) limité à **6000 TPM**. Le prompt RAG avec 10 chunks demande ~**2675 tokens** par appel. Dès 2-3 requêtes/minute (reformulation + RAG), le quota TPM est saturé → Groq renvoie **429** « Rate limit reached … Please try again in 6.44s ». `streamAIResponse` (`route.ts`) avait un `catch { return null; }` **silencieux** → le RAG échouait sans log → fallback `sendDirect(kbFallback, "kb")` (ligne 1122) → réponse KB brute à 60%. Comportement **intermittent** (2 succès / 1 échec sur la même question), confirmé par le trace en base (`rag_only_search` → `direct_response` en ~108ms, les succès prennent 1500-2000ms).
- **FIX 1 — Retry + backoff** (`route.ts`) : `streamAIResponse` (streaming) et `callAI` (non-streaming) font maintenant **2 tentatives** et loguent l'erreur réelle. Nouvelle fonction `parseRetryDelay(msg)` qui extrait le délai d'un message 429 (« in 6.44s ») et attend `délai+1s` (plafonné à 10s) avant de réessayer.
- **FIX 2 — Réduction de la charge** : `topNChunks` de LITAN passé de **10 → 6** en base → prompt RAG ~1600 tokens au lieu de ~2675 → ~2x plus de requêtes avant d'atteindre le TPM.
- **Validé de bout en bout** (serveur dev + POST `/api/chat/LITAN` streaming et non-streaming) : la même question renvoie désormais `source:"rag"` avec citations `[6]` (Chapitre 4 : IoT pour la santé et le bien-être), réponse sourcée correcte. Sans le backoff, le 429 reproduisait systématiquement la réponse KB.
- **Recommandation** : passer LITAN à la clé Cerebras active (`ApiKey` cerebras, `limit=0` illimité, modèle `gpt-oss-120b`) en nettoyant `client.apiKey` et en mettant `aiProvider=cerebras` — sinon le tier free Groq 6000 TPM continuera de provoquer des latences (backoff) sous charge.

## 2026-08-06 — Fix RAG « aucune information » / mauvais chunk : index ANN approximatif supprimé
- **SYMPTÔME** : question LITAN « Qu'est-ce que l'apprentissage par renforcement (Reinforcement Learning) en S5 ? » → réponse RAG « aucune information » ne citant que la « Références bibliographiques » (Sutton & Barto, `chunk_417`) au lieu du module RL. Pourtant le module existe : `chunk_410` (Objectifs, UEF 1.5.1, Matière 1) est le **#1 cosinus** (0.8007), `chunk_412` (Chapitre 1) #3 (0.7877), `chunk_415` (Chapitre 5 TD) #12.
- **CAUSE RACINE** : l'index `idx_document_chunks_embedding` sur `document_chunks` était **ivfflat (`lists=100`)**, pas HNSW — le `CREATE INDEX IF NOT EXISTS … USING hnsw` de `ensureTable` (`vector-store.ts`) est un **no-op** car l'ancien index existait déjà. ivfflat est **approximatif** : il n'explore qu'une partie des 100 lists → le vrai plus proche voisin (cosinus #1) est **exclu des candidats pré-re-ranking** quand le `LIMIT` est petit (topN=6 → LIMIT 24 ; chunk_410 absent ; topN=24 → LIMIT 96 ; chunk_410 présent). L'index est aussi **global multi-clients** (filtre `clientId` appliqué APRÈS le scan ANN, confirmé par `EXPLAIN` : `Index Scan … Filter: clientId`). Le re-ranking hybride ne peut pas récupérer un chunk absent des candidats.
- **FIX** : suppression définitive de l'index ANN. Table petite (3634 chunks, 2 clients) → le **scan séquentiel exact** (`ORDER BY embedding <=> $1` sans index) coûte ~ms et **garantit** le classement cosinus exact.
  - `src/lib/vector-store.ts` : bloc `CREATE INDEX … USING hnsw` retiré de `ensureTable()` **et** de `recreateTable()` (sinon le serveur le recréerait au cold start) ; constante `COSINE_OPS` supprimée.
  - Base (Neon dev, déjà exécuté) + `scripts/sync-schema.sql` (pour la VM) : `DROP INDEX IF EXISTS idx_document_chunks_embedding;`
- **Validé** : `searchChunks` topN=6 renvoie désormais `chunk_410` (#4 hyb 0.5302), `chunk_412` (#5), `chunk_415` (#6) + KB pertinentes (ia_sd_modules, ia_sd_faq) et la table RH mentionnant RL. POST `/api/chat/LITAN` ragOnly streaming **et** non-streaming → `source:"rag"`, 6 citations, réponse complète (UEF 1.5.1 S5, Objectifs, Chapitre 1 bandit/UCB, Chapitre 5 Sarsa/Q-learning). `tsc --noEmit` OK.
- **À noter** : `chunkId` est une numérotation **par document** (plusieurs `chunk_057` légitimes dans des docs différents) — pas un doublon. En flux complet (non-ragOnly), la comparaison QA vs RAG peut légitimement choisir la réponse KB (score 60) si elle est jugée meilleure.
- **Si le volume grandit** (> ~50k chunks), réintroduire un index ANN est possible mais en **péri-client** impossible (pgvector ne supporte pas les index composites) ; préférer à ce moment-là un scan exact par sous-ensemble (`clientId` filtrable avant le `ORDER BY`).

## 2026-08-15 — Catalogue produits par client (promotion proactive avec illustrations)
- **Modèle `Product`** (`prisma/schema.prisma`) + relation `Client.products Product[]` + `@@index([clientId])`. Appliqué en base via `scripts/sync-schema.sql` **et** déjà exécuté sur Neon (ne pas utiliser `prisma db push`).
- **UI** : composant partagé `src/components/admin/ProductManager.tsx` (CRUD + upload image + toggle actif + ordre) ; onglet **Catalogue** ajouté à `app/kb/page.tsx` (client connecté) et `dashboard/clients/[id]/kb/page.tsx` (admin).
- **API** : `GET/POST /api/products` (liste/création, scoping par `clientId` si admin), `PUT/DELETE /api/products/[id]` (mise à jour partielle OK, re-valide le nom seulement s'il est fourni), `POST /api/products/upload-image` (png/jpg/jpeg/webp/gif ≤ 2 Mo), `GET /api/catalog-images/[slug]/[filename]`.
- **Indexation vectorielle** : `syncProductChunks` dans `vector-store.ts` (1 chunk/produit, `chunkId = prod_<id>`, `metadata {docType:"catalog", productId, imageUrl, price, category}`) ; `autoIndexProduct`/`autoDeleteProduct` déclenchés par les routes produits. `migrate-vector` gère `type:"products"` et `vector-index-status` expose `totalProducts/indexedProducts`.
- **Chat** (`route.ts`) : nouveau chemin **déterministe (0 token LLM)** testé AVANT le RAG/escalade dans les handlers streaming ET non-streaming :
  - `detectCatalogKeyword(question)` → mots-clés catalogue/prix/produit.
  - Garde : le catalogue prime sauf si match KB **sémantique fort** (`score >= kbThreshold && !isKeyword`) — un match mot-clé KB ne bloque plus la promotion produits.
  - `scoreCatalogProducts` (mots-clés/nom/catégorie, frontières de mots via `wordInQuery` + pluriel `s?`), cap 6, fallback premiers produits si aucun match.
  - `buildCatalogResponse` → réponse markdown avec `![Nom](URL)` pour chaque produit (URL **exactes** stockées en base, jamais inventées) — `source:"catalog"`, suggestions = noms produits.
  - Chemin **LLM optionnel** uniquement si `isOpenProductQuestion` (recommande/suggère/meilleur/adapté…) → `buildCatalogPrompt` (bloc compact ≤ 6 produits), max_tokens 600.
  - **RAG corpus** : `productsToChunks` ajoute les produits actifs aux chunks keyword (`findBestChunks`) et la gate `hasAnyDoc` inclut `hasProduct` (un client avec UNIQUEMENT des produits déclenche le RAG). `buildRAGPrompt` affiche l'image d'un chunk quand `metadata.docType==="catalog"`.
- **Widget** (`embed/route.ts`) : images markdown rendues dans les bulles (regex image AVANT le regex lien) + CSS `.nmsg-bbl img{max-width:100%;border-radius:12px}`.
- **Stockage des images produits** : `upload-image` tente d'abord `saveFile` (Vercel Blob si configuré, sinon `data/images/<slug>/` en local/VM). **Fallback base de données** si `saveFile` échoue (ex : Vercel sans `BLOB_READ_WRITE_TOKEN` → erreur 500) : table `ProductImage` (modèle Prisma `ProductImage`, `scripts/sync-schema.sql`, déjà appliqué sur Neon). `catalog-images` sert depuis la base (priorité) puis disque local (legacy) — plus de 404 sur Vercel. Suppression des lignes `ProductImage` si on change d'approche.
- **Bug évité** : `t.includes(kw)` matchait « blé » dans « dispo**ble**s » → un seul produit retourné pour « Quels sont vos produits disponibles ? » ; remplacé par `wordInQuery` (frontière + pluriel).
- **Validé** (serveur dev + POST `/api/chat/CEVITAL`, produits de test supprimés ensuite) : « Quels sont vos produits disponibles ? » → `source:"catalog"` avec 4 produits ; « Quel est le prix de la margarine végétale ? » → margarine seule ; « Quel produit me recommandez-vous pour la pâtisserie ? » → chemin LLM Groq avec tableau de 2 produits. `tsc --noEmit` + `next build` OK.
- **Limite connue** : une question par nom de produit SANS mot-clé catalogue (ex « Parlez-moi de l'huile d'olive ») passe par le RAG hybride ; si le client a du vectoriel indexé, le chunk produit n'est trouvé que s'il a été vectorisé via l'API (pas l'insertion SQL brute).

## 2026-08-16 — FIX CRITIQUE widget : regex image markdown invalide cassait TOUT l'embed (`embed/route.ts`)
- **SYMPTÔME** : le widget ne s'affiche sur AUCUN site (« ne s'affiche pas sur tous ») après le commit catalogue. Le bouton flottant `#nb` n'est jamais créé.
- **CAUSE RACINE** : le script du widget est servi depuis un **template literal (backticks)** dans `route.ts`. Dans un template literal, une séquence d'échappement inconnue type `\[` est un *identity escape* : le backslash est **consommé** à la compilation → le script servi contient `![(...` au lieu de `!\[(...`. La regex d'image ajoutée par le commit catalogue (`/!\[([^\]]*)\]\(([^)]+)\)/g`) était écrite avec des backslashes SIMPLES (contrairement aux autres regex du fichier qui utilisent `\\`). Une fois servie, elle devient `![([^]]*)](([^)]+))` → **SyntaxError « Unmatched ')' »** → tout le script ne compile pas → le widget ne monte nulle part.
- **FIX** : ligne 566 → `s.replace(/!\\[([^\\]]*)\\]\\(([^)]+)\\)/g, ...)` (double backslash, comme les regex `\\*\\*`/`\\[` existantes). Le script servi recompile et le widget monte (vérifié : bouton 66px visible, carte 420×629, message envoyé, image `<img>` rendue dans la bulle).
- **RÈGLE pour tout ajout de regex dans ce template literal** : toujours `\\` pour produire `\` dans le script servi (jamais `\` seul). Vérifier après coup : `new Function(scriptServi)` doit compiler sans erreur.
- **Le reste des regex (gras/liens/citations) était déjà correct** (`\\` dans le source → `\` dans le servi).

## 2026-08-16 — Auto-indexation des entrées KB + onglet « Base Vectorielle » côté client (`app/kb/page.tsx`)
- **Auto-indexation KB = identique aux produits** : `autoIndexKBEntry`/`autoDeleteKBEntry` (`vector-store.ts`) déjà déclenchés sur création/modification/suppression (`/api/kb`, `/api/kb/[id]`), transfert docs→KB (`transfer-to-kb`), import JSON (`import-kb`), feedback (`/api/feedback`) et propositions (`clients/[id]/proposals`) — 1 chunk par entrée (`chunkId = kb_<id>`, `metadata {docType:"kb", tag}`). Garde `client.useVectorRag` + clé embedding requise.
- **Onglet « Base Vectorielle » ajouté à la page client** `src/app/app/kb/page.tsx` (4e onglet, comme l'admin) : statut `indexedDocs/totalDocs`, `indexedKB/totalKB`, `indexedProducts/totalProducts` via `GET /api/vector-index-status?clientId=` + bouton « Indexer documents + KB » → `POST /api/migrate-vector` avec son propre `clientId` (déjà autorisé pour un client non-admin sur son compte). Affiche la liste des docs/entrées non indexés.
- **Important** : les entrées KB créées AVANT le câblage auto (ex : les 33 entrées CEVITAL) restaient à 0 indexées — le bouton permet de les rattraper en masse (`migrate-vector` type `all` par client).
- **Validé** (serveur local + API) : création KB → auto-indexée (34/34), suppression → désindexée (33/33), `migrate-vector` en tant que client pour son propre client → 33 entrées indexées. `tsc --noEmit` + `next build` OK.
