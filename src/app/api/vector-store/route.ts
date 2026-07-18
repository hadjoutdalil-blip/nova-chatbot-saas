import { NextRequest, NextResponse } from "next/server";
import { Pool } from "@neondatabase/serverless";
import { getAuthUser } from "@/lib/api-auth";
import { generateEmbedding } from "@/lib/embeddings";

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });

export async function GET(req: NextRequest) {
  const user = getAuthUser(req);
  if (!user || user.role !== "admin") return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const url = new URL(req.url);
  const clientId = url.searchParams.get("clientId");
  const search = url.searchParams.get("search");
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = parseInt(url.searchParams.get("limit") || "20");
  const offset = (page - 1) * limit;

  const stats = await pool.query(`
    SELECT
      COUNT(*)::int AS total_chunks,
      COUNT(DISTINCT "clientId")::int AS total_clients,
      COUNT(DISTINCT "docId")::int AS total_docs
    FROM document_chunks
  `);

  const perClient = await pool.query(`
    SELECT c.name AS client_name, dc."clientId", COUNT(*)::int AS chunks, COUNT(DISTINCT dc."docId")::int AS docs
    FROM document_chunks dc
    JOIN "Client" c ON c.id = dc."clientId"
    GROUP BY dc."clientId", c.name
    ORDER BY chunks DESC
  `);

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

export async function POST(req: NextRequest) {
  const user = getAuthUser(req);
  if (!user || user.role !== "admin") return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { question, clientId, topN = 5, hfApiKey: reqApiKey } = await req.json();
  if (!question) return NextResponse.json({ error: "question requise" }, { status: 400 });

  // Use provided key or fetch from global settings
  let hfApiKey = reqApiKey;
  if (!hfApiKey) {
    const configRow = await pool.query(`SELECT value FROM "GlobalConfig" WHERE key = 'hfApiKey'`);
    hfApiKey = configRow.rows[0]?.value || "";
  }
  if (!hfApiKey) return NextResponse.json({ error: "Clé API Cohere non configurée" }, { status: 400 });

  const embedding = await generateEmbedding(question, hfApiKey);
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
