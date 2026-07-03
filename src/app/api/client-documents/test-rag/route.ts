import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/api-auth";
import { chunkDocument, parseChunks, findBestChunks } from "@/lib/rag-utils";

export async function POST(req: NextRequest) {
  const user = getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { question } = await req.json();
  if (!question || typeof question !== "string")
    return NextResponse.json({ error: "Question requise" }, { status: 400 });

  const client = await db.prisma.client.findUnique({ where: { id: user.clientId } });
  if (!client) return NextResponse.json({ error: "Client introuvable" }, { status: 404 });

  const chunkSize = client.chunkSize ?? 600;
  const ragThreshold = client.ragThreshold ?? 72;
  const topNChunks = client.topNChunks ?? 3;

  const siteChunks = parseChunks(client.siteContext || "");

  const now = new Date();
  const clientDocs = await db.prisma.clientDocument.findMany({
    where: {
      clientId: client.id,
      status: { not: "archived" },
      AND: [
        { OR: [{ valid_until: null }, { valid_until: { gte: now } }] },
        { OR: [{ valid_from: null }, { valid_from: { lte: now } }] },
      ],
    },
  });
  const docChunks = clientDocs.flatMap((d: any) => chunkDocument(d, chunkSize));
  const allChunks = [...siteChunks, ...docChunks];

  const topChunks = findBestChunks(question, allChunks, topNChunks, ragThreshold);

  const seen = new Set<string>();
  const docsUsed = (clientDocs.filter(d => topChunks.some(c => c.docId === d.id))).map(d => ({
    id: d.id,
    originalName: d.originalName,
    fileSize: d.fileSize,
    version: d.version,
    source_url: d.source_url,
  })).filter(d => {
    const key = d.id;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return NextResponse.json({
    question,
    chunks: topChunks.map(c => ({
      source: c.source,
      section: c.section,
      score: Math.round((c.score ?? 0) * 100),
      content: c.content.slice(0, 300),
      docId: c.docId,
    })),
    documentsUsed: docsUsed,
    totalChunksFound: allChunks.length,
    chunksReturned: topChunks.length,
  });
}
