import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const user = getAuthUser(req);
  if (!user || user.role !== "admin") return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const url = new URL(req.url);
  const clientId = url.searchParams.get("clientId");
  const days = parseInt(url.searchParams.get("days") || "30");

  const where: any = {};
  if (clientId) where.clientId = clientId;

  if (days > 0) {
    const since = new Date();
    since.setDate(since.getDate() - days);
    where.createdAt = { gte: since };
  }

  const conversations = await db.prisma.conversation.findMany({
    where,
    select: { messages: true, clientId: true, createdAt: true },
  });

  const sourceCounts: Record<string, number> = {};
  const dailyBySource: Record<string, Record<string, number>> = {};
  let totalResponses = 0;

  for (const convo of conversations) {
    let msgs: any[];
    try { msgs = JSON.parse(convo.messages); } catch { continue; }

    for (const msg of msgs) {
      if (msg.role !== "assistant" || !msg.source) continue;

      const src = msg.source;
      sourceCounts[src] = (sourceCounts[src] || 0) + 1;
      totalResponses++;

      const day = convo.createdAt.toISOString().slice(0, 10);
      if (!dailyBySource[day]) dailyBySource[day] = {};
      dailyBySource[day][src] = (dailyBySource[day][src] || 0) + 1;
    }
  }

  const ragCount = (sourceCounts["rag"] || 0) + (sourceCounts["qa"] || 0);
  const kbCount = sourceCounts["kb"] || 0;
  const escaladeCount = sourceCounts["escalade"] || 0;
  const fallbackCount = sourceCounts["fallback"] || 0;
  const intentCount = totalResponses - ragCount - kbCount - escaladeCount - fallbackCount;

  return NextResponse.json({
    total: totalResponses,
    bySource: sourceCounts,
    summary: {
      rag: ragCount,
      kb: kbCount,
      escalade: escaladeCount,
      fallback: fallbackCount,
      intent: intentCount,
    },
    ragPercent: totalResponses > 0 ? Math.round((ragCount / totalResponses) * 100) : 0,
    daily: dailyBySource,
  });
}
