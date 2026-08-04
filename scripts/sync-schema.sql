-- =============================================================================
-- Nova Chatbot SaaS — Synchronisation du schéma VM → schema.prisma
-- =============================================================================
-- CORRIGE LE P2021 « table X does not exist » sur la VM (déploiement école).
--
-- Pourquoi ce script existe :
--   La VM est déployée avec `npx prisma migrate deploy`, mais le dossier
--   prisma/migrations ne contient QUE les anciennes migrations (init, pgvector,
--   champs embedding/widget). Toutes les tables/modèles ajoutés ensuite dans
--   schema.prisma (ClientLocalDoc, ClientDocument, ApiKey, ActivityReport,
--   QualityAlert, KnowledgeGap, PendingKBEntry, PublicProposal, AIUsageLog,
--   MessageFeedback, LocalImportFile) et les colonnes ajoutées aux tables
--   existantes ont été appliquées en dev via `prisma db push`, jamais en
--   migration → la base de la VM ne les possède pas → erreurs P2021 au runtime.
--
-- Ce script est IDEMPOTENT (IF NOT EXISTS / ADD COLUMN IF NOT EXISTS) :
--   il peut être relancé sans risque.
--
-- Exécution sur la VM :
--   cd /var/www/nova-chatbot-saas
--   PGPASSWORD='motdepassefort' psql -U nova_user -h localhost -d nova_chatbot -f scripts/sync-schema.sql
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Colonnes manquantes sur Client
-- ---------------------------------------------------------------------------
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "siteUrl" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "useVectorRag" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "hfApiKey" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Client" ALTER COLUMN "topNChunks" SET DEFAULT 7;
ALTER TABLE "Client" ALTER COLUMN "primaryColor" SET DEFAULT '#059669';
ALTER TABLE "Client" ALTER COLUMN "embeddingProvider" SET DEFAULT 'nomic';

-- ---------------------------------------------------------------------------
-- 2. Colonnes manquantes sur WidgetConfig
-- ---------------------------------------------------------------------------
ALTER TABLE "WidgetConfig" ADD COLUMN IF NOT EXISTS "greetingMsg" TEXT NOT NULL DEFAULT '';
ALTER TABLE "WidgetConfig" ADD COLUMN IF NOT EXISTS "buttonAnimation" TEXT NOT NULL DEFAULT 'pulse';
ALTER TABLE "WidgetConfig" ADD COLUMN IF NOT EXISTS "buttonLabel" TEXT NOT NULL DEFAULT '';
ALTER TABLE "WidgetConfig" ADD COLUMN IF NOT EXISTS "buttonLabelDuration" INTEGER NOT NULL DEFAULT 8;
ALTER TABLE "WidgetConfig" ADD COLUMN IF NOT EXISTS "buttonIcon" TEXT NOT NULL DEFAULT '';
ALTER TABLE "WidgetConfig" ADD COLUMN IF NOT EXISTS "aiColor" TEXT NOT NULL DEFAULT '#7c3aed';
ALTER TABLE "WidgetConfig" ADD COLUMN IF NOT EXISTS "widgetWidth" INTEGER NOT NULL DEFAULT 420;
ALTER TABLE "WidgetConfig" ADD COLUMN IF NOT EXISTS "widgetHeight" INTEGER NOT NULL DEFAULT 700;
ALTER TABLE "WidgetConfig" ADD COLUMN IF NOT EXISTS "widgetMaxWidth" INTEGER NOT NULL DEFAULT 820;
ALTER TABLE "WidgetConfig" ADD COLUMN IF NOT EXISTS "widgetMaxHeight" INTEGER NOT NULL DEFAULT 820;

