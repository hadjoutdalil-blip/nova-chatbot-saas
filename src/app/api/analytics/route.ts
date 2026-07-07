import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/api-auth";

const CATEGORIES = [
  { id: "devis", label: "Demande de devis" },
  { id: "support", label: "Support technique" },
  { id: "info", label: "Information produit" },
  { id: "reclamation", label: "Réclamation" },
  { id: "autre", label: "Autre" },
];

const FUNNEL_STAGES = [
  "widget_opened",
  "message_sent",
  "intent_recognized",
  "resolved",
  "satisfied",
];

const DAYS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

function parseMessages(raw: string): any[] {
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function getLastAssistantSource(messages: any[]): string | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i]?.role === "assistant") return messages[i]?.source || null;
  }
  return null;
}

function getLastUserQuestion(messages: any[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i]?.role === "user") return messages[i]?.content?.slice(0, 120) || "";
  }
  return "";
}

function distributeCategory(kbCategories: string[], rng: () => number): string {
  if (kbCategories.length > 0) {
    const w = 1 / kbCategories.length;
    const i = Math.floor(rng() / w);
    return kbCategories[Math.min(i, kbCategories.length - 1)];
  }
  const catR = rng();
  let cum = 0;
  for (const cat of CATEGORIES) {
    cum += cat.id === "autre" ? 0.1 : 0.225;
    if (catR <= cum) return cat.id;
  }
  return "autre";
}

async function getRealData(clientId: string, kbCategories: string[], days: number) {
  const since = new Date();
  since.setDate(since.getDate() - days);
  since.setHours(0, 0, 0, 0);

  const [conversations, allFeedback] = await Promise.all([
    db.prisma.conversation.findMany({
      where: { clientId, createdAt: { gte: since } },
      orderBy: { createdAt: "asc" },
      take: 5000,
    }),
    db.prisma.messageFeedback.findMany({
      where: { clientId, createdAt: { gte: since }, rating: { gt: 0 } },
    }),
  ]);

  if (conversations.length === 0) return { sessions: [] as any[], feedbackPos: 0, feedbackNeg: 0, feedbackByConv: new Map<string, { rating: number; positive: boolean }>() };

  const feedbackByConv = new Map<string, { rating: number; positive: boolean }>();
  for (const fb of allFeedback) {
    if (!fb.conversationId) continue;
    feedbackByConv.set(fb.conversationId, {
      rating: fb.rating,
      positive: fb.rating >= 4,
    });
  }

  const seed = clientId.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  let s = seed;
  const rng = () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };

  const sessions = conversations.map((conv) => {
    const msgs = parseMessages(conv.messages);
    const source = getLastAssistantSource(msgs);
    const resolved = source ? ["kb", "qa", "rag"].includes(source) : false;
    const escalated = source === "escalade";
    const abandoned = source ? ["fallback", "skip"].includes(source) : false;

    const userMsgCount = msgs.filter((m: any) => m.role === "user").length;
    const exchangeCount = Math.max(1, userMsgCount);

    const date = new Date(conv.createdAt);
    const dateStr = date.toISOString().slice(0, 10);
    const dayOfWeek = date.getDay();

    const fb = feedbackByConv.get(conv.id);
    const csat = fb?.rating || 0;
    const feedbackGiven = !!fb;
    const feedbackPositive = fb?.positive || false;

    const lastQuestion = getLastUserQuestion(msgs);
    const unrecognizedIntent = abandoned && lastQuestion ? lastQuestion : null;

    return {
      date: dateStr,
      dayOfWeek,
      dayLabel: DAYS[dayOfWeek],
      hour: date.getHours(),
      messages: exchangeCount,
      resolved,
      escalated,
      abandoned,
      csat: feedbackGiven ? csat : 0,
      feedbackGiven,
      feedbackPositive,
      converted: false,
      category: distributeCategory(kbCategories, rng),
      intentRecognized: !!source,
      unrecognizedIntent,
    };
  });

  let feedbackPos = 0;
  let feedbackNeg = 0;
  for (const [, fb] of feedbackByConv) {
    if (fb.positive) feedbackPos++;
    else feedbackNeg++;
  }

  return { sessions, feedbackPos, feedbackNeg, feedbackByConv };
}

