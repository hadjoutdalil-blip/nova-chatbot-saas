import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/api-auth";
import { downloadDocument, removeDocument } from "@/lib/doc-manager";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ docId: string }> },
) {
  const user = getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { docId } = await params;
  const result = await downloadDocument(docId, user.clientId);
  if (!result) return NextResponse.json({ error: "Document introuvable" }, { status: 404 });

  const { data, doc } = result;
  return new NextResponse(new Uint8Array(data), {
    headers: {
      "Content-Type": doc.mimeType,
      "Content-Disposition": `attachment; filename="${doc.originalName}"`,
      "Content-Length": data.length.toString(),
    },
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ docId: string }> },
) {
  const user = getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { docId } = await params;
  const { db } = await import("@/lib/db");
  const doc = await db.prisma.clientLocalDoc.findFirst({
    where: { id: docId, clientId: user.clientId },
  });
  if (!doc) return NextResponse.json({ error: "Document introuvable" }, { status: 404 });

  const { db: db2 } = await import("@/lib/db");
  const client = await db2.prisma.client.findUnique({ where: { id: user.clientId } });
  await removeDocument(docId, client?.slug || "", doc.fileName);

  return NextResponse.json({ ok: true });
}
