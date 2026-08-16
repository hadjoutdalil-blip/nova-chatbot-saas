import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/api-auth";
import { syncDocumentChunks, syncKBEntry, recreateTable } from "@/lib/vector-store";
import { getActiveEmbeddingKey } from "@/lib/embedding-keys";

export async function POST(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const { clientId, type: reqType } = await req.json().catch(() => ({}));
    const type = reqType || "all";
    const targetClientId = clientId || user.clientId;

    // Only admin can run for all clients; others only for their own
    if (user.role !== "admin" && targetClientId !== user.clientId)
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    // Full migration (no clientId): recreate table with correct dimension
    if (user.role === "admin" && !clientId) {
      await recreateTable();
    }

    const where = user.role === "admin" && !clientId ? { useVectorRag: true } : { id: targetClientId };
    const clients = await db.prisma.client.findMany({
      where,
      select: { id: true, name: true, chunkSize: true, hfApiKey: true, embeddingProvider: true },
    });

    const results: any[] = [];

    for (const client of clients) {
      try {
        const ak = await getActiveEmbeddingKey(client.id);
        const apiKey = ak?.key || client.hfApiKey;
        const provider = ak?.provider || client.embeddingProvider;
        const embedKeyId = ak?.id;

        if (!apiKey) {
          results.push({ client: client.name || client.id, status: "skipped", reason: "clé API embedding manquante" });
          continue;
        }

        const log: any = { client: client.name || client.id, documents: 0, kbEntries: 0, errors: [] };
        const chunkSize = client.chunkSize ?? 600;

        /* ── Documents ── */
        if (type === "all" || type === "documents") {
          const docs = await db.prisma.clientDocument.findMany({
            where: { clientId: client.id, status: { not: "archived" } },
          });
          for (const doc of docs) {
            try {
              await syncDocumentChunks(doc.id, client.id, doc.content, doc.originalName, doc.source_url, doc.valid_until?.toISOString() || null, chunkSize, apiKey, provider, embedKeyId);
              log.documents++;
            } catch (err: any) {
              log.errors.push(`doc ${doc.id}: ${err.message}`);
            }
          }
        }

        /* ── KB entries ── */
        if (type === "all" || type === "kb") {
          const kbEntries = await db.prisma.kBEntry.findMany({ where: { clientId: client.id } });
          for (const kb of kbEntries) {
            try {
              await syncKBEntry(client.id, {
                id: kb.id,
                tag: kb.tag,
                question: kb.question,
                alt_questions: kb.alt_questions || null,
                answer: kb.answer,
                source_url: kb.source_url || null,
                valid_until: kb.valid_until || null,
              }, apiKey, provider, embedKeyId);
              log.kbEntries++;
            } catch (err: any) {
              log.errors.push(`kb ${kb.id}: ${err.message}`);
            }
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
