import { Pool } from "pg";
import { chunkDocument, ChunkMeta } from "./rag-utils";
import { generateEmbeddings, getEmbeddingDimension } from "./embeddings";
import { trackEmbeddingUsage, getActiveEmbeddingKey } from "./embedding-keys";
import { db } from "./db";

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });

const TABLE_DIM = getEmbeddingDimension("nomic"); // 768 — supports both Cohere (padded) and Nomic

/* halfvec (pgvector ≥ 0.7, dispo sur Neon) : stockage 2x plus compact pour la même dimension.
   Activer via PG_VECTOR_HALF=1 puis relancer une migration complète (recreateTable). */
const USE_HALF = process.env.PG_VECTOR_HALF === "1";
const VEC_TYPE = USE_HALF ? "halfvec" : "vector";
const VEC_CAST = USE_HALF ? "::halfvec" : "::vector";
const COSINE_OPS = USE_HALF ? "halfvec_cosine_ops" : "vector_cosine_ops";

function padToDim(vec: number[], dim: number): number[] {
  if (vec.length >= dim) return vec;
  return [...vec, ...new Array(dim - vec.length).fill(0)];
}

/* PostgreSQL refuse les octets nuls (0x00) et certains caractères de contrôle dans TEXT.
   Filet de sécurité appliqué avant tout INSERT, quelle que soit la source du contenu. */
export function sanitizeText(text: string): string {
  return text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "").trim();
}

let tableEnsured = false;

async function ensureTable() {
  if (tableEnsured) return;
  const client = await pool.connect();
  try {
    await client.query("CREATE EXTENSION IF NOT EXISTS vector");
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
        metadata JSONB NOT NULL DEFAULT '{}',
        embedding ${VEC_TYPE}(${TABLE_DIM})
      )
    `);
    /* Rétro-compatibilité : ajoute la colonne metadata sur les tables créées avant cette version */
    await client.query(`ALTER TABLE document_chunks ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'`);
    await client.query('CREATE INDEX IF NOT EXISTS idx_document_chunks_client ON document_chunks ("clientId")');
    await client.query('CREATE INDEX IF NOT EXISTS idx_document_chunks_doc ON document_chunks ("docId")');
    await client.query('CREATE INDEX IF NOT EXISTS idx_document_chunks_metadata ON document_chunks USING gin (metadata)');
    /* HNSW : se construit sur table vide, pas de tuning lists, meilleur rappel que ivfflat */
    try {
      await client.query(
        `CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding ON document_chunks USING hnsw (embedding ${COSINE_OPS}) WITH (m = 16, ef_construction = 64)`
      );
    } catch {
      // hnsw peut échouer sur très vieilles versions de pgvector (< 0.5) ; on garde le scan séquentiel
    }
  } finally {
    client.release();
  }
  tableEnsured = true;
}

