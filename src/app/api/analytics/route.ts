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

const INTENTS_FALLBACK = [
  "Prix historique / évolution",
  "Documentation technique",
  "Disponibilité / stock",
  "Formation / certification",
  "Partenariat / distribution",
  "Réglementation / norme",
  "Recrutement / stage",
];

const FUNNEL_STAGES = [
  "widget_opened",
  "message_sent",
  "intent_recognized",
  "resolved",
  "satisfied",
];

const DAYS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

function generateClientAnalytics(clientId: string, kbCount: number, kbCategories: string[], days = 30) {
  const seed = clientId.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const rng = seededRandom(seed);

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const sessions: any[] = [];

  const categoryPct: Record<string, number> = {};
  if (kbCategories.length > 0) {
    kbCategories.forEach((c, i) => { categoryPct[c] = 0.3 + (i * 0.1); });
    const total = Object.values(categoryPct).reduce((a, b) => a + b, 0);
    Object.keys(categoryPct).forEach(k => { categoryPct[k] /= total; });
  }

  for (let d = days - 1; d >= 0; d--) {
    const date = new Date(now);
    date.setDate(date.getDate() - d);
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isFriday = dayOfWeek === 5;

    const progressFactor = 1 - (d / days) * 0.15;
    const baseFcr = Math.min(0.85, (0.65 + kbCount * 0.002)) * progressFactor;

    let baseSessions = isWeekend ? 2 + rng() * 2 : 6 + rng() * 5;
    if (isFriday) baseSessions *= 1.3;
    const daySessions = Math.max(1, Math.round(baseSessions));

    for (let s = 0; s < daySessions; s++) {
      let hour = Math.floor(rng() * 24);
      if (hour < 7 || hour > 21) hour = 7 + Math.floor(rng() * 3);
      if (hour >= 12 && hour <= 13) hour = rng() > 0.5 ? 11 : 14;

      const messages = 1 + Math.floor(Math.pow(rng(), 0.6) * 8);
      const resolved = rng() < baseFcr;
      const escalated = !resolved && rng() < 0.45;
      const abandoned = !resolved && !escalated;
      const intentOk = rng() < 0.88;

      const feedbackGiven = rng() < 0.40;
      const feedbackPositive = feedbackGiven ? (resolved ? rng() < 0.85 : rng() < 0.30) : false;
      const csat = feedbackGiven ? (feedbackPositive ? 4 + rng() : 1 + rng() * 2) : 0;
      const converted = resolved && rng() < 0.12;

      let category = "autre";
      if (kbCategories.length > 0) {
        const catR = rng();
        let cum = 0;
        for (const [cat, pct] of Object.entries(categoryPct)) {
          cum += pct;
          if (catR <= cum) { category = cat; break; }
        }
      } else {
        const catR = rng();
        let cum = 0;
        for (const cat of CATEGORIES) {
          cum += cat.id === "autre" ? 0.1 : 0.225;
          if (catR <= cum) { category = cat.id; break; }
        }
      }

      let unrecognizedIntent = null;
      if (!intentOk) {
        unrecognizedIntent = INTENTS_FALLBACK[Math.floor(rng() * INTENTS_FALLBACK.length)];
      }

      sessions.push({
        date: date.toISOString().slice(0, 10),
        dayOfWeek,
        dayLabel: DAYS[dayOfWeek],
        hour,
        messages,
        resolved,
        escalated,
        abandoned,
        csat: Math.round(csat * 10) / 10,
        feedbackGiven,
        feedbackPositive,
        converted,
        category,
        intentRecognized: intentOk,
        unrecognizedIntent,
      });
    }
  }

  return sessions;
}

function aggregateAnalytics(sessions: any[]) {
  const total = sessions.length;
  if (total === 0) return emptyResult();

  const resolved = sessions.filter((s: any) => s.resolved).length;
  const escalated = sessions.filter((s: any) => s.escalated).length;
  const abandoned = sessions.filter((s: any) => s.abandoned).length;
  const totalMessages = sessions.reduce((a: number, s: any) => a + s.messages, 0);
  const csatSessions = sessions.filter((s: any) => s.csat > 0);
  const csatAvg = csatSessions.length > 0
    ? csatSessions.reduce((a: number, s: any) => a + s.csat, 0) / csatSessions.length
    : 0;
  const convertedCount = sessions.filter((s: any) => s.converted).length;
  const fallbackCount = sessions.filter((s: any) => !s.intentRecognized).length;
  const feedbackPos = sessions.filter((s: any) => s.feedbackPositive).length;
  const feedbackNeg = sessions.filter((s: any) => s.feedbackGiven && !s.feedbackPositive).length;

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
  sessions.filter((s: any) => !s.intentRecognized && s.unrecognizedIntent)
    .forEach((s: any) => { fallbackIntents[s.unrecognizedIntent] = (fallbackIntents[s.unrecognizedIntent] || 0) + 1; });
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
    conversion: Math.round(convertedCount / total * 100),
    fallback: Math.round(fallbackCount / total * 100),
    resolved,
    escalated,
    abandoned,
    convertedCount,
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
  const allClients = await db.read<any>("clients");
  const client = allClients.find((c: any) => c.id === clientId);
  if (!client) return NextResponse.json({ error: "Client introuvable" }, { status: 404 });

  const allKb = await db.read<any>("kb_entries");
  const clientKb = allKb.filter((k: any) => k.clientId === clientId);
  const kbCategories = [...new Set(clientKb.map((k: any) => k.category).filter(Boolean))];

  const sessions = generateClientAnalytics(clientId, clientKb.length, kbCategories, days);
  const analytics = aggregateAnalytics(sessions);

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
