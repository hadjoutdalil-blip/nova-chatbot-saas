import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/api-auth";
import { randomUUID } from "crypto";

function extractKeywords(text: string): string {
  const stopWords = new Set([
    "c'est", "qu'est-ce", "qu'est", "que", "qui", "quoi", "comment", "pourquoi",
    "est-ce", "dans", "avec", "sur", "pour", "sans", "chez", "entre", "vers",
    "mon", "ma", "mes", "ton", "ta", "tes", "son", "sa", "ses", "votre", "nos",
    "notre", "leurs", "tous", "tout", "toute", "toutes", "une", "des", "du",
    "au", "aux", "ce", "cet", "cette", "ces", "je", "tu", "il", "elle", "on",
    "nous", "vous", "ils", "elles", "en", "y", "ai", "a", "ont", "sont", "été",
    "peut", "peux", "veut", "veux", "fait", "font", "voir", "vais", "va", "vas",
    "plus", "moins", "très", "bien", "aussi", "si", "là", "ici", "où", "non",
    "oui", "pas", "ne", "ni", "ou", "et", "mais", "donc", "car", "or", "si",
    "the", "is", "a", "an", "of", "to", "in", "it", "for", "on", "with",
  ]);
  const words = text
    .toLowerCase()
    .replace(/[^a-zéèêëàâäùûüôöîïç0-9\s-]/g, " ")
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopWords.has(w));
  return [...new Set(words)].slice(0, 12).join(", ");
}

function parseSiteChunks(siteContext: string): { name: string; content: string }[] {
  if (!siteContext) return [];
  const regex = /\[CHUNK:([^\]]+)\]([\s\S]*?)(?=\[CHUNK:|$)/g;
  const chunks: { name: string; content: string }[] = [];
  let m;
  while ((m = regex.exec(siteContext)) !== null) {
    chunks.push({ name: m[1], content: m[2].trim() });
  }
  if (chunks.length === 0 && siteContext.trim()) {
    chunks.push({ name: "contexte.txt", content: siteContext.trim() });
  }
  return chunks;
}

export async function POST(req: NextRequest) {
  const user = getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const clients = await db.read<any>("clients");
  const client = clients.find((c: any) => c.id === user.clientId);
  if (!client) return NextResponse.json({ error: "Client introuvable" }, { status: 404 });

  const allEntries = await db.read<any>("kb_entries");
  const kbEntries = allEntries.filter((k: any) => k.clientId === client.id);
  let created = 0;

  // Transfer siteContext chunks
  const chunks = parseSiteChunks(client.siteContext || "");
  for (const chunk of chunks) {
    const exists = kbEntries.some((k: any) => k.answer === chunk.content);
    if (exists) continue;
    const q = `Document : ${chunk.name}`;
    allEntries.push({
      id: randomUUID(),
      tag: "import_document",
      question: q,
      alt_questions: "",
      short_resp: "",
      answer: chunk.content,
      category: "Document importé",
      keywords: extractKeywords(chunk.content),
      priority: 3,
      related_tags: "",
      icon: "📄",
      source: chunk.name,
      source_url: "",
      valid_until: "",
      clientId: client.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    created++;
  }

  // Transfer GED documents
  const allDocs = await db.read<any>("client_documents");
  const clientDocs = allDocs.filter((d: any) => d.clientId === client.id && d.status !== "archived");
  for (const doc of clientDocs) {
    const exists = kbEntries.some((k: any) => k.answer === doc.content);
    if (exists) continue;
    const q = `Document : ${doc.originalName}`;
    allEntries.push({
      id: randomUUID(),
      tag: "import_ged",
      question: q,
      alt_questions: "",
      short_resp: "",
      answer: doc.content,
      category: "Document importé",
      keywords: extractKeywords(doc.content || ""),
      priority: 3,
      related_tags: "",
      icon: "📄",
      source: doc.originalName,
      source_url: doc.source_url || "",
      valid_until: doc.valid_until || "",
      clientId: client.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    created++;
  }

  await db.write("kb_entries", allEntries);
  return NextResponse.json({ success: true, created });
}
