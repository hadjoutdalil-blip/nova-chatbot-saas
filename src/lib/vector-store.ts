import { neon } from "@neondatabase/serverless";
import { chunkDocument, ChunkMeta } from "./rag-utils";
import { generateEmbeddings } from "./embeddings";

const sql = neon(process.env.DATABASE_URL!);

const VECTOR_DIM = 1024;

let tableEnsured = false;

async function ensureTable() {
  if (tableEnsured) return;
  await sql`CREATE EXTENSION IF NOT EXISTS vector`;
  await sql`
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
      embedding vector(${VECTOR_DIM})
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_document_chunks_client ON document_chunks ("clientId")`;
  await sql`CREATE INDEX IF NOT EXISTS idx_document_chunks_doc ON document_chunks ("docId")`;
  try {
    await sql`CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding ON document_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100)`;
  } catch {
    // ivfflat requires existing rows; safe to ignore on empty table
  }
  tableEnsured = true;
}

export async function syncDocumentChunks(
  docId: string,
  clientId: string,
  content: string,
  source: string,
  sourceUrl: string,
  validUntil: string | null,
  chunkSize: number,
  hfApiKey: string,
) {
  await ensureTable();
  await deleteDocChunks(docId);

  const chunks = chunkDocument(
    { id: docId, content, source_url: sourceUrl, valid_until: validUntil, originalName: source },
    chunkSize,
  );
  if (chunks.length === 0) return;

  const texts = chunks.map((c) => c.content);
  const embeddings = await generateEmbeddings(texts, hfApiKey);

  for (let i = 0; i < chunks.length; i++) {
    const c = chunks[i];
    const rowId = `${docId}__${i}`;
    const embeddingStr = `[${embeddings[i].join(",")}]`;
    await sql`
      INSERT INTO document_chunks (id, "clientId", "docId", "chunkId", content, source, section, keywords, source_url, valid_until, embedding)
      VALUES (${rowId}, ${clientId}, ${docId}, ${c.id}, ${c.content}, ${c.source}, ${c.section}, ${c.keywords.join(", ")}, ${sourceUrl}, ${validUntil || ""}, ${embeddingStr}::vector)
    `;
  }
}

export async function deleteDocChunks(docId: string) {
  await ensureTable();
  await sql`DELETE FROM document_chunks WHERE "docId" = ${docId}`;
}

export async function searchChunks(
  clientId: string,
  questionEmbedding: number[],
  topN: number,
): Promise<{ chunk: ChunkMeta; score: number }[]> {
  await ensureTable();

  const embeddingStr = `[${questionEmbedding.join(",")}]`;
  const rows = await sql`
    SELECT *,
      1 - (embedding <=> ${embeddingStr}::vector) AS score
    FROM document_chunks
    WHERE "clientId" = ${clientId}
    ORDER BY embedding <=> ${embeddingStr}::vector
    LIMIT ${topN}
  `;

  return rows.map((row: any) => ({
    chunk: {
      id: row.chunkId || row.id,
      source: row.source || "",
      section: row.section || "",
      keywords: (row.keywords || "").split(", ").filter(Boolean),
      content: row.content || "",
      score: parseFloat(row.score) || 0,
      docId: row.docId || undefined,
      source_url: row.source_url || "",
      valid_until: row.valid_until || "",
    },
    score: parseFloat(row.score) || 0,
  }));
}
