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
  const all = await db.read<any>("conversations");
  const convos = all
    .filter((c: any) => c.clientId === clientId)
    .sort((a: any, b: any) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());

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

  const all = await db.read<any>("conversations");
  const title = body.title || (body.messages[0]?.content?.slice(0, 80) || "Conversation");

  const entry = {
    id: body.id || randomUUID(),
    title,
    messages: JSON.stringify(body.messages),
    clientId,
    createdAt: body.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const existing = all.find((c: any) => c.id === entry.id);
  if (existing) {
    Object.assign(existing, entry);
  } else {
    all.push(entry);
  }

  await db.write("conversations", all);
  return NextResponse.json(entry, { status: existing ? 200 : 201 });
}

export async function DELETE(req: NextRequest) {
  const user = getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const url = new URL(req.url);
  const all = await db.read<any>("conversations");
  const clientId = getTargetClientId(req, user);

  const id = url.searchParams.get("id");
  const deleteAll = url.searchParams.get("all") === "true";

  if (deleteAll) {
    const filtered = all.filter((c: any) => c.clientId !== clientId);
    await db.write("conversations", filtered);
    return NextResponse.json({ success: true, deleted: true });
  }

  if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 });

  const filtered = all.filter((c: any) => c.id !== id || c.clientId !== clientId);
  if (filtered.length === all.length) {
    return NextResponse.json({ error: "Conversation introuvable" }, { status: 404 });
  }

  await db.write("conversations", filtered);
  return NextResponse.json({ success: true });
}
