import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/api-auth";
import { hashPassword } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authUser = getAuthUser(req);
  if (!authUser || authUser.role !== "admin") return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const existing = await db.prisma.user.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });

  const body = await req.json();
  const update: any = {};

  if (body.email && body.email !== existing.email) {
    const emailUser = await db.prisma.user.findUnique({ where: { email: body.email } });
    if (emailUser) return NextResponse.json({ error: "Cet email est déjà utilisé" }, { status: 409 });
    update.email = body.email;
  }
  if (body.name) update.name = body.name;
  if (body.role) update.role = body.role === "admin" ? "admin" : "client";
  if (body.clientId) update.clientId = body.clientId;
  if (body.password) update.password = await hashPassword(body.password);

  const updated = await db.prisma.user.update({ where: { id }, data: update });
  const { password: _, ...safe } = updated;
  return NextResponse.json(safe);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authUser = getAuthUser(req);
  if (!authUser || authUser.role !== "admin") return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const existing = await db.prisma.user.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });

  await db.prisma.user.delete({ where: { id } });
  return NextResponse.json({ message: "Utilisateur supprimé" });
}
