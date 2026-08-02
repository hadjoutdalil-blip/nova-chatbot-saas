import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/api-auth";
import { removeDocument } from "@/lib/doc-manager";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const doc = await db.prisma.clientLocalDoc.findUnique({ where: { id } });
  if (!doc || (doc.clientId !== user.clientId && user.role !== "admin")) {
    return NextResponse.json({ error: "Document introuvable" }, { status: 404 });
  }

  const client = await db.prisma.client.findUnique({ where: { id: doc.clientId } });
  if (!client) return NextResponse.json({ error: "Client introuvable" }, { status: 404 });

  /* Supprime les chunks vectoriels + le fichier stocké + la ligne en base */
  await removeDocument(doc.id, client.slug, doc.fileName);

  return NextResponse.json({ message: "Document local et chunks supprimés" });
}
