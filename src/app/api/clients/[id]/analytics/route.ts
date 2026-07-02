import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = await db.prisma.client.findUnique({ where: { id } });
  if (!client) return NextResponse.json({ error: "Client introuvable" }, { status: 404 });

  const clientConvos = await db.prisma.conversation.findMany({ where: { clientId: id } });

  const locMap = new Map<string, { country: string; city: string; count: number }>();
  for (const c of clientConvos) {
    const key = `${c.country || "Inconnu"}|${c.city || "Inconnu"}`;
    if (locMap.has(key)) locMap.get(key)!.count++;
    else locMap.set(key, { country: c.country || "Inconnu", city: c.city || "Inconnu", count: 1 });
  }
  const connectionsByLocation = [...locMap.values()].sort((a, b) => b.count - a.count);

  const allFeedback = await db.prisma.messageFeedback.findMany();
  const ratedFeedback = allFeedback.filter((f) => f.rating > 0);
  const totalRatings = ratedFeedback.length;
  const avgRating = totalRatings > 0
    ? Math.round((ratedFeedback.reduce((s, f) => s + f.rating, 0) / totalRatings) * 10) / 10
    : 0;
  const distribution: Record<string, number> = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 };
  for (const f of ratedFeedback) {
    distribution[String(f.rating)] = (distribution[String(f.rating)] || 0) + 1;
  }

  const recentConvos = clientConvos
    .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
    .slice(0, 30)
    .map((c) => ({
      id: c.id,
      title: c.title,
      country: c.country || "",
      city: c.city || "",
      messages: typeof c.messages === "string" ? JSON.parse(c.messages) : (c.messages || []),
      createdAt: c.createdAt,
    }));

  return NextResponse.json({
    conversations: { total: clientConvos.length },
    connectionsByLocation,
    satisfaction: {
      total: totalRatings,
      avgRating,
      distribution,
    },
    recentConversations: recentConvos,
  });
}
