import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";
import { getAuthUser } from "@/lib/api-auth";
import { generateEmbedding } from "@/lib/embeddings";
import { getActiveEmbeddingKey, trackEmbeddingUsage } from "@/lib/embedding-keys";
import { db } from "@/lib/db";
import { removeDocument } from "@/lib/doc-manager";

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });

export async function GET(req: NextRequest) {
  const user = getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const url = new URL(req.url);
  const clientId = url.searchParams.get("clientId") || (user.role !== "admin" ? user.clientId : null);
  const search = url.searchParams.get("search");
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = parseInt(url.searchParams.get("limit") || "20");
  const offset = (page - 1) * limit;

  const whereClause = clientId ? `WHERE dc."clientId" = $1` : "";
  const whereParams = clientId ? [clientId] : [];

  const stats = await pool.query(`
    SELECT
      COUNT(*)::int AS total_chunks,
      COUNT(DISTINCT "clientId")::int AS total_clients,
      COUNT(DISTINCT "docId")::int AS total_docs
    FROM document_chunks dc
    ${whereClause.replace("dc.", "")}
  `, whereParams.length ? whereParams : undefined);

  const perClient = await pool.query(`
    SELECT c.name AS client_name, dc."clientId", COUNT(*)::int AS chunks, COUNT(DISTINCT dc."docId")::int AS docs
    FROM document_chunks dc
    JOIN "Client" c ON c.id = dc."clientId"
    ${whereClause}
    GROUP BY dc."clientId", c.name
    ORDER BY chunks DESC
  `, whereParams.length ? whereParams : undefined);

  let perDocWhere = "";
  const perDocParams: any[] = [];
  if (clientId) {
    perDocParams.push(clientId);
    perDocWhere = `WHERE dc."clientId" = $1`;
  }
  const perDoc = await pool.query(`
    SELECT dc."docId", dc.source, dc."clientId", c.name AS client_name, COUNT(*)::int AS chunks
    FROM document_chunks dc
    JOIN "Client" c ON c.id = dc."clientId"
    ${perDocWhere}
    GROUP BY dc."docId", dc.source, dc."clientId", c.name
    ORDER BY chunks DESC
    LIMIT 50
  `, perDocParams);

  let where = "";
  const params: any[] = [];
  if (clientId) {
    params.push(clientId);
    where += ` WHERE dc."clientId" = $${params.length}`;
  }
  if (search) {
    params.push(`%${search}%`);
    where += where ? ` AND (dc.content ILIKE $${params.length} OR dc.source ILIKE $${params.length} OR dc.section ILIKE $${params.length})` : ` WHERE (dc.content ILIKE $${params.length} OR dc.source ILIKE $${params.length} OR dc.section ILIKE $${params.length})`;
  }

  params.push(limit, offset);
  const chunks = await pool.query(`
    SELECT dc.id, dc."docId", dc."chunkId", dc.source, dc.section, dc.keywords, dc.content,
           dc.source_url, dc.valid_until, dc."clientId", c.name AS client_name
    FROM document_chunks dc
    JOIN "Client" c ON c.id = dc."clientId"
    ${where}
    ORDER BY dc.source, dc."chunkId"
    LIMIT $${params.length - 1} OFFSET $${params.length}
  `, params);

  const countParams = params.slice(0, -2);
  const countResult = await pool.query(`
    SELECT COUNT(*)::int AS total
    FROM document_chunks dc
    JOIN "Client" c ON c.id = dc."clientId"
    ${where}
  `, countParams);

  return NextResponse.json({
    stats: stats.rows[0],
    perClient: perClient.rows,
    perDoc: perDoc.rows,
    chunks: chunks.rows,
    total: countResult.rows[0].total,
    page,
    limit,
  });
}

