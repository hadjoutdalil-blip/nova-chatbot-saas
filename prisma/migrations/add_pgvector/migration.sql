-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create document_chunks table for vector search
CREATE TABLE IF NOT EXISTS document_chunks (
    id TEXT PRIMARY KEY,
    "clientId" TEXT NOT NULL,
    "docId" TEXT NOT NULL,
    "chunkId" TEXT NOT NULL,
    content TEXT NOT NULL,
    source TEXT NOT NULL DEFAULT '',
    section TEXT NOT NULL DEFAULT '',
    keywords TEXT NOT NULL DEFAULT '',
    source_url TEXT NOT NULL DEFAULT '',
    valid_until TEXT NOT NULL DEFAULT '',
    embedding vector(1024)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_document_chunks_client ON document_chunks ("clientId");
CREATE INDEX IF NOT EXISTS idx_document_chunks_doc ON document_chunks ("docId");
CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding ON document_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Remove ChromaDB columns from Client table
ALTER TABLE "Client" DROP COLUMN IF EXISTS "chromaApiKey";
ALTER TABLE "Client" DROP COLUMN IF EXISTS "chromaTenant";
ALTER TABLE "Client" DROP COLUMN IF EXISTS "chromaDatabase";
