import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/api-auth";
import { Pool } from "@neondatabase/serverless";
import { randomUUID } from "crypto";
import { chunkDocument } from "@/lib/rag-utils";
import { generateEmbeddings } from "@/lib/embeddings";

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });

export async function POST(req: NextRequest) {
  const user = getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { clientId, content, source } = await req.json();
  if (!content || !clientId) return NextResponse.json({ error: "content et clientId requis" }, { status: 400 });

  const client = await db.prisma.client.findUnique({ where: { id: clientId } });
  if (!client) return NextResponse.json({ error: "Client introuvable" }, { status: 404 });
  if (!client.useVectorRag) return NextResponse.json({ error: "RAG vectoriel désactivé pour ce client" }, { status: 400 });
  if (!client.hfApiKey) return NextResponse.json({ error: "Clé API embedding non configurée" }, { status: 400 });

  const docId = randomUUID();
  const src = source || "import-direct";
  const chunkSize = client.chunkSize || 500;

  const chunks = chunkDocument({ id: docId, content, source_url: "", valid_until: null, originalName: src }, chunkSize);
  if (chunks.length === 0) return NextResponse.json({ error: "Contenu vide après découpage" }, { status: 400 });

  const texts = chunks.map((c) => c.content);
  const embeddings = await generateEmbeddings(texts, client.hfApiKey, client.embeddingProvider);

  const insertClient = await pool.connect();
  try {
    for (let i = 0; i < chunks.length; i++) {
      const c = chunks[i];
      const rowId = `${docId}__${i}`;
      const embeddingStr = `[${embeddings[i].join(",")}]`;
      await insertClient.query(
        `INSERT INTO document_chunks (id, "clientId", "docId", "chunkId", content, source, section, keywords, source_url, valid_until, embedding)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::vector)`,
        [rowId, clientId, docId, c.id, c.content, c.source, c.section, c.keywords.join(", "), "", "", embeddingStr]
      );
    }
  } finally {
    insertClient.release();
  }

  return NextResponse.json({ docId, chunksCount: chunks.length, source: src });
}
