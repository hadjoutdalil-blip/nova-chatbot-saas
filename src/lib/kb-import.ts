import { randomUUID } from "crypto";
import { db } from "./db";
import { syncDocumentChunks } from "./vector-store";
import { getActiveEmbeddingKey } from "./embedding-keys";

export interface KBImportEntry {
  question: string;
  answer: string;
  alt_questions?: string;
  short_resp?: string;
  category?: string;
  keywords?: string;
  tag?: string;
  priority?: number;
  related_tags?: string;
  icon?: string;
  source?: string;
  source_url?: string;
  valid_until?: string;
}

export interface KBImportResult {
  kbCount: number;
  vectorCount: number;
}

export async function importKBEntries(
  clientId: string,
  entries: KBImportEntry[],
  source?: string,
): Promise<KBImportResult> {
  const client = await db.prisma.client.findUnique({ where: { id: clientId } });
  if (!client) throw new Error("Client not found");

  const kbEntries = entries.map((e) => ({
    id: randomUUID(),
    clientId,
    tag: e.tag || "",
    question: e.question,
    alt_questions: e.alt_questions || "",
    short_resp: e.short_resp || "",
    answer: e.answer,
    category: e.category || "",
    keywords: e.keywords || "",
    priority: e.priority ?? 5,
    related_tags: e.related_tags || "",
    icon: e.icon || "",
    source: e.source || source || "",
    source_url: e.source_url || "",
    valid_until: e.valid_until || "",
  }));

  await db.prisma.kBEntry.createMany({ data: kbEntries });

  let vectorCount = 0;
  if (client.useVectorRag) {
    const activeKey = await getActiveEmbeddingKey(clientId);
    const apiKey = activeKey?.key || client.hfApiKey;
    const provider = activeKey?.provider || client.embeddingProvider;
    if (apiKey) {
      const docId = `kb-import-${randomUUID()}`;
      const content = entries
        .map((e) => `Question: ${e.question}\nRéponse: ${e.answer}`)
        .join("\n\n");
      try {
        await syncDocumentChunks(
          docId,
          clientId,
          content,
          source || "kb-import",
          "",
          null,
          client.chunkSize || 500,
          apiKey,
          provider,
          activeKey?.id,
        );
        vectorCount = entries.length;
      } catch (err) {
        console.error("[KB Import] vector sync error:", err);
      }
    }
  }

  return { kbCount: kbEntries.length, vectorCount };
}

export async function upsertKBFromJSON(
  clientId: string,
  jsonData: Record<string, unknown>,
  source?: string,
): Promise<KBImportResult> {
  const entries: KBImportEntry[] = [];

  if (Array.isArray(jsonData.entries)) {
    for (const e of jsonData.entries) {
      entries.push({
        question: e.question || e.q || "",
        answer: e.answer || e.resp || e.response || "",
        alt_questions: e.alt_questions || "",
        short_resp: e.short_resp || "",
        category: e.category || jsonData.title || "",
        keywords: Array.isArray(e.keywords) ? e.keywords.join(", ") : (e.keywords || e.kw || ""),
        tag: e.tag || "",
        priority: e.priority ?? 5,
        related_tags: Array.isArray(e.related_tags) ? e.related_tags.join(", ") : (e.related_tags || ""),
        source: source || "",
        source_url: e.source_url || "",
      });
    }
  } else if (Array.isArray(jsonData)) {
    for (const e of jsonData) {
      entries.push({
        question: e.question || e.q || "",
        answer: e.answer || e.resp || e.response || "",
        alt_questions: e.alt_questions || "",
        short_resp: e.short_resp || "",
        category: e.category || "",
        keywords: Array.isArray(e.keywords) ? e.keywords.join(", ") : (e.keywords || e.kw || ""),
        tag: e.tag || "",
        priority: e.priority ?? 5,
        related_tags: Array.isArray(e.related_tags) ? e.related_tags.join(", ") : (e.related_tags || ""),
        source: source || "",
        source_url: e.source_url || "",
      });
    }
  }

  const valid = entries.filter((e) => e.question && e.answer);
  if (valid.length === 0) return { kbCount: 0, vectorCount: 0 };

  return importKBEntries(clientId, valid, source);
}

export async function upsertKBFromText(
  clientId: string,
  text: string,
  source?: string,
): Promise<KBImportResult> {
  const sections = text.split(/\n{2,}/).filter((s) => s.trim());
  const entries: KBImportEntry[] = [];

  for (const section of sections) {
    const lines = section.split("\n").filter((l) => l.trim());
    if (lines.length >= 2) {
      entries.push({
        question: lines[0].replace(/^#+\s*/, "").trim(),
        answer: lines.slice(1).join("\n").trim(),
        category: source || "text-import",
        source: source || "",
      });
    }
  }

  if (entries.length === 0 && text.trim()) {
    entries.push({
      question: text.slice(0, 200).trim(),
      answer: text.trim(),
      category: source || "text-import",
      source: source || "",
    });
  }

  return importKBEntries(clientId, entries, source);
}

export async function removeKBBySource(clientId: string, source: string) {
  const deleted = await db.prisma.kBEntry.deleteMany({
    where: { clientId, source },
  });
  return deleted.count;
}
