import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/api-auth";
import { syncDocumentChunks } from "@/lib/vector-store";
import { chunkDocument } from "@/lib/rag-utils";
import { generateEmbeddings } from "@/lib/embeddings";

async function getCollectionId(baseUrl: string, apiKey: string): Promise<string> {
  const res = await fetch(`${baseUrl}/api/v1/collections?name=nova_chunks`, {
    headers: { "X-Chroma-Token": apiKey },
  });
  if (res.status === 404) {
    const create = await fetch(`${baseUrl}/api/v1/collections`, {
      method: "POST",
      headers: { "X-Chroma-Token": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({ name: "nova_chunks" }),
    });
    if (!create.ok) throw new Error(`Chroma create error ${create.status}`);
    const data = await create.json();
    return data.id || data.uuid;
  }
  if (!res.ok) throw new Error(`Chroma get collection error ${res.status}`);
  const data = await res.json();
  return data.id || data.uuid;
}

export async function POST(req: NextRequest) {
  const user = getAuthUser(req);
  if (!user || user.role !== "admin") return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { clientId } = await req.json().catch(() => ({}));
  const where = clientId ? { id: clientId } : { useVectorRag: true };

  const clients = await db.prisma.client.findMany({
    where,
    select: { id: true, name: true, chunkSize: true, chromaUrl: true, chromaApiKey: true, jinaApiKey: true },
  });

  const results: any[] = [];

  for (const client of clients) {
    if (!client.chromaUrl || !client.chromaApiKey || !client.jinaApiKey) {
      results.push({ client: client.name || client.id, status: "skipped", reason: "credentials manquants" });
      continue;
    }

    const log: any = { client: client.name || client.id, documents: 0, kbEntries: 0, errors: [] };
    const chunkSize = client.chunkSize ?? 600;

    /* ── Documents ── */
    const docs = await db.prisma.clientDocument.findMany({
      where: { clientId: client.id, status: { not: "archived" } },
    });
    for (const doc of docs) {
      try {
        await syncDocumentChunks(doc.id, client.id, doc.content, doc.originalName, doc.source_url, doc.valid_until?.toISOString() || null, chunkSize, client.chromaUrl, client.chromaApiKey, client.jinaApiKey);
        log.documents++;
      } catch (err: any) {
        log.errors.push(`doc ${doc.id}: ${err.message}`);
      }
    }

    /* ── KB entries ── */
    const collectionId = await getCollectionId(client.chromaUrl, client.chromaApiKey);
    const kbEntries = await db.prisma.kBEntry.findMany({ where: { clientId: client.id } });

    for (const kb of kbEntries) {
      try {
        const content = `Question: ${kb.question}\n${kb.alt_questions ? "Variantes: " + kb.alt_questions + "\n" : ""}Réponse: ${kb.answer}`;
        const chunks = chunkDocument({ id: kb.id, content, source_url: kb.source_url, valid_until: kb.valid_until || null, originalName: `KB: ${kb.tag || kb.question.slice(0, 50)}` }, chunkSize);
        if (chunks.length === 0) continue;

        const texts = chunks.map((c) => c.content);
        const embeddings = await generateEmbeddings(texts, client.jinaApiKey);
        const ids = chunks.map((c, i) => `${kb.id}__kb__${i}`);
        const metadatas = chunks.map((c) => ({
          clientId: client.id,
          docId: kb.id,
          chunkId: c.id,
          source: c.source,
          section: c.section,
          keywords: c.keywords.join(", "),
          source_url: kb.source_url || "",
          valid_until: kb.valid_until || "",
        }));

        await fetch(`${client.chromaUrl}/api/v1/collections/${collectionId}/delete`, {
          method: "POST",
          headers: { "X-Chroma-Token": client.chromaApiKey, "Content-Type": "application/json" },
          body: JSON.stringify({ where: { docId: kb.id } }),
        }).catch(() => {});

        const upsertRes = await fetch(`${client.chromaUrl}/api/v1/collections/${collectionId}/upsert`, {
          method: "POST",
          headers: { "X-Chroma-Token": client.chromaApiKey, "Content-Type": "application/json" },
          body: JSON.stringify({ ids, embeddings, metadatas }),
        });
        if (!upsertRes.ok) throw new Error(`Chroma upsert error ${upsertRes.status}`);
        log.kbEntries++;
      } catch (err: any) {
        log.errors.push(`kb ${kb.id}: ${err.message}`);
      }
    }

    results.push(log);
  }

  return NextResponse.json({ done: true, results });
}
