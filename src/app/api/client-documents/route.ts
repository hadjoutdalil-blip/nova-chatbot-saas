import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/api-auth";
import { randomUUID } from "crypto";

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
  const all = await db.read<any>("client_documents");
  const docs = all
    .filter((d: any) => d.clientId === clientId && d.status !== "archived")
    .map((d: any) => ({
      id: d.id,
      originalName: d.originalName,
      mimeType: d.mimeType,
      fileSize: d.fileSize || d.content?.length || 0,
      description: d.description || "",
      tags: d.tags || "",
      category: d.category || "",
      author: d.author || "",
      version: d.version ?? 1,
      status: d.status || "active",
      valid_from: d.valid_from || null,
      valid_until: d.valid_until || null,
      source_url: d.source_url || "",
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    }));
  return NextResponse.json(docs);
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

  const text = await file.text();
  if (!text.trim()) return NextResponse.json({ error: "Fichier vide" }, { status: 400 });

  const content = file.type === "application/json" ? JSON.stringify(JSON.parse(text), null, 2) : text;

  const description = form.get("description")?.toString() || "";
  const tags = form.get("tags")?.toString() || "";
  const category = form.get("category")?.toString() || "";
  const author = form.get("author")?.toString() || "";
  const valid_from = form.get("valid_from")?.toString() || "";
  const valid_until = form.get("valid_until")?.toString() || "";

  const all = await db.read<any>("client_documents");
  const doc = {
    id: randomUUID(),
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
    source_url: `/api/client-documents/${randomUUID()}/download`,
    valid_from: valid_from || null,
    valid_until: valid_until || null,
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  doc.source_url = `/api/client-documents/${doc.id}/download`;
  all.push(doc);
  await db.write("client_documents", all);

  return NextResponse.json({
    id: doc.id,
    originalName: doc.originalName,
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
