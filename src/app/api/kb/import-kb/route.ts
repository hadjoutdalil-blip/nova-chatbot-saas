import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/api-auth";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  const user = getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { clientId, entries, replace } = await req.json();
  const targetClientId = clientId && user.role === "admin" ? clientId : user.clientId;

  if (!Array.isArray(entries) || entries.length === 0) {
    return NextResponse.json({ error: "Entrées requises" }, { status: 400 });
  }

  let allEntries = await db.read<any>("kb_entries");

  if (replace) {
    allEntries = allEntries.filter((k: any) => k.clientId !== targetClientId);
  }

  const newEntries = entries.map((e: any) => ({
    id: randomUUID(),
    question: e.question,
    alt_questions: e.alt_questions || "",
    answer: e.answer,
    category: e.category || "",
    keywords: e.keywords || "",
    priority: e.priority ?? 5,
    related_tags: e.related_tags || "",
    icon: e.icon || "",
    clientId: targetClientId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));

  await db.write("kb_entries", [...allEntries, ...newEntries]);
  return NextResponse.json({ imported: newEntries.length });
}
