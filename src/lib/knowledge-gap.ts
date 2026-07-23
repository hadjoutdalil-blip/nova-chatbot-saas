import { randomUUID } from "crypto";
import { db } from "./db";
import { extractKeywords } from "./chunk-utils";
import { syncDocumentChunks } from "./vector-store";
import { getActiveEmbeddingKey } from "./embedding-keys";

export interface CaptureEscaladeParams {
  clientId: string;
  question: string;
  escalationMsg: string;
  context?: string;
}

export interface SubmitResponseParams {
  gapId: string;
  expertResponse: string;
  reviewedBy?: string;
}

export interface ValidateParams {
  pendingId: string;
  action: "approve" | "reject";
  reviewedBy?: string;
}

export interface GapStats {
  total: number;
  pending: number;
  autoAdded: number;
  approved: number;
  rejected: number;
  avgConfidence: number;
}

function calculateConfidence(question: string, expertResponse: string, escalationMsg: string): number {
  let score = 0;

  if (expertResponse.length > 50) score += 0.3;
  else if (expertResponse.length > 20) score += 0.15;

  if (/[•\-\d]/.test(expertResponse)) score += 0.2;

  if (!/je ne sais pas|contactez|support|non disponible/i.test(expertResponse)) score += 0.2;

  if (expertResponse.length > escalationMsg.length * 1.5) score += 0.15;

  if (/\d+|[A-Z][a-z]+/.test(expertResponse)) score += 0.15;

  return Math.min(Math.round(score * 100) / 100, 1);
}

function formatResponse(response: string): string {
  let formatted = response.trim();

  formatted = formatted.charAt(0).toUpperCase() + formatted.slice(1);

  if (!formatted.endsWith(".") && !formatted.endsWith("!") && !formatted.endsWith("?")) {
    formatted += ".";
  }

  formatted = formatted.replace(/\s+/g, " ");
  formatted = formatted.replace(/\n{3,}/g, "\n\n");

  return formatted;
}

