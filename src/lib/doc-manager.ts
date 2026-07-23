import { randomUUID } from "crypto";
import { db } from "./db";
import { saveFile, readFile, deleteFile, listFiles } from "./storage";
import { syncDocumentChunks, deleteDocChunks } from "./vector-store";
import { getActiveEmbeddingKey } from "./embedding-keys";

export interface SaveDocParams {
  clientId: string;
  clientSlug: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  data: Buffer;
  sourceUrl?: string;
  title?: string;
  description?: string;
  topics?: string;
}

export async function saveDocument(params: SaveDocParams) {
  const {
    clientId,
    clientSlug,
    fileName,
    originalName,
    mimeType,
    data,
    sourceUrl = "",
    title = "",
    description = "",
    topics = "",
  } = params;

  const { storagePath } = await saveFile(clientSlug, "docs", fileName, data);

  const doc = await db.prisma.clientLocalDoc.create({
    data: {
      id: randomUUID(),
      clientId,
      fileName,
      originalName,
      storagePath,
      mimeType,
      fileSize: data.length,
      content: "",
      sourceUrl,
      title: title || originalName,
      description,
      topics,
      status: "active",
    },
  });

  return doc;
}

export async function indexDocumentText(
  docId: string,
  clientId: string,
  content: string,
  source: string,
  sourceUrl: string,
) {
  const client = await db.prisma.client.findUnique({ where: { id: clientId } });
  if (!client?.useVectorRag) return;

  const activeKey = await getActiveEmbeddingKey(clientId);
  const apiKey = activeKey?.key || client.hfApiKey;
  const provider = activeKey?.provider || client.embeddingProvider;
  if (!apiKey) return;

  await syncDocumentChunks(
    docId,
    clientId,
    content,
    source,
    sourceUrl,
    null,
    client.chunkSize || 500,
    apiKey,
    provider,
    activeKey?.id,
  );

  await db.prisma.clientLocalDoc.update({
    where: { id: docId },
    data: { content },
  });
}

export async function removeDocument(docId: string, clientSlug: string, fileName: string) {
  await deleteDocChunks(docId);
  await deleteFile(clientSlug, "docs", fileName);
  await db.prisma.clientLocalDoc.delete({ where: { id: docId } }).catch(() => {});
}

export async function upsertDocument(params: SaveDocParams & { content: string }) {
  const existing = await db.prisma.clientLocalDoc.findFirst({
    where: {
      clientId: params.clientId,
      sourceUrl: params.sourceUrl || "",
      status: "active",
    },
  });

  if (existing) {
    await deleteDocChunks(existing.id);
    const { storagePath } = await saveFile(params.clientSlug, "docs", params.fileName, params.data);
    await db.prisma.clientLocalDoc.update({
      where: { id: existing.id },
      data: {
        storagePath,
        fileSize: params.data.length,
        content: params.content,
        title: params.title || params.originalName,
        description: params.description,
        topics: params.topics,
        updatedAt: new Date(),
      },
    });
    await indexDocumentText(existing.id, params.clientId, params.content, params.fileName, params.sourceUrl || "");
    return existing.id;
  }

  const doc = await saveDocument(params);
  await indexDocumentText(doc.id, params.clientId, params.content, params.fileName, params.sourceUrl || "");
  return doc.id;
}

export async function listDocuments(clientId: string) {
  return db.prisma.clientLocalDoc.findMany({
    where: { clientId, status: "active" },
    orderBy: { createdAt: "desc" },
  });
}

export async function getDocument(docId: string, clientId: string) {
  return db.prisma.clientLocalDoc.findFirst({
    where: { id: docId, clientId, status: "active" },
  });
}

export async function downloadDocument(docId: string, clientId: string) {
  const doc = await getDocument(docId, clientId);
  if (!doc) return null;
  const data = await readFile(doc.storagePath);
  return { data, doc };
}

export async function findRelevantDocs(clientId: string, keywords: string[]) {
  const where = keywords.length > 0
    ? {
        clientId,
        status: "active" as const,
        OR: keywords.flatMap((kw) => [
          { topics: { contains: kw, mode: "insensitive" as const } },
          { title: { contains: kw, mode: "insensitive" as const } },
          { description: { contains: kw, mode: "insensitive" as const } },
        ]),
      }
    : { clientId, status: "active" as const };

  return db.prisma.clientLocalDoc.findMany({ where, take: 5 });
}
