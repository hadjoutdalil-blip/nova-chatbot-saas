import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/api-auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const entries = db.read<any>("kb_entries");
  const idx = entries.findIndex((k) => k.id === id && k.clientId === user.clientId);
  if (idx === -1) return NextResponse.json({ error: "Entrée introuvable" }, { status: 404 });

  const body = await req.json();
  entries[idx] = {
    ...entries[idx],
    ...body,
    id,
    clientId: user.clientId,
    updatedAt: new Date().toISOString(),
  };

  db.write("kb_entries", entries);
  return NextResponse.json(entries[idx]);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  let entries = db.read<any>("kb_entries");
  const idx = entries.findIndex((k) => k.id === id && k.clientId === user.clientId);
  if (idx === -1) return NextResponse.json({ error: "Entrée introuvable" }, { status: 404 });

  entries = entries.filter((k) => k.id !== id);
  db.write("kb_entries", entries);
  return NextResponse.json({ message: "Entrée supprimée" });
}