function generateQuestionVariants(question: string): string[] {
  const variants: string[] = [question];

  const withoutPrefix = question
    .replace(/^(comment|pourquoi|quand|quel|quelle|quels|quelles|est-ce que|est-ce qu'|peut-on|faut-il)\s+/i, "")
    .trim();
  if (withoutPrefix !== question && withoutPrefix.length > 10) {
    variants.push(withoutPrefix);
  }

  const simplified = question
    .replace(/[?!.]+$/, "")
    .trim();
  if (simplified !== question) {
    variants.push(simplified);
  }

  return [...new Set(variants)];
}

export async function captureEscalade(params: CaptureEscaladeParams) {
  const { clientId, question, escalationMsg, context = "" } = params;

  const existing = await db.prisma.knowledgeGap.findFirst({
    where: {
      clientId,
      question: { equals: question, mode: "insensitive" },
      status: { not: "rejected" },
    },
  });

  if (existing) {
    return existing;
  }

  return db.prisma.knowledgeGap.create({
    data: {
      id: randomUUID(),
      clientId,
      question,
      escalationMsg,
      context,
      confidence: 0,
      status: "pending",
    },
  });
}

export async function submitExpertResponse(params: SubmitResponseParams) {
  const { gapId, expertResponse, reviewedBy } = params;

  const gap = await db.prisma.knowledgeGap.findUnique({ where: { id: gapId } });
  if (!gap) throw new Error("Knowledge gap not found");

  const formatted = formatResponse(expertResponse);
  const confidence = calculateConfidence(gap.question, formatted, gap.escalationMsg);
  const keywords = extractKeywords(gap.question, 5);
  const autoAdd = confidence > 0.8;

  await db.prisma.knowledgeGap.update({
    where: { id: gapId },
    data: {
      expertResponse: formatted,
      confidence,
      status: autoAdd ? "auto_added" : "pending",
      reviewedBy: autoAdd ? "auto" : reviewedBy || null,
      reviewedAt: autoAdd ? new Date() : null,
    },
  });

  if (autoAdd) {
    const kbEntry = await addKBEntry(gap.clientId, gap.question, formatted, keywords, gap.id);
    await indexKBEntry(gap.clientId, gap.question, formatted);
    return { gap, confidence, autoAdded: true, kbEntryId: kbEntry.id };
  }

  await db.prisma.pendingKBEntry.create({
    data: {
      id: randomUUID(),
      clientId: gap.clientId,
      question: gap.question,
      answer: formatted,
      keywords: keywords.join(", "),
      category: "escalade-learning",
      source: "knowledge-gap",
      confidence,
      gapId,
      status: "pending",
    },
  });

  return { gap, confidence, autoAdded: false, kbEntryId: null };
}

export async function validatePendingEntry(params: ValidateParams) {
  const { pendingId, action, reviewedBy } = params;

  const pending = await db.prisma.pendingKBEntry.findUnique({ where: { id: pendingId } });
  if (!pending) throw new Error("Pending KB entry not found");

  if (action === "reject") {
    await db.prisma.pendingKBEntry.update({
      where: { id: pendingId },
      data: { status: "rejected", reviewedBy, reviewedAt: new Date() },
    });

    if (pending.gapId) {
      await db.prisma.knowledgeGap.update({
        where: { id: pending.gapId },
        data: { status: "rejected", reviewedBy, reviewedAt: new Date() },
      });
    }

    return { approved: false };
  }

  const keywords = pending.keywords.split(",").map((k) => k.trim()).filter(Boolean);
  const kbEntry = await addKBEntry(pending.clientId, pending.question, pending.answer, keywords, pending.gapId || undefined);
  await indexKBEntry(pending.clientId, pending.question, pending.answer);

  await db.prisma.pendingKBEntry.update({
    where: { id: pendingId },
    data: { status: "approved", reviewedBy, reviewedAt: new Date() },
  });

  if (pending.gapId) {
    await db.prisma.knowledgeGap.update({
      where: { id: pending.gapId },
      data: { status: "approved", kbEntryId: kbEntry.id, reviewedBy, reviewedAt: new Date() },
    });
  }

  return { approved: true, kbEntryId: kbEntry.id };
}

async function addKBEntry(
  clientId: string,
  question: string,
  answer: string,
  keywords: string[],
  gapId?: string,
) {
  const variants = generateQuestionVariants(question);
  const altQuestions = variants.length > 1 ? variants.slice(1).join(" || ") : "";

  return db.prisma.kBEntry.create({
    data: {
      id: randomUUID(),
      clientId,
      question,
      alt_questions: altQuestions,
      answer,
      keywords: keywords.join(", "),
      category: "escalade-learning",
      source: "knowledge-gap",
      source_url: gapId ? `gap:${gapId}` : "",
      priority: 5,
    },
  });
}

async function indexKBEntry(clientId: string, question: string, answer: string) {
  try {
    const client = await db.prisma.client.findUnique({ where: { id: clientId } });
    if (!client?.useVectorRag) return;

    const activeKey = await getActiveEmbeddingKey(clientId);
    const apiKey = activeKey?.key || client.hfApiKey;
    const provider = activeKey?.provider || client.embeddingProvider;
    if (!apiKey) return;

    const content = `Question: ${question}\nRéponse: ${answer}`;
    const docId = `kg-${randomUUID()}`;

    await syncDocumentChunks(
      docId,
      clientId,
      content,
      `knowledge-gap-${question.slice(0, 50)}`,
      "",
      null,
      client.chunkSize || 500,
      apiKey,
      provider,
      activeKey?.id,
    );
  } catch (err) {
    console.error("[Knowledge Gap] Vector index error:", err);
  }
}

export async function getPendingGaps(clientId: string, limit = 50) {
  return db.prisma.knowledgeGap.findMany({
    where: { clientId, status: "pending" },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getPendingEntries(clientId: string, limit = 50) {
  return db.prisma.pendingKBEntry.findMany({
    where: { clientId, status: "pending" },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getGapStats(clientId: string): Promise<GapStats> {
  const total = await db.prisma.knowledgeGap.count({ where: { clientId } });
  const pending = await db.prisma.knowledgeGap.count({ where: { clientId, status: "pending" } });
  const autoAdded = await db.prisma.knowledgeGap.count({ where: { clientId, status: "auto_added" } });
  const approved = await db.prisma.knowledgeGap.count({ where: { clientId, status: "approved" } });
  const rejected = await db.prisma.knowledgeGap.count({ where: { clientId, status: "rejected" } });

  const gaps = await db.prisma.knowledgeGap.findMany({
    where: { clientId, confidence: { gt: 0 } },
    select: { confidence: true },
  });
  const avgConfidence = gaps.length > 0
    ? gaps.reduce((sum, g) => sum + g.confidence, 0) / gaps.length
    : 0;

  return { total, pending, autoAdded, approved, rejected, avgConfidence: Math.round(avgConfidence * 100) / 100 };
}

export function formatGapReportMarkdown(stats: GapStats, clientName: string): string {
  let md = `🧠 Rapport d'apprentissage — ${clientName}\n\n`;

  md += `📊 Statistiques\n`;
  md += `• Total trous de connaissance : ${stats.total}\n`;
  md += `• ⏳ En attente : ${stats.pending}\n`;
  md += `• ✅ Auto-ajoutés : ${stats.autoAdded}\n`;
  md += `• ✅ Approuvés : ${stats.approved}\n`;
  md += `• ❌ Rejetés : ${stats.rejected}\n`;
  md += `• 📈 Confiance moyenne : ${Math.round(stats.avgConfidence * 100)}%\n`;

  return md;
}
