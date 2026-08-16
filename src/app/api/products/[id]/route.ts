import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/api-auth";
import { autoIndexProduct, autoDeleteProduct } from "@/lib/vector-store";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const existing = await db.prisma.product.findUnique({ where: { id } });
  if (!existing || (existing.clientId !== user.clientId && user.role !== "admin")) {
    return NextResponse.json({ error: "Produit introuvable" }, { status: 404 });
  }

  const body = await req.json();
  const { clientId, id: bodyId, createdAt, updatedAt, ...clean } = body;
  if (body.name !== undefined && !body.name?.trim()) {
    return NextResponse.json({ error: "Nom du produit requis" }, { status: 400 });
  }
  const data: any = { ...clean, updatedAt: new Date().toISOString() };
  if (body.name?.trim()) data.name = body.name.trim();
  const updated = await db.prisma.product.update({
    where: { id },
    data,
  });

  /* Re-indexation vectorielle après modification */
  autoIndexProduct(existing.clientId, updated).catch(() => {});

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const existing = await db.prisma.product.findUnique({ where: { id } });
  if (!existing || (existing.clientId !== user.clientId && user.role !== "admin")) {
    return NextResponse.json({ error: "Produit introuvable" }, { status: 404 });
  }

  await db.prisma.product.delete({ where: { id } });

  /* Suppression des chunks vectoriels associés */
  autoDeleteProduct(existing.clientId, id).catch(() => {});

  return NextResponse.json({ message: "Produit supprimé" });
}
