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
  const entries = db.read<any>("kb_entries").filter((k) => k.clientId === clientId);
  return NextResponse.json(entries);
}

export async function POST(req: NextRequest) {
  const user = getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json();
  if (!body.question || !body.answer) {
    return NextResponse.json({ error: "Question et réponse requis" }, { status: 400 });
  }

  const clientId = body.clientId && user.role === "admin" ? body.clientId : user.clientId;

  const entries = db.read<any>("kb_entries");
  const entry = {
    id: randomUUID(),
    question: body.question,
    answer: body.answer,
    category: body.category || "",
    keywords: body.keywords || "",
    clientId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  entries.push(entry);
  db.write("kb_entries", entries);
  return NextResponse.json(entry, { status: 201 });
}
