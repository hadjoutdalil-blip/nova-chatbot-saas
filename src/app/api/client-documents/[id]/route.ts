import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/api-auth";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  let docs = await db.read<any>("client_documents");
  const idx = docs.findIndex((d: any) => d.id === id && (d.clientId === user.clientId || user.role === "admin"));
  if (idx === -1) return NextResponse.json({ error: "Document introuvable" }, { status: 404 });

  docs = docs.filter((d: any) => d.id !== id);
  await db.write("client_documents", docs);
  return NextResponse.json({ message: "Document supprimé" });
}
