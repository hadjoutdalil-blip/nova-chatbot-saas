import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/api-auth";
import { randomUUID } from "crypto";
import { syncDocumentChunks } from "@/lib/vector-store";

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

  await syncDocumentChunks(
    docId,
    clientId,
    content,
    src,
    "",
    null,
    client.chunkSize || 500,
    client.hfApiKey,
    client.embeddingProvider,
  );

  return NextResponse.json({ docId, chunksCount: -1, source: src });
}
