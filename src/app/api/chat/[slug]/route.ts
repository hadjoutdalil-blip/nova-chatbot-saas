import { NextRequest, NextResponse } from "next/server";
import { findClientBySlug } from "@/lib/auth";
import { db } from "@/lib/db";

const PROVIDERS: Record<string, { endpoint: string; label: string }> = {
  groq: { endpoint: "https://api.groq.com/openai/v1/chat/completions", label: "Groq" },
  cerebras: { endpoint: "https://api.cerebras.ai/v1/chat/completions", label: "Cerebras" },
};

function detectProvider(key: string): { id: string; label: string } {
  const id = key.startsWith("csk_") ? "cerebras" : "groq";
  return { id, label: PROVIDERS[id].label };
}

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function calcSimilarity(a: string, b: string): number {
  const na = norm(a);
  const nb = norm(b);
  if (na === nb) return 1;
  const wa = na.split(" ");
  const wb = nb.split(" ");
  let hits = 0;
  for (let i = 0; i < wa.length; i++) {
    const w = wa[i];
    if (w.length < 2) continue;
    for (let j = 0; j < wb.length; j++) {
      if (wb[j].includes(w) || w.includes(wb[j])) {
        hits++;
        break;
      }
    }
  }
  return hits / Math.max(wa.length, wb.length);
}

function findBestMatch(
  query: string,
  KB: { question: string; alt_questions: string; answer: string; category: string; keywords: string }[]
): { match: any | null; score: number } {
  let best: any | null = null;
  let bestScore = 0;
  const nq = norm(query);
  for (const e of KB) {
    const sq = calcSimilarity(query, e.question);
    if (sq > bestScore) {
      bestScore = sq;
      best = e;
    }
    if (e.alt_questions) {
      const alts = e.alt_questions.split(",").map((s: string) => s.trim());
      for (const a of alts) {
        if (!a) continue;
        const sa = calcSimilarity(query, a);
        if (sa > bestScore) {
          bestScore = sa;
          best = e;
        }
      }
    }
    const kws = e.keywords
      ? e.keywords.split(",").map((s: string) => s.trim())
      : [];
    for (let j = 0; j < kws.length; j++) {
      const kw = norm(kws[j]);
      if (kw && (nq.includes(kw) || kw.includes(nq))) {
        const sk = 0.5 + ((kws.length - j) / kws.length) * 0.3;
        if (sk > bestScore) {
          bestScore = sk;
          best = e;
        }
      }
    }
    const cat = norm(e.category);
    if (cat && (nq.includes(cat) || cat.includes(nq))) {
      const sc = 0.6;
      if (sc > bestScore) {
        bestScore = sc;
        best = e;
      }
    }
  }
  return { match: best, score: Math.round(Math.min(bestScore, 1) * 100) };
}

function findRelated(
  match: any | null,
  KB: any[],
  count: number
): string[] {
  if (!match || KB.length < 2) return [];
  const sameCat = KB.filter(
    (k: any) =>
      k.question !== match.question &&
      k.category &&
      k.category === match.category
  );
  if (sameCat.length >= count) return sameCat.slice(0, count).map((k: any) => k.question);
  const rest = KB.filter(
    (k: any) =>
      k.question !== match.question && sameCat.indexOf(k) === -1
  );
  const scored = rest
    .map((k: any) => ({ q: k.question, sc: calcSimilarity(match.question, k.question) }))
    .sort((a, b) => b.sc - a.sc);
  const out = sameCat.map((k: any) => k.question);
  for (const item of scored) {
    if (out.length >= count) break;
    out.push(item.q);
  }
  return out;
}

