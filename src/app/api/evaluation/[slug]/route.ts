import { NextRequest, NextResponse } from "next/server";
import { findClientBySlug } from "@/lib/auth";
import { db } from "@/lib/db";

function extractTrace(messagesJson: string): any[] | undefined {
  try {
    const msgs = JSON.parse(messagesJson);
    const last = [...msgs].reverse().find((m: any) => m.role === "assistant");
    return last?.trace?.length ? last.trace : undefined;
  } catch {
    return undefined;
  }
}

function csvField(v: any): string {
  if (v === null || v === undefined) return "";
  const s = String(v).replace(/"/g, '""').replace(/\n/g, " ").replace(/\r/g, "");
  return `"${s}"`;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const client =
    (await findClientBySlug(slug)) ||
    (await db.prisma.client.findUnique({ where: { id: slug } }));
  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  const all = await db.prisma.messageFeedback.findMany({
    where: { clientId: client.id },
    orderBy: { createdAt: "desc" },
  });

  const total = all.length;
  const rated = all.filter((r: any) => r.rating > 0);
  const auto = all.filter((r: any) => r.rating === 0);

  /* Load conversation traces for feedbacks */
  const convIds = [...new Set(all.map((f: any) => f.conversationId).filter(Boolean))];
  const convs = convIds.length
    ? await db.prisma.conversation.findMany({ where: { id: { in: convIds } }, select: { id: true, messages: true } })
    : [];
  const traceByConv: Record<string, any[] | undefined> = {};
  for (const c of convs) {
    traceByConv[c.id] = extractTrace(c.messages as string);
  }

  const scores = auto.map((r: any) => r.score);
  const avgScore = scores.length > 0 ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length) : 0;
  const minScore = scores.length > 0 ? Math.min(...scores) : 0;
  const maxScore = scores.length > 0 ? Math.max(...scores) : 0;

  const dist: Record<string, number> = {};
  for (let i = 0; i <= 100; i += 10) {
    const label = `${i}-${i + 10}`;
    dist[label] = scores.filter((s: number) => s >= i && s < i + 10).length;
  }

  const sourceDist: Record<string, number> = {};
  for (const r of auto) {
    sourceDist[r.source] = (sourceDist[r.source] || 0) + 1;
  }

  const lowScore = auto.filter((r: any) => r.score < 50).map((r: any) => ({
    question: r.question,
    response: r.response.slice(0, 120),
    score: r.score,
    source: r.source,
    createdAt: r.createdAt,
  }));

  /* CSV export (full audit) */
  const format = req.nextUrl.searchParams.get("format");
  if (format === "csv") {
    const headers = ["Date", "Question", "Réponse", "Score", "Source", "Provider", "Scénario"];
    const rows = all.map((r: any) => {
      const trace = traceByConv[r.conversationId] || [];
      const scenario = trace
        .map((s: any) => {
          let detail = "";
          if (s.step === "kb_match") detail = `score=${s.score ?? ""}/seuil=${s.kbThreshold ?? ""}`;
          else if (s.step === "intent_regex" || s.step === "intent_ai_override") detail = String(s.intent ?? "");
          else if (s.step === "rag_search" || s.step === "rag_only_search") detail = `${s.chunks ?? 0} chunks`;
          else if (s.step === "ai_response") detail = `model=${s.model ?? ""}`;
          return `${s.step}(${s.ms}ms${detail ? ";" + detail : ""})`;
        })
        .join(" -> ");
      return [
        r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt || ""),
        r.question,
        r.response,
        String(r.score ?? ""),
        r.source || "",
        r.provider || "",
        scenario,
      ];
    });
    const csv = [headers.map(csvField).join(";"), ...rows.map((row) => row.map(csvField).join(";"))].join("\n");
    return new NextResponse("\uFEFF" + csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="audit-${client.slug || client.id}.csv"`,
      },
    });
  }

  return NextResponse.json({
    total,
    rated: rated.length,
    auto: auto.length,
    avgScore,
    minScore,
    maxScore,
    distribution: dist,
    sourceDistribution: sourceDist,
    lowScoreQuestions: lowScore.slice(0, 50),
    recent: auto.slice(0, 100).map((r: any) => ({
      id: r.id,
      question: r.question,
      response: r.response.slice(0, 200),
      score: r.score,
      source: r.source,
      provider: r.provider,
      createdAt: r.createdAt,
      trace: traceByConv[r.conversationId],
    })),
  });
}
