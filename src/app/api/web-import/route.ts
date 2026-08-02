import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/api-auth";
import { randomUUID } from "crypto";
import { syncDocumentChunks } from "@/lib/vector-store";
import { getActiveEmbeddingKey } from "@/lib/embedding-keys";
import { upsertDocument } from "@/lib/doc-manager";
import { importKBEntries, KBImportEntry } from "@/lib/kb-import";
import { isPdfName, extractPdfText } from "@/lib/pdf-extractor";

function verifyImportKey(req: NextRequest): boolean {
  const key = req.headers.get("x-import-key");
  return key === process.env.IMPORT_API_KEY;
}

async function scrapeUrl(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7",
      "Accept-Encoding": "gzip, deflate, br",
      "Cache-Control": "no-cache",
      "Sec-Fetch-Dest": "document",
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-Site": "none",
      "Sec-Fetch-User": "?1",
      "Upgrade-Insecure-Requests": "1",
    },
    signal: AbortSignal.timeout(30000),
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} when fetching ${url}`);
  const html = await res.text();
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "")
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "")
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, "")
    .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

export async function POST(req: NextRequest) {
  const user = getAuthUser(req);
  const importKey = req.headers.get("x-import-key");
  const isImportAuth = importKey && verifyImportKey(req);

  if (!user && !isImportAuth) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const body = await req.json();
  const { url, content: rawContent, clientId: bodyClientId, mode = "upsert", documents = [], kbEntries = [] } = body;
  const clientId = bodyClientId || user?.clientId;

  if (!clientId) {
    return NextResponse.json({ error: "clientId requis" }, { status: 400 });
  }

  if (user && user.role !== "admin" && clientId !== user.clientId) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const client = await db.prisma.client.findUnique({ where: { id: clientId } });
  if (!client) return NextResponse.json({ error: "Client introuvable" }, { status: 404 });

  const targetUrl = url || client.siteUrl;
  let content = rawContent;

  if (!content && targetUrl) {
    try {
      content = await scrapeUrl(targetUrl);
    } catch (err: any) {
      return NextResponse.json({ error: `Erreur scraping: ${err.message}` }, { status: 422 });
    }
  }

  if (!content) {
    return NextResponse.json({ error: "content ou url requis" }, { status: 400 });
  }

  let chunksCount = 0;
  let docsCount = 0;
  let kbCount = 0;
  const errors: string[] = [];

  if (content && client.useVectorRag) {
    const activeKey = await getActiveEmbeddingKey(clientId);
    const apiKey = activeKey?.key || client.hfApiKey;
    const provider = activeKey?.provider || client.embeddingProvider;

    if (apiKey) {
      if (mode === "upsert" && targetUrl) {
        const existing = await db.prisma.clientDocument.findFirst({
          where: { clientId, source_url: targetUrl },
        });
        if (existing) {
          const { Pool } = await import("pg");
          const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
          await pool.query('DELETE FROM document_chunks WHERE "docId" = $1', [existing.id]);
          await pool.end();
          await db.prisma.clientDocument.update({
            where: { id: existing.id },
            data: { content, updatedAt: new Date() },
          });
          const docId = existing.id;
          try {
            await syncDocumentChunks(docId, clientId, content, targetUrl, targetUrl, null, client.chunkSize || 500, apiKey, provider, activeKey?.id);
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
              originalName: targetUrl,
              mimeType: "text/html",
              content,
              fileSize: content.length,
              description: "",
              tags: "",
              category: "",
              author: "",
              version: 1,
              previousVersionId: "",
              source_url: targetUrl,
              status: "active",
            },
          });
          try {
            await syncDocumentChunks(docId, clientId, content, targetUrl, targetUrl, null, client.chunkSize || 500, apiKey, provider, activeKey?.id);
            chunksCount = 1;
          } catch (err: any) {
            errors.push(`Vector sync error: ${err.message}`);
          }
        }
      } else {
        const docId = randomUUID();
        try {
          await syncDocumentChunks(docId, clientId, content, targetUrl || "web-import", targetUrl || "", null, client.chunkSize || 500, apiKey, provider, activeKey?.id);
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
      const urlPath = doc.url.split("/");
      const fileName = urlPath.pop() || `doc-${Date.now()}.bin`;
      const ext = fileName.split(".").pop() || "bin";
      const mimeType = ext === "pdf" ? "application/pdf" : ext === "docx" ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document" : `application/${ext}`;

      /* PDF : extraire le vrai texte pour l'indexation (pas seulement le titre) */
      let content = doc.title || "";
      if (isPdfName(fileName) || ext === "pdf") {
        try {
          const extracted = await extractPdfText(buffer);
          if (extracted.trim()) content = extracted;
          else errors.push(`PDF sans texte extractible: ${doc.url}`);
        } catch (err: any) {
          errors.push(`PDF extraction error ${doc.url}: ${err.message}`);
        }
      }

      await upsertDocument({
        clientId,
        clientSlug: client.slug,
        fileName,
        originalName: fileName,
        mimeType,
        data: buffer,
        sourceUrl: doc.url,
        title: doc.title || "",
        description: doc.description || "",
        topics: doc.topics || "",
        content,
      });
      docsCount++;
    } catch (err: any) {
      errors.push(`Error processing doc ${doc.url}: ${err.message}`);
    }
  }

  if (kbEntries.length > 0) {
    try {
      const result = await importKBEntries(clientId, kbEntries as KBImportEntry[], targetUrl || "web-import");
      kbCount = result.kbCount;
    } catch (err: any) {
      errors.push(`KB import error: ${err.message}`);
    }
  }

  return NextResponse.json({ chunksCount, docsCount, kbCount, errors });
}
