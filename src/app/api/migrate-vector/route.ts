import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/api-auth";
import { syncDocumentChunks } from "@/lib/vector-store";
import { chunkDocument } from "@/lib/rag-utils";
import { generateEmbeddings } from "@/lib/embeddings";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export async function POST(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    if (!user || user.role !== "admin") return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const { clientId } = await req.json().catch(() => ({}));
    const where = clientId ? { id: clientId } : { useVectorRag: true };

    const clients = await db.prisma.client.findMany({
      where,
      select: { id: true, name: true, chunkSize: true, hfApiKey: true },
    });

    const results: any[] = [];

    for (const client of clients) {
      try {
        if (!client.hfApiKey) {
          results.push({ client: client.name || client.id, status: "skipped", reason: "clé API embedding manquante" });
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
            await syncDocumentChunks(doc.id, client.id, doc.content, doc.originalName, doc.source_url, doc.valid_until?.toISOString() || null, chunkSize, client.hfApiKey);
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

            /* Delete existing KB chunks */
            await sql`DELETE FROM document_chunks WHERE "docId" = ${kb.id}`;

            for (let i = 0; i < chunks.length; i++) {
              const c = chunks[i];
              const rowId = `${kb.id}__kb__${i}`;
              const embeddingStr = `[${embeddings[i].join(",")}]`;
              await sql`
                INSERT INTO document_chunks (id, "clientId", "docId", "chunkId", content, source, section, keywords, source_url, valid_until, embedding)
                VALUES (${rowId}, ${client.id}, ${kb.id}, ${c.id}, ${c.content}, ${c.source}, ${c.section}, ${c.keywords.join(", ")}, ${kb.source_url || ""}, ${kb.valid_until || ""}, ${embeddingStr}::vector)
              `;
            }
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
