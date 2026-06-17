import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const user = getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const [allLogs, allClients, allConversations, allKb] = await Promise.all([
    db.read<any>("ai_usage_logs"),
    db.read<any>("clients"),
    db.read<any>("conversations"),
    db.read<any>("kb_entries"),
  ]);

  const clientNameMap = new Map(allClients.map((c: any) => [c.id, c.name]));

  // Per-provider/model aggregation
  const agg: Record<string, { provider: string; model: string; promptTokens: number; completionTokens: number; totalTokens: number; calls: number }> = {};

  for (const log of allLogs) {
    if (user.role !== "admin" && log.clientId !== user.clientId) continue;
    const key = `${log.provider}:${log.model}`;
    if (!agg[key]) {
      agg[key] = { provider: log.provider, model: log.model, promptTokens: 0, completionTokens: 0, totalTokens: 0, calls: 0 };
    }
    agg[key].promptTokens += log.promptTokens || 0;
    agg[key].completionTokens += log.completionTokens || 0;
    agg[key].totalTokens += log.totalTokens || 0;
    agg[key].calls++;
  }

  const byProvider = Object.values(agg).sort((a, b) => b.totalTokens - a.totalTokens);

  // Per-client aggregation with enriched data
  const byClient: Record<string, { clientId: string; clientName: string; totalTokens: number; calls: number; conversations: number; kbCount: number }> = {};
  if (user.role === "admin") {
    for (const c of allClients) {
      byClient[c.id] = { clientId: c.id, clientName: c.name, totalTokens: 0, calls: 0, conversations: 0, kbCount: 0 };
    }
    for (const log of allLogs) {
      if (!byClient[log.clientId]) continue;
      byClient[log.clientId].totalTokens += log.totalTokens || 0;
      byClient[log.clientId].calls++;
    }
    for (const conv of allConversations) {
      if (byClient[conv.clientId]) byClient[conv.clientId].conversations++;
    }
    for (const k of allKb) {
      if (byClient[k.clientId]) byClient[k.clientId].kbCount++;
    }
  }

  const byClientSorted = Object.values(byClient).sort((a, b) => b.totalTokens - a.totalTokens);

  return NextResponse.json({ byProvider, byClient: byClientSorted, clientCount: allClients.length });
}
