import { NextRequest, NextResponse } from "next/server";
import { findClientBySlug } from "@/lib/auth";
import { db } from "@/lib/db";
import { randomUUID } from "crypto";

const PROVIDERS: Record<string, { endpoint: string; label: string }> = {
  groq: { endpoint: "https://api.groq.com/openai/v1/chat/completions", label: "Groq" },
  cerebras: { endpoint: "https://api.cerebras.ai/v1/chat/completions", label: "Cerebras" },
  xai: { endpoint: "https://api.x.ai/v1/chat/completions", label: "xAI Grok" },
};

function detectProvider(key: string): { id: string; label: string } {
  if (key.startsWith("csk_")) return { id: "cerebras", label: "Cerebras" };
  if (key.startsWith("xai-")) return { id: "xai", label: "xAI Grok" };
  return { id: "groq", label: "Groq" };
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

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

function wordOverlap(a: string, b: string): number {
  const wa = a.split(" ").filter(w => w.length > 1);
  const wb = b.split(" ").filter(w => w.length > 1);
  if (wa.length === 0 || wb.length === 0) return 0;
  let hits = 0;
  for (const w of wa) {
    if (wb.some(bw => bw.includes(w) || w.includes(bw))) hits++;
  }
  return hits / Math.max(wa.length, wb.length);
}

function bigramOverlap(a: string, b: string): number {
  const getBigrams = (s: string) => { const w = s.split(" "); const bg: string[] = []; for (let i = 0; i < w.length - 1; i++) bg.push(w[i] + " " + w[i + 1]); return bg; };
  const ba = getBigrams(a).filter(x => x.length > 2);
  const bb = getBigrams(b).filter(x => x.length > 2);
  if (ba.length === 0 || bb.length === 0) return 0;
  let hits = 0;
  for (const bg of ba) {
    if (bb.some(b => b.includes(bg) || bg.includes(b))) hits++;
  }
  return hits / Math.max(ba.length, bb.length);
}

function fuzzyScore(a: string, b: string): number {
  const wa = a.split(" ").filter(w => w.length > 3);
  const wb = b.split(" ").filter(w => w.length > 3);
  if (wa.length === 0 || wb.length === 0) return 0;
  let hits = 0;
  for (const waWord of wa) {
    for (const wbWord of wb) {
      if (Math.abs(waWord.length - wbWord.length) > 3) continue;
      const dist = levenshtein(waWord, wbWord);
      const maxLen = Math.max(waWord.length, wbWord.length);
      if (dist <= 2) { hits++; break; }
    }
  }
  return hits / Math.max(wa.length, wb.length);
}

function calcSimilarity(a: string, b: string): number {
  const na = norm(a);
  const nb = norm(b);
  if (na === nb) return 1;
  if (na.includes(nb) || nb.includes(na)) return 0.95;
  const wo = wordOverlap(na, nb);
  const bo = bigramOverlap(na, nb);
  const fs = fuzzyScore(na, nb);
  return Math.min(wo * 0.35 + bo * 0.35 + fs * 0.30 + 0.02, 1);
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
    if (sq > bestScore) { bestScore = sq; best = e; }
    if (e.alt_questions) {
      for (const a of e.alt_questions.split(",").map(s => s.trim())) {
        if (!a) continue;
        const sa = calcSimilarity(query, a);
        if (sa > bestScore) { bestScore = sa; best = e; }
      }
    }
    for (const kw of (e.keywords || "").split(",").map(s => s.trim())) {
      const nkw = norm(kw);
      if (nkw && (nq.includes(nkw) || nkw.includes(nq))) {
        const sk = 0.6;
        if (sk > bestScore) { bestScore = sk; best = e; }
      }
    }
    const cat = norm(e.category);
    if (cat && (nq.includes(cat) || cat.includes(nq))) {
      if (0.55 > bestScore) { bestScore = 0.55; best = e; }
    }
  }
  return { match: best, score: Math.round(Math.min(bestScore, 1) * 100) };
}

function findRelated(match: any | null, KB: any[], count: number): string[] {
  if (!match || KB.length < 2) return [];
  const sameCat = KB.filter(k => k.question !== match.question && k.category && k.category === match.category);
  if (sameCat.length >= count) return sameCat.slice(0, count).map(k => k.question);
  const rest = KB.filter(k => k.question !== match.question && !sameCat.includes(k));
  const scored = rest.map(k => ({ q: k.question, sc: calcSimilarity(match.question, k.question) })).sort((a, b) => b.sc - a.sc);
  const out = sameCat.map(k => k.question);
  for (const item of scored) { if (out.length >= count) break; out.push(item.q); }
  return out;
}

