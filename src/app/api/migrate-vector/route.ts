import { NextRequest, NextResponse } from "next/server";
import { ChromaClient } from "chromadb";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/api-auth";
import { syncDocumentChunks } from "@/lib/vector-store";
import { chunkDocument } from "@/lib/rag-utils";
import { generateEmbeddings } from "@/lib/embeddings";

const COLLECTION_NAME = "nova_chunks";
const noopEmbed = { generate: async (_texts: string[]) => [] };

async function getOrCreateCollection(apiKey: string, tenant: string, database: string): Promise<any> {
  const client = new ChromaClient({
    host: "api.trychroma.com",
    ssl: true,
    headers: { "X-Chroma-Token": apiKey },
    tenant,
    database,
  });
  return client.getOrCreateCollection({ name: COLLECTION_NAME, embeddingFunction: noopEmbed });
}

export async function POST(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    if (!user || user.role !== "admin") return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const { clientId } = await req.json().catch(() => ({}));
    const where = clientId ? { id: clientId } : { useVectorRag: true };

    const clients = await db.prisma.client.findMany({
      where,
      select: { id: true, name: true, chunkSize: true, chromaApiKey: true, chromaTenant: true, chromaDatabase: true, hfApiKey: true },
    });

    const results: any[] = [];

    for (const client of clients) {
      try {
        if (!client.chromaApiKey || !client.chromaTenant || !client.chromaDatabase || !client.hfApiKey) {
          results.push({ client: client.name || client.id, status: "skipped", reason: "credentials manquants" });
          continue;
        }

        const log: any = { client: client.name || client.id, documents: 0, kbEntries: 0, errors: [] };
        const chunkSize = client.chunkSize ?? 600;

        const collection = await getOrCreateCollection(client.chromaApiKey, client.chromaTenant, client.chromaDatabase);

        /* ── Documents ── */
        const docs = await db.prisma.clientDocument.findMany({
          where: { clientId: client.id, status: { not: "archived" } },
        });
        for (const doc of docs) {
          try {
            await syncDocumentChunks(doc.id, client.id, doc.content, doc.originalName, doc.source_url, doc.valid_until?.toISOString() || null, chunkSize, client.chromaApiKey, client.chromaTenant, client.chromaDatabase, client.hfApiKey);
            log.documents++;
          } catch (err: any) {
            log.errors.push(`doc ${doc.id}: ${err.message}`);
          }
        }

        /* ── KB entries ── */
        const kbEntries = await db.prisma.kBEntry.findMany({ where: { clientId: client.id } });
        for (const kb of kbEntries) {
          try {
            const content = `Question: ${kb.question}\n${kb.alt_questions ? "Variantes: " + kb.alt_questions + "\n" : ""}Réponse: ${kb.answer}`;
            const chunks = chunkDocument({ id: kb.id, content, source_url: kb.source_url, valid_until: kb.valid_until || null, originalName: `KB: ${kb.tag || kb.question.slice(0, 50)}` }, chunkSize);
            if (chunks.length === 0) continue;

            const texts = chunks.map((c) => c.content);
            const embeddings = await generateEmbeddings(texts, client.hfApiKey);
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

            await collection.delete({ where: { docId: kb.id } }).catch(() => {});
            await collection.add({ ids, embeddings, metadatas });
            log.kbEntries++;
          } catch (err: any) {
            log.errors.push(`kb ${kb.id}: ${err.message}`);
          }
        }

        results.push(log);
      } catch (err: any) {
        results.push({ client: client.name || client.id, status: "error", reason: err.message });
      }
    }

    return NextResponse.json({ done: true, results });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
