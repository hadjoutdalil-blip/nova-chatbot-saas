import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/api-auth";
import { randomUUID } from "crypto";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const docs = await db.read<any>("client_documents");
  const doc = docs.find((d: any) => d.id === id && (d.clientId === user.clientId || user.role === "admin"));
  if (!doc) return NextResponse.json({ error: "Document introuvable" }, { status: 404 });

  return NextResponse.json({
    id: doc.id,
    clientId: doc.clientId,
    originalName: doc.originalName,
    mimeType: doc.mimeType,
    content: doc.content,
    fileSize: doc.fileSize || doc.content?.length || 0,
    description: doc.description || "",
    tags: doc.tags || "",
    category: doc.category || "",
    author: doc.author || "",
    version: doc.version ?? 1,
    previousVersionId: doc.previousVersionId || "",
    source_url: doc.source_url || "",
    valid_from: doc.valid_from || null,
    valid_until: doc.valid_until || null,
    status: doc.status || "active",
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const docs = await db.read<any>("client_documents");
  const idx = docs.findIndex((d: any) => d.id === id && (d.clientId === user.clientId || user.role === "admin"));
  if (idx === -1) return NextResponse.json({ error: "Document introuvable" }, { status: 404 });

  const form = await req.formData();
  const file = form.get("file") as File | null;
  const existing = docs[idx];

  const update: any = { ...existing, updatedAt: new Date().toISOString() };

  const description = form.get("description")?.toString();
  const tags = form.get("tags")?.toString();
  const category = form.get("category")?.toString();
  const author = form.get("author")?.toString();
  const valid_from = form.get("valid_from")?.toString();
  const valid_until = form.get("valid_until")?.toString();
  const status = form.get("status")?.toString();

  if (description !== undefined) update.description = description;
  if (tags !== undefined) update.tags = tags;
  if (category !== undefined) update.category = category;
  if (author !== undefined) update.author = author;
  if (valid_from !== undefined) update.valid_from = valid_from || null;
  if (valid_until !== undefined) update.valid_until = valid_until || null;
  if (status !== undefined) update.status = status;

  if (file) {
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) return NextResponse.json({ error: "Fichier trop volumineux (max 5 Mo)" }, { status: 400 });

    const allowedTypes = ["text/plain", "text/csv", "application/json", "text/markdown"];
    if (!allowedTypes.includes(file.type) && !file.name.endsWith(".txt") && !file.name.endsWith(".csv") && !file.name.endsWith(".json") && !file.name.endsWith(".md")) {
      return NextResponse.json({ error: "Format non supporté" }, { status: 400 });
    }

    const text = await file.text();
    if (!text.trim()) return NextResponse.json({ error: "Fichier vide" }, { status: 400 });

    update.previousVersionId = existing.id;
    update.id = randomUUID();
    update.version = (existing.version || 1) + 1;
    update.originalName = file.name;
    update.mimeType = file.type || "text/plain";
    update.content = file.type === "application/json" ? JSON.stringify(JSON.parse(text), null, 2) : text;
    update.fileSize = file.size;
    update.createdAt = new Date().toISOString();
    update.source_url = `/api/client-documents/${update.id}/download`;
    update.status = "active";

    docs[idx].status = "archived";
    docs.push(update);
  }

  await db.write("client_documents", docs);
  return NextResponse.json({
    id: update.id,
    originalName: update.originalName,
    version: update.version,
    fileSize: update.fileSize,
    source_url: update.source_url,
    description: update.description,
    tags: update.tags,
    category: update.category,
    valid_from: update.valid_from,
    valid_until: update.valid_until,
    status: update.status,
  });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const docs = await db.read<any>("client_documents");
  const idx = docs.findIndex((d: any) => d.id === id && (d.clientId === user.clientId || user.role === "admin"));
  if (idx === -1) return NextResponse.json({ error: "Document introuvable" }, { status: 404 });

  docs[idx].status = "archived";
  docs[idx].updatedAt = new Date().toISOString();
  await db.write("client_documents", docs);
  return NextResponse.json({ message: "Document archivé" });
}
