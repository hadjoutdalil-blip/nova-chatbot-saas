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

  if (replace) {
    await db.prisma.kBEntry.deleteMany({ where: { clientId: targetClientId } });
  }

  const newEntries = entries.map((e: any) => {
    const isCetim = Array.isArray(e.qs);
    const tag = e.tag || "";
    const question = isCetim ? e.qs[0] : e.question;
    const altQuestions = isCetim
      ? (e.qs.slice(1).join(" || ") || "")
      : (e.alt_questions || "");
    const shortResp = e.short_resp || "";
    const answer = isCetim ? (e.resp || "") : e.answer;
    const category = isCetim ? (e.cat || "") : (e.category || "");
    const keywords = isCetim
      ? (Array.isArray(e.kw) ? e.kw.join(", ") : "")
      : (e.keywords || "");
    const relatedTags = isCetim
      ? (Array.isArray(e.related_tags) ? e.related_tags.join(", ") : "")
      : (e.related_tags || "");

    return {
      id: randomUUID(),
      tag,
      question,
      alt_questions: altQuestions,
      short_resp: shortResp,
      answer,
      category,
      keywords,
      priority: e.priority ?? 5,
      related_tags: relatedTags,
      source: e.source || "",
      source_url: e.source_url || "",
      valid_until: e.valid_until || "",
      icon: e.icon || "",
      clientId: targetClientId,
    };
  });

  await db.prisma.kBEntry.createMany({ data: newEntries });
  return NextResponse.json({ imported: newEntries.length });
}
