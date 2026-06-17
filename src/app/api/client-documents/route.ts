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
  const docs = all.filter((d: any) => d.clientId === clientId).map((d: any) => ({
    id: d.id,
    originalName: d.originalName,
    mimeType: d.mimeType,
    contentLength: d.content?.length || 0,
    createdAt: d.createdAt,
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

  const all = await db.read<any>("client_documents");
  const doc = {
    id: randomUUID(),
    clientId,
    originalName: file.name,
    mimeType: file.type || "text/plain",
    content,
    createdAt: new Date().toISOString(),
  };
  all.push(doc);
  await db.write("client_documents", all);

  return NextResponse.json({ id: doc.id, originalName: doc.originalName, contentLength: content.length }, { status: 201 });
}
