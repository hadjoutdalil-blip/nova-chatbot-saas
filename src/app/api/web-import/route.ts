import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/api-auth";
import { randomUUID } from "crypto";
import { syncDocumentChunks } from "@/lib/vector-store";
import { getActiveEmbeddingKey } from "@/lib/embedding-keys";
import { upsertDocument } from "@/lib/doc-manager";
import { importKBEntries, KBImportEntry } from "@/lib/kb-import";

function verifyImportKey(req: NextRequest): boolean {
  const key = req.headers.get("x-import-key");
  return key === process.env.IMPORT_API_KEY;
}

export async function POST(req: NextRequest) {
  const user = getAuthUser(req);
  const importKey = req.headers.get("x-import-key");
  const isImportAuth = importKey && verifyImportKey(req);

  if (!user && !isImportAuth) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const body = await req.json();
  const { url, content, clientId: bodyClientId, mode = "upsert", documents = [], kbEntries = [] } = body;
  const clientId = bodyClientId || user?.clientId;

  if (!content || !clientId) {
    return NextResponse.json({ error: "content et clientId requis" }, { status: 400 });
  }

  if (user && user.role !== "admin" && clientId !== user.clientId) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const client = await db.prisma.client.findUnique({ where: { id: clientId } });
  if (!client) return NextResponse.json({ error: "Client introuvable" }, { status: 404 });

  let chunksCount = 0;
  let docsCount = 0;
  let kbCount = 0;
  const errors: string[] = [];

  if (content && client.useVectorRag) {
    const activeKey = await getActiveEmbeddingKey(clientId);
    const apiKey = activeKey?.key || client.hfApiKey;
    const provider = activeKey?.provider || client.embeddingProvider;

    if (apiKey) {
      if (mode === "upsert" && url) {
        const existing = await db.prisma.clientDocument.findFirst({
          where: { clientId, source_url: url },
        });
        if (existing) {
          const { Pool } = await import("@neondatabase/serverless");
          const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
          await pool.query('DELETE FROM document_chunks WHERE "docId" = $1', [existing.id]);
          await pool.end();
          await db.prisma.clientDocument.update({
            where: { id: existing.id },
            data: { content, updatedAt: new Date() },
          });
          const docId = existing.id;
          try {
            await syncDocumentChunks(docId, clientId, content, url, url, null, client.chunkSize || 500, apiKey, provider, activeKey?.id);
            chunksCount = 1;
          } catch (err: any) {
            errors.push(`Vector sync error: ${err.message}`);
          }
        } else {
          const docId = randomUUID();
          await db.prisma.clientDocument.create({
            data: {
              id: docId,
              clientId,
              originalName: url,
              mimeType: "text/html",
              content,
              fileSize: content.length,
              description: "",
              tags: "",
              category: "",
              author: "",
              version: 1,
              previousVersionId: "",
              source_url: url,
              status: "active",
            },
          });
          try {
            await syncDocumentChunks(docId, clientId, content, url, url, null, client.chunkSize || 500, apiKey, provider, activeKey?.id);
            chunksCount = 1;
          } catch (err: any) {
            errors.push(`Vector sync error: ${err.message}`);
          }
        }
      } else {
        const docId = randomUUID();
        try {
          await syncDocumentChunks(docId, clientId, content, url || "web-import", url || "", null, client.chunkSize || 500, apiKey, provider, activeKey?.id);
          chunksCount = 1;
        } catch (err: any) {
          errors.push(`Vector sync error: ${err.message}`);
        }
      }
    }
  }

  for (const doc of documents) {
    try {
      const res = await fetch(doc.url);
      if (!res.ok) {
        errors.push(`Failed to download ${doc.url}: ${res.statusText}`);
        continue;
      }
      const buffer = Buffer.from(await res.arrayBuffer());
      const ext = doc.url.split(".").pop() || "bin";
      const mimeType = ext === "pdf" ? "application/pdf" : ext === "docx" ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document" : `application/${ext}`;

      await upsertDocument({
        clientId,
        clientSlug: client.slug,
        fileName: doc.url.split("/").pop() || `doc-${Date.now()}.${ext}`,
        originalName: doc.url.split("/").pop() || `doc.${ext}`,
        mimeType,
        data: buffer,
        sourceUrl: doc.url,
        title: doc.title || "",
        description: doc.description || "",
        topics: doc.topics || "",
        content: doc.title || "",
      });
      docsCount++;
    } catch (err: any) {
      errors.push(`Error processing doc ${doc.url}: ${err.message}`);
    }
  }

  if (kbEntries.length > 0) {
    try {
      const result = await importKBEntries(clientId, kbEntries as KBImportEntry[], url || "web-import");
      kbCount = result.kbCount;
    } catch (err: any) {
      errors.push(`KB import error: ${err.message}`);
    }
  }

  return NextResponse.json({ chunksCount, docsCount, kbCount, errors });
}
