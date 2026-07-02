import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/api-auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const existing = await db.prisma.kBEntry.findUnique({ where: { id } });
  if (!existing || (existing.clientId !== user.clientId && user.role !== "admin")) {
    return NextResponse.json({ error: "Entrée introuvable" }, { status: 404 });
  }

  const body = await req.json();
  const { clientId, id: bodyId, createdAt, updatedAt, ...clean } = body;
  const updated = await db.prisma.kBEntry.update({
    where: { id },
    data: { ...clean, updatedAt: new Date().toISOString() },
  });
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const existing = await db.prisma.kBEntry.findUnique({ where: { id } });
  if (!existing || (existing.clientId !== user.clientId && user.role !== "admin")) {
    return NextResponse.json({ error: "Entrée introuvable" }, { status: 404 });
  }

  await db.prisma.kBEntry.delete({ where: { id } });
  return NextResponse.json({ message: "Entrée supprimée" });
}
