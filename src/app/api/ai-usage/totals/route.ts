import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/api-auth";

const DEFAULT_MONTHLY_LIMITS: Record<string, Record<string, number>> = {
  groq: {
    "llama-3.1-8b-instant": 1_000_000,
    "llama-3.3-70b-versatile": 500_000,
    "openai/gpt-oss-20b": 1_000_000,
    "openai/gpt-oss-120b": 500_000,
    "qwen/qwen3-32b": 500_000,
    "qwen/qwen3.6-27b": 500_000,
    "meta-llama/llama-4-scout-17b-16e-instruct": 500_000,
  },
  cerebras: {
    "llama3.1-8b": 1_000_000,
    "llama3.1-70b": 500_000,
  },
  xai: {
    "grok-2-latest": 500_000,
    "grok-3-beta": 200_000,
  },
  gemini: {
    "gemini-2.5-flash": 1_000_000,
  },
};

export async function GET(req: NextRequest) {
  const user = getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  // Load global config overrides
  const configs = await db.prisma.globalConfig.findMany();
  const configMap = new Map(configs.map((c) => [c.key, c.value]));

  // Parse overrides from global config (format: tokenLimit_groq_llama-3.1-8b-instant = "2000000")
  const limits: Record<string, Record<string, number>> = {};
  for (const [key, val] of configMap) {
    if (!key.startsWith("tokenLimit_")) continue;
    const parts = key.split("_");
    if (parts.length !== 3) continue;
    const provider = parts[1];
    const model = parts[2];
    if (!limits[provider]) limits[provider] = {};
    const parsed = parseInt(val);
    if (!isNaN(parsed)) limits[provider][model] = parsed;
  }

  // Merge defaults + overrides
  for (const [prov, models] of Object.entries(DEFAULT_MONTHLY_LIMITS)) {
    if (!limits[prov]) limits[prov] = {};
    for (const [model, limit] of Object.entries(models)) {
      if (!limits[prov][model]) limits[prov][model] = limit;
    }
  }

  // Aggregated usage for this client (current month)
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const allLogs = await db.prisma.aIUsageLog.findMany({
    where: { clientId: user.clientId, createdAt: { gte: monthStart } },
  });
  console.log("[AI Usage Totals] user.clientId:", user.clientId, "monthStart:", monthStart.toISOString(), "totalLogs:", allLogs.length);
  const clientLogs = allLogs;
  console.log("[AI Usage Totals] clientLogs:", clientLogs.length);

  const usage: Record<string, { provider: string; model: string; used: number; limit: number; calls: number }> = {};

  for (const log of clientLogs) {
    const key = `${log.provider}:${log.model}`;
    if (!usage[key]) {
      usage[key] = {
        provider: log.provider,
        model: log.model,
        used: 0,
        limit: limits[log.provider]?.[log.model] || 0,
        calls: 0,
      };
    }
    usage[key].used += log.totalTokens || 0;
    usage[key].calls++;
  }

  // Also include provider/models that have limits but no usage yet
  for (const [prov, models] of Object.entries(limits)) {
    for (const [model, limit] of Object.entries(models)) {
      const key = `${prov}:${model}`;
      if (!usage[key]) {
        usage[key] = { provider: prov, model, used: 0, limit, calls: 0 };
      }
    }
  }

  const result = Object.values(usage)
    .filter((u) => u.limit > 0)
    .map((u) => ({
      ...u,
      remaining: Math.max(0, u.limit - u.used),
      pct: Math.min(100, Math.round((u.used / u.limit) * 100)),
    }))
    .sort((a, b) => b.used - a.used);

  // Totals across all
  const totalUsed = result.reduce((s, u) => s + u.used, 0);
  const totalLimit = result.reduce((s, u) => s + u.limit, 0);

  return NextResponse.json({
    providers: result,
    totalUsed,
    totalLimit,
    totalPct: totalLimit > 0 ? Math.min(100, Math.round((totalUsed / totalLimit) * 100)) : 0,
    month: now.toLocaleString("fr-FR", { month: "long", year: "numeric" }),
  });
}
