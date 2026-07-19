import { Pool } from "@neondatabase/serverless";
import { chunkDocument, ChunkMeta } from "./rag-utils";
import { generateEmbeddings, getEmbeddingDimension } from "./embeddings";

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });

const TABLE_DIM = getEmbeddingDimension("nomic"); // 768 — supports both Cohere (padded) and Nomic

function padToDim(vec: number[], dim: number): number[] {
  if (vec.length >= dim) return vec;
  return [...vec, ...new Array(dim - vec.length).fill(0)];
}

let tableEnsured = false;

async function ensureTable() {
  if (tableEnsured) return;
  const client = await pool.connect();
  try {
    await client.query("CREATE EXTENSION IF NOT EXISTS vector");
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables WHERE table_name = 'document_chunks'
      ) AS exists, (
        SELECT atttypmod FROM pg_attribute
        JOIN pg_class ON pg_attribute.attrelid = pg_class.oid
        WHERE pg_class.relname = 'document_chunks' AND pg_attribute.attname = 'embedding'
      ) AS dim
    `);
    const row = tableCheck.rows[0];
    if (row?.exists && row?.dim !== null && row?.dim - 4 < TABLE_DIM) {
      await client.query("DROP TABLE document_chunks");
    }
    await client.query(`
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
        embedding vector(${TABLE_DIM})
      )
    `);
    await client.query('CREATE INDEX IF NOT EXISTS idx_document_chunks_client ON document_chunks ("clientId")');
    await client.query('CREATE INDEX IF NOT EXISTS idx_document_chunks_doc ON document_chunks ("docId")');
    try {
      await client.query("CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding ON document_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100)");
    } catch {
      // ivfflat requires existing rows; safe to ignore on empty table
    }
  } finally {
    client.release();
  }
  tableEnsured = true;
}

function padEmbeddings(embeddings: number[][], provider: string): number[][] {
  const targetDim = getEmbeddingDimension(provider);
  if (targetDim >= TABLE_DIM) return embeddings;
  return embeddings.map((e) => padToDim(e, TABLE_DIM));
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
  embeddingProvider = "cohere",
) {
  await ensureTable();
  await deleteDocChunks(docId);

  const chunks = chunkDocument(
    { id: docId, content, source_url: sourceUrl, valid_until: validUntil, originalName: source },
    chunkSize,
  );
  if (chunks.length === 0) return;

  const texts = chunks.map((c) => c.content);
  const embeddings = padEmbeddings(await generateEmbeddings(texts, hfApiKey, embeddingProvider), embeddingProvider);

  const client = await pool.connect();
  try {
    for (let i = 0; i < chunks.length; i++) {
      const c = chunks[i];
      const rowId = `${docId}__${i}`;
      const embeddingStr = `[${embeddings[i].join(",")}]`;
      await client.query(
        `INSERT INTO document_chunks (id, "clientId", "docId", "chunkId", content, source, section, keywords, source_url, valid_until, embedding)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::vector)`,
        [rowId, clientId, docId, c.id, c.content, c.source, c.section, c.keywords.join(", "), sourceUrl, validUntil || "", embeddingStr]
      );
    }
  } finally {
    client.release();
  }
}

export async function deleteDocChunks(docId: string) {
  await ensureTable();
  await pool.query('DELETE FROM document_chunks WHERE "docId" = $1', [docId]);
}

export async function searchChunks(
  clientId: string,
  questionEmbedding: number[],
  topN: number,
  provider = "cohere",
): Promise<{ chunk: ChunkMeta; score: number }[]> {
  await ensureTable();
  const queryVec = padToDim(questionEmbedding, TABLE_DIM);
  const embeddingStr = `[${queryVec.join(",")}]`;
  const { rows } = await pool.query(
    `SELECT *,
      1 - (embedding <=> $1::vector) AS score
    FROM document_chunks
    WHERE "clientId" = $2
    ORDER BY embedding <=> $1::vector
    LIMIT $3`,
    [embeddingStr, clientId, topN]
  );

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
