import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/api-auth";
import { randomUUID } from "crypto";
import { detectProvider } from "@/lib/api-keys";

export async function GET(req: NextRequest) {
  const user = getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const url = new URL(req.url);
  const clientId = url.searchParams.get("clientId") || user.clientId;

  if (user.role !== "admin" && clientId !== user.clientId) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const keys = await db.prisma.apiKey.findMany({
    where: { clientId },
    orderBy: { priority: "asc" },
  });

  return NextResponse.json(keys);
}

export async function POST(req: NextRequest) {
  const user = getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json();
  const clientId = body.clientId && user.role === "admin" ? body.clientId : user.clientId;

  if (!body.key) {
    return NextResponse.json({ error: "Clé API requise" }, { status: 400 });
  }

  const provider = body.provider || detectProvider(body.key).id;

  const existing = await db.prisma.apiKey.findMany({
    where: { clientId },
    orderBy: { priority: "desc" },
    take: 1,
  });

  const nextPriority = existing.length > 0 ? existing[0].priority + 1 : 0;

  const entry = {
    id: randomUUID(),
    clientId,
    provider,
    label: body.label || `Clé ${provider} #${nextPriority + 1}`,
    key: body.key,
    isActive: body.isActive !== false,
    priority: body.priority ?? nextPriority,
    monthlyLimit: body.monthlyLimit ?? 0,
    usedTokens: 0,
    lastResetAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await db.prisma.apiKey.create({ data: entry });
  return NextResponse.json(entry, { status: 201 });
}
