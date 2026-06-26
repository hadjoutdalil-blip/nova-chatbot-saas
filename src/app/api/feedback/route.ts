import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { randomUUID } from "crypto";
import { findClientBySlug } from "@/lib/auth";

const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, GET, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" };

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function OPTIONS() {
  return NextResponse.json(null, { headers: corsHeaders });
}

export async function POST(req: NextRequest) {
  try {
    const { slug, messageId, conversationId, rating, question, response, source, score, provider, comment, pageUrl } = await req.json();

    if (!slug || !messageId || !rating || !question) {
      return NextResponse.json({ error: "slug, messageId, rating et question requis" }, { status: 400, headers: corsHeaders });
    }
    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Le rating doit être entre 1 et 5" }, { status: 400, headers: corsHeaders });
    }

    const client = await findClientBySlug(slug);
    if (!client) {
      return NextResponse.json({ error: "Client introuvable" }, { status: 404, headers: corsHeaders });
    }

    const all = await db.read<any>("message_feedback");
    all.push({
      id: randomUUID(),
      clientId: client.id,
      messageId,
      conversationId: conversationId || "",
      rating,
      question,
      response: response || "",
      source: source || "",
      score: score || 0,
      provider: provider || "",
      comment: comment || "",
      pageUrl: pageUrl || "",
      createdAt: new Date().toISOString(),
    });
    await db.write("message_feedback", all);

    /* Auto-create KB entry from good RAG exchanges */
    if (rating >= 4 && source === "rag" && response) {
      const allKb = await db.read<any>("kb_entries");
      const clientKb = allKb.filter((k: any) => k.clientId === client.id);
      const nq = norm(question);
      const exists = clientKb.some(k =>
        norm(k.question) === nq ||
        norm(k.question).includes(nq) ||
        nq.includes(norm(k.question))
      );
      if (!exists) {
        allKb.push({
          id: randomUUID(),
          tag: "auto-rag",
          question,
          alt_questions: "",
          short_resp: "",
          answer: response,
          category: "",
          keywords: "",
          priority: 3,
          related_tags: "",
          icon: "",
          source: "auto-rag",
          source_url: "",
          valid_until: "",
          clientId: client.id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        await db.write("kb_entries", allKb);
        console.log(`[Feedback] KB auto-créée depuis RAG: "${question.slice(0, 80)}"`);
      }
    }

    return NextResponse.json({ success: true }, { headers: corsHeaders });
  } catch (err: any) {
    console.error("[Feedback] Error:", err);
    return NextResponse.json({ error: err.message || "Erreur interne" }, { status: 500, headers: corsHeaders });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");
    const all = await db.read<any>("message_feedback");

    let feedbacks = all;
    if (slug) {
      const client = await findClientBySlug(slug);
      if (client) feedbacks = feedbacks.filter((f: any) => f.clientId === client.id);
    }

    feedbacks.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = feedbacks.length;
    const ratings = [0, 0, 0, 0, 0];
    for (const f of feedbacks) ratings[f.rating - 1]++;
    const avgRating = total > 0 ? feedbacks.reduce((s: number, f: any) => s + f.rating, 0) / total : 0;

    return NextResponse.json({
      total,
      avgRating: Math.round(avgRating * 10) / 10,
      distribution: {
        "5 (excellent)": ratings[4],
        "4 (bien)": ratings[3],
        "3 (moyen)": ratings[2],
        "2 (mauvais)": ratings[1],
        "1 (très mauvais)": ratings[0],
      },
      feedbacks: feedbacks.slice(0, 100),
    }, { headers: corsHeaders });
  } catch (err: any) {
    console.error("[Feedback] Error:", err);
    return NextResponse.json({ error: err.message || "Erreur interne" }, { status: 500, headers: corsHeaders });
  }
}
