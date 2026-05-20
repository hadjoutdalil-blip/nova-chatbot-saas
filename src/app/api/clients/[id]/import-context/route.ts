import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/api-auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = getAuthUser(req);
  if (!user || user.role !== "admin")
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const { text } = await req.json();
  if (!text || typeof text !== "string")
    return NextResponse.json({ error: "Texte requis" }, { status: 400 });

  const clients = await db.read<any>("clients");
  const idx = clients.findIndex((c: any) => c.id === id);
  if (idx === -1)
    return NextResponse.json({ error: "Client introuvable" }, { status: 404 });

  const existing = clients[idx].siteContext || "";
  const separator = existing ? "\n\n--- Fichier importé ---\n" : "";
  clients[idx].siteContext = existing + separator + text.trim();
  clients[idx].updatedAt = new Date().toISOString();

  await db.write("clients", clients);
  return NextResponse.json({ siteContext: clients[idx].siteContext });
}
