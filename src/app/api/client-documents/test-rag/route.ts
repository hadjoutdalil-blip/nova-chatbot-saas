import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/api-auth";
import { chunkDocument, parseChunks, findBestChunks, ChunkMeta } from "@/lib/rag-utils";
import { generateEmbedding } from "@/lib/embeddings";
import { searchChunks as vectorSearchChunks } from "@/lib/vector-store";

/* ── Recherche par mots-clés en fallback ── */
function keywordSearch(question: string, chunks: any[]): any[] {
  const terms = question
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .split(/\s+/)
    .filter((w: string) => w.length > 2);
  if (terms.length === 0) return [];
  return chunks
    .map(c => {
      const haystack = (c.content + " " + (c.section || "")).toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const hits = terms.filter((t: string) => haystack.includes(t)).length;
      return { ...c, _kwScore: hits / terms.length };
    })
    .filter(c => c._kwScore > 0)
    .sort((a, b) => b._kwScore - a._kwScore)
    .slice(0, 5);
}

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

  let topChunks: ChunkMeta[] = [];
  let matchedByKeyword = false;

  if (client.useVectorRag && client.chromaApiKey && client.chromaTenant && client.chromaDatabase && client.hfApiKey) {
    try {
      const embedding = await generateEmbedding(question, client.hfApiKey);
      const results = await vectorSearchChunks(client.id, embedding, topNChunks, client.chromaApiKey, client.chromaTenant, client.chromaDatabase);
      topChunks = results.map((r) => r.chunk);
    } catch (err) {
      console.error("[Vector RAG test] error, falling back to keyword:", err);
    }
  }

  if (topChunks.length === 0) {
    topChunks = findBestChunks(question, allChunks, topNChunks, ragThreshold);
  }

  if (topChunks.length === 0 && allChunks.length > 0) {
    const kwResults = keywordSearch(question, allChunks);
    if (kwResults.length > 0) {
      topChunks = kwResults;
      matchedByKeyword = true;
    }
  }

  const seen = new Set<string>();
  const docsUsed = (clientDocs.filter((d: any) => topChunks.some((c: any) => c.docId === d.id))).map((d: any) => ({
    id: d.id,
    originalName: d.originalName,
    fileSize: d.fileSize,
    version: d.version,
    source_url: d.source_url,
  })).filter((d: any) => {
    const key = d.id;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return NextResponse.json({
    question,
    matchedByKeyword,
    chunks: topChunks.map((c: any) => ({
      source: c.source,
      section: c.section,
      score: Math.round(((c.score ?? c._kwScore ?? 0)) * 100),
      content: c.content.slice(0, 300),
      docId: c.docId,
    })),
    documentsUsed: docsUsed,
    totalChunksFound: allChunks.length,
    chunksReturned: topChunks.length,
  });
}