/* ── CHUNK PARSING ─────────────────────────── */
function parseChunks(siteContext: string): { source: string; content: string }[] {
  if (!siteContext) return [];
  const chunks: { source: string; content: string }[] = [];
  const regex = /\[CHUNK:([^\]]+)\]([\s\S]*?)(?=\[CHUNK:|$)/g;
  let match;
  while ((match = regex.exec(siteContext)) !== null) {
    const content = match[2].trim();
    if (content) chunks.push({ source: match[1], content });
  }
  if (chunks.length === 0 && siteContext.trim()) {
    chunks.push({ source: "contexte.txt", content: siteContext.trim() });
  }
  return chunks;
}

function findBestChunks(question: string, chunks: { source: string; content: string }[], topN: number, threshold: number) {
  const scored = chunks.map(c => ({ ...c, score: calcSimilarity(question, c.content) }));
  const sorted = scored.sort((a, b) => b.score - a.score);
  return sorted.filter(c => c.score * 100 >= threshold).slice(0, topN);
}

/* ── PROMPT BUILDERS ──────────────────────────────────── */
function buildQAPrompt(client: any, match: any, score: number, question: string) {
  const system = `Tu es l'assistant officiel de ${client.name}.
Tu reformules UNIQUEMENT une réponse validée issue de la base de connaissance.

RÈGLES ABSOLUES :
- Ne modifie PAS le fond, les chiffres, les délais ou les références
- Reformule UNIQUEMENT la formulation pour l'adapter à la question du client
- Réponds toujours en français, professionnel et concis
- Termine par : [Source : Base de connaissance CETIM]`;

  const user = `NIVEAU : QA VALIDÉE (score ${score}%)

RÉPONSE OFFICIELLE À UTILISER :
${match.answer}

QUESTION DU CLIENT :
${question}`;

  return { system, user };
}

function buildRAGPrompt(client: any, chunks: { source: string; content: string }[], question: string) {
  const docs = chunks.map((c, i) =>
    `[Extrait #${i + 1} — Source : ${c.source}]\n${c.content}`
  ).join("\n\n");

  const system = `Tu es l'assistant officiel de ${client.name}.
Tu réponds en te basant UNIQUEMENT sur les extraits de documentation ci-dessous.

RÈGLES ABSOLUES :
- Ne réponds qu'à partir des extraits fournis
- Si les extraits ne répondent pas clairement, dis-le explicitement
- N'invente JAMAIS d'information
- Réponds toujours en français, professionnel et concis
- Termine par : [Source documentaire : ${chunks.map(c => c.source).join(", ")}]
- Ajoute : "Cette réponse est basée sur la documentation disponible. Pour confirmation officielle, contactez un expert."`;

  const user = `NIVEAU : RAG DOCUMENTAIRE

EXTRAITS DISPONIBLES :
${docs}

QUESTION DU CLIENT :
${question}`;

  return { system, user };
}

function buildEscaladePrompt(client: any, question: string, sessionType: string) {
  const contacts: Record<string, string> = {
    client: `- Expertise technique → experts@cetim.fr
- Demande de devis → commercial@cetim.fr
- Formations → formation@cetim.fr
- Standard → +33 (0)3 44 67 36 82`,
    partenaire: `- Partenariats → partenaires@cetim.fr
- Support technique → support@cetim.fr`,
    interne: `- Support interne → support-interne@cetim.fr
- IT → it@cetim.fr`,
  };

  const system = `Tu es l'assistant officiel de ${client.name}.
Tu n'as pas trouvé d'information pertinente pour répondre.

RÈGLES ABSOLUES :
- Reconnais honnêtement que tu n'as pas la réponse
- Explique brièvement pourquoi (hors périmètre ou info non disponible)
- Propose les canaux de contact adaptés
- NE TENTE PAS de répondre approximativement
- Réponds toujours en français, professionnel et concis`;

  const user = `NIVEAU : ESCALADE — AUCUN CONTEXTE PERTINENT

PROFIL : ${sessionType}

CANAUX DE CONTACT :
${contacts[sessionType] || contacts.client}

QUESTION DU CLIENT :
${question}`;

  return { system, user };
}

/* ── AI CALL ────────────────────────────────────────── */
async function callAI(apiKey: string, providerId: string, model: string, system: string, user: string, temperature: number, history: any[]) {
  const provider = PROVIDERS[providerId];
  if (!provider) throw new Error("Fournisseur AI inconnu");

  const msgHistory = (history || []).slice(-10).map((m: any) => ({ role: m.role, content: m.content }));

  const resp = await fetch(provider.endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: system },
        ...msgHistory,
        { role: "user", content: user },
      ],
      temperature,
      max_tokens: 600,
    }),
  });

  const data = await resp.json();
  if (!resp.ok) throw new Error(data.error?.message || `Erreur ${resp.status}`);
  return data.choices?.[0]?.message?.content || "";
}

