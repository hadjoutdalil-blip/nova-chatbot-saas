-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Recreate table with correct vector dimension (384 for embed-english-light-v3.0)
DROP TABLE IF EXISTS document_chunks;

CREATE TABLE document_chunks (
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
    embedding vector(384)
);

-- Indexes for performance
CREATE INDEX idx_document_chunks_client ON document_chunks ("clientId");
CREATE INDEX idx_document_chunks_doc ON document_chunks ("docId");

-- Remove ChromaDB columns from Client table
ALTER TABLE "Client" DROP COLUMN IF EXISTS "chromaApiKey";
ALTER TABLE "Client" DROP COLUMN IF EXISTS "chromaTenant";
ALTER TABLE "Client" DROP COLUMN IF EXISTS "chromaDatabase";
