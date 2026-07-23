import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { randomUUID } from "crypto";
import { saveFile } from "@/lib/storage";
import { indexDocumentText } from "@/lib/doc-manager";

function verifyImportKey(req: NextRequest): boolean {
  const key = req.headers.get("x-import-key");
  return key === process.env.IMPORT_API_KEY;
}

export async function POST(req: NextRequest) {
  const user = getAuthUser(req);
  const isImportAuth = verifyImportKey(req);

  if (!user && !isImportAuth) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const body = await req.json();
  const { clientId: bodyClientId, fileName, content, source = "local-import" } = body;
  const clientId = bodyClientId || user?.clientId;

  if (!content || !clientId || !fileName) {
    return NextResponse.json({ error: "content, clientId et fileName requis" }, { status: 400 });
  }

  if (user && user.role !== "admin" && clientId !== user.clientId) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const client = await db.prisma.client.findUnique({ where: { id: clientId } });
  if (!client) return NextResponse.json({ error: "Client introuvable" }, { status: 404 });

  const buffer = Buffer.from(content, "utf-8");
  const { storagePath } = await saveFile(client.slug, "import", fileName, buffer);

  const docId = randomUUID();
  await db.prisma.clientLocalDoc.create({
    data: {
      id: docId,
      clientId,
      fileName,
      originalName: fileName,
      storagePath,
      mimeType: "text/plain",
      fileSize: buffer.length,
      content,
      title: fileName.replace(/\.[^.]+$/, ""),
      description: "",
      topics: "",
      sourceUrl: "",
      status: "active",
    },
  });

  await indexDocumentText(docId, clientId, content, fileName, "");

  return NextResponse.json({ docId, fileName, chunksCount: 1 }, { status: 201 });
}
