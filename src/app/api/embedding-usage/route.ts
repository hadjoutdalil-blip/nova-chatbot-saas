import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const user = getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const clientId = req.nextUrl.searchParams.get("clientId") || user.clientId;
  if (user.role !== "admin" && clientId !== user.clientId)
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const keys = await db.prisma.embeddingKey.findMany({
    where: { clientId },
    select: { id: true, provider: true, label: true, usageCount: true, lastUsedAt: true, isActive: true },
    orderBy: { usageCount: "desc" },
  });

  const totalCalls = keys.reduce((s, k) => s + k.usageCount, 0);
  const byProvider: Record<string, { calls: number; label: string }> = {};
  for (const k of keys) {
    if (!byProvider[k.provider]) byProvider[k.provider] = { calls: 0, label: k.label };
    byProvider[k.provider].calls += k.usageCount;
  }

  return NextResponse.json({ keys, totalCalls, byProvider });
}
