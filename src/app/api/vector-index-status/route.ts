import { NextRequest, NextResponse } from "next/server";
import { Pool } from "@neondatabase/serverless";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/api-auth";

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });

export async function GET(req: NextRequest) {
  const user = getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const clientId = req.nextUrl.searchParams.get("clientId") || user.clientId;

  // Check client ownership
  const client = await db.prisma.client.findUnique({ where: { id: clientId } });
  if (!client || (clientId !== user.clientId && user.role !== "admin"))
    return NextResponse.json({ error: "Client introuvable" }, { status: 404 });

  // Get all indexed docIds
  const indexed = await pool.query(
    `SELECT DISTINCT "docId" FROM document_chunks WHERE "clientId" = $1`,
    [clientId],
  );
  const indexedDocIds = new Set(indexed.rows.map((r: any) => r.docId));

  // Documents
  const docs = await db.prisma.clientDocument.findMany({
    where: { clientId, status: { not: "archived" } },
    select: { id: true, originalName: true, updatedAt: true },
  });
  const docsWithStatus = docs.map((d) => ({
    id: d.id,
    name: d.originalName,
    indexed: indexedDocIds.has(d.id),
  }));

  // KB entries
  const kbEntries = await db.prisma.kBEntry.findMany({
    where: { clientId },
    select: { id: true, question: true, tag: true, updatedAt: true },
  });
  const kbWithStatus = kbEntries.map((kb) => ({
    id: kb.id,
    name: kb.tag || kb.question.slice(0, 60),
    indexed: indexedDocIds.has(kb.id),
  }));

  return NextResponse.json({
    indexedCount: indexedDocIds.size,
    totalDocs: docs.length,
    indexedDocs: docsWithStatus.filter((d) => d.indexed).length,
    totalKB: kbEntries.length,
    indexedKB: kbWithStatus.filter((k) => k.indexed).length,
    docs: docsWithStatus,
    kb: kbWithStatus,
  });
}