/* ── SAVE CONVERSATION ──────────────────────────────── */
async function saveConversation(client: any, history: any[], userMsg: string, aiMsg: string, source: string, provider: string, score: number) {
  try {
    const all = await db.read<any>("conversations");
    const allMsgs = [...(history || []), { role: "user", content: userMsg }, { role: "assistant", content: aiMsg, source, provider, score }];
    const title = (history?.[0]?.content?.slice(0, 80)) || userMsg.slice(0, 80);

    all.push({
      id: randomUUID(),
      title,
      messages: JSON.stringify(allMsgs),
      clientId: client.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await db.write("conversations", all);
  } catch (err) {
    console.error("[Nova Chat] Failed to save conversation:", err);
  }
}

/* ── MAIN HANDLER ───────────────────────────────────── */
const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" };

export async function OPTIONS() {
  return NextResponse.json(null, { headers: corsHeaders });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const client = await findClientBySlug(slug);
  if (!client) {
    return NextResponse.json({ error: "Client introuvable" }, { status: 404, headers: corsHeaders });
  }

  const { message, history, aiMode, sessionType = "client" } = await req.json();
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
  const kbThreshold = client.kbThreshold ?? 80;
  const ragThreshold = client.ragThreshold ?? 72;

  /* ── NIVEAU 1 : QA VALIDÉE ── */
  if (match && score >= kbThreshold) {
    if (score === 100 || !aiMode || !client.apiKey) {
      saveConversation(client, history || [], message, match.answer, "kb", "", score);
      return NextResponse.json({
        response: match.answer,
        source: "kb",
        score,
        suggestions: findRelated(match, KB, 3),
      }, { headers: corsHeaders });
    }

    const { system, user } = buildQAPrompt(client, match, score, message);
    try {
      const providerInfo = detectProvider(client.apiKey);
      const text = await callAI(client.apiKey, providerInfo.id, client.aiModel || "llama-3.1-8b-instant", system, user, client.tempQA ?? 0.05, history || []);
      saveConversation(client, history || [], message, text, "qa", providerInfo.label, score);
      return NextResponse.json({ response: text, source: "qa", provider: providerInfo.label, score, suggestions: findRelated(match, KB, 3) }, { headers: corsHeaders });
    } catch {
      saveConversation(client, history || [], message, match.answer, "kb", "", score);
      return NextResponse.json({ response: match.answer, source: "kb", score, suggestions: findRelated(match, KB, 3) }, { headers: corsHeaders });
    }
  }

  /* ── PAS D'IA → fallback KB ou message générique ── */
  if (!aiMode || !client.apiKey) {
    const resp = match?.answer || "Je n'ai pas trouvé de réponse dans ma base de connaissances. Contactez-nous pour plus d'informations.";
    saveConversation(client, history || [], message, resp, match?.answer ? "kb" : "fallback", "", score);
    return NextResponse.json({
      response: resp,
      source: match?.answer ? "kb" : "fallback",
      score,
      suggestions: match ? findRelated(match, KB, 3) : [],
    }, { headers: corsHeaders });
  }

  const providerInfo = detectProvider(client.apiKey);
  const model = client.aiModel || "llama-3.1-8b-instant";

  /* ── NIVEAU 2 : RAG — contexte documentaire ── */
  if (score >= ragThreshold) {
    const chunks = parseChunks(client.siteContext || "");
    const topChunks = findBestChunks(message, chunks, client.topNChunks ?? 3, ragThreshold);

    if (topChunks.length > 0) {
      const { system, user } = buildRAGPrompt(client, topChunks, message);
      try {
        const text = await callAI(client.apiKey, providerInfo.id, model, system, user, client.tempRAG ?? 0.10, history || []);
        saveConversation(client, history || [], message, text, "rag", providerInfo.label, score);
        return NextResponse.json({ response: text, source: "rag", provider: providerInfo.label, score, chunks: topChunks.map(c => c.source) }, { headers: corsHeaders });
      } catch (err: any) {
        console.error("[Nova Chat] RAG error:", err);
      }
    }
  }

  /* ── NIVEAU 3 : ESCALADE ── */
  const { system, user } = buildEscaladePrompt(client, message, sessionType);
  try {
    const text = await callAI(client.apiKey, providerInfo.id, model, system, user, client.tempEscalade ?? 0.20, history || []);
    console.warn(`[Nova Chat] ESCALADE — question non couverte: "${message.slice(0, 80)}..." (${client.name})`);
    saveConversation(client, history || [], message, text, "escalade", providerInfo.label, score);
    return NextResponse.json({ response: text, source: "escalade", provider: providerInfo.label, score }, { headers: corsHeaders });
  } catch (err: any) {
    console.error("[Nova Chat] Escalade error:", err);
    const fallbackResp = "Je n'ai pas pu traiter votre demande pour le moment. Veuillez réessayer ou contacter notre équipe.";
    saveConversation(client, history || [], message, fallbackResp, "fallback", "", score);
    return NextResponse.json({
      response: fallbackResp,
      source: "fallback",
      score,
    }, { headers: corsHeaders });
  }
}
