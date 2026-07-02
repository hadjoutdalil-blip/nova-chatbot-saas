import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const user = getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const url = new URL(req.url);
  const clientId = url.searchParams.get("clientId") || user.clientId;

  const entries = await db.prisma.kBEntry.findMany({
    where: { clientId },
    select: {
      tag: true,
      icon: true,
      category: true,
      priority: true,
      related_tags: true,
      question: true,
      alt_questions: true,
      keywords: true,
      short_resp: true,
      source: true,
      source_url: true,
      valid_until: true,
      answer: true,
    },
  });

  const mapped = entries.map((k) => ({
    tag: k.tag || "",
    icon: k.icon || "",
    cat: k.category || "",
    priority: k.priority ?? 5,
    related_tags: (k.related_tags || "").split(",").map((s: string) => s.trim()).filter(Boolean),
    qs: [
      k.question,
      ...(k.alt_questions || "").split(" || ").map((s: string) => s.trim()).filter(Boolean),
    ].filter(Boolean),
    kw: (k.keywords || "").split(",").map((s: string) => s.trim()).filter(Boolean),
    short_resp: k.short_resp || "",
    source: k.source || "",
    source_url: k.source_url || "",
    valid_until: k.valid_until || "",
    resp: k.answer,
  }));

  return new NextResponse(JSON.stringify(mapped, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="kb-export-${clientId}.json"`,
    },
  });
}
