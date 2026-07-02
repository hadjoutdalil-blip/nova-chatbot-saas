import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/api-auth";
import { randomUUID } from "crypto";

function getTargetClientId(req: NextRequest, user: { userId: string; clientId: string; role: string }): string {
  const url = new URL(req.url);
  const param = url.searchParams.get("clientId");
  if (param && user.role === "admin") return param;
  return user.clientId;
}

export async function GET(req: NextRequest) {
  const user = getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const clientId = getTargetClientId(req, user);
  const convos = await db.prisma.conversation.findMany({
    where: { clientId },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(convos);
}

export async function POST(req: NextRequest) {
  const user = getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json();
  const clientId = body.clientId && user.role === "admin" ? body.clientId : user.clientId;

  if (!body.messages) {
    return NextResponse.json({ error: "Messages requis" }, { status: 400 });
  }

  const id = body.id || randomUUID();
  const title = body.title || (body.messages[0]?.content?.slice(0, 80) || "Conversation");

  const entry = await db.prisma.conversation.upsert({
    where: { id },
    create: {
      id,
      title,
      messages: JSON.stringify(body.messages),
      clientId,
      createdAt: body.createdAt || new Date().toISOString(),
    },
    update: {
      title,
      messages: JSON.stringify(body.messages),
      clientId,
    },
  });

  return NextResponse.json(entry, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const user = getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const url = new URL(req.url);
  const clientId = getTargetClientId(req, user);
  const id = url.searchParams.get("id");
  const deleteAll = url.searchParams.get("all") === "true";

  if (deleteAll) {
    await db.prisma.conversation.deleteMany({ where: { clientId } });
    return NextResponse.json({ success: true, deleted: true });
  }

  if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 });

  const existing = await db.prisma.conversation.findUnique({ where: { id } });
  if (!existing || existing.clientId !== clientId) {
    return NextResponse.json({ error: "Conversation introuvable" }, { status: 404 });
  }

  await db.prisma.conversation.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
