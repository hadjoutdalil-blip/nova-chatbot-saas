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
\`\`\``
