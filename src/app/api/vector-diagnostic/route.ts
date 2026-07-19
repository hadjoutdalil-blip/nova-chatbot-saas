import { NextRequest, NextResponse } from "next/server";
import { Pool } from "@neondatabase/serverless";
import { getAuthUser } from "@/lib/api-auth";
import { getEmbeddingDimension } from "@/lib/embeddings";
const TABLE_DIM = getEmbeddingDimension("nomic"); // 768

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });

export async function GET(req: NextRequest) {
  const user = getAuthUser(req);
  if (!user || user.role !== "admin")
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const clientId = user.clientId || req.nextUrl.searchParams.get("clientId") || "";

  // table exists ?
  const tableExists = await pool.query(`
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'document_chunks') AS exists
  `);

  // column atttypmod
  const colInfo = await pool.query(`
    SELECT atttypmod FROM pg_attribute
    JOIN pg_class ON pg_attribute.attrelid = pg_class.oid
    WHERE pg_class.relname = 'document_chunks' AND pg_attribute.attname = 'embedding'
  `);

  // count
  const counts = await pool.query(`
    SELECT
      COUNT(*)::int AS total_chunks,
      COUNT(DISTINCT "clientId")::int AS total_clients,
      COUNT(DISTINCT "docId")::int AS total_docs
    FROM document_chunks
  `);

  const clientCount = clientId
    ? (await pool.query(`SELECT COUNT(*)::int AS n FROM document_chunks WHERE "clientId" = $1`, [clientId])).rows[0].n
    : null;

  const perClient = await pool.query(`
    SELECT "clientId", COUNT(*)::int AS n FROM document_chunks GROUP BY "clientId"
  `);

  const atttypmod = colInfo.rows[0]?.atttypmod;
  const actualDim = atttypmod != null ? atttypmod - 4 : null;
  const wouldDrop = tableExists.rows[0]?.exists && actualDim != null && actualDim < TABLE_DIM;

  return NextResponse.json({
    tableExists: tableExists.rows[0]?.exists || false,
    columnTypmod: atttypmod ?? null,
    actualDimension: actualDim,
    expectedDimension: TABLE_DIM,
    wouldDropTable: wouldDrop,
    totalChunks: counts.rows[0]?.total_chunks ?? 0,
    totalClients: counts.rows[0]?.total_clients ?? 0,
    totalDocs: counts.rows[0]?.total_docs ?? 0,
    yourClientChunks: clientCount,
    perClient: perClient.rows,
  });
}
