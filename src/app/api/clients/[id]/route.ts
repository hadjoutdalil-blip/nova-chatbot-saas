import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/api-auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const clients = await db.read<any>("clients");
  const client = clients.find((c) => c.id === id);
  if (!client) return NextResponse.json({ error: "Client introuvable" }, { status: 404 });
  return NextResponse.json(client);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const clients = await db.read<any>("clients");
  const idx = clients.findIndex((c) => c.id === id);
  if (idx === -1) return NextResponse.json({ error: "Client introuvable" }, { status: 404 });

  const body = await req.json();
  if (body.slug && clients.find((c) => c.slug === body.slug && c.id !== id)) {
    return NextResponse.json({ error: "Ce slug est déjà utilisé" }, { status: 409 });
  }

  clients[idx] = {
    ...clients[idx],
    ...body,
    id,
    updatedAt: new Date().toISOString(),
  };

  await db.write("clients", clients);
  return NextResponse.json(clients[idx]);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  let clients = await db.read<any>("clients");
  const exists = clients.find((c) => c.id === id);
  if (!exists) return NextResponse.json({ error: "Client introuvable" }, { status: 404 });

  clients = clients.filter((c) => c.id !== id);
  await db.write("clients", clients);
  return NextResponse.json({ message: "Client supprimé" });
}
