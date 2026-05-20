import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/api-auth";
import { randomUUID } from "crypto";

export async function GET(req: NextRequest) {
  const user = getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const entries = db.read<any>("kb_entries").filter((k) => k.clientId === user.clientId);
  return NextResponse.json(entries);
}

export async function POST(req: NextRequest) {
  const user = getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json();
  if (!body.question || !body.answer) {
    return NextResponse.json({ error: "Question et réponse requis" }, { status: 400 });
  }

  const entries = db.read<any>("kb_entries");
  const entry = {
    id: randomUUID(),
    question: body.question,
    answer: body.answer,
    category: body.category || "",
    keywords: body.keywords || "",
    clientId: user.clientId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  entries.push(entry);
  db.write("kb_entries", entries);
  return NextResponse.json(entry, { status: 201 });
}