export async function recreateTable() {
  const client = await pool.connect();
  try {
    await client.query("DROP TABLE IF EXISTS document_chunks");
    await client.query(`
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
        metadata JSONB NOT NULL DEFAULT '{}',
        embedding ${VEC_TYPE}(${TABLE_DIM})
      )
    `);
    await client.query('CREATE INDEX IF NOT EXISTS idx_document_chunks_client ON document_chunks ("clientId")');
    await client.query('CREATE INDEX IF NOT EXISTS idx_document_chunks_doc ON document_chunks ("docId")');
    await client.query('CREATE INDEX IF NOT EXISTS idx_document_chunks_metadata ON document_chunks USING gin (metadata)');
    try {
      await client.query(
        `CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding ON document_chunks USING hnsw (embedding ${COSINE_OPS}) WITH (m = 16, ef_construction = 64)`
      );
    } catch {}
    tableEnsured = true;
  } finally {
    client.release();
  }
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
  embeddingProvider = "nomic",
  embeddingKeyId?: string,
) {
  await ensureTable();
  await deleteDocChunks(docId);

  content = sanitizeText(content);

  const chunks = chunkDocument(
    { id: docId, content, source_url: sourceUrl, valid_until: validUntil, originalName: source },
    chunkSize,
  );
  if (chunks.length === 0) return;

  const texts = chunks.map((c) => c.content);
  const embeddings = padEmbeddings(await generateEmbeddings(texts, hfApiKey, embeddingProvider), embeddingProvider);

  if (embeddingKeyId) {
    trackEmbeddingUsage(embeddingKeyId).catch(() => {});
  }

  const client = await pool.connect();
  try {
    const BATCH = 100;
    for (let offset = 0; offset < chunks.length; offset += BATCH) {
      const batch = chunks.slice(offset, offset + BATCH);
      const params: any[] = [];
      const rows: string[] = [];
      let p = 1;
      for (let j = 0; j < batch.length; j++) {
        const c = batch[j];
        const globalIdx = offset + j;
        const rowId = `${docId}__${globalIdx}`;
        const embeddingStr = `[${embeddings[globalIdx].join(",")}]`;
        params.push(
          rowId, clientId, docId, c.id, c.content, c.source, c.section,
          c.keywords.join(", "), sourceUrl, validUntil || "",
          JSON.stringify(c.metadata || {}), embeddingStr
        );
        rows.push(
          `($${p++}, $${p++}, $${p++}, $${p++}, $${p++}, $${p++}, $${p++}, $${p++}, $${p++}, $${p++}, $${p++}, $${p++}${VEC_CAST})`
        );
      }
      await client.query(
        `INSERT INTO document_chunks (id, "clientId", "docId", "chunkId", content, source, section, keywords, source_url, valid_until, metadata, embedding)
         VALUES ${rows.join(", ")}`,
        params
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

export type KBEntryInput = {
  id: string;
  tag?: string | null;
  question: string;
  alt_questions?: string | null;
  answer: string;
  source_url?: string | null;
  valid_until?: string | null;
};

/* Indexe automatiquement une entrée KB si le client utilise le RAG vectoriel.
   Fire-and-forget : ne bloque jamais la requête principale. */
export async function autoIndexKBEntry(clientId: string, kb: KBEntryInput) {
  try {
    const client = await db.prisma.client.findUnique({ where: { id: clientId } });
    if (!client?.useVectorRag) return;

    const activeKey = await getActiveEmbeddingKey(clientId);
    const apiKey = activeKey?.key || client.hfApiKey;
    const provider = activeKey?.provider || client.embeddingProvider;
    if (!apiKey) return;

    await syncKBEntry(clientId, kb, apiKey, provider, activeKey?.id);
  } catch (err) {
    console.error("[Vector KB Sync] Erreur d'indexation:", err);
  }
}

/* Désindexe automatiquement une entrée KB si le client utilise le RAG vectoriel. */
export async function autoDeleteKBEntry(clientId: string, kbId: string) {
  try {
    const client = await db.prisma.client.findUnique({ where: { id: clientId } });
    if (!client?.useVectorRag) return;
    await deleteDocChunks(kbId);
  } catch (err) {
    console.error("[Vector KB Sync] Erreur de suppression:", err);
  }
}

/* Indexe une entrée KB entière en un SEUL chunk (question + variantes + réponse complète) */
export async function syncKBEntry(
  clientId: string,
  kb: {
    id: string;
    tag?: string | null;
    question: string;
    alt_questions?: string | null;
    answer: string;
    source_url?: string | null;
    valid_until?: string | null;
  },
  hfApiKey: string,
  embeddingProvider = "nomic",
  embeddingKeyId?: string,
) {
  await ensureTable();

  const content = sanitizeText([
    `Question: ${kb.question}`,
    kb.alt_questions ? `Variantes: ${kb.alt_questions}` : "",
    `Réponse: ${kb.answer}`,
  ].filter(Boolean).join("\n"));
  if (!content.trim()) return;

  /* Garde-fou : si l'entrée dépasse la limite raisonnable d'un embedding, on la découpe
     pour ne pas tronquer la réponse. Sinon, indexer l'entrée entière en un seul chunk. */
  const MAX_KB_CHARS = 8000;
  if (content.length > MAX_KB_CHARS) {
    await syncDocumentChunks(
      kb.id,
      clientId,
      content,
      `KB: ${kb.tag || kb.question.slice(0, 50)}`,
      kb.source_url || "",
      kb.valid_until || null,
      MAX_KB_CHARS / 2,
      hfApiKey,
      embeddingProvider,
      embeddingKeyId,
    );
    return;
  }

  const [embedding] = await generateEmbeddings([content], hfApiKey, embeddingProvider);
  const padded = padEmbeddings([embedding], embeddingProvider)[0];
  if (embeddingKeyId) {
    trackEmbeddingUsage(embeddingKeyId).catch(() => {});
  }

  const source = `KB: ${kb.tag || kb.question.slice(0, 50)}`;

  await deleteDocChunks(kb.id);

  const rowId = `${kb.id}__kb__0`;
  const embeddingStr = `[${padded.join(",")}]`;
  const metadata = JSON.stringify({ docType: "kb", tag: kb.tag || "" });
  const client = await pool.connect();
  try {
    await client.query(
      `INSERT INTO document_chunks (id, "clientId", "docId", "chunkId", content, source, section, keywords, source_url, valid_until, metadata, embedding)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12${VEC_CAST})`,
      [rowId, clientId, kb.id, `kb_${kb.id}`, content, source, "", [], kb.source_url || "", kb.valid_until || "", metadata, embeddingStr]
    );
  } finally {
    client.release();
  }
}

export async function searchChunks(
  clientId: string,
  questionEmbedding: number[],
  topN: number,
  provider = "nomic",
  filterMetadata?: Record<string, any>,
): Promise<{ chunk: ChunkMeta; score: number }[]> {
  await ensureTable();
  const queryVec = padToDim(questionEmbedding, TABLE_DIM);
  const embeddingStr = `[${queryVec.join(",")}]`;

  let whereClause = `WHERE "clientId" = $2`;
  const params: any[] = [embeddingStr, clientId];

  if (filterMetadata && Object.keys(filterMetadata).length > 0) {
    let condIdx = 3;
    for (const [k, v] of Object.entries(filterMetadata)) {
      whereClause += ` AND metadata->>'${k.replace(/'/g, "''")}' = $${condIdx}`;
      params.push(String(v));
      condIdx++;
    }
  }

  const { rows } = await pool.query(
    `SELECT *,
       1 - (embedding <=> $1${VEC_CAST}) AS score
     FROM document_chunks
     ${whereClause}
     ORDER BY embedding <=> $1${VEC_CAST}
     LIMIT $${params.length + 1}`,
    [...params, topN]
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
      metadata: row.metadata || undefined,
    },
    score: parseFloat(row.score) || 0,
  }));
}
