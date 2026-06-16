import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/api-auth";

function chunkText(text: string, fileName: string, chunkSize: number): string {
  const cleaned = text.trim();
  if (!cleaned) return "";

  const chunks: string[] = [];
  const paragraphs = cleaned.split(/\n{2,}/);

  let current = "";
  for (const para of paragraphs) {
    if ((current + "\n\n" + para).length <= chunkSize) {
      current = current ? current + "\n\n" + para : para;
    } else {
      if (current) chunks.push(current);
      current = para;
    }
  }
  if (current) chunks.push(current);

  if (chunks.length === 0) return "";

  return chunks
    .map((c, i) => `[CHUNK:${fileName}:${i}]\n${c}`)
    .join("\n\n");
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = getAuthUser(req);
  if (!user || user.role !== "admin")
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const { text, fileName = "document.txt" } = await req.json();
  if (!text || typeof text !== "string")
    return NextResponse.json({ error: "Texte requis" }, { status: 400 });

  const clients = await db.read<any>("clients");
  const idx = clients.findIndex((c: any) => c.id === id);
  if (idx === -1)
    return NextResponse.json({ error: "Client introuvable" }, { status: 404 });

  const chunkSize = clients[idx].chunkSize ?? 500;
  const chunked = chunkText(text, fileName, chunkSize);
  if (!chunked) {
    return NextResponse.json({ error: "Le fichier est vide" }, { status: 400 });
  }

  const existing = clients[idx].siteContext || "";
  const separator = existing ? "\n\n" : "";
  clients[idx].siteContext = existing + separator + chunked;
  clients[idx].updatedAt = new Date().toISOString();

  await db.write("clients", clients);
  return NextResponse.json({ siteContext: clients[idx].siteContext });
}