-- ---------------------------------------------------------------------------
-- 3. Colonnes manquantes sur Conversation
-- ---------------------------------------------------------------------------
ALTER TABLE "Conversation" ADD COLUMN IF NOT EXISTS "title" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Conversation" ADD COLUMN IF NOT EXISTS "ipAddress" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Conversation" ADD COLUMN IF NOT EXISTS "country" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Conversation" ADD COLUMN IF NOT EXISTS "city" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Conversation" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- ---------------------------------------------------------------------------
-- 4. Tables manquantes
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "ClientDocument" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL DEFAULT '',
    "content" TEXT NOT NULL DEFAULT '',
    "fileSize" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT NOT NULL DEFAULT '',
    "tags" TEXT NOT NULL DEFAULT '',
    "category" TEXT NOT NULL DEFAULT '',
    "author" TEXT NOT NULL DEFAULT '',
    "version" INTEGER NOT NULL DEFAULT 1,
    "previousVersionId" TEXT NOT NULL DEFAULT '',
    "source_url" TEXT NOT NULL DEFAULT '',
    "valid_from" TIMESTAMP(3),
    "valid_until" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ClientDocument_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AIUsageLog" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "promptTokens" INTEGER NOT NULL DEFAULT 0,
    "completionTokens" INTEGER NOT NULL DEFAULT 0,
    "totalTokens" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AIUsageLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "MessageFeedback" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL DEFAULT '',
    "rating" INTEGER NOT NULL,
    "question" TEXT NOT NULL,
    "response" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT '',
    "score" INTEGER NOT NULL DEFAULT 0,
    "provider" TEXT NOT NULL DEFAULT '',
    "comment" TEXT NOT NULL DEFAULT '',
    "pageUrl" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MessageFeedback_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ApiKey" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT,
    "label" TEXT NOT NULL DEFAULT '',
    "key" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "monthlyLimit" INTEGER NOT NULL DEFAULT 0,
    "usedTokens" INTEGER NOT NULL DEFAULT 0,
    "lastResetAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ClientLocalDoc" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL DEFAULT '',
    "fileSize" INTEGER NOT NULL DEFAULT 0,
    "content" TEXT NOT NULL DEFAULT '',
    "sourceUrl" TEXT NOT NULL DEFAULT '',
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "topics" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ClientLocalDoc_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "LocalImportFile" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileHash" TEXT NOT NULL,
    "chunkCount" INTEGER NOT NULL DEFAULT 0,
    "kbCount" INTEGER NOT NULL DEFAULT 0,
    "lastIndexedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "LocalImportFile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ActivityReport" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "kbEntriesAdded" INTEGER NOT NULL DEFAULT 0,
    "docsImported" INTEGER NOT NULL DEFAULT 0,
    "chunksIndexed" INTEGER NOT NULL DEFAULT 0,
    "errorsCount" INTEGER NOT NULL DEFAULT 0,
    "errorDetails" TEXT NOT NULL DEFAULT '[]',
    "resolutionRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalQuestions" INTEGER NOT NULL DEFAULT 0,
    "answered" INTEGER NOT NULL DEFAULT 0,
    "escalated" INTEGER NOT NULL DEFAULT 0,
    "failed" INTEGER NOT NULL DEFAULT 0,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),
    "sentVia" TEXT,
    "recipientEmail" TEXT,
    CONSTRAINT "ActivityReport_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "QualityAlert" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'low',
    "description" TEXT NOT NULL,
    "entryIds" TEXT NOT NULL DEFAULT '[]',
    "autoFixed" BOOLEAN NOT NULL DEFAULT false,
    "fixedAt" TIMESTAMP(3),
    "fixedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "QualityAlert_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "KnowledgeGap" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "escalationMsg" TEXT NOT NULL,
    "expertResponse" TEXT NOT NULL DEFAULT '',
    "context" TEXT NOT NULL DEFAULT '',
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "kbEntryId" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "KnowledgeGap_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "PendingKBEntry" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "keywords" TEXT NOT NULL DEFAULT '',
    "category" TEXT NOT NULL DEFAULT '',
    "source" TEXT NOT NULL DEFAULT 'escalade-learning',
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "gapId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PendingKBEntry_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "PublicProposal" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL DEFAULT '',
    "theme" TEXT NOT NULL DEFAULT '',
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "submitter" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PublicProposal_pkey" PRIMARY KEY ("id")
);

