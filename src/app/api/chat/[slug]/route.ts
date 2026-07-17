import { NextRequest, NextResponse } from "next/server";
import { findClientBySlug } from "@/lib/auth";
import { db } from "@/lib/db";
import { randomUUID } from "crypto";
import { extractIP, lookupGeo } from "@/lib/geo";
import { norm, calcSimilarity, ChunkMeta, chunkDocument, parseChunks, findBestChunks } from "@/lib/rag-utils";
import { detectProvider, selectApiKey, trackKeyUsage } from "@/lib/api-keys";
import { generateEmbedding } from "@/lib/embeddings";
import { searchChunks as vectorSearchChunks } from "@/lib/vector-store";
import { compareWithHeuristic, compareWithAI } from "@/lib/response-comparator";
import { detectIntent, classifyIntentWithAI } from "@/lib/intent-detector";

const PROVIDERS: Record<string, { endpoint: string; label: string }> = {
  groq: { endpoint: "https://api.groq.com/openai/v1/chat/completions", label: "Groq" },
  cerebras: { endpoint: "https://api.cerebras.ai/v1/chat/completions", label: "Cerebras" },
  xai: { endpoint: "https://api.x.ai/v1/chat/completions", label: "xAI Grok" },
  gemini: { endpoint: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", label: "Gemini" },
};

function providerLabel(id: string): string {
  return PROVIDERS[id]?.label || id;
}



function findBestMatch(
  query: string,
  KB: { tag: string; question: string; alt_questions: string; answer: string; category: string; keywords: string; priority: number }[]
): { match: any | null; score: number; isKeyword: boolean } {
  let best: any | null = null;
  let bestScore = 0;
  let isKeyword = false;
  const nq = norm(query);
  for (const e of KB) {
    const sq = calcSimilarity(query, e.question);
    if (sq > bestScore || (sq === bestScore && e.priority > (best?.priority ?? 0))) { bestScore = sq; best = e; isKeyword = false; }
    if (e.alt_questions) {
      for (const a of e.alt_questions.split(/[,|]+\s*/).map(s => s.trim())) {
        if (!a) continue;
        const sa = calcSimilarity(query, a);
        if (sa > bestScore || (sa === bestScore && e.priority > (best?.priority ?? 0))) { bestScore = sa; best = e; isKeyword = false; }
      }
    }
    for (const kw of (e.keywords || "").split(",").map(s => s.trim())) {
      const nkw = norm(kw);
      if (nkw) {
        const kwRegex = new RegExp("\\b" + nkw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b", "i");
        const qRegex = new RegExp("\\b" + nq.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b", "i");
        if (kwRegex.test(nq) || qRegex.test(nkw)) {
          const sk = 0.6;
          if (sk > bestScore || (sk === bestScore && e.priority > (best?.priority ?? 0))) { bestScore = sk; best = e; isKeyword = true; }
        }
      }
    }
    const cat = norm(e.category);
    if (cat) {
      const catRegex = new RegExp("\\b" + cat.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b", "i");
      const qRegex = new RegExp("\\b" + nq.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b", "i");
      if (catRegex.test(nq) || qRegex.test(cat)) {
        if (0.55 > bestScore || (0.55 === bestScore && e.priority > (best?.priority ?? 0))) { bestScore = 0.55; best = e; isKeyword = false; }
      }
    }
  }
  return { match: best, score: Math.round(Math.min(bestScore, 1) * 100), isKeyword };
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


function buildContext(client: any, pageUrl?: string, pageTitle?: string): string {
  const parts: string[] = [];
  if (pageUrl) parts.push(`Page visitée : ${pageUrl}`);
  if (pageTitle) parts.push(`Titre de la page : ${pageTitle}`);
  if (client.siteContext) {
    const ctx = client.siteContext.trim().slice(0, 2000);
    if (ctx) parts.push(`Contexte de l'entreprise : ${ctx}`);
  }
  return parts.length > 0 ? `\n\nCONTEXTE :\n${parts.join("\n")}` : "";
}

/* ── PROMPT BUILDERS ──────────────────────────────────── */
function buildQAPrompt(client: any, match: any, score: number, question: string, isVisitor: boolean, pageUrl?: string, pageTitle?: string) {
  const linkRule = isVisitor
    ? `- Si un document source PDF est disponible pour téléchargement, inclus un lien cliquable markdown : [Télécharger le fichier](URL)`
    : `- Si un document source est disponible pour téléchargement, inclus un lien cliquable markdown : [Télécharger le fichier](URL)`;
  const sourceLine = isVisitor ? "" : `\n- Termine par : [Source : Base de connaissance ${client.name}]`;
  const system = `Tu es l'assistant officiel de ${client.name}.
Tu reformules UNIQUEMENT une réponse validée issue de la base de connaissance.${buildContext(client, pageUrl, pageTitle)}

RÈGLES ABSOLUES :
- Ne modifie PAS le fond, les chiffres, les délais ou les références
- Reformule légèrement l'introduction et la transition, mais conserve le contenu structuré (listes, tableaux, puces)
- Conserve les emojis, le gras, les listes numérotées et les tableaux markdown
- Réponds toujours en français, professionnel et concis
${linkRule}${sourceLine}
- Si la RÉPONSE OFFICIELLE ne répond PAS à la QUESTION DU CLIENT, réponds UNIQUEMENT par le mot exact : NO_MATCH`;

  const srcUrl = isVisitor ? (match.source_url?.toLowerCase().endsWith(".pdf") ? match.source_url : "") : (match.source_url || "");
  const user = `NIVEAU : QA VALIDÉE (score ${score}%)

RÉPONSE OFFICIELLE À UTILISER :
${match.answer}

LIEN DU DOCUMENT SOURCE :
${srcUrl || "Aucun"}

QUESTION DU CLIENT :
${question}`;

  return { system, user };
}

function buildRAGPrompt(client: any, chunks: ChunkMeta[], question: string, isVisitor: boolean, pageUrl?: string, pageTitle?: string) {
  const docMap = new Map<string, { chunks: ChunkMeta[]; maxScore: number }>();
  for (const c of chunks) {
    const key = c.source;
    if (!docMap.has(key)) docMap.set(key, { chunks: [], maxScore: 0 });
    const entry = docMap.get(key)!;
    entry.chunks.push(c);
    if ((c.score ?? 0) > entry.maxScore) entry.maxScore = c.score ?? 0;
  }
  const docRanking = [...docMap.entries()]
    .sort((a, b) => b[1].maxScore - a[1].maxScore)
    .map(([docName, info], i) =>
      `  ${i + 1}. ${docName} (pertinence : ${Math.round(info.maxScore * 100)}%) — ${info.chunks.length} extrait${info.chunks.length > 1 ? "s" : ""}`
    ).join("\n");

  const docs = chunks.map((c, i) => {
    const meta = [`Source : ${c.source}`];
    if (c.section) meta.push(`Section : ${c.section}`);
    if (c.keywords?.length) meta.push(`Mots-clés : ${c.keywords.join(", ")}`);
    if (c.source_url) {
      if (!isVisitor || c.source_url.toLowerCase().endsWith(".pdf")) {
        meta.push(`Lien : ${c.source_url}`);
      }
    }
    return `[Extrait #${i + 1} — ${meta.join(" | ")}]\n${c.content}`;
  }).join("\n\n");

  const noMatchRule = isVisitor
    ? `- Si tu n'as pas de réponse précise, invite poliment le client à reformuler ou contacter l'équipe`
    : `- Si AUCUN extrait ne répond à la question, dis-le poliment`;
  const linkRule = isVisitor
    ? `- Si un extrait a un lien PDF disponible dans ses métadonnées, inclus un lien cliquable markdown : [Télécharger le fichier](URL)`
    : `- Si un extrait a un Lien disponible dans ses métadonnées, inclus un lien cliquable markdown : [Télécharger le fichier](URL)`;
  const adminFooter = isVisitor ? "" : `\n- Termine par : [Source documentaire : ${chunks.map(c => c.source).join(", ")}]\n- Ajoute : "Cette réponse est basée sur la documentation disponible. Pour confirmation officielle, contactez un expert."`;

  const system = `Tu es l'assistant officiel de ${client.name}.
Tu réponds en te basant UNIQUEMENT sur les extraits de documentation ci-dessous.${buildContext(client, pageUrl, pageTitle)}

RÈGLES ABSOLUES :
- Ne réponds qu'à partir des extraits fournis
- Si les extraits ne répondent que partiellement, réponds avec les informations disponibles
- En cas de contradiction entre extraits, privilégie le plus récent ou le plus spécifique
- Les extraits sont classés par pertinence : l'extrait #1 est le plus important
${noMatchRule}
- N'invente JAMAIS d'information
- Réponds toujours en français, professionnel et concis
${linkRule}${adminFooter}`;

  const user = `NIVEAU : RAG DOCUMENTAIRE

DOCUMENTS CONSULTÉS (classés par pertinence) :
${docRanking}

EXTRAITS DISPONIBLES :
${docs}

QUESTION DU CLIENT :
${question}`;

  return { system, user };
}

function findContactEntry(KB: any[]): string {
  const contactKeywords = ["contact", "contacter", "support", "assistance", "administration"];
  const entry = KB.find(k =>
    k.keywords && contactKeywords.some(kw => norm(k.keywords).includes(kw))
  ) || KB.find(k =>
    k.question && contactKeywords.some(kw => norm(k.question).includes(kw))
  );
  return entry?.answer?.trim() || "";
}

function buildEscaladePrompt(client: any, question: string, sessionType: string, KB: any[], pageUrl?: string, pageTitle?: string) {
  const contactInfo = findContactEntry(KB);

  const system = `Tu es un assistant professionnel de ${client.name}.
Tu n'as pas trouvé de réponse précise. Tu orientes le client vers les bonnes ressources.${buildContext(client, pageUrl, pageTitle)}

EXEMPLE DE RÉPONSE ATTENDUE :
Client : "Quels sont les tarifs des essais ?"
Assistant :
"Je n'ai pas trouvé de réponse précise à votre question dans notre base de connaissances.

Pour obtenir un devis personnalisé, vous pouvez contacter notre équipe :
📞 Tél. : 023 58 70 70
📧 Email : contact@cetim-dz.com

Vous pouvez également consulter notre catalogue de prestations ou nous préciser le type d'essai qui vous intéresse (béton, sol, eau, etc.).

Puis-je vous aider avec autre chose ?"

RÈGLES ABSOLUES :
- Suis le format de l'exemple ci-dessus : 1) phrase d'ouverture, 2) coordonnées, 3) suggestions, 4) question ouverte
- Reste courtois, neutre et professionnel
- Utilise les INFORMATIONS DE CONTACT réelles ci-dessous
- Suggère 2-3 questions pertinentes en lien avec la QUESTION DU CLIENT
- N'invente JAMAIS d'information technique
- Réponds toujours en français, ton professionnel et accessible
- Ne te présente PAS comme "conseiller commercial"`;

  const user = `NIVEAU : ESCALADE — AUCUN CONTEXTE PERTINENT

PROFIL : ${sessionType}

INFORMATIONS DE CONTACT :
${contactInfo || "Aucune coordonnée spécifique disponible."}

QUESTION DU CLIENT :
${question}

Consigne : Inspire-toi de l'exemple ci-dessus. Utilise les INFORMATIONS DE CONTACT réelles. Suggère 2-3 questions en lien avec la QUESTION DU CLIENT. Termine par une invitation ouverte.`;

  return { system, user, contactInfo };
}

function buildIntentPrompt(client: any, intent: string, message: string, pageUrl?: string, pageTitle?: string) {
  const ctx = buildContext(client, pageUrl, pageTitle);
  const rules = intent === "SMALL_TALK"
    ? `- L'utilisateur te salue ou fait du small talk
- Réponds avec le même ton (salut → salut, salam → salam aleykoum, bonjour → bonjour)
- Oriente-le ensuite vers les services CETIM (essais, normes, étalonnage, formations)`
    : intent === "AVIS"
      ? `- L'utilisateur exprime son avis sur CETIM ou le chatbot
- Accueille son retour avec bienveillance
- Présente les points forts du CETIM : laboratoires accrédités, équipes expertes, services diversifiés
- Invite-le à découvrir les services qui pourraient l'intéresser`
      : `- L'utilisateur pose une question hors sujet
- Réponds poliment que ce domaine n'est pas celui du CETIM
- Redirige vers les sujets CETIM : essais, normes, certifications, formations`;

  const system = `Tu es l'assistant officiel de ${client.name}.${ctx}

RÈGLES :
${rules}
- Réponds toujours en français, chaleureux et professionnel
- Termine par une question ouverte sur ses besoins CETIM`;

  return { system, user: message };
}

/* ── AI CALL ────────────────────────────────────────── */
async function callAI(apiKey: string, providerId: string, model: string, system: string, user: string, temperature: number, history: any[], max_tokens: number = 600) {
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
      max_tokens,
    }),
  });

  const data = await resp.json();
  if (!resp.ok) throw new Error(data.error?.message || `Erreur ${resp.status}`);
  const text = data.choices?.[0]?.message?.content || "";
  const usage = data.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
  return { text, usage };
}

async function resolveApiKey(client: any): Promise<{ id: string; key: string; model?: string | null } | null> {
  let entry = await selectApiKey(client.id, client.aiProvider || "groq");
  if (entry) return entry;
  const anyKey = await db.prisma.apiKey.findFirst({
    where: { clientId: client.id, isActive: true },
    orderBy: { priority: "asc" },
  });
  if (anyKey) return { id: anyKey.id, key: anyKey.key, model: anyKey.model };
  if (client.apiKey) return { id: "deprecated", key: client.apiKey, model: client.aiModel };
  return null;
}

async function saveUsage(clientId: string, provider: string, model: string, usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number }) {
  try {
    const data = {
      id: randomUUID(),
      clientId,
      provider,
      model,
      promptTokens: usage.prompt_tokens || 0,
      completionTokens: usage.completion_tokens || 0,
      totalTokens: usage.total_tokens || 0,
    };
    console.log("[Nova Chat] saveUsage called:", JSON.stringify({ clientId, provider, model, totalTokens: data.totalTokens }));
    await db.prisma.aIUsageLog.create({ data });
    console.log("[Nova Chat] saveUsage success");
  } catch (err: any) {
    console.error("[Nova Chat] Failed to save AI usage:", err?.message || err, err?.stack || "");
  }
}

/* ── SAVE CONVERSATION ──────────────────────────────── */
async function saveConversation(client: any, history: any[], userMsg: string, aiMsg: string, source: string, provider: string, score: number, geoPromise?: Promise<{ ip: string; country: string; city: string }>) {
  try {
    const geo = geoPromise ? await geoPromise : { ip: "", country: "", city: "" };
    const msgId = randomUUID();
    const allMsgs = [...(history || []), { role: "user", content: userMsg }, { role: "assistant", content: aiMsg, source, provider, score }];
    const title = (history?.[0]?.content?.slice(0, 80)) || userMsg.slice(0, 80);

    await db.prisma.conversation.create({
      data: {
        id: msgId,
        title,
        messages: JSON.stringify(allMsgs),
        clientId: client.id,
        ipAddress: geo.ip,
        country: geo.country,
        city: geo.city,
      },
    });

    /* Log Q&A pair for evaluation */
    const qaMsgId = randomUUID();
    await db.prisma.messageFeedback.create({
      data: {
        id: qaMsgId,
        clientId: client.id,
        messageId: qaMsgId,
        conversationId: msgId,
        rating: 0,
        question: userMsg,
        response: aiMsg,
        source,
        score,
        provider,
        comment: "",
        pageUrl: "",
      },
    });
  } catch (err) {
    console.error("[Nova Chat] Failed to save conversation:", err);
  }
}

/* ── MAIN HANDLER ───────────────────────────────────── */
const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" };

function filterResponse(data: any, isVisitor: boolean): any {
  if (!isVisitor) return data;
  const { source_url, valid_until, suggestions, chunks, documents, ...rest } = data;
  return rest;
}

export async function OPTIONS() {
  return NextResponse.json(null, { headers: corsHeaders });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const client = await findClientBySlug(slug);
  if (!client) {
    return NextResponse.json({ error: "Client introuvable" }, { status: 404, headers: corsHeaders });
  }

  const { message, history, aiMode, ragOnly, sessionType = "client", pageUrl, pageTitle, isVisitor = false } = await req.json();
  if (!message || typeof message !== "string") {
    return NextResponse.json({ error: "Message requis" }, { status: 400, headers: corsHeaders });
  }

  const messageId = randomUUID();
  const trimmed = message.trim();
  const words = trimmed.split(/\s+/).filter(Boolean);

  const ip = extractIP(req);
  const geoPromise = lookupGeo(ip);

  /* ── NIVEAU 0 : Détection d'intention ── */
  let intent = detectIntent(trimmed);

  /* Passe 2 : Classification IA (corrige faux positifs/faux négatifs des regex) */
  if (aiMode) {
    const keyEntry = await resolveApiKey(client);
    if (keyEntry?.key) {
      const provInfo = detectProvider(keyEntry.key);
      const provider = PROVIDERS[provInfo.id];
      if (provider) {
        try {
          const aiModel = keyEntry.model || client.aiModel || "openai/gpt-oss-20b";
          const aiIntent = await classifyIntentWithAI(trimmed, keyEntry.key, provider.endpoint, aiModel);
          if (aiIntent.intent !== intent.intent) {
            console.log(`[Nova Chat] Intent override: regex=${intent.intent} → ai=${aiIntent.intent} message="${trimmed.slice(0, 80)}" (${client.name})`);
            intent = aiIntent;
          }
        } catch (err) {
          console.error("[Nova Chat] AI Intent error:", err);
        }
      }
    }
  }

  if (intent.intent !== "REQUETE_METIER") {
    console.log(`[Nova Chat] Intent="${intent.intent}" confidence=${intent.confidence} message="${trimmed.slice(0, 80)}" (${client.name})`);
    if (!aiMode) {
      const fallback = intent.intent === "AVIS"
        ? "Je suis l'assistant CETIM. Je suis là pour vous informer sur nos services techniques. Comment puis-je vous aider ?"
        : intent.intent === "HORS_SUJET"
          ? "Je suis l'assistant technique du CETIM Algérie. Je suis spécialisé dans les essais, normes et services techniques. Puis-je vous aider avec un de ces sujets ?"
          : "Bonjour ! Je suis l'assistant CETIM. Comment puis-je vous aider ?";
      saveConversation(client, history || [], message, fallback, intent.intent.toLowerCase(), "", 0, geoPromise);
      return NextResponse.json(filterResponse({
        messageId,
        response: fallback,
        source: intent.intent.toLowerCase(),
        score: 0,
        suggestions: [],
      }, isVisitor), { headers: corsHeaders });
    }

    /* aiMode : laisser l'IA répondre avec le prompt adapté à l'intention */
    const keyEntry = await resolveApiKey(client);
    if (keyEntry?.key) {
      const providerId = client.aiProvider || detectProvider(keyEntry.key).id;
      const provider = PROVIDERS[providerId];
      if (provider) {
        const model = keyEntry.model || client.aiModel || "openai/gpt-oss-20b";
        const { system, user } = buildIntentPrompt(client, intent.intent, trimmed, pageUrl, pageTitle);
        try {
          const { text, usage } = await callAI(keyEntry.key, providerId, model, system, user, 0.30, history || [], 300);
          console.log(`[Nova Chat] AI ${intent.intent} response sent: "${text.slice(0, 80)}..."`);
          saveConversation(client, history || [], message, text, intent.intent.toLowerCase(), provider.label, 0, geoPromise);
          saveUsage(client.id, providerId, model, usage);
          await trackKeyUsage(keyEntry.id, usage.total_tokens || 0);
          return NextResponse.json(filterResponse({
            messageId,
            response: text,
            source: intent.intent.toLowerCase(),
            provider: provider.label,
            score: 0,
          }, isVisitor), { headers: corsHeaders });
        } catch (err: any) {
          console.error(`[Nova Chat] AI ${intent.intent} error:`, err?.message || err);
        }
      }
    }
    /* Fallback si l'appel AI échoue ou pas de clé */
    const fallbackText = intent.intent === "AVIS"
      ? "Merci pour votre retour ! Chez CETIM, nous proposons des services techniques de qualité. Que puis-je vous aider ?"
      : intent.intent === "HORS_SUJET"
        ? "Je suis l'assistant technique du CETIM Algérie. Je peux vous renseigner sur nos essais, normes et formations. En quoi puis-je vous être utile ?"
        : "Bonjour ! Je suis l'assistant CETIM. Comment puis-je vous aider avec nos services techniques ?";
    saveConversation(client, history || [], message, fallbackText, intent.intent.toLowerCase(), "", 0, geoPromise);
    return NextResponse.json(filterResponse({
      messageId,
      response: fallbackText,
      source: intent.intent.toLowerCase(),
      score: 0,
    }, isVisitor), { headers: corsHeaders });
  }

  const kbEntries = await db.prisma.kBEntry.findMany({ where: { clientId: client.id } });

  const KB = kbEntries.map((k: any) => ({
    tag: k.tag,
    question: k.question,
    alt_questions: k.alt_questions || "",
    answer: k.answer,
    category: k.category,
    keywords: k.keywords || "",
    priority: k.priority ?? 5,
    source: k.source || "",
    source_url: k.source_url || "",
    valid_until: k.valid_until || "",
  }));

  const { match, score, isKeyword } = findBestMatch(message, KB);
  const kbThreshold = isKeyword ? 50 : (client.kbThreshold ?? 80);
  const ragThreshold = client.ragThreshold ?? 40;

  /* ── Short query guard (only if no good KB match) ── */
  if ((words.length === 1 && words[0].length <= 4 || trimmed.length <= 3) && (!match || (score < Math.max(kbThreshold, 80) && !isKeyword))) {
    return NextResponse.json(filterResponse({
      messageId,
      response: "",
      source: "skip",
      score: 0,
      suggestions: [],
    }, isVisitor), { headers: corsHeaders });
  }



  /* ── RAG ONLY MODE : skip KB, go directly to RAG ── */
  if (ragOnly) {
    /* Toujours respecter les matchs exacts KB */
    if (match && score === 100) {
      saveConversation(client, history || [], message, match.answer, "kb", "", score, geoPromise);
      return NextResponse.json(filterResponse({
        messageId,
        response: match.answer,
        source: "kb",
        score,
        source_url: match.source_url || "",
        valid_until: match.valid_until || "",
        suggestions: findRelated(match, KB, 3),
      }, isVisitor), { headers: corsHeaders });
    }
    if (!aiMode) {
      return NextResponse.json(filterResponse({
        messageId,
        response: "Le mode RAG nécessite une clé API IA. Veuillez activer le mode IA ou désactiver le mode RAG.",
        source: "fallback",
        score: 0,
        suggestions: [],
      }, isVisitor), { headers: corsHeaders });
    }
    const keyEntry = await resolveApiKey(client);
    if (!keyEntry?.key) {
      return NextResponse.json(filterResponse({
        messageId,
        response: "Aucune clé API disponible pour le mode RAG. Veuillez configurer une clé API.",
        source: "fallback",
        score: 0,
        suggestions: [],
      }, isVisitor), { headers: corsHeaders });
    }
    const apiKey = keyEntry.key;
    const providerInfo = detectProvider(apiKey);
    const model = keyEntry?.model || client.aiModel || "openai/gpt-oss-20b";
    const siteChunks = parseChunks(client.siteContext || "");
    const now = new Date();
    const clientDocs = await db.prisma.clientDocument.findMany({
      where: {
        clientId: client.id,
        status: { not: "archived" },
        AND: [
          { OR: [{ valid_until: null }, { valid_until: { gte: now } }] },
          { OR: [{ valid_from: null }, { valid_from: { lte: now } }] },
        ],
      },
    });
    let topChunks: ChunkMeta[] = [];
    if (client.useVectorRag && client.chromaUrl && client.chromaApiKey && client.hfApiKey) {
      try {
        const embedding = await generateEmbedding(message, client.hfApiKey);
        const results = await vectorSearchChunks(client.id, embedding, client.topNChunks ?? 3, client.chromaUrl, client.chromaApiKey);
        topChunks = results.map((r) => r.chunk);
      } catch (err) {
        console.error("[Vector RAG] error, falling back to keyword:", err);
      }
    }
    if (topChunks.length === 0) {
      const docChunks = clientDocs.flatMap((d: any) => chunkDocument(d, client.chunkSize ?? 600));
      const allChunks = [...siteChunks, ...docChunks];
      topChunks = findBestChunks(message, allChunks, client.topNChunks ?? 3, ragThreshold);
    }
    if (topChunks.length > 0) {
      const { system, user } = buildRAGPrompt(client, topChunks, message, isVisitor, pageUrl, pageTitle);
      try {
        const { text, usage } = await callAI(apiKey, providerInfo.id, model, system, user, client.tempRAG ?? 0.10, history || []);
        saveConversation(client, history || [], message, text, "rag", providerInfo.label, 0, geoPromise);
        saveUsage(client.id, providerInfo.id, model, usage);
        await trackKeyUsage(keyEntry?.id || "", usage.total_tokens || 0);
        const docMeta = topChunks.filter(c => c.docId).map(c => ({
          docId: c.docId,
          name: c.source,
          version: c.version,
          source_url: c.source_url,
          valid_until: c.valid_until,
        })).filter((v, i, a) => a.findIndex(d => d.docId === v.docId) === i);
        return NextResponse.json(filterResponse({ messageId, response: text, source: "rag", provider: providerInfo.label, score: 0, chunks: topChunks.map(c => c.source), documents: docMeta }, isVisitor), { headers: corsHeaders });
      } catch (err: any) {
        console.error("[Nova Chat] RAG error:", err);
      }
    }
    /* Fallback KB si la RAG n'a rien trouvé */
    if (match && score >= kbThreshold) {
      saveConversation(client, history || [], message, match.answer, "kb", "", score, geoPromise);
      return NextResponse.json(filterResponse({
        messageId,
        response: match.answer,
        source: "kb",
        score,
        source_url: match.source_url || "",
        valid_until: match.valid_until || "",
        suggestions: findRelated(match, KB, 3),
      }, isVisitor), { headers: corsHeaders });
    }
    if (isKeyword && match?.answer && score >= 60 && score < kbThreshold) {
      saveConversation(client, history || [], message, match.answer, "kb", "", score, geoPromise);
      return NextResponse.json(filterResponse({
        messageId,
        response: match.answer,
        source: "kb",
        score,
        source_url: match.source_url || "",
        valid_until: match.valid_until || "",
        suggestions: findRelated(match, KB, 3),
      }, isVisitor), { headers: corsHeaders });
    }
    const { system: escSystem, user: escUser, contactInfo } = buildEscaladePrompt(client, message, sessionType, KB, pageUrl, pageTitle);
    try {
      const { text, usage } = await callAI(apiKey, providerInfo.id, model, escSystem, escUser, client.tempEscalade ?? 0.20, history || [], 800);
      saveConversation(client, history || [], message, text, "escalade", providerInfo.label, 0, geoPromise);
      saveUsage(client.id, providerInfo.id, model, usage);
      await trackKeyUsage(keyEntry?.id || "", usage.total_tokens || 0);
      return NextResponse.json({ messageId, response: text, source: "escalade", provider: providerInfo.label, score: 0 }, { headers: corsHeaders });
    } catch (err: any) {
      const fallbackResp = contactInfo
        ? `Je n'ai pas pu traiter votre demande pour le moment. 📋\n\n${contactInfo}`
        : "Je n'ai pas pu traiter votre demande pour le moment. Veuillez réessayer.";
      saveConversation(client, history || [], message, fallbackResp, "fallback", "", 0, geoPromise);
      return NextResponse.json({ messageId, response: fallbackResp, source: "fallback", score: 0 }, { headers: corsHeaders });
    }
  }

  let qaResponse: string | null = null;
  let qaProvider = "";

  /* ── NIVEAU 1 : QA VALIDÉE ── */
  if (match && score >= kbThreshold) {
    if (score === 100 || !aiMode) {
      saveConversation(client, history || [], message, match.answer, "kb", "", score, geoPromise);
      return NextResponse.json(filterResponse({
        messageId,
        response: match.answer,
        source: "kb",
        score,
        source_url: match.source_url || "",
        valid_until: match.valid_until || "",
        suggestions: findRelated(match, KB, 3),
      }, isVisitor), { headers: corsHeaders });
    }

    const { system, user } = buildQAPrompt(client, match, score, message, isVisitor, pageUrl, pageTitle);
    try {
      const keyEntry = await resolveApiKey(client);
      const apiKey = keyEntry?.key || "";
      const providerInfo = detectProvider(apiKey);
      const model = keyEntry?.model || client.aiModel || "openai/gpt-oss-20b";
      const { text, usage } = await callAI(apiKey, providerInfo.id, model, system, user, client.tempQA ?? 0.05, history || []);
      if (text.trim().toUpperCase() === "NO_MATCH") {
        console.warn(`[Nova Chat] KB mismatch N1: score=${score} tag=${match?.tag} msg="${message.slice(0, 80)}" (${client.name})`);
      } else {
        saveConversation(client, history || [], message, text, "qa", providerInfo.label, score, geoPromise);
        saveUsage(client.id, providerInfo.id, model, usage);
        await trackKeyUsage(keyEntry?.id || "", usage.total_tokens || 0);
        qaResponse = text;
        qaProvider = providerInfo.label;
      }
    } catch {
      qaResponse = match.answer;
      qaProvider = "";
      saveConversation(client, history || [], message, match.answer, "kb", "", score, geoPromise);
    }
  }

  /* ── NIVEAU 1b : MATCH MOT-CLÉ SOUS SEUIL → reformulation IA ── */
  if (aiMode && isKeyword && match?.answer && score >= 60 && score < kbThreshold) {
    const { system, user } = buildQAPrompt(client, match, score, message, isVisitor, pageUrl, pageTitle);
    try {
      const keyEntry = await resolveApiKey(client);
      const apiKey = keyEntry?.key || "";
      const providerInfo = detectProvider(apiKey);
      const model = keyEntry?.model || client.aiModel || "openai/gpt-oss-20b";
      const { text, usage } = await callAI(apiKey, providerInfo.id, model, system, user, client.tempQA ?? 0.05, history || []);
      if (text.trim().toUpperCase() === "NO_MATCH") {
        console.warn(`[Nova Chat] KB mismatch N1b: score=${score} tag=${match?.tag} msg="${message.slice(0, 80)}" (${client.name})`);
      } else {
        saveConversation(client, history || [], message, text, "qa", providerInfo.label, score, geoPromise);
        saveUsage(client.id, providerInfo.id, model, usage);
        await trackKeyUsage(keyEntry?.id || "", usage.total_tokens || 0);
        qaResponse = text;
        qaProvider = providerInfo.label;
      }
    } catch {
      qaResponse = match.answer;
      qaProvider = "";
      saveConversation(client, history || [], message, match.answer, "kb", "", score, geoPromise);
    }
  }

  /* ── PAS D'IA → fallback avec contacts KB ── */
  if (!aiMode) {
    const contactInfo = findContactEntry(KB);
    let resp: string;
    if (match?.answer && score >= kbThreshold) {
      resp = match.answer;
    } else if (contactInfo) {
      resp = `Je n'ai pas trouvé de réponse précise à votre question. 🎯\n\nN'hésitez pas à nous contacter directement, notre équipe se fera un plaisir de vous renseigner :\n\n${contactInfo}\n\n💬 **Vous pouvez aussi reformuler votre question**, je suis là pour vous aider !`;
    } else {
      resp = "Je n'ai pas trouvé de réponse dans ma base de connaissances. Contactez-nous pour plus d'informations.";
    }
    saveConversation(client, history || [], message, resp, match?.answer ? "kb" : "fallback", "", score, geoPromise);
    return NextResponse.json(filterResponse({
      messageId,
      response: resp,
      source: match?.answer ? "kb" : "fallback",
      score,
      source_url: match?.source_url || "",
      valid_until: match?.valid_until || "",
      suggestions: match ? findRelated(match, KB, 3) : [],
    }, isVisitor), { headers: corsHeaders });
  }

  const keyEntry = await resolveApiKey(client);
  const apiKey = keyEntry?.key || "";
  const providerInfo = detectProvider(apiKey);
  const model = keyEntry?.model || client.aiModel || "openai/gpt-oss-20b";

  let ragResponse: string | null = null;
  let ragProvider = "";
  let ragChunks: any[] = [];
  let ragDocMeta: any[] = [];

  /* ── NIVEAU 2 : RAG — recherche documentaire (sauf si réponse KB exacte) ── */
  const hasSiteContext = !!(client.siteContext?.trim());
  const hasAnyDoc = hasSiteContext || !!(await db.prisma.clientDocument.findFirst({ where: { clientId: client.id, status: { not: "archived" } }, select: { id: true } }));
  if (score < 100 && hasAnyDoc) {
    const siteChunks = parseChunks(client.siteContext || "");
    const now = new Date();
    const clientDocs = await db.prisma.clientDocument.findMany({
      where: {
        clientId: client.id,
        status: { not: "archived" },
        AND: [
          { OR: [{ valid_until: null }, { valid_until: { gte: now } }] },
          { OR: [{ valid_from: null }, { valid_from: { lte: now } }] },
        ],
      },
    });
    let topChunks: ChunkMeta[] = [];
    if (client.useVectorRag && client.chromaUrl && client.chromaApiKey && client.hfApiKey) {
      try {
        const embedding = await generateEmbedding(message, client.hfApiKey);
        const results = await vectorSearchChunks(client.id, embedding, client.topNChunks ?? 3, client.chromaUrl, client.chromaApiKey);
        topChunks = results.map((r) => r.chunk);
      } catch (err) {
        console.error("[Vector RAG] error, falling back to keyword:", err);
      }
    }
    if (topChunks.length === 0) {
      const docChunks = clientDocs.flatMap((d: any) => chunkDocument(d, client.chunkSize ?? 600));
      const allChunks = [...siteChunks, ...docChunks];
      topChunks = findBestChunks(message, allChunks, client.topNChunks ?? 3, ragThreshold);
    }

    if (topChunks.length > 0) {
      const { system, user } = buildRAGPrompt(client, topChunks, message, isVisitor, pageUrl, pageTitle);
      try {
        const { text, usage } = await callAI(apiKey, providerInfo.id, model, system, user, client.tempRAG ?? 0.10, history || []);
        saveConversation(client, history || [], message, text, "rag", providerInfo.label, score, geoPromise);
        saveUsage(client.id, providerInfo.id, model, usage);
        await trackKeyUsage(keyEntry?.id || "", usage.total_tokens || 0);
        const docMeta = topChunks.filter(c => c.docId).map(c => ({
          docId: c.docId,
          name: c.source,
          version: c.version,
          source_url: c.source_url,
          valid_until: c.valid_until,
        })).filter((v, i, a) => a.findIndex(d => d.docId === v.docId) === i);
        ragResponse = text;
        ragProvider = providerInfo.label;
        ragChunks = topChunks.map(c => c.source);
        ragDocMeta = docMeta;
      } catch (err: any) {
        console.error("[Nova Chat] RAG error:", err);
      }
    }
  }

  /* ── COMPARAISON QA vs RAG ── */
  if (qaResponse && ragResponse) {
    const heuristicWinner = compareWithHeuristic(qaResponse, ragResponse);
    if (heuristicWinner === "rag") {
      return NextResponse.json(filterResponse({ messageId, response: ragResponse, source: "rag", provider: ragProvider, score, chunks: ragChunks, documents: ragDocMeta }, isVisitor), { headers: corsHeaders });
    }
    if (heuristicWinner === "kb") {
      return NextResponse.json(filterResponse({ messageId, response: qaResponse, source: "qa", provider: qaProvider, score, source_url: match?.source_url || "", valid_until: match?.valid_until || "", suggestions: findRelated(match, KB, 3) }, isVisitor), { headers: corsHeaders });
    }
    try {
      const aiWinner = await compareWithAI(message, qaResponse, ragResponse, apiKey, providerInfo.id, model);
      if (aiWinner === "rag") {
        return NextResponse.json(filterResponse({ messageId, response: ragResponse, source: "rag", provider: ragProvider, score, chunks: ragChunks, documents: ragDocMeta }, isVisitor), { headers: corsHeaders });
      }
    } catch { /* fallback to QA */ }
    return NextResponse.json(filterResponse({ messageId, response: qaResponse, source: "qa", provider: qaProvider, score, source_url: match?.source_url || "", valid_until: match?.valid_until || "", suggestions: findRelated(match, KB, 3) }, isVisitor), { headers: corsHeaders });
  }

  if (qaResponse) {
    return NextResponse.json(filterResponse({ messageId, response: qaResponse, source: "qa", provider: qaProvider, score, source_url: match?.source_url || "", valid_until: match?.valid_until || "", suggestions: findRelated(match, KB, 3) }, isVisitor), { headers: corsHeaders });
  }

  if (ragResponse) {
    return NextResponse.json(filterResponse({ messageId, response: ragResponse, source: "rag", provider: ragProvider, score, chunks: ragChunks, documents: ragDocMeta }, isVisitor), { headers: corsHeaders });
  }

  /* ── NIVEAU 3 : ESCALADE ── */
  const kbMatch = match ? findRelated(match, KB, 3) : [];
  const { system, user, contactInfo } = buildEscaladePrompt(client, message, sessionType, KB, pageUrl, pageTitle);
  try {
    const { text, usage } = await callAI(apiKey, providerInfo.id, model, system, user, client.tempEscalade ?? 0.20, history || [], 800);
    console.warn(`[Nova Chat] ESCALADE — question non couverte: "${message.slice(0, 80)}..." (${client.name})`);
    saveConversation(client, history || [], message, text, "escalade", providerInfo.label, score, geoPromise);
    saveUsage(client.id, providerInfo.id, model, usage);
    await trackKeyUsage(keyEntry?.id || "", usage.total_tokens || 0);
    return NextResponse.json(filterResponse({ messageId, response: text, source: "escalade", provider: providerInfo.label, score, suggestions: kbMatch }, isVisitor), { headers: corsHeaders });
  } catch (err: any) {
    console.error("[Nova Chat] Escalade error:", err);
    const fallbackResp = contactInfo
      ? `Je n'ai pas pu traiter votre demande pour le moment. 📋\n\nN'hésitez pas à nous contacter directement, notre équipe se fera un plaisir de vous renseigner :\n\n${contactInfo}\n\n💬 **Vous pouvez aussi reformuler votre question**, je suis là pour vous aider !`
      : "Je n'ai pas pu traiter votre demande pour le moment. Veuillez réessayer ou contacter notre équipe.";
    saveConversation(client, history || [], message, fallbackResp, "fallback", "", score, geoPromise);
    return NextResponse.json(filterResponse({
      messageId,
      response: fallbackResp,
      source: "fallback",
      score,
      suggestions: kbMatch,
    }, isVisitor), { headers: corsHeaders });
  }
}
