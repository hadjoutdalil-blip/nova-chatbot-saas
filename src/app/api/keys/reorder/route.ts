import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/api-auth";

export async function POST(req: NextRequest) {
  const user = getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { clientId, order } = await req.json();
  if (!order || !Array.isArray(order)) {
    return NextResponse.json({ error: "Ordre requis (tableau [{id, priority}])" }, { status: 400 });
  }

  const targetClientId = clientId && user.role === "admin" ? clientId : user.clientId;

  for (const item of order) {
    await db.prisma.apiKey.updateMany({
      where: { id: item.id, clientId: targetClientId },
      data: { priority: item.priority, updatedAt: new Date() },
    });
  }

  return NextResponse.json({ success: true });
}