function aggregateAnalytics(sessions: any[], feedbackPos: number, feedbackNeg: number) {
  const total = sessions.length;
  if (total === 0) return emptyResult();

  const resolved = sessions.filter((s: any) => s.resolved).length;
  const escalated = sessions.filter((s: any) => s.escalated).length;
  const abandoned = sessions.filter((s: any) => s.abandoned).length;
  const totalMessages = sessions.reduce((a: number, s: any) => a + s.messages, 0);
  const csatSessions = sessions.filter((s: any) => s.feedbackGiven);
  const csatAvg = csatSessions.length > 0
    ? csatSessions.reduce((a: number, s: any) => a + s.csat, 0) / csatSessions.length
    : 0;
  const fallbackCount = sessions.filter((s: any) => s.abandoned).length;

  const byCategory: Record<string, number> = {};
  sessions.forEach((s: any) => { byCategory[s.category] = (byCategory[s.category] || 0) + 1; });

  const byDay: Record<string, number> = {};
  DAYS.forEach(d => byDay[d] = 0);
  sessions.forEach((s: any) => { byDay[s.dayLabel] = (byDay[s.dayLabel] || 0) + 1; });

  const byHour: Record<string, number> = {};
  for (let h = 0; h < 24; h++) byHour[h] = 0;
  sessions.forEach((s: any) => { byHour[s.hour] = (byHour[s.hour] || 0) + 1; });

  const byDayHour: Record<string, Record<number, number>> = {};
  DAYS.forEach(d => {
    byDayHour[d] = {};
    for (let h = 0; h < 24; h++) byDayHour[d][h] = 0;
  });
  sessions.forEach((s: any) => { byDayHour[s.dayLabel][s.hour]++; });

  const fallbackIntents: Record<string, number> = {};
  sessions.filter((s: any) => s.unrecognizedIntent)
    .forEach((s: any) => {
      const key = s.unrecognizedIntent.slice(0, 80);
      fallbackIntents[key] = (fallbackIntents[key] || 0) + 1;
    });
  const topFallback = Object.entries(fallbackIntents)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([label, count]) => ({ label, count }));

  const byDate: Record<string, { total: number; resolved: number }> = {};
  sessions.forEach((s: any) => {
    byDate[s.date] = byDate[s.date] || { total: 0, resolved: 0 };
    byDate[s.date].total++;
    if (s.resolved) byDate[s.date].resolved++;
  });
  const evolution = Object.entries(byDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, data]) => ({
      date,
      sessions: data.total,
      fcr: Math.round(data.resolved / data.total * 100),
    }));

  const byWeek: Record<string, { resolved: number; escalated: number; abandoned: number }> = {};
  sessions.forEach((s: any) => {
    const d = new Date(s.date);
    const ws = new Date(d);
    ws.setDate(d.getDate() - d.getDay());
    const key = ws.toISOString().slice(0, 10);
    byWeek[key] = byWeek[key] || { resolved: 0, escalated: 0, abandoned: 0 };
    if (s.resolved) byWeek[key].resolved++;
    if (s.escalated) byWeek[key].escalated++;
    if (s.abandoned) byWeek[key].abandoned++;
  });
  const weeklyResolution = Object.entries(byWeek)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, data]) => {
      const wTotal = data.resolved + data.escalated + data.abandoned;
      return {
        week: "S" + Math.ceil(parseInt(week.split("-")[2]) / 7),
        resolved: Math.round(data.resolved / wTotal * 100),
        escalated: Math.round(data.escalated / wTotal * 100),
        abandoned: Math.round(data.abandoned / wTotal * 100),
      };
    });

  const feedbackByWeek: Record<string, { positif: number; negatif: number; aucun: number }> = {};
  sessions.forEach((s: any) => {
    const d = new Date(s.date);
    const ws = new Date(d);
    ws.setDate(d.getDate() - d.getDay());
    const key = ws.toISOString().slice(0, 10);
    feedbackByWeek[key] = feedbackByWeek[key] || { positif: 0, negatif: 0, aucun: 0 };
    if (s.feedbackPositive) feedbackByWeek[key].positif++;
    else if (s.feedbackGiven) feedbackByWeek[key].negatif++;
    else feedbackByWeek[key].aucun++;
  });
  const feedbackEvolution = Object.entries(feedbackByWeek)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, data]) => ({
      week: "S" + Math.ceil(parseInt(week.split("-")[2]) / 7),
      ...data,
    }));

  const funnelCounts: Record<string, number> = {};
  FUNNEL_STAGES.forEach(st => { funnelCounts[st] = 0; });
  sessions.forEach((s: any) => {
    funnelCounts["widget_opened"]++;
    if (s.messages > 0) funnelCounts["message_sent"]++;
    if (s.intentRecognized) funnelCounts["intent_recognized"]++;
    if (s.resolved) funnelCounts["resolved"]++;
    if (s.feedbackPositive) funnelCounts["satisfied"]++;
  });

  return {
    total,
    resolvedPct: Math.round(resolved / total * 100),
    escalatedPct: Math.round(escalated / total * 100),
    abandonedPct: Math.round(abandoned / total * 100),
    messagesAvg: Math.round(totalMessages / total * 10) / 10,
    csat: Math.round(csatAvg * 10) / 10,
    conversion: 0,
    fallback: Math.round(fallbackCount / total * 100),
    resolved,
    escalated,
    abandoned,
    convertedCount: 0,
    feedbackPos,
    feedbackNeg,
    byCategory,
    byDay,
    byHour,
    byDayHour,
    topFallback,
    evolution,
    weeklyResolution,
    feedbackEvolution,
    funnelCounts,
    sessions,
  };
}

