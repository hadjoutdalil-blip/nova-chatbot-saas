import { db } from "./db";

interface RecurringPattern {
  normalizedQuestion: string;
  originalQuestions: string[];
  occurrences: number;
  avgScore: number;
  worstSource: string;
  sampleResponse: string;
}

interface ImprovementProposal {
  id: string;
  clientId: string;
  question: string;
  answer: string;
  keywords: string[];
  occurrences: number;
  avgScore: number;
  status: "pending" | "approved" | "rejected";
  createdAt: Date;
}

function normalizeForGrouping(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[?!.,;:()]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function extractKeywords(text: string): string[] {
  const stopwords = new Set([
    "le", "la", "les", "de", "du", "des", "un", "une", "et", "ou", "est",
    "ce", "que", "qui", "dans", "en", "pour", "pas", "ne", "sur", "je",
    "tu", "il", "elle", "nous", "vous", "ils", "elles", "se", "son", "sa",
    "ses", "avec", "plus", "cette", "tout", "mais", "comme", "aussi",
    "peut", "faire", "dit", "a", "ai", "ont", "etre", "avoir", "mon",
    "ma", "mes", "leur", "leurs", "y", "ca", "comment", "pourquoi",
    "quand", "quel", "quelle", "quels", "quelles", "combien", "ou"
  ]);
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[0-9]/g, "")
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopwords.has(w))
    .slice(0, 10);
}

function areSimilar(a: string, b: string): boolean {
  const wordsA = new Set(a.split(" "));
  const wordsB = new Set(b.split(" "));
  const intersection = [...wordsA].filter(w => wordsB.has(w));
  const union = new Set([...wordsA, ...wordsB]);
  return intersection.length / union.size > 0.6;
}

export async function analyzeConversations(clientId: string, options?: { days?: number; minOccurrences?: number }) {
  const days = options?.days ?? 30;
  const minOccurrences = options?.minOccurrences ?? 3;
  const since = new Date(Date.now() - days * 86400000);

  const feedbacks = await db.prisma.messageFeedback.findMany({
    where: {
      clientId,
      createdAt: { gte: since },
    },
    orderBy: { createdAt: "desc" },
  });

  const problematic = feedbacks.filter(f =>
    f.source === "escalade" || f.source === "fallback" || f.score < 50
  );

  const normalizedMap = new Map<string, RecurringPattern>();

  for (const fb of problematic) {
    const norm = normalizeForGrouping(fb.question);
    let matched = false;

    for (const [key, pattern] of normalizedMap) {
      if (areSimilar(norm, key)) {
        pattern.occurrences++;
        pattern.originalQuestions.push(fb.question);
        pattern.avgScore = (pattern.avgScore + fb.score) / 2;
        if (fb.source === "escalade" || fb.source === "fallback") {
          pattern.worstSource = fb.source;
        }
        matched = true;
        break;
      }
    }

    if (!matched) {
      normalizedMap.set(norm, {
        normalizedQuestion: norm,
        originalQuestions: [fb.question],
        occurrences: 1,
        avgScore: fb.score,
        worstSource: fb.source,
        sampleResponse: fb.response,
      });
    }
  }

  const patterns = [...normalizedMap.values()]
    .filter(p => p.occurrences >= minOccurrences)
    .sort((a, b) => b.occurrences - a.occurrences);

  return patterns;
}

export async function generateProposals(clientId: string, patterns: RecurringPattern[]) {
  const proposals: ImprovementProposal[] = [];

  for (const pattern of patterns) {
    const existing = await db.prisma.pendingKBEntry.findFirst({
      where: {
        clientId,
        question: { contains: pattern.normalizedQuestion.slice(0, 50) },
        status: "pending",
      },
    });

    if (existing) continue;

    const keywords = extractKeywords(pattern.originalQuestions[0]);
    const question = pattern.originalQuestions[0];

    let answer = pattern.sampleResponse;
    if (answer.length < 20) {
      answer = `[Réponse à valider] ${question}`;
    }

    const id = `imp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    await db.prisma.pendingKBEntry.create({
      data: {
        id,
        clientId,
        question,
        answer,
        keywords: JSON.stringify(keywords),
        confidence: pattern.avgScore,
        status: "pending",
        source: "auto_improvement",
      },
    });

    proposals.push({
      id,
      clientId,
      question,
      answer,
      keywords,
      occurrences: pattern.occurrences,
      avgScore: Math.round(pattern.avgScore),
      status: "pending",
      createdAt: new Date(),
    });
  }

  return proposals;
}

export async function getStats(clientId: string) {
  const pending = await db.prisma.pendingKBEntry.count({
    where: { clientId, status: "pending", source: "auto_improvement" },
  });
  const approved = await db.prisma.pendingKBEntry.count({
    where: { clientId, status: "approved", source: "auto_improvement" },
  });
  const rejected = await db.prisma.pendingKBEntry.count({
    where: { clientId, status: "rejected", source: "auto_improvement" },
  });

  return { pending, approved, rejected, total: pending + approved + rejected };
}
