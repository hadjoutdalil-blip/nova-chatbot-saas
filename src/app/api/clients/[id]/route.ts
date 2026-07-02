import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/api-auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const client = await db.prisma.client.findUnique({ where: { id } });
  if (!client) return NextResponse.json({ error: "Client introuvable" }, { status: 404 });
  return NextResponse.json(client);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const existing = await db.prisma.client.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Client introuvable" }, { status: 404 });

  const body = await req.json();
  if (body.slug) {
    const slugClient = await db.prisma.client.findUnique({ where: { slug: body.slug } });
    if (slugClient && slugClient.id !== id) {
      return NextResponse.json({ error: "Ce slug est déjà utilisé" }, { status: 409 });
    }
  }

  const { id: bodyId, createdAt, updatedAt, ...clean } = body;
  const client = await db.prisma.client.update({
    where: { id },
    data: clean,
  });
  return NextResponse.json(client);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const existing = await db.prisma.client.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Client introuvable" }, { status: 404 });

  await db.prisma.client.delete({ where: { id } });
  return NextResponse.json({ message: "Client supprimé" });
}