-- ---------------------------------------------------------------------------
-- 5. Index
-- ---------------------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS "ApiKey_clientId_priority_key" ON "ApiKey"("clientId", "priority");
CREATE INDEX IF NOT EXISTS "ClientLocalDoc_clientId_idx" ON "ClientLocalDoc"("clientId");
CREATE INDEX IF NOT EXISTS "ClientLocalDoc_sourceUrl_idx" ON "ClientLocalDoc"("sourceUrl");
CREATE INDEX IF NOT EXISTS "LocalImportFile_clientId_idx" ON "LocalImportFile"("clientId");
CREATE UNIQUE INDEX IF NOT EXISTS "LocalImportFile_clientId_fileName_key" ON "LocalImportFile"("clientId", "fileName");
CREATE INDEX IF NOT EXISTS "ActivityReport_clientId_idx" ON "ActivityReport"("clientId");
CREATE INDEX IF NOT EXISTS "ActivityReport_period_idx" ON "ActivityReport"("period");
CREATE INDEX IF NOT EXISTS "QualityAlert_clientId_idx" ON "QualityAlert"("clientId");
CREATE INDEX IF NOT EXISTS "QualityAlert_type_idx" ON "QualityAlert"("type");
CREATE INDEX IF NOT EXISTS "QualityAlert_createdAt_idx" ON "QualityAlert"("createdAt");
CREATE INDEX IF NOT EXISTS "KnowledgeGap_clientId_idx" ON "KnowledgeGap"("clientId");
CREATE INDEX IF NOT EXISTS "KnowledgeGap_status_idx" ON "KnowledgeGap"("status");
CREATE INDEX IF NOT EXISTS "KnowledgeGap_createdAt_idx" ON "KnowledgeGap"("createdAt");
CREATE INDEX IF NOT EXISTS "PendingKBEntry_clientId_idx" ON "PendingKBEntry"("clientId");
CREATE INDEX IF NOT EXISTS "PendingKBEntry_status_idx" ON "PendingKBEntry"("status");
CREATE INDEX IF NOT EXISTS "PublicProposal_clientId_idx" ON "PublicProposal"("clientId");
CREATE INDEX IF NOT EXISTS "PublicProposal_status_idx" ON "PublicProposal"("status");
CREATE INDEX IF NOT EXISTS "PublicProposal_theme_idx" ON "PublicProposal"("theme");
CREATE INDEX IF NOT EXISTS "PublicProposal_createdAt_idx" ON "PublicProposal"("createdAt");

-- ---------------------------------------------------------------------------
-- 6. Clés étrangères (sécurisées : ignore si déjà présentes)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ClientDocument_clientId_fkey') THEN
    ALTER TABLE "ClientDocument" ADD CONSTRAINT "ClientDocument_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AIUsageLog_clientId_fkey') THEN
    ALTER TABLE "AIUsageLog" ADD CONSTRAINT "AIUsageLog_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'MessageFeedback_clientId_fkey') THEN
    ALTER TABLE "MessageFeedback" ADD CONSTRAINT "MessageFeedback_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ApiKey_clientId_fkey') THEN
    ALTER TABLE "ApiKey" ADD CONSTRAINT "ApiKey_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ClientLocalDoc_clientId_fkey') THEN
    ALTER TABLE "ClientLocalDoc" ADD CONSTRAINT "ClientLocalDoc_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'LocalImportFile_clientId_fkey') THEN
    ALTER TABLE "LocalImportFile" ADD CONSTRAINT "LocalImportFile_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ActivityReport_clientId_fkey') THEN
    ALTER TABLE "ActivityReport" ADD CONSTRAINT "ActivityReport_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'QualityAlert_clientId_fkey') THEN
    ALTER TABLE "QualityAlert" ADD CONSTRAINT "QualityAlert_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'KnowledgeGap_clientId_fkey') THEN
    ALTER TABLE "KnowledgeGap" ADD CONSTRAINT "KnowledgeGap_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PendingKBEntry_clientId_fkey') THEN
    ALTER TABLE "PendingKBEntry" ADD CONSTRAINT "PendingKBEntry_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PublicProposal_clientId_fkey') THEN
    ALTER TABLE "PublicProposal" ADD CONSTRAINT "PublicProposal_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
