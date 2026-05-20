import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const user = getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const url = new URL(req.url);
  const clientId = url.searchParams.get("clientId") || user.clientId;

  const allEntries = await db.read<any>("kb_entries");
  const entries = allEntries
    .filter((k: any) => k.clientId === clientId)
    .map((k: any) => ({
      question: k.question,
      alt_questions: k.alt_questions || "",
      answer: k.answer,
      category: k.category || "",
      keywords: k.keywords || "",
      priority: k.priority ?? 5,
      related_tags: k.related_tags || "",
      icon: k.icon || "",
    }));

  return new NextResponse(JSON.stringify(entries, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="kb-export-${clientId}.json"`,
    },
  });
}
