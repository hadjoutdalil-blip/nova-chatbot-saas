import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/api-auth";
import { randomUUID } from "crypto";

export async function GET(req: NextRequest) {
  const user = getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const clientId = req.nextUrl.searchParams.get("clientId") || user.clientId;
  if (user.role !== "admin" && clientId !== user.clientId)
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const keys = await db.prisma.embeddingKey.findMany({
    where: { clientId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(keys);
}

export async function POST(req: NextRequest) {
  const user = getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json();
  const clientId = body.clientId && user.role === "admin" ? body.clientId : user.clientId;

  if (!body.key) return NextResponse.json({ error: "Clé requise" }, { status: 400 });
  if (!body.provider) return NextResponse.json({ error: "Provider requis" }, { status: 400 });

  const isActive = body.isActive !== false;
  if (isActive) {
    await db.prisma.embeddingKey.updateMany({
      where: { clientId, isActive: true },
      data: { isActive: false, updatedAt: new Date() },
    });
  }

  const entry = await db.prisma.embeddingKey.create({
    data: {
      id: randomUUID(),
      clientId,
      provider: body.provider,
      label: body.label || `Clé ${body.provider}`,
      key: body.key,
      isActive,
    },
  });
  return NextResponse.json(entry, { status: 201 });
}
