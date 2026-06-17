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
  const allEntries = await db.read<any>("kb_entries");
  const entries = allEntries.filter((k) => k.clientId === clientId);
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

  const entries = await db.read<any>("kb_entries");
  const entry = {
    id: randomUUID(),
    tag: body.tag || "",
    question: body.question,
    alt_questions: body.alt_questions || "",
    short_resp: body.short_resp || "",
    answer: body.answer,
    category: body.category || "",
    keywords: body.keywords || "",
    priority: body.priority ?? 5,
    related_tags: body.related_tags || "",
    icon: body.icon || "",
    source: body.source || "",
    source_url: body.source_url || "",
    valid_until: body.valid_until || "",
    clientId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  entries.push(entry);
  await db.write("kb_entries", entries);
  return NextResponse.json(entry, { status: 201 });
}
