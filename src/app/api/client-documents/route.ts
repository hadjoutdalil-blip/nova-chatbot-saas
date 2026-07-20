import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/api-auth";
import { randomUUID } from "crypto";
import { syncDocumentChunks } from "@/lib/vector-store";
import { getActiveEmbeddingKey } from "@/lib/embedding-keys";

function getTargetClientId(req: NextRequest, user: { userId: string; clientId: string; role: string }): string {
  const url = new URL(req.url);
  const param = url.searchParams.get("clientId");
  if (param && user.role === "admin") return param;
  return user.clientId;
}

export async function GET(req: NextRequest) {
  const user = getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const clientId = getTargetClientId(req, user);
  const docs = await db.prisma.clientDocument.findMany({
    where: { clientId, status: { not: "archived" } },
    select: {
      id: true,
      originalName: true,
      mimeType: true,
      content: true,
      fileSize: true,
      description: true,
      tags: true,
      category: true,
      author: true,
      version: true,
      status: true,
      valid_from: true,
      valid_until: true,
      source_url: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  const mapped = docs.map((d) => ({
    ...d,
    fileSize: d.fileSize || 0,
    description: d.description || "",
    tags: d.tags || "",
    category: d.category || "",
    author: d.author || "",
    version: d.version ?? 1,
    status: d.status || "active",
    valid_from: d.valid_from || null,
    valid_until: d.valid_until || null,
    source_url: d.source_url || "",
  }));
  return NextResponse.json(mapped);
}

export async function POST(req: NextRequest) {
  const user = getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const clientId = getTargetClientId(req, user);
  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "Fichier requis" }, { status: 400 });

  const MAX_SIZE = 5 * 1024 * 1024;
  if (file.size > MAX_SIZE) return NextResponse.json({ error: "Fichier trop volumineux (max 5 Mo)" }, { status: 400 });

  const allowedTypes = ["text/plain", "text/csv", "application/json", "text/markdown"];
  if (!allowedTypes.includes(file.type) && !file.name.endsWith(".txt") && !file.name.endsWith(".csv") && !file.name.endsWith(".json") && !file.name.endsWith(".md")) {
    return NextResponse.json({ error: "Format non supporté. Utilisez .txt, .csv, .json ou .md" }, { status: 400 });
  }

  let raw = await file.text();
  raw = raw.replace(/^\uFEFF/, "");
  if (!raw.trim()) return NextResponse.json({ error: "Fichier vide" }, { status: 400 });

  const isJson = file.type === "application/json" || file.name.endsWith(".json");
  let content = raw;
  if (isJson) {
    try { content = JSON.stringify(JSON.parse(raw), null, 2); }
    catch (e: any) { return NextResponse.json({ error: "Fichier JSON invalide : " + (e?.message || "erreur inconnue") + " (premiers 200 car.: " + JSON.stringify(raw.slice(0, 200)) + ")" }, { status: 400 }); }
  }

  const description = form.get("description")?.toString() || "";
  const tags = form.get("tags")?.toString() || "";
  const category = form.get("category")?.toString() || "";
  const author = form.get("author")?.toString() || "";
  const valid_from = form.get("valid_from")?.toString() || "";
  const valid_until = form.get("valid_until")?.toString() || "";

  const docId = randomUUID();
  const doc = await db.prisma.clientDocument.create({
    data: {
      id: docId,
      clientId,
      originalName: file.name,
      mimeType: file.type || "text/plain",
      content,
      fileSize: file.size,
      description,
      tags,
      category,
      author,
      version: 1,
      previousVersionId: "",
      source_url: `/api/client-documents/${docId}/download`,
      valid_from: valid_from || null,
      valid_until: valid_until || null,
      status: "active",
    },
  });

  const client = await db.prisma.client.findUnique({ where: { id: clientId } });
  if (client?.useVectorRag) {
    const activeKey = await getActiveEmbeddingKey(clientId);
    const apiKey = activeKey?.key || client.hfApiKey;
    const provider = activeKey?.provider || client.embeddingProvider;
    if (apiKey) {
      syncDocumentChunks(doc.id, clientId, content, file.name, doc.source_url, valid_until || null, client.chunkSize || 500, apiKey, provider).catch((err) => console.error("[Vector Sync]", err));
    }
  }

  return NextResponse.json({
    id: doc.id,
    originalName: doc.originalName,
    content: doc.content,
    fileSize: doc.fileSize,
    description: doc.description,
    tags: doc.tags,
    category: doc.category,
    version: doc.version,
    source_url: doc.source_url,
    valid_from: doc.valid_from,
    valid_until: doc.valid_until,
  }, { status: 201 });
}
