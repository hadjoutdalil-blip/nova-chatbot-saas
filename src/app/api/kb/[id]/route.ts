import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/api-auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const entries = await db.read<any>("kb_entries");
  const idx = entries.findIndex((k) => k.id === id && (k.clientId === user.clientId || user.role === "admin"));
  if (idx === -1) return NextResponse.json({ error: "Entrée introuvable" }, { status: 404 });

  const body = await req.json();
  entries[idx] = {
    ...entries[idx],
    ...body,
    id,
    clientId: entries[idx].clientId,
    updatedAt: new Date().toISOString(),
  };

  await db.write("kb_entries", entries);
  return NextResponse.json(entries[idx]);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  let entries = await db.read<any>("kb_entries");
  const idx = entries.findIndex((k) => k.id === id && (k.clientId === user.clientId || user.role === "admin"));
  if (idx === -1) return NextResponse.json({ error: "Entrée introuvable" }, { status: 404 });

  entries = entries.filter((k) => k.id !== id);
  await db.write("kb_entries", entries);
  return NextResponse.json({ message: "Entrée supprimée" });
}
