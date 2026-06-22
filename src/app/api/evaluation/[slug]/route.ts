import { NextRequest, NextResponse } from "next/server";
import { findClientBySlug } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const client = await findClientBySlug(slug);
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
    })),
  });
}