export async function DELETE(req: NextRequest) {
  const user = getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { docId, clientId: reqClientId } = await req.json();
  if (!docId) return NextResponse.json({ error: "docId requis" }, { status: 400 });

  const targetClientId = reqClientId || (user.role !== "admin" ? user.clientId : null);
  if (!targetClientId) return NextResponse.json({ error: "clientId requis" }, { status: 400 });
  if (user.role !== "admin" && user.clientId !== targetClientId) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  /* 1. Purge de TOUS les chunks de cette source */
  await pool.query('DELETE FROM document_chunks WHERE "docId" = $1 AND "clientId" = $2', [docId, targetClientId]);

  /* 2. Suppression de la source associée (pour éviter une ré-indexation) */
  const doc = await db.prisma.clientDocument.findUnique({ where: { id: docId } });
  if (doc) {
    await db.prisma.clientDocument.delete({ where: { id: docId } }).catch(() =>
      db.prisma.clientDocument.update({ where: { id: docId }, data: { status: "archived" } })
    );
    return NextResponse.json({ message: "Document et chunks supprimés", deleted: "clientDocument" });
  }

  const localDoc = await db.prisma.clientLocalDoc.findUnique({ where: { id: docId } });
  if (localDoc) {
    const client = await db.prisma.client.findUnique({ where: { id: targetClientId } });
    if (client) {
      await removeDocument(docId, client.slug, localDoc.fileName);
    } else {
      await db.prisma.clientLocalDoc.delete({ where: { id: docId } }).catch(() => {});
    }
    return NextResponse.json({ message: "Document local et chunks supprimés", deleted: "clientLocalDoc" });
  }

  const kb = await db.prisma.kBEntry.findUnique({ where: { id: docId } });
  if (kb) {
    await db.prisma.kBEntry.delete({ where: { id: docId } }).catch(() => {});
    return NextResponse.json({ message: "Entrée KB et chunks supprimés", deleted: "kb" });
  }

  return NextResponse.json({ message: "Chunks supprimés (import direct)", deleted: "chunks-only" });
}

export async function POST(req: NextRequest) {
  const user = getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { question, clientId: reqClientId, topN = 5, hfApiKey: reqApiKey } = await req.json();
  if (!question) return NextResponse.json({ error: "question requise" }, { status: 400 });

  const clientId = reqClientId || (user.role !== "admin" ? user.clientId : null);

  // Use active embedding key or fallback
  let apiKey = reqApiKey;
  let provider = "nomic";
  let embedKeyId: string | undefined;
  if (!apiKey) {
    const activeKey = clientId ? await getActiveEmbeddingKey(clientId) : null;
    apiKey = activeKey?.key;
    provider = activeKey?.provider || "nomic";
    embedKeyId = activeKey?.id;
  }
  if (!apiKey) return NextResponse.json({ error: "Clé API embedding non configurée" }, { status: 400 });

  const embedding = await generateEmbedding(question, apiKey, provider);
  if (embedKeyId) trackEmbeddingUsage(embedKeyId).catch(() => {});
  const embeddingStr = `[${embedding.join(",")}]`;

  let where = "";
  const params: any[] = [embeddingStr];
  if (clientId) {
    params.push(clientId);
    where = `WHERE dc."clientId" = $2`;
  }
  params.push(topN);

  const { rows } = await pool.query(
    `SELECT dc.*, c.name AS client_name,
      1 - (dc.embedding <=> $1::vector) AS score
    FROM document_chunks dc
    JOIN "Client" c ON c.id = dc."clientId"
    ${where}
    ORDER BY dc.embedding <=> $1::vector
    LIMIT $${params.length}`,
    params
  );

  return NextResponse.json({
    query: question,
    results: rows.map((r: any) => ({
      id: r.id,
      chunkId: r.chunkId,
      source: r.source,
      section: r.section,
      keywords: r.keywords,
      content: r.content,
      docId: r.docId,
      clientName: r.client_name,
      clientId: r.clientId,
      score: parseFloat(r.score).toFixed(4),
      scorePercent: Math.round(parseFloat(r.score) * 100),
    })),
  });
}
