import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/api-auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const existing = await db.prisma.apiKey.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Clé introuvable" }, { status: 404 });

  if (user.role !== "admin" && existing.clientId !== user.clientId) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const body = await req.json();
  const update: any = { updatedAt: new Date() };

  if (body.label !== undefined) update.label = body.label;
  if (body.isActive !== undefined) update.isActive = body.isActive;
  if (body.priority !== undefined) update.priority = body.priority;
  if (body.monthlyLimit !== undefined) update.monthlyLimit = body.monthlyLimit;
  if (body.key !== undefined) update.key = body.key;
  if (body.provider !== undefined) update.provider = body.provider;

  const updated = await db.prisma.apiKey.update({ where: { id }, data: update });
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const existing = await db.prisma.apiKey.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Clé introuvable" }, { status: 404 });

  if (user.role !== "admin" && existing.clientId !== user.clientId) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  await db.prisma.apiKey.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
