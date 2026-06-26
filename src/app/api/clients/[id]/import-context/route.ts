import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/api-auth";
import { extractKeywords } from "@/lib/chunk-utils";

function chunkText(text: string, fileName: string, maxChars = 600): string {
  const cleaned = text.trim();
  if (!cleaned) return "";
  const overlap = Math.round(maxChars * 0.2);
  const sections = cleaned.split(/\n{2,}|\n(?=#{1,3}\s)/);

  const result: string[] = [];
  for (const section of sections) {
    const trimmed = section.trim();
    if (!trimmed) continue;
    const sectionTitle = trimmed.startsWith("#")
      ? trimmed.split("\n")[0].replace(/^#+\s*/, "")
      : "";
    const keywords = extractKeywords(trimmed);
    const meta = JSON.stringify({ section: sectionTitle, keywords });

    if (trimmed.length <= maxChars) {
      result.push(`[CHUNK:${fileName}:${result.length}]\n${meta}\n${trimmed}`);
    } else {
      const step = maxChars - overlap;
      for (let i = 0; i < trimmed.length; i += step) {
        const content = trimmed.slice(i, i + maxChars).trim();
        if (content) {
          result.push(`[CHUNK:${fileName}:${result.length}]\n${meta}\n${content}`);
        }
      }
    }
  }

  if (result.length === 0) return "";
  return result.join("\n\n");
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

  const chunkSize = clients[idx].chunkSize ?? 600;
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
