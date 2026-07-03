import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/api-auth";
import { randomUUID } from "crypto";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const doc = await db.prisma.clientDocument.findUnique({ where: { id } });
  if (!doc || (doc.clientId !== user.clientId && user.role !== "admin")) {
    return NextResponse.json({ error: "Document introuvable" }, { status: 404 });
  }

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
  const existing = await db.prisma.clientDocument.findUnique({ where: { id } });
  if (!existing || (existing.clientId !== user.clientId && user.role !== "admin")) {
    return NextResponse.json({ error: "Document introuvable" }, { status: 404 });
  }

  const form = await req.formData();
  const file = form.get("file") as File | null;

  const update: any = {};

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

    const text = (await file.text()).replace(/^\uFEFF/, "");
    if (!text.trim()) return NextResponse.json({ error: "Fichier vide" }, { status: 400 });

    await db.prisma.clientDocument.update({
      where: { id },
      data: { status: "archived" },
    });

    const newId = randomUUID();
    const isJson = file.type === "application/json" || file.name.endsWith(".json");
    let parsedContent = text;
    if (isJson) {
      try { parsedContent = JSON.stringify(JSON.parse(text), null, 2); }
      catch { return NextResponse.json({ error: "Fichier JSON invalide" }, { status: 400 }); }
    }
    const newDoc = await db.prisma.clientDocument.create({
      data: {
        id: newId,
        clientId: existing.clientId,
        originalName: file.name,
        mimeType: file.type || "text/plain",
        content: parsedContent,
        fileSize: file.size,
        description: update.description || existing.description || "",
        tags: update.tags || existing.tags || "",
        category: update.category || existing.category || "",
        author: update.author || existing.author || "",
        version: (existing.version || 1) + 1,
        previousVersionId: id,
        source_url: `/api/client-documents/${newId}/download`,
        valid_from: update.valid_from ?? existing.valid_from,
        valid_until: update.valid_until ?? existing.valid_until,
        status: "active",
      },
    });

    return NextResponse.json({
      id: newDoc.id,
      originalName: newDoc.originalName,
      version: newDoc.version,
      fileSize: newDoc.fileSize,
      source_url: newDoc.source_url,
      description: newDoc.description,
      tags: newDoc.tags,
      category: newDoc.category,
      valid_from: newDoc.valid_from,
      valid_until: newDoc.valid_until,
      status: newDoc.status,
    });
  }

  if (Object.keys(update).length > 0) {
    const updated = await db.prisma.clientDocument.update({ where: { id }, data: update });
    return NextResponse.json({
      id: updated.id,
      originalName: updated.originalName,
      version: updated.version,
      fileSize: updated.fileSize,
      source_url: updated.source_url,
      description: updated.description,
      tags: updated.tags,
      category: updated.category,
      valid_from: updated.valid_from,
      valid_until: updated.valid_until,
      status: updated.status,
    });
  }

  return NextResponse.json({
    id: existing.id,
    originalName: existing.originalName,
    version: existing.version,
    fileSize: existing.fileSize,
    source_url: existing.source_url,
    description: existing.description,
    tags: existing.tags,
    category: existing.category,
    valid_from: existing.valid_from,
    valid_until: existing.valid_until,
    status: existing.status,
  });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const existing = await db.prisma.clientDocument.findUnique({ where: { id } });
  if (!existing || (existing.clientId !== user.clientId && user.role !== "admin")) {
    return NextResponse.json({ error: "Document introuvable" }, { status: 404 });
  }

  await db.prisma.clientDocument.update({
    where: { id },
    data: { status: "archived" },
  });
  return NextResponse.json({ message: "Document archivé" });
}