function buildSystemPrompt(
  client: any,
  kbEntries: any[]
): string {
  const kbContext = kbEntries
    .map((k: any) => `Q: ${k.question}\nR: ${k.answer}`)
    .join("\n\n");
  const siteCtx = client.siteContext
    ? `\n\nCONTEXTE ENTREPRISE :\n${client.siteContext}`
    : "";
  const relance = client.relanceText
    ? `\n\nPHRASE DE RELANCE :\n${client.relanceText}`
    : "\n\nTermine par une phrase de relance pour continuer la conversation.";
  return `Tu es l'assistant virtuel OFFICIEL de ${client.name}.

BASE DE CONNAISSANCES (questions/réponses) :
${kbContext || "(aucune donnée fournie)"}${siteCtx}

RÈGLES :
- Réponds UNIQUEMENT en utilisant le contexte ci-dessus.
- N'invente PAS d'informations absentes du contexte.
- Si la question est hors-sujet, dis-le honnêtement et redirige vers le contact.
- Réponds toujours en français, professionnel et concis.
- Si la question mérite OUI/NON, commence par "**Oui,**" ou "**Non,**".${relance}`;
}

const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" };

export async function OPTIONS() {
  return NextResponse.json(null, { headers: corsHeaders });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const client = await findClientBySlug(slug);
  if (!client) {
    return NextResponse.json({ error: "Client introuvable" }, { status: 404, headers: corsHeaders });
  }

  const { message, history, aiMode } = await req.json();
  if (!message || typeof message !== "string") {
    return NextResponse.json({ error: "Message requis" }, { status: 400, headers: corsHeaders });
  }

  const allEntries = await db.read<any>("kb_entries");
  const kbEntries = allEntries.filter((k: any) => k.clientId === client.id);

  const KB = kbEntries.map((k: any) => ({
    question: k.question,
    alt_questions: k.alt_questions || "",
    answer: k.answer,
    category: k.category,
    keywords: k.keywords || "",
  }));

  const { match, score } = findBestMatch(message, KB);
  const threshold = client.kbThreshold ?? 60;

  /* KB match suffisant */
  if (match && score >= threshold) {
    return NextResponse.json({
      response: match.answer,
      source: "kb",
      score,
      suggestions: findRelated(match, KB, 3),
    }, { headers: corsHeaders });
  }

  const useAI = aiMode === true && client.apiKey;

  if (!useAI) {
    return NextResponse.json({
      response:
        match?.answer ||
        "Je n'ai pas trouvé de réponse dans ma base de connaissances. Contactez-nous pour plus d'informations.",
      source: match?.answer ? "kb" : "fallback",
      score,
      suggestions: match ? findRelated(match, KB, 3) : [],
    }, { headers: corsHeaders });
  }

  /* Mode IA */
  const providerInfo = detectProvider(client.apiKey);
  const provider = PROVIDERS[providerInfo.id];
  const model = client.aiModel || "llama-3.1-8b-instant";
  const systemPrompt = buildSystemPrompt(client, kbEntries);

  const msgHistory = (history || [])
    .slice(-10)
    .map((m: any) => ({ role: m.role, content: m.content }));

  try {
    const resp = await fetch(provider.endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${client.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          ...msgHistory,
          { role: "user", content: message },
        ],
        temperature: 0.65,
        max_tokens: 600,
      }),
    });

    const data = await resp.json();
    if (!resp.ok) {
      console.error("[Nova Chat] AI error:", data);
      return NextResponse.json({
        response:
          match?.answer ||
          "Le service IA est temporairement indisponible.",
        source: match?.answer ? "kb" : "fallback",
        score,
        suggestions: match ? findRelated(match, KB, 3) : [],
      });
    }

    const text = data.choices?.[0]?.message?.content;
    if (!text) {
      return NextResponse.json({
        response:
          match?.answer || "Je n'ai pas pu générer de réponse.",
        source: match?.answer ? "kb" : "fallback",
        score,
        suggestions: match ? findRelated(match, KB, 3) : [],
      });
    }

    return NextResponse.json({
      response: text,
      source: "ai",
      provider: providerInfo.label,
      clientName: client.name,
      score,
      suggestions: match ? findRelated(match, KB, 3) : [],
    }, { headers: corsHeaders });
  } catch (err: any) {
    console.error("[Nova Chat] AI exception:", err);
    return NextResponse.json({
      response:
        match?.answer || "Une erreur est survenue. Veuillez réessayer.",
      source: match?.answer ? "kb" : "fallback",
      score,
      suggestions: match ? findRelated(match, KB, 3) : [],
    }, { headers: corsHeaders });
  }
}