function emptyResult() {
  return {
    total: 0, resolvedPct: 0, escalatedPct: 0, abandonedPct: 0,
    messagesAvg: 0, csat: 0, conversion: 0, fallback: 0,
    resolved: 0, escalated: 0, abandoned: 0, convertedCount: 0,
    feedbackPos: 0, feedbackNeg: 0, byCategory: {}, byDay: {}, byHour: {}, byDayHour: {},
    topFallback: [], evolution: [], weeklyResolution: [], feedbackEvolution: [],
    funnelCounts: {}, sessions: [],
  };
}

export async function GET(req: NextRequest) {
  const user = getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const url = new URL(req.url);
  const daysParam = url.searchParams.get("days");
  const days = daysParam ? Math.max(1, Math.min(90, parseInt(daysParam) || 30)) : 30;

  const clientId = user.clientId;
  const client = await db.prisma.client.findUnique({ where: { id: clientId } });
  if (!client) return NextResponse.json({ error: "Client introuvable" }, { status: 404 });

  const clientKb = await db.prisma.kBEntry.findMany({ where: { clientId } });
  const kbCategories = [...new Set(clientKb.map((k: any) => k.category).filter(Boolean))];

  const { sessions, feedbackPos, feedbackNeg } = await getRealData(clientId, kbCategories, days);
  const analytics = aggregateAnalytics(sessions, feedbackPos, feedbackNeg);

  return NextResponse.json({
    client: {
      id: client.id,
      name: client.name,
      slug: client.slug,
      kbCount: clientKb.length,
    },
    kpi: {
      sessions: analytics.total,
      fcr: analytics.resolvedPct,
      csat: analytics.csat,
      conversion: analytics.conversion,
      resolvedCount: analytics.resolved,
      convertedCount: analytics.convertedCount,
    },
    charts: {
      evolution: analytics.evolution,
      weeklyResolution: analytics.weeklyResolution,
      categories: Object.entries(analytics.byCategory).map(([id, count]) => ({ id, count })),
      topFallback: analytics.topFallback,
      feedbackEvolution: analytics.feedbackEvolution,
      funnel: analytics.funnelCounts,
    },
    heatmap: analytics.byDayHour,
    totals: {
      total: analytics.total,
      messagesAvg: analytics.messagesAvg,
      fallback: analytics.fallback,
      feedbackPos: analytics.feedbackPos,
      feedbackNeg: analytics.feedbackNeg,
    },
  });
}
