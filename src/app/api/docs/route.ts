import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/api-auth";
import { listDocuments, saveDocument, indexDocumentText } from "@/lib/doc-manager";
import { db } from "@/lib/db";

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
  const docs = await listDocuments(clientId);

  return NextResponse.json(
    docs.map((d) => ({
      id: d.id,
      fileName: d.fileName,
      title: d.title,
      description: d.description,
      topics: d.topics,
      sourceUrl: d.sourceUrl,
      fileSize: d.fileSize,
      mimeType: d.mimeType,
      downloadUrl: `/api/docs/${d.id}/download`,
      createdAt: d.createdAt,
    })),
  );
}

export async function POST(req: NextRequest) {
  const user = getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const clientId = getTargetClientId(req, user);
  const client = await db.prisma.client.findUnique({ where: { id: clientId } });
  if (!client) return NextResponse.json({ error: "Client introuvable" }, { status: 404 });

  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "Fichier requis" }, { status: 400 });

  const MAX_SIZE = 10 * 1024 * 1024;
  if (file.size > MAX_SIZE) return NextResponse.json({ error: "Fichier trop volumineux (max 10 Mo)" }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const title = form.get("title")?.toString() || file.name;
  const description = form.get("description")?.toString() || "";
  const topics = form.get("topics")?.toString() || "";
  const sourceUrl = form.get("sourceUrl")?.toString() || "";

  const doc = await saveDocument({
    clientId,
    clientSlug: client.slug,
    fileName: `${Date.now()}-${file.name}`,
    originalName: file.name,
    mimeType: file.type || "application/octet-stream",
    data: buffer,
    sourceUrl,
    title,
    description,
    topics,
  });

  const textContent = form.get("content")?.toString() || "";
  if (textContent) {
    await indexDocumentText(doc.id, clientId, textContent, file.name, sourceUrl);
  }

  return NextResponse.json({
    id: doc.id,
    fileName: doc.fileName,
    title: doc.title,
    downloadUrl: `/api/docs/${doc.id}/download`,
  }, { status: 201 });
}
