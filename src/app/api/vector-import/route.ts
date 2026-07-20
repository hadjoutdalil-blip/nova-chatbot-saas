import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/api-auth";
import { randomUUID } from "crypto";
import { syncDocumentChunks } from "@/lib/vector-store";
import { getActiveEmbeddingKey } from "@/lib/embedding-keys";

export async function POST(req: NextRequest) {
  const user = getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { clientId: bodyClientId, content, source } = await req.json();
  const clientId = bodyClientId || user.clientId;
  if (!content || !clientId) return NextResponse.json({ error: "content et clientId requis" }, { status: 400 });
  if (user.role !== "admin" && clientId !== user.clientId)
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const client = await db.prisma.client.findUnique({ where: { id: clientId } });
  if (!client) return NextResponse.json({ error: "Client introuvable" }, { status: 404 });
  if (!client.useVectorRag) return NextResponse.json({ error: "RAG vectoriel désactivé pour ce client" }, { status: 400 });

  const activeKey = await getActiveEmbeddingKey(clientId);
  const apiKey = activeKey?.key || client.hfApiKey;
  const provider = activeKey?.provider || client.embeddingProvider;
  if (!apiKey) return NextResponse.json({ error: "Clé API embedding non configurée" }, { status: 400 });

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
    apiKey,
    provider,
  );

  return NextResponse.json({ docId, chunksCount: -1, source: src });
}
