import { NextRequest, NextResponse } from "next/server";
import { findClientBySlug } from "@/lib/auth";
import { db } from "@/lib/db";
import { randomUUID } from "crypto";
import { extractIP, lookupGeo } from "@/lib/geo";
import { norm, calcSimilarity, ChunkMeta, chunkDocument, parseChunks, findBestChunks, expandSearchQuery } from "@/lib/rag-utils";
import { extractKeywords } from "@/lib/chunk-utils";
import { detectProvider, selectApiKey, trackKeyUsage } from "@/lib/api-keys";
import { generateEmbedding } from "@/lib/embeddings";
import { searchChunks as pgSearchChunks } from "@/lib/vector-store";
import { compareWithHeuristic, compareWithAI } from "@/lib/response-comparator";
import { detectIntent, classifyIntentWithAI, type IntentResult } from "@/lib/intent-detector";
import { sseEvent } from "@/lib/stream-utils";
import { getActiveEmbeddingKey, trackEmbeddingUsage } from "@/lib/embedding-keys";
import { findRelevantDocs } from "@/lib/doc-manager";
import { captureEscalade } from "@/lib/knowledge-gap";

const PROVIDERS: Record<string, { endpoint: string; label: string }> = {
  groq: { endpoint: "https://api.groq.com/openai/v1/chat/completions", label: "Groq" },
  cerebras: { endpoint: "https://api.cerebras.ai/v1/chat/completions", label: "Cerebras" },
  xai: { endpoint: "https://api.x.ai/v1/chat/completions", label: "xAI Grok" },
  gemini: { endpoint: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", label: "Gemini" },
};

function providerLabel(id: string): string {
  return PROVIDERS[id]?.label || id;
}

/* Mots-clés trop génériques : un seul match ne doit PAS déclencher un QA/NIVEAU 1b
   (ex: "module", "thèmes", "quels" → faux positifs qui court-circuitent le RAG) */
const GENERIC_KEYWORDS = new Set([
  "module", "modules", "thème", "thèmes", "theme", "themes",
  "question", "questions", "cours", "formation", "formations",
  "programme", "programmes", "semestre", "semestres", "spécialité", "spécialités",
  "specialite", "specialites", "ia", "nlp", "master", "masters",
  "école", "ecole", "contenu", "sujet", "sujets", "introduction",
  "le", "la", "les", "de", "du", "des", "un", "une", "et", "ou", "est",
  "ce", "que", "qui", "dans", "en", "pour", "pas", "ne", "sur", "je",
  "tu", "il", "elle", "nous", "vous", "ils", "elles", "se", "son", "sa",
  "ses", "avec", "plus", "cette", "tout", "mais", "comme", "aussi",
  "peut", "faire", "dit", "a", "ai", "ont", "etre", "avoir", "mon",
  "ma", "mes", "leur", "leurs", "y", "ca", "comment", "pourquoi",
  "quand", "quel", "quelle", "quels", "quelles", "combien", "ou",
  "aux", "au", "par", "tout", "toute", "tous", "toutes", "moi", "toi",
  "lui", "eux", "elles", "en", "dans", "sur", "sous", "entre", "vers",
  "chez", "depuis", "jusqu", "via", "selon", "chaque", "son", "ses",
  "sont", "sera", "été", "être", "cette", "cet", "ces", "celui", "celle",
  "ceux", "celles", "autre", "autres", "même", "même", "peu", "bien",
  "très", "fort", "non", "oui", "merci", "bonjour", "salut", "bonsoir",
]);

function isGenericKeyword(kw: string): boolean {
  const k = kw.toLowerCase().trim();
  if (!k) return true;
  if (k.includes(" ")) return false; /* phrase multi-mots → distinctive */
  if (k.length < 4) return true;
  return GENERIC_KEYWORDS.has(k);
}

function isAiRefusal(text: string): boolean {
  let t = text.trim().toLowerCase();
  if (!t) return true;
  t = t
    .split("\n")
    .filter((line) => !/^\[source\s*:/.test(line.trim()))
    .join("\n")
    .trim();
  if (!t || t === "no_match") return true;
  if (t.startsWith("no_match")) return true;
  if (/diff[ée]rente? de la r[ée]ponse officielle/.test(t)) return true;
  if (/ne (correspond|concorde) pas (à|avec) (la|ta) question/.test(t)) return true;
  if (/ne r[ée]pond pas (à|a) (la|ta|votre) question/.test(t)) return true;
  if (/n'est pas (en|une) r[ée]ponse/.test(t)) return true;
  if (/je (ne )?(peux|puis|pourrais) pas r[ée]pondre/.test(t)) return true;
  if (/pas de r[ée]ponse (à|disponible)/.test(t)) return true;
  if (/hors du p[ée]rim[ée]tre|hors de mon domaine/.test(t)) return true;
  if (/question.*ne (correspond|concerne) pas/.test(t)) return true;
  return false;
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
          const generic = isGenericKeyword(kw);
          if (!generic) {
            const sk = 0.6;
            if (sk > bestScore || (sk === bestScore && e.priority > (best?.priority ?? 0))) { bestScore = sk; best = e; isKeyword = true; }
          }
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


/* ── INTENT OVERRIDE GUARD ─────────────────────────── */
/* Ne pas laisser une classification IA douteuse remplacer une intention
   métier détectée par regex quand le client a du contenu documentaire :
   la question sera tranchée par le RAG (qui retombe sur REQUETE_METIER). */
function shouldOverrideIntent(regexIntent: IntentResult, aiIntent: IntentResult, client: any): boolean {
  if (regexIntent.intent === aiIntent.intent) return false;
  if (regexIntent.intent === "REQUETE_METIER" && aiIntent.intent === "HORS_SUJET") return false;
  if (regexIntent.intent === "REQUETE_METIER" && aiIntent.confidence < regexIntent.confidence) return false;
  return true;
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

/* ── LANG HELPERS ────────────────────────────────────── */
const LANG_CMD: Record<string, string> = {
  fr: "Réponds toujours en français",
  en: "Always answer in English",
  ar: "أجب دائمًا بالعربية",
};
function langInstruction(lang: string): string {
  return LANG_CMD[lang] || LANG_CMD.fr;
}

const LANG_FALLBACK: Record<string, Record<string, string>> = {
  fr: {
    avis: "Je suis l'assistant de {name}. Je suis là pour vous informer sur nos services techniques. Comment puis-je vous aider ?",
    hors_sujet: "Je suis l'assistant technique de {name}. Je suis spécialisé dans les services techniques. Puis-je vous aider avec un de ces sujets ?",
    default: "Bonjour ! Je suis l'assistant de {name}. Comment puis-je vous aider ?",
    avis_ai: "Merci pour votre retour ! Chez {name}, nous proposons des services techniques de qualité. Que puis-je vous aider ?",
    hors_sujet_ai: "Je suis l'assistant technique de {name}. Je peux vous renseigner sur nos services techniques. En quoi puis-je vous être utile ?",
    default_ai: "Bonjour ! Je suis l'assistant de {name}. Comment puis-je vous aider avec nos services techniques ?",
    rag_no_ai: "Le mode RAG nécessite une clé API IA.",
    rag_no_key: "Aucune clé API disponible pour le mode RAG.",
    rag_no_ai_long: "Le mode RAG nécessite une clé API IA. Veuillez activer le mode IA ou désactiver le mode RAG.",
    rag_no_key_long: "Aucune clé API disponible pour le mode RAG. Veuillez configurer une clé API.",
    no_match_contact: "Je n'ai pas trouvé de réponse précise à votre question. 🎯\n\nN'hésitez pas à nous contacter directement :\n\n{contact}\n\n💬 **Vous pouvez aussi reformuler votre question**, je suis là pour vous aider !",
    no_match: "Je n'ai pas trouvé de réponse dans ma base de connaissances. Contactez-nous pour plus d'informations.",
    escalade_fail: "Je n'ai pas pu traiter votre demande pour le moment. Veuillez réessayer ou contacter notre équipe.",
    escalade_fail_strict: "Je n'ai pas pu traiter votre demande pour le moment. Veuillez réessayer.",
    internal_error: "Une erreur interne s'est produite. Veuillez réessayer.",
    escalade_fail_contact: "Je n'ai pas pu traiter votre demande pour le moment. 📋\n\n{contact}",
    no_match_fallback_contact: "Je n'ai pas trouvé de réponse précise à votre question. 🎯\n\nN'hésitez pas à nous contacter directement, notre équipe se fera un plaisir de vous renseigner :\n\n{contact}\n\n💬 **Vous pouvez aussi reformuler votre question**, je suis là pour vous aider !",
  },
  en: {
    avis: "I am the assistant of {name}. I am here to inform you about our technical services. How can I help you?",
    hors_sujet: "I am the technical assistant of {name}. I specialize in technical services. Can I help you with one of these topics?",
    default: "Hello! I am the assistant of {name}. How can I help you?",
    avis_ai: "Thank you for your feedback! At {name}, we offer quality technical services. How can I help you?",
    hors_sujet_ai: "I am the technical assistant of {name}. I can help you with our technical services. How can I assist you?",
    default_ai: "Hello! I am the assistant of {name}. How can I help you with our technical services?",
    rag_no_ai: "RAG mode requires an AI API key.",
    rag_no_key: "No API key available for RAG mode.",
    rag_no_ai_long: "RAG mode requires an AI API key. Please enable AI mode or disable RAG mode.",
    rag_no_key_long: "No API key available for RAG mode. Please configure an API key.",
    no_match_contact: "I couldn't find an exact answer to your question. 🎯\n\nFeel free to contact us directly:\n\n{contact}\n\n💬 **You can also rephrase your question**, I am here to help!",
    no_match: "I couldn't find an answer in my knowledge base. Please contact us for more information.",
    escalade_fail: "I couldn't process your request at the moment. Please try again or contact our team.",
    escalade_fail_strict: "I couldn't process your request at the moment. Please try again.",
    internal_error: "An internal error occurred. Please try again.",
    escalade_fail_contact: "I couldn't process your request at the moment. 📋\n\n{contact}",
    no_match_fallback_contact: "I couldn't find an exact answer to your question. 🎯\n\nFeel free to contact us directly, our team will be happy to help:\n\n{contact}\n\n💬 **You can also rephrase your question**, I am here to help!",
  },
  ar: {
    avis: "أنا مساعد {name}. أنا هنا لإعلامك بخدماتنا الفنية. كيف يمكنني مساعدتك؟",
    hors_sujet: "أنا المساعد الفني لـ {name}. أنا متخصص في الخدمات الفنية. هل يمكنني مساعدتك في أحد هذه المواضيع؟",
    default: "مرحبًا! أنا مساعد {name}. كيف يمكنني مساعدتك؟",
    avis_ai: "شكرًا لملاحظاتك! في {name}، نقدم خدمات فنية عالية الجودة. كيف يمكنني مساعدتك؟",
    hors_sujet_ai: "أنا المساعد الفني لـ {name}. يمكنني إعلامك بخدماتنا الفنية. كيف يمكنني مساعدتك؟",
    default_ai: "مرحبًا! أنا مساعد {name}. كيف يمكنني مساعدتك بخدماتنا الفنية؟",
    rag_no_ai: "وضع RAG يتطلب مفتاح API للذكاء الاصطناعي.",
    rag_no_key: "لا يوجد مفتاح API متاح لوضع RAG.",
    rag_no_ai_long: "وضع RAG يتطلب مفتاح API للذكاء الاصطناعي. يرجى تفعيل وضع الذكاء الاصطناعي أو تعطيل وضع RAG.",
    rag_no_key_long: "لا يوجد مفتاح API متاح لوضع RAG. يرجى تكوين مفتاح API.",
    no_match_contact: "لم أتمكن من العثور على إجابة دقيقة لسؤالك. 🎯\n\nلا تتردد في الاتصال بنا مباشرة:\n\n{contact}\n\n💬 **يمكنك أيضًا إعادة صياغة سؤالك**، أنا هنا للمساعدة!",
    no_match: "لم أتمكن من العثور على إجابة في قاعدة المعرفة الخاصة بي. يرجى الاتصال بنا لمزيد من المعلومات.",
    escalade_fail: "لم أتمكن من معالجة طلبك في الوقت الحالي. يرجى المحاولة مرة أخرى أو الاتصال بفريقنا.",
    escalade_fail_strict: "لم أتمكن من معالجة طلبك في الوقت الحالي. يرجى المحاولة مرة أخرى.",
    internal_error: "حدث خطأ داخلي. يرجى المحاولة مرة أخرى.",
    escalade_fail_contact: "لم أتمكن من معالجة طلبك في الوقت الحالي. 📋\n\n{contact}",
    no_match_fallback_contact: "لم أتمكن من العثور على إجابة دقيقة لسؤالك. 🎯\n\nلا تتردد في الاتصال بنا مباشرة، سيسعد فريقنا بمساعدتك:\n\n{contact}\n\n💬 **يمكنك أيضًا إعادة صياغة سؤالك**، أنا هنا للمساعدة!",
  },
};
function t(lang: string, key: string, name: string, contact?: string): string {
  const text = LANG_FALLBACK[lang]?.[key] || LANG_FALLBACK.fr[key];
  return text.replace(/\{name\}/g, name).replace(/\{contact\}/g, contact || "");
}

/* ── PROMPT BUILDERS ──────────────────────────────────── */
function buildQAPrompt(client: any, match: any, score: number, question: string, isVisitor: boolean, pageUrl?: string, pageTitle?: string, lang: string = "fr") {
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
- ${langInstruction(lang)}, professionnel et concis
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

function buildRAGPrompt(client: any, chunks: ChunkMeta[], question: string, isVisitor: boolean, pageUrl?: string, pageTitle?: string, lang: string = "fr", theme: string = "") {
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
  const themeLine = theme ? `\n- Thème identifié de la question : ${theme}` : "";

  const system = `Tu es l'assistant officiel de ${client.name}.
Tu réponds en te basant UNIQUEMENT sur les extraits de documentation ci-dessous.${buildContext(client, pageUrl, pageTitle)}${themeLine}

RÈGLES ABSOLUES :
- Ne réponds qu'à partir des extraits fournis
- Si les extraits ne répondent que partiellement, réponds avec les informations disponibles
- En cas de contradiction entre extraits, privilégie le plus récent ou le plus spécifique
- Les extraits sont classés par pertinence : l'extrait #1 est le plus important
- CITE TES SOURCES : après chaque phrase fondée sur l'extrait #N, ajoute immédiatement la référence [N] (exemple : « Le module a lieu au semestre S4. [3] »). Cite plusieurs extraits si besoin : [2][5]
${noMatchRule}
- N'invente JAMAIS d'information
- ${langInstruction(lang)}, professionnel et concis
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

/* Construit la liste des citations [n] → { titre, extrait, url } pour le widget.
   L'index n correspond à la position de l'extrait dans le prompt ([Extrait #N]). */
function buildCitations(chunks: ChunkMeta[], isVisitor: boolean): { n: number; title: string; excerpt: string; url: string }[] {
  return chunks.map((c, i) => ({
    n: i + 1,
    title: c.section ? `${c.source} — ${c.section}` : c.source,
    excerpt: c.content.length > 200 ? c.content.slice(0, 200) + "…" : c.content,
    url: !isVisitor || c.source_url?.toLowerCase().endsWith(".pdf") ? (c.source_url || "") : "",
  }));
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

function findKbContext(question: string, KB: any[], maxEntries = 4): { question: string; answer: string; score: number }[] {
  const scored = KB.map((e) => {
    const sQ = calcSimilarity(question, e.question);
    let sA = 0;
    if (e.alt_questions) {
      for (const a of e.alt_questions.split(/[,|]+\s*/).map((s: string) => s.trim())) {
        if (!a) continue;
        sA = Math.max(sA, calcSimilarity(question, a));
      }
    }
    const sK = (e.keywords || "").split(",").some((kw: string) => {
      const nkw = norm(kw);
      return nkw && new RegExp("\\b" + nkw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b", "i").test(norm(question));
    }) ? 0.55 : 0;
    return { e, score: Math.max(sQ, sA, sK) };
  });
  return scored
    .filter((s) => s.score >= 0.3)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxEntries)
    .map((s) => ({
      question: s.e.question,
      answer: (s.e.answer || "").slice(0, 600),
      score: s.score,
    }));
}

function buildEscaladePrompt(client: any, question: string, sessionType: string, KB: any[], pageUrl?: string, pageTitle?: string, lang: string = "fr") {
  const contactInfo = findContactEntry(KB);
  const kbCtx = findKbContext(question, KB);
  const kbSection = kbCtx.length > 0
    ? `\n\nRESSOURCES DISPONIBLES DANS LA BASE DE CONNAISSANCES (questions proches de celle du client) :\n${kbCtx.map((k, i) => `[${i + 1}] ${k.question}\n${k.answer}`).join("\n\n")}\n\nIMPORTANT : Si l'une de ces ressources répond à la QUESTION DU CLIENT, réponds en t'appuyant sur elle (ne redirige pas vers le contact). Sinon, utilise le format d'escalade ci-dessus.`
    : "";

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
- Utilise les INFORMATIONS DE CONTACT réelles ci-dessous — ne tronque JAMAIS les adresses email, téléphones ou coordonnées, recopie-les intégralement
- Suggère 2-3 questions pertinentes en lien avec la QUESTION DU CLIENT
- N'invente JAMAIS d'information technique
- ${langInstruction(lang)}, ton professionnel et accessible
- Ne te présente PAS comme "conseiller commercial"`;

  const user = `NIVEAU : ESCALADE — AUCUN CONTEXTE PERTINENT

PROFIL : ${sessionType}

INFORMATIONS DE CONTACT :
${contactInfo || "Aucune coordonnée spécifique disponible."}${kbSection}

QUESTION DU CLIENT :
${question}

Consigne : Inspire-toi de l'exemple ci-dessus. Utilise les INFORMATIONS DE CONTACT réelles. Suggère 2-3 questions en lien avec la QUESTION DU CLIENT. Termine par une invitation ouverte.`;

  return { system, user, contactInfo };
}

function buildIntentPrompt(client: any, intent: string, message: string, pageUrl?: string, pageTitle?: string, lang: string = "fr") {
  const ctx = buildContext(client, pageUrl, pageTitle);
  const rules = intent === "SMALL_TALK"
    ? `- L'utilisateur te salue ou fait du small talk
- Réponds avec le même ton (salut → salut, salam → salam aleykoum, bonjour → bonjour)
- Oriente-le ensuite vers les services de ${client.name}`
    : intent === "AVIS"
      ? `- L'utilisateur exprime son avis sur ${client.name} ou le chatbot
- Accueille son retour avec bienveillance
- Présente les points forts de ${client.name}
- Invite-le à découvrir les services qui pourraient l'intéresser`
      : `- L'utilisateur pose une question hors sujet
- Réponds poliment que ce domaine n'est pas celui de ${client.name}
- Redirige vers les sujets de ${client.name}`;

  const system = `Tu es l'assistant officiel de ${client.name}.${ctx}

RÈGLES :
${rules}
- ${langInstruction(lang)}, chaleureux et professionnel
- Termine par une question ouverte sur les besoins du client`;

  return { system, user: message };
}

/* ── KB TRANSLATION ────────────────────────────────── */
async function translateKbAnswer(text: string, lang: string, client: any): Promise<string> {
  if (lang === "fr" || !text) return text;
  try {
    const keyEntry = await resolveApiKey(client);
    if (!keyEntry?.key) return text;
    const target = lang === "en" ? "English" : "Arabic";
    const providerInfo = detectProvider(keyEntry.key);
    const model = keyEntry.model || client.aiModel || "openai/gpt-oss-20b";
    const { text: translated } = await callAI(keyEntry.key, providerInfo.id, model,
      `Translate the following text to ${target}. Keep all formatting (markdown, emojis, lists, line breaks, bold, tables) exactly as-is. Respond ONLY with the translation, no preamble.`,
      text, 0.05, [], 1500);
    return translated || text;
  } catch { return text; }
}

/* ── CARTE KB + POSITIONNEMENT / REFORMULATION ─────── */
function buildKbMap(KB: { tag: string; question: string; alt_questions: string; answer: string; category: string; keywords: string; priority: number }[]): string {
  try {
    const byCat = new Map<string, { count: number; questions: string[] }>();
    for (const e of KB) {
      const cat = (e.category || "Général").trim() || "Général";
      if (!byCat.has(cat)) byCat.set(cat, { count: 0, questions: [] });
      const entry = byCat.get(cat)!;
      entry.count++;
      const q = (e.question || "").trim().slice(0, 90);
      if (q && entry.questions.length < 5 && !entry.questions.includes(q)) entry.questions.push(q);
    }
    const lines = [...byCat.entries()]
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10)
      .map(([cat, info]) =>
        `- ${cat} (${info.count} entrées)${info.questions.length ? ` : ${info.questions.join(" | ")}` : ""}`
      );
    return lines.join("\n");
  } catch {
    return "";
  }
}

async function positionAndReformulate(
  question: string,
  KB: { tag: string; question: string; alt_questions: string; answer: string; category: string; keywords: string; priority: number }[],
  apiKey: string,
  providerId: string,
  model: string,
): Promise<{ theme: string; query: string }> {
  const fallback = { theme: "", query: question };
  const kbMap = buildKbMap(KB);
  if (!kbMap || kbMap.length < 10) return fallback;
  try {
    const resp = await fetch(PROVIDERS[providerId]?.endpoint || "https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content: `Voici la vue d'ensemble de la base de connaissances d'un assistant client (thèmes → exemples de questions) :\n${kbMap}\n\nTâche : positionne la question du client dans le bon thème puis reformule-la en une requête de recherche concise (max 15 mots), en gardant les termes techniques, sigles et noms propres.\nRéponds UNIQUEMENT en JSON au format : {"theme": "<nom exact du thème ou chaîne vide>", "query": "<requête de recherche>"}`,
          },
          { role: "user", content: question },
        ],
        temperature: 0,
        max_tokens: 400,
      }),
    });
    if (!resp.ok) return fallback;
    const data = await resp.json();
    const raw = (data.choices?.[0]?.message?.content || "").trim();
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return fallback;
    const parsed = JSON.parse(jsonMatch[0]);
    const theme = typeof parsed.theme === "string" ? parsed.theme.trim().slice(0, 80) : "";
    const query = typeof parsed.query === "string" ? parsed.query.trim() : "";
    if (!query || query.length < 3 || query.length > 150) return fallback;
    /* Garde-fou anti-hallucination : si la reformulation perd les mots-clés significatifs
       de la question originale (ex: "multi-agents", "systems"), on la rejette pour éviter
       que la recherche vectorielle rate le chunk pertinent. On garde le thème, mais la
       requête de recherche reste la question brute. */
    const qKeywords = extractKeywords(question, 6).filter((k) => k.length > 3);
    const qNorm = norm(query);
    if (qKeywords.length > 0) {
      const kept = qKeywords.filter((k) => qNorm.includes(k));
      if (kept.length / qKeywords.length < 0.6) {
        console.log(`[Query Reformulation] rejetée (mots-clés perdus ${kept.length}/${qKeywords.length}): "${query.slice(0, 60)}" ← question brute`);
        return { theme, query: question };
      }
    }
    return { theme, query };
  } catch {
    return fallback;
  }
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

async function callAIStream(apiKey: string, providerId: string, model: string, system: string, user: string, temperature: number, history: any[], max_tokens: number = 600): Promise<ReadableStream<Uint8Array>> {
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
      stream: true,
    }),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`AI Stream ${resp.status}: ${err.slice(0, 300)}`);
  }

  if (!resp.body) throw new Error("No response body for stream");

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();

  return new ReadableStream({
    async start(controller) {
      let buffer = "";
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const payload = line.slice(6).trim();
            if (payload === "[DONE]") continue;
            try {
              const parsed = JSON.parse(payload);
              const token = parsed.choices?.[0]?.delta?.content;
              if (token) {
                controller.enqueue(sseEvent("token", { content: token }));
              }
            } catch { /* malformed chunk, skip */ }
          }
        }
      } catch (err) {
        console.error("[Nova Chat] Stream read error:", err);
      } finally {
        reader.releaseLock();
        controller.close();
      }
    },
  });
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
async function saveConversation(client: any, history: any[], userMsg: string, aiMsg: string, source: string, provider: string, score: number, geoPromise?: Promise<{ ip: string; country: string; city: string }>, trace?: any[]) {
  try {
    const geo = geoPromise ? await geoPromise : { ip: "", country: "", city: "" };
    const msgId = randomUUID();
    const allMsgs = [...(history || []), { role: "user", content: userMsg }, { role: "assistant", content: aiMsg, source, provider, score, trace: trace || undefined }];
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
  const { source_url, valid_until, chunks, documents, ...rest } = data;
  return rest;
}

async function enrichWithDocLinks(clientId: string, question: string, response: string): Promise<{ response: string; docLinks: { id: string; title: string; url: string }[] }> {
  try {
    const words = question.split(/\s+/).filter((w: string) => w.length > 3);
    const keywords = words.slice(0, 5);
    if (keywords.length === 0) return { response, docLinks: [] };

    const docs = await findRelevantDocs(clientId, keywords);
    if (docs.length === 0) return { response, docLinks: [] };

    const docLinks = docs.map((d) => ({
      id: d.id,
      title: d.title,
      url: `/api/docs/${d.id}/download`,
    }));

    const linksText = "\n\n" + docs.map((d) => `- [${d.title}](/api/docs/${d.id}/download)`).join("\n");
    return { response: response + linksText, docLinks };
  } catch {
    return { response, docLinks: [] };
  }
}

export async function OPTIONS() {
  return NextResponse.json(null, { headers: corsHeaders });
}

/* Récupère tous les documents textuels d'un client (uploads + web-import + import local)
   normalisés pour le chunking. Couvre les deux tables ClientDocument et ClientLocalDoc. */
async function getAllClientDocs(clientId: string): Promise<any[]> {
  const now = new Date();
  const [cdocs, ldocs] = await Promise.all([
    db.prisma.clientDocument.findMany({
      where: {
        clientId,
        status: { not: "archived" },
        AND: [{ OR: [{ valid_until: null }, { valid_until: { gte: now } }] }, { OR: [{ valid_from: null }, { valid_from: { lte: now } }] }],
      },
    }),
    db.prisma.clientLocalDoc.findMany({
      where: { clientId, status: "active" },
    }),
  ]);
  return [
    ...cdocs.map((d: any) => ({
      id: d.id,
      content: d.content || "",
      originalName: d.originalName,
      source_url: d.source_url || "",
      valid_until: d.valid_until,
      version: d.version ?? 1,
    })),
    ...ldocs.map((d: any) => ({
      id: d.id,
      content: d.content || "",
      originalName: d.fileName || d.originalName || "document",
      source_url: d.sourceUrl || "",
      valid_until: null,
      version: 1,
    })),
  ].filter((d) => (d.content || "").trim().length > 0);
}

async function hasAnyClientDoc(clientId: string): Promise<boolean> {
  const now = new Date();
  const [c, l] = await Promise.all([
    db.prisma.clientDocument.count({ where: { clientId, status: { not: "archived" } } }),
    db.prisma.clientLocalDoc.count({ where: { clientId, status: "active" } }),
  ]);
  return c > 0 || l > 0;
}

/* ── STREAMING HANDLER ──────────────────────────────── */
async function handleStreamingRequest(
  req: NextRequest,
  client: any,
  body: { message: string; history: any[]; aiMode: boolean; ragOnly: boolean; sessionType: string; pageUrl?: string; pageTitle?: string; isVisitor: boolean; lang?: string },
): Promise<Response> {
  const { message, history, aiMode, ragOnly, sessionType = "client", pageUrl, pageTitle, isVisitor, lang = "fr" } = body;
  const messageId = randomUUID();
  const trimmed = message.trim();
  const words = trimmed.split(/\s+/).filter(Boolean);
  const ip = extractIP(req);
  const geoPromise = lookupGeo(ip);
  const t0 = Date.now();
  const trace: any[] = [];
  function addStep(step: string, data?: any) {
    trace.push({ step, ms: Date.now() - t0, ...(data || {}) });
  }

  const sseHeaders = {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-cache",
    "Connection": "keep-alive",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  /* ── Helper: consume an AI stream and buffer the full text ── */
  async function consumeAIStream(aiStream: ReadableStream<Uint8Array>): Promise<string> {
    const reader = aiStream.getReader();
    const decoder = new TextDecoder();
    let fullText = "";
    let evType = "message";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const decoded = decoder.decode(value, { stream: true });
      for (const line of decoded.split("\n")) {
        if (line.startsWith("event: ")) { evType = line.slice(7).trim(); continue; }
        if (line.startsWith("data: ")) {
          const payload = line.slice(6).trim();
          if (evType === "token") {
            try {
              const parsed = JSON.parse(payload);
              if (parsed.content) fullText += parsed.content;
            } catch { /* skip */ }
          }
          evType = "message";
        }
      }
    }
    return fullText;
  }

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => controller.enqueue(sseEvent(event, data));
      let closed = false;
      function finish() { if (!closed) { closed = true; send("done", { messageId }); controller.close(); } }

      try {
        /* ── NIVEAU 0 : Détection d'intention ── */
        let intent = detectIntent(trimmed);
        addStep("intent_regex", { intent: intent.intent, confidence: intent.confidence });

        if (aiMode) {
          const keyEntry = await resolveApiKey(client);
          if (keyEntry?.key) {
            const provInfo = detectProvider(keyEntry.key);
            const provider = PROVIDERS[provInfo.id];
            if (provider) {
              try {
                const aiModel = keyEntry.model || client.aiModel || "openai/gpt-oss-20b";
                const aiIntent = await classifyIntentWithAI(trimmed, keyEntry.key, provider.endpoint, aiModel, client.name);
                if (aiIntent.intent !== intent.intent && shouldOverrideIntent(intent, aiIntent, client)) { intent = aiIntent; addStep("intent_ai_override", { intent: intent.intent, confidence: intent.confidence }); }
              } catch { /* keep regex intent */ }
            }
          }
        }

        /* Chercher dans la KB d'abord, quelque soit l'intention */
        const kbEntries = await db.prisma.kBEntry.findMany({ where: { clientId: client.id } });
        const KB = kbEntries.map((k: any) => ({
          tag: k.tag, question: k.question, alt_questions: k.alt_questions || "", answer: k.answer,
          category: k.category, keywords: k.keywords || "", priority: k.priority ?? 5,
          source: k.source || "", source_url: k.source_url || "", valid_until: k.valid_until || "",
        }));

        const { match, score, isKeyword } = findBestMatch(message, KB);
        const kbThreshold = isKeyword ? (client.keywordThreshold ?? 50) : (client.kbThreshold ?? 80);
        addStep("kb_match", { score, isKeyword, kbThreshold, matchedQuestion: match?.question || null, kbSize: KB.length });

  const ragThreshold = client.ragThreshold ?? 72;
        /* Short query guard */
        if ((words.length === 1 && words[0].length <= 4 || trimmed.length <= 3) && (!match || (score < Math.max(kbThreshold, 80) && !isKeyword))) {
          send("metadata", { messageId, source: "skip", score: 0 });
          finish();
          return;
        }

        /* Si pas de bon match KB et l'intention n'est pas métier → fallback intention */
        const hasGoodKbMatch = match && score >= kbThreshold;
        if (!hasGoodKbMatch && intent.intent !== "REQUETE_METIER") {
          if (!aiMode) {
            const intentKey = intent.intent === "AVIS" ? "avis" : intent.intent === "HORS_SUJET" ? "hors_sujet" : "default";
            const fallback = t(lang, intentKey, client.name);
            send("metadata", { messageId, source: intent.intent.toLowerCase(), score: 0 });
            send("token", { content: fallback });
            saveConversation(client, history || [], message, fallback, intent.intent.toLowerCase(), "", 0, geoPromise, trace);
            finish();
            return;
          }
          /* aiMode : laisser l'IA répondre avec le prompt adapté à l'intention */
          const keyEntry = await resolveApiKey(client);
          if (keyEntry?.key) {
            const providerId = detectProvider(keyEntry.key).id;
            const provider = PROVIDERS[providerId];
            if (provider) {
              const model = keyEntry.model || client.aiModel || "openai/gpt-oss-20b";
              const { system, user } = buildIntentPrompt(client, intent.intent, trimmed, pageUrl, pageTitle, lang);
              try {
                const aiStream = await callAIStream(keyEntry.key, providerId, model, system, user, 0.30, history || [], 600);
                const text = await consumeAIStream(aiStream);
                send("metadata", { messageId, source: intent.intent.toLowerCase(), provider: provider.label, score: 0 });
                send("token", { content: text });
                saveConversation(client, history || [], message, text, intent.intent.toLowerCase(), provider.label, 0, geoPromise, trace);
                saveUsage(client.id, providerId, model, { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 });
                finish();
                return;
              } catch { /* fallback below */ }
            }
          }
          const intentKey = intent.intent === "AVIS" ? "avis_ai" : intent.intent === "HORS_SUJET" ? "hors_sujet_ai" : "default_ai";
          const fallbackText = t(lang, intentKey, client.name);
          send("metadata", { messageId, source: intent.intent.toLowerCase(), score: 0 });
          send("token", { content: fallbackText });
          saveConversation(client, history || [], message, fallbackText, intent.intent.toLowerCase(), "", 0, geoPromise, trace);
          finish();
          return;
        }

        /* ── Helper: stream a buffered AI response to client ── */
        async function streamAIResponse(system: string, userMsg: string, temperature: number, source: string, maxTokens?: number, strictNoMatch = false, metaExtra?: any): Promise<string | null> {
          const keyEntry = await resolveApiKey(client);
          if (!keyEntry?.key) return null;
          const apiKey = keyEntry.key;
          const providerInfo = detectProvider(apiKey);
          const provObj = PROVIDERS[providerInfo.id];
          if (!provObj) return null;
          const model = keyEntry.model || client.aiModel || "openai/gpt-oss-20b";
          try {
            const aiStream = await callAIStream(apiKey, providerInfo.id, model, system, userMsg, temperature, history || [], maxTokens);
            const text = await consumeAIStream(aiStream);
            if (strictNoMatch ? isAiRefusal(text) : (!text || text.trim().toUpperCase() === "NO_MATCH")) return null;
            const { response: enrichedText, docLinks } = await enrichWithDocLinks(client.id, message, text);
            send("metadata", { messageId, source, provider: provObj.label, score, docLinks, ...(metaExtra || {}) });
            send("token", { content: enrichedText });
            addStep("ai_response", { source, provider: provObj.label, model, chars: enrichedText.length });
            saveConversation(client, history || [], message, enrichedText, source, provObj.label, score, geoPromise, trace);
            saveUsage(client.id, providerInfo.id, model, { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 });
            return enrichedText;
          } catch { return null; }
        }

        /* ── Helper: send a direct (non-AI) response ── */
        function sendDirect(response: string, source: string, extra?: any) {
          send("metadata", { messageId, source, score, ...extra });
          send("token", { content: response });
          addStep("direct_response", { source, score, extra });
          saveConversation(client, history || [], message, response, source, "", score, geoPromise, trace);
          enrichWithDocLinks(client.id, message, response).catch(() => {});
        }

        /* ── RAG ONLY MODE ── */
        if (ragOnly) {
          if (match && score === 100) {
            const extra: any = {};
            if (!isVisitor) { extra.source_url = match.source_url || ""; extra.valid_until = match.valid_until || ""; }
            extra.suggestions = findRelated(match, KB, 3);
            sendDirect(match.answer, "kb", extra);
            finish();
            return;
          }
          if (!aiMode) { sendDirect(t(lang, "rag_no_ai", client.name), "fallback"); finish(); return; }
          const keyEntry = await resolveApiKey(client);
          if (!keyEntry?.key) { sendDirect(t(lang, "rag_no_key", client.name), "fallback"); finish(); return; }

          const apiKey = keyEntry.key;
          const providerInfo = detectProvider(apiKey);
          const model = keyEntry?.model || client.aiModel || "openai/gpt-oss-20b";
          const positionedRagOnly = await positionAndReformulate(message, KB, apiKey, providerInfo.id, model);
          const ragOnlyQuery = expandSearchQuery(positionedRagOnly.query);
          const siteChunks = parseChunks(client.siteContext || "");
          const clientDocs = await getAllClientDocs(client.id);
          let topChunks: ChunkMeta[] = [];
          const embedKeyEntry = client.useVectorRag ? await getActiveEmbeddingKey(client.id) : null;
          const embedApiKey = embedKeyEntry?.key || client.hfApiKey;
          if (client.useVectorRag && embedApiKey) {
            try { const embedding = await generateEmbedding(ragOnlyQuery, embedApiKey, embedKeyEntry?.provider || client.embeddingProvider); const results = await pgSearchChunks(client.id, embedding, client.topNChunks ?? 7, client.embeddingProvider, undefined, ragOnlyQuery); topChunks = results.map((r) => r.chunk); console.log("[Nova Chat] rag-only vector search:", topChunks.length, "chunks"); } catch (err) { console.error("[Nova Chat] rag-only vector search error:", err); }
            if (embedKeyEntry?.id) trackEmbeddingUsage(embedKeyEntry.id).catch(() => {});
          }
          if (topChunks.length === 0) {
            const docChunks = clientDocs.flatMap((d: any) => chunkDocument(d, client.chunkSize ?? 600));
            topChunks = findBestChunks(ragOnlyQuery, [...siteChunks, ...docChunks], client.topNChunks ?? 7, ragThreshold);
          }
          addStep("rag_only_search", { chunks: topChunks.length, useVector: client.useVectorRag && !!embedApiKey, theme: positionedRagOnly.theme || null });
          if (topChunks.length > 0) {
            const { system, user } = buildRAGPrompt(client, topChunks, message, isVisitor, pageUrl, pageTitle, lang, positionedRagOnly.theme);
            const result = await streamAIResponse(system, user, client.tempRAG ?? 0.10, "rag", undefined, false, { citations: buildCitations(topChunks, isVisitor) });
            if (result) { finish(); return; }
          }
          if (match && score >= kbThreshold) { sendDirect(match.answer, "kb"); finish(); return; }
          if (isKeyword && match?.answer && score >= 60 && score < kbThreshold) { sendDirect(match.answer, "kb"); finish(); return; }
          const { system: escSystem, user: escUser } = buildEscaladePrompt(client, message, sessionType, KB, pageUrl, pageTitle, lang);
          const escResult = await streamAIResponse(escSystem, escUser, client.tempEscalade ?? 0.20, "escalade", 800);
          if (escResult) {
            captureEscalade({ clientId: client.id, question: message, escalationMsg: escResult, context: pageUrl || "" }).catch(console.error);
            finish(); return;
          }
          sendDirect(t(lang, "escalade_fail_strict", client.name), "fallback");
          finish();
          return;
        }

        /* ── NORMAL MODE ── */

        /* Réponse KB brute conservée comme fallback si la QA IA retourne NO_MATCH */
        let kbFallback: string | null = null;

        /* NIVEAU 1 : QA VALIDÉE */
        if (match && score >= kbThreshold) {
          if ((score === 100 && lang === "fr") || !aiMode) {
            const extra: any = {};
            if (!isVisitor) { extra.source_url = match.source_url || ""; extra.valid_until = match.valid_until || ""; }
            const answer = !aiMode && lang !== "fr" ? await translateKbAnswer(match.answer, lang, client) : match.answer;
            extra.suggestions = findRelated(match, KB, 3);
            sendDirect(answer, "kb", extra);
            finish();
            return;
          }
          const { system, user } = buildQAPrompt(client, match, score, message, isVisitor, pageUrl, pageTitle, lang);
          const qaResult = await streamAIResponse(system, user, client.tempQA ?? 0.05, "qa", undefined, true);
          if (qaResult) { finish(); return; }
          /* AI returned NO_MATCH or failed → conserver la réponse brute et tenter RAG */
          kbFallback = match.answer;
        }

        /* NIVEAU 1b : MATCH MOT-CLÉ SOUS SEUIL */
        if (aiMode && isKeyword && match?.answer && score >= 60 && score < kbThreshold) {
          const { system, user } = buildQAPrompt(client, match, score, message, isVisitor, pageUrl, pageTitle, lang);
          const qaResult = await streamAIResponse(system, user, client.tempQA ?? 0.05, "qa", undefined, true);
          if (qaResult) { finish(); return; }
          kbFallback = match.answer;
        }

        /* PAS D'IA */
        if (!aiMode) {
          const contactInfo = findContactEntry(KB);
          let resp: string;
          if (match?.answer && score >= kbThreshold) { resp = match.answer; }
          else if (contactInfo) { resp = t(lang, "no_match_contact", client.name, contactInfo); }
          else { resp = t(lang, "no_match", client.name); }
          sendDirect(resp, match?.answer ? "kb" : "fallback");
          finish();
          return;
        }

        /* NIVEAU 2 : RAG */
        const hasSiteContext = !!(client.siteContext?.trim());
        const hasClientDoc = await hasAnyClientDoc(client.id);
        const hasAnyDoc = hasSiteContext || hasClientDoc || client.useVectorRag;
        if (score < 100 && hasAnyDoc) {
          const siteChunks = parseChunks(client.siteContext || "");
          const clientDocs = await getAllClientDocs(client.id);

          /* Positionnement + reformulation de la requête pour meilleur matching */
          const ragKeyEntry = await resolveApiKey(client);
          const ragProviderInfo = detectProvider(ragKeyEntry?.key || "");
          const ragModel = ragKeyEntry?.model || client.aiModel || "openai/gpt-oss-20b";
          const positioned = ragKeyEntry?.key ? await positionAndReformulate(message, KB, ragKeyEntry.key, ragProviderInfo.id, ragModel) : { theme: "", query: message };
          const searchQuery = expandSearchQuery(positioned.query);
          if (searchQuery !== message) {
            console.log(`[Query Reformulation] "${message.slice(0, 60)}" → "${searchQuery.slice(0, 60)}" (${client.name})`);
          }

          let topChunks: ChunkMeta[] = [];
          const activeKey = client.useVectorRag ? await getActiveEmbeddingKey(client.id) : null;
          const apiKey = activeKey?.key || client.hfApiKey;

          /* Recherche vectorielle (si activée) */
          const vectorResults: ChunkMeta[] = [];
          if (client.useVectorRag && apiKey) {
            try { const embedding = await generateEmbedding(searchQuery, apiKey, activeKey?.provider || client.embeddingProvider); const results = await pgSearchChunks(client.id, embedding, client.topNChunks ?? 7, client.embeddingProvider, undefined, searchQuery); vectorResults.push(...results.map((r) => r.chunk)); console.log("[Nova Chat] vector search results:", vectorResults.length, "chunks for client", client.id); } catch (err) { console.error("[Nova Chat] vector search error:", err); }
            if (activeKey?.id) trackEmbeddingUsage(activeKey.id).catch(() => {});
          }

          /* Recherche keyword (toujours, sur site + documents, avec requête reformulée) */
          const docChunks = clientDocs.flatMap((d: any) => chunkDocument(d, client.chunkSize ?? 600));
          const allChunks = [...siteChunks, ...docChunks];
          const keywordResults = findBestChunks(searchQuery, allChunks, client.topNChunks ?? 7, ragThreshold);

          /* Fusion : priorité vectorielle, puis keyword pour combler */
          const seen = new Set<string>();
          const merged: ChunkMeta[] = [];
          for (const c of vectorResults) {
            const key = c.content.slice(0, 120);
            if (!seen.has(key)) { seen.add(key); merged.push(c); }
          }
          for (const c of keywordResults) {
            if (merged.length >= (client.topNChunks ?? 7)) break;
            const key = c.content.slice(0, 120);
            if (!seen.has(key)) { seen.add(key); merged.push(c); }
          }
          topChunks = merged;
          addStep("rag_search", { chunks: topChunks.length, vector: vectorResults.length, keyword: keywordResults.length, useVector: client.useVectorRag && !!apiKey });
          if (topChunks.length > 0) {
            const { system, user } = buildRAGPrompt(client, topChunks, message, isVisitor, pageUrl, pageTitle, lang, positioned.theme);
            const result = await streamAIResponse(system, user, client.tempRAG ?? 0.10, "rag", undefined, false, { citations: buildCitations(topChunks, isVisitor) });
            if (result) { finish(); return; }
          }
          /* RAG n'a rien donné → si une réponse KB brute était disponible, la renvoyer */
          if (kbFallback) { sendDirect(kbFallback, "kb"); finish(); return; }
        } else if (kbFallback) {
          /* Pas de document disponible → renvoyer la réponse KB brute */
          sendDirect(kbFallback, "kb");
          finish();
          return;
        }

        /* NIVEAU 3 : ESCALADE */
        const { system: escSystem, user: escUser } = buildEscaladePrompt(client, message, sessionType, KB, pageUrl, pageTitle, lang);
        const escResult = await streamAIResponse(escSystem, escUser, client.tempEscalade ?? 0.20, "escalade", 800);
        if (escResult) {
          captureEscalade({ clientId: client.id, question: message, escalationMsg: escResult, context: pageUrl || "" }).catch(console.error);
          finish(); return;
        }
        sendDirect(t(lang, "escalade_fail", client.name), "fallback");
        finish();
      } catch (err) {
        console.error("[Nova Chat] Streaming error:", err);
        send("token", { content: t(lang, "internal_error", client.name) });
        finish();
      }
    },
  });

  return new Response(stream, { headers: sseHeaders });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const client = await findClientBySlug(slug);
  if (!client) {
    return NextResponse.json({ error: "Client introuvable" }, { status: 404, headers: corsHeaders });
  }

  const { message, history, aiMode, ragOnly, sessionType = "client", pageUrl, pageTitle, isVisitor = false, stream: enableStream = false, lang = "fr" } = await req.json();
  if (!message || typeof message !== "string") {
    return NextResponse.json({ error: "Message requis" }, { status: 400, headers: corsHeaders });
  }

  if (enableStream) {
    return handleStreamingRequest(req, client, { message, history, aiMode, ragOnly, sessionType, pageUrl, pageTitle, isVisitor, lang });
  }

  const messageId = randomUUID();
  const trimmed = message.trim();
  const words = trimmed.split(/\s+/).filter(Boolean);

  const ip = extractIP(req);
  const geoPromise = lookupGeo(ip);
  const t0 = Date.now();
  const trace: any[] = [];
  function addStep(step: string, data?: any) {
    trace.push({ step, ms: Date.now() - t0, ...(data || {}) });
  }

  /* ── NIVEAU 0 : Détection d'intention ── */
  let intent = detectIntent(trimmed);
  addStep("intent_regex", { intent: intent.intent, confidence: intent.confidence });

  /* Passe 2 : Classification IA (corrige faux positifs/faux négatifs des regex) */
  if (aiMode) {
    const keyEntry = await resolveApiKey(client);
    if (keyEntry?.key) {
      const provInfo = detectProvider(keyEntry.key);
      const provider = PROVIDERS[provInfo.id];
      if (provider) {
        try {
          const aiModel = keyEntry.model || client.aiModel || "openai/gpt-oss-20b";
          const aiIntent = await classifyIntentWithAI(trimmed, keyEntry.key, provider.endpoint, aiModel, client.name);
          if (aiIntent.intent !== intent.intent && shouldOverrideIntent(intent, aiIntent, client)) {
            console.log(`[Nova Chat] Intent override: regex=${intent.intent} → ai=${aiIntent.intent} message="${trimmed.slice(0, 80)}" (${client.name})`);
            intent = aiIntent;
          }
        } catch (err) {
          console.error("[Nova Chat] AI Intent error:", err);
        }
      }
    }
  }

  /* Chercher dans la KB d'abord, quelque soit l'intention */
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
  const kbThreshold = isKeyword ? (client.keywordThreshold ?? 50) : (client.kbThreshold ?? 80);
  const ragThreshold = client.ragThreshold ?? 72;
  addStep("kb_match", { score, isKeyword, kbThreshold, matchedQuestion: match?.question || null, kbSize: KB.length });

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

  /* Si pas de bon match KB et l'intention n'est pas métier → fallback intention */
  const hasGoodKbMatch = match && score >= kbThreshold;
  if (!hasGoodKbMatch && intent.intent !== "REQUETE_METIER") {
    console.log(`[Nova Chat] Intent="${intent.intent}" confidence=${intent.confidence} message="${trimmed.slice(0, 80)}" (${client.name})`);
    if (!aiMode) {
      const intentKey = intent.intent === "AVIS" ? "avis" : intent.intent === "HORS_SUJET" ? "hors_sujet" : "default";
      const fallback = t(lang, intentKey, client.name);
      saveConversation(client, history || [], message, fallback, intent.intent.toLowerCase(), "", 0, geoPromise, trace);
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
      const providerId = detectProvider(keyEntry.key).id;
      const provider = PROVIDERS[providerId];
      if (provider) {
        const model = keyEntry.model || client.aiModel || "openai/gpt-oss-20b";
        const { system, user } = buildIntentPrompt(client, intent.intent, trimmed, pageUrl, pageTitle, lang);
        try {
          const { text, usage } = await callAI(keyEntry.key, providerId, model, system, user, 0.30, history || [], 600);
          console.log(`[Nova Chat] AI ${intent.intent} response sent: "${text.slice(0, 80)}..."`);
          saveConversation(client, history || [], message, text, intent.intent.toLowerCase(), provider.label, 0, geoPromise, trace);
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
    const intentKey = intent.intent === "AVIS" ? "avis_ai" : intent.intent === "HORS_SUJET" ? "hors_sujet_ai" : "default_ai";
    const fallbackText = t(lang, intentKey, client.name);
    saveConversation(client, history || [], message, fallbackText, intent.intent.toLowerCase(), "", 0, geoPromise, trace);
    return NextResponse.json(filterResponse({
      messageId,
      response: fallbackText,
      source: intent.intent.toLowerCase(),
      score: 0,
    }, isVisitor), { headers: corsHeaders });
  }

  /* ── RAG ONLY MODE : skip KB, go directly to RAG ── */
  if (ragOnly) {
    /* Toujours respecter les matchs exacts KB */
    if (match && score === 100) {
      saveConversation(client, history || [], message, match.answer, "kb", "", score, geoPromise, trace);
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
        response: t(lang, "rag_no_ai_long", client.name),
        source: "fallback",
        score: 0,
        suggestions: [],
      }, isVisitor), { headers: corsHeaders });
    }
    const keyEntry = await resolveApiKey(client);
    if (!keyEntry?.key) {
      return NextResponse.json(filterResponse({
        messageId,
        response: t(lang, "rag_no_key_long", client.name),
        source: "fallback",
        score: 0,
        suggestions: [],
      }, isVisitor), { headers: corsHeaders });
    }
    const apiKey = keyEntry.key;
    const providerInfo = detectProvider(apiKey);
    const model = keyEntry?.model || client.aiModel || "openai/gpt-oss-20b";
    const positionedRagOnly = await positionAndReformulate(message, KB, apiKey, providerInfo.id, model);
    const ragOnlyQuery = expandSearchQuery(positionedRagOnly.query);
    const siteChunks = parseChunks(client.siteContext || "");
    const clientDocs = await getAllClientDocs(client.id);
    let topChunks: ChunkMeta[] = [];
    const embedKeyEntry = client.useVectorRag ? await getActiveEmbeddingKey(client.id) : null;
    const embedApiKey = embedKeyEntry?.key || client.hfApiKey;
    if (client.useVectorRag && embedApiKey) {
      try {
        const embedding = await generateEmbedding(ragOnlyQuery, embedApiKey, embedKeyEntry?.provider || client.embeddingProvider);
        const results = await pgSearchChunks(client.id, embedding, client.topNChunks ?? 7, client.embeddingProvider, undefined, ragOnlyQuery);
        topChunks = results.map((r) => r.chunk);
      } catch (err) {
        console.error("[Vector RAG] error, falling back to keyword:", err);
      }
      if (embedKeyEntry?.id) trackEmbeddingUsage(embedKeyEntry.id).catch(() => {});
    }
    if (topChunks.length === 0) {
      const docChunks = clientDocs.flatMap((d: any) => chunkDocument(d, client.chunkSize ?? 600));
      const allChunks = [...siteChunks, ...docChunks];
      topChunks = findBestChunks(ragOnlyQuery, allChunks, client.topNChunks ?? 7, ragThreshold);
    }
    if (topChunks.length > 0) {
      const { system, user } = buildRAGPrompt(client, topChunks, message, isVisitor, pageUrl, pageTitle, lang, positionedRagOnly.theme);
      try {
        const { text, usage } = await callAI(apiKey, providerInfo.id, model, system, user, client.tempRAG ?? 0.10, history || []);
        saveConversation(client, history || [], message, text, "rag", providerInfo.label, 0, geoPromise, trace);
        saveUsage(client.id, providerInfo.id, model, usage);
        await trackKeyUsage(keyEntry?.id || "", usage.total_tokens || 0);
        const docMeta = topChunks.filter(c => c.docId).map(c => ({
          docId: c.docId,
          name: c.source,
          version: c.version,
          source_url: c.source_url,
          valid_until: c.valid_until,
        })).filter((v, i, a) => a.findIndex(d => d.docId === v.docId) === i);
        return NextResponse.json(filterResponse({ messageId, response: text, source: "rag", provider: providerInfo.label, score: 0, chunks: topChunks.map(c => c.source), documents: docMeta, citations: buildCitations(topChunks, isVisitor) }, isVisitor), { headers: corsHeaders });
      } catch (err: any) {
        console.error("[Nova Chat] RAG error:", err);
      }
    }
    /* Fallback KB si la RAG n'a rien trouvé */
    if (match && score >= kbThreshold) {
      saveConversation(client, history || [], message, match.answer, "kb", "", score, geoPromise, trace);
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
      saveConversation(client, history || [], message, match.answer, "kb", "", score, geoPromise, trace);
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
    const { system: escSystem, user: escUser, contactInfo } = buildEscaladePrompt(client, message, sessionType, KB, pageUrl, pageTitle, lang);
    try {
      const { text, usage } = await callAI(apiKey, providerInfo.id, model, escSystem, escUser, client.tempEscalade ?? 0.20, history || [], 800);
      saveConversation(client, history || [], message, text, "escalade", providerInfo.label, 0, geoPromise, trace);
      saveUsage(client.id, providerInfo.id, model, usage);
      await trackKeyUsage(keyEntry?.id || "", usage.total_tokens || 0);
      return NextResponse.json({ messageId, response: text, source: "escalade", provider: providerInfo.label, score: 0 }, { headers: corsHeaders });
    } catch (err: any) {
      const fallbackResp = contactInfo
        ? t(lang, "escalade_fail_contact", client.name, contactInfo)
        : t(lang, "escalade_fail", client.name);
      saveConversation(client, history || [], message, fallbackResp, "fallback", "", 0, geoPromise, trace);
      return NextResponse.json({ messageId, response: fallbackResp, source: "fallback", score: 0 }, { headers: corsHeaders });
    }
  }

  let qaResponse: string | null = null;
  let qaProvider = "";

  /* ── NIVEAU 1 : QA VALIDÉE ── */
  if (match && score >= kbThreshold) {
    if ((score === 100 && lang === "fr") || !aiMode) {
      const answer = !aiMode && lang !== "fr" ? await translateKbAnswer(match.answer, lang, client) : match.answer;
      saveConversation(client, history || [], message, answer, "kb", "", score, geoPromise, trace);
      return NextResponse.json(filterResponse({
        messageId,
        response: answer,
        source: "kb",
        score,
        source_url: match.source_url || "",
        valid_until: match.valid_until || "",
        suggestions: findRelated(match, KB, 3),
      }, isVisitor), { headers: corsHeaders });
    }

    const { system, user } = buildQAPrompt(client, match, score, message, isVisitor, pageUrl, pageTitle, lang);
    try {
      const keyEntry = await resolveApiKey(client);
      const apiKey = keyEntry?.key || "";
      const providerInfo = detectProvider(apiKey);
      const model = keyEntry?.model || client.aiModel || "openai/gpt-oss-20b";
      const { text, usage } = await callAI(apiKey, providerInfo.id, model, system, user, client.tempQA ?? 0.05, history || []);
      if (isAiRefusal(text)) {
        console.warn(`[Nova Chat] KB mismatch N1: score=${score} tag=${match?.tag} msg="${message.slice(0, 80)}" (${client.name})`);
        qaResponse = match.answer;
        qaProvider = "";
        saveConversation(client, history || [], message, match.answer, "kb", "", score, geoPromise, trace);
      } else {
        saveConversation(client, history || [], message, text, "qa", providerInfo.label, score, geoPromise, trace);
        saveUsage(client.id, providerInfo.id, model, usage);
        await trackKeyUsage(keyEntry?.id || "", usage.total_tokens || 0);
        qaResponse = text;
        qaProvider = providerInfo.label;
      }
    } catch {
      qaResponse = match.answer;
      qaProvider = "";
      saveConversation(client, history || [], message, match.answer, "kb", "", score, geoPromise, trace);
    }
  }

  /* ── NIVEAU 1b : MATCH MOT-CLÉ SOUS SEUIL → reformulation IA ── */
  if (aiMode && isKeyword && match?.answer && score >= 60 && score < kbThreshold) {
    const { system, user } = buildQAPrompt(client, match, score, message, isVisitor, pageUrl, pageTitle, lang);
    try {
      const keyEntry = await resolveApiKey(client);
      const apiKey = keyEntry?.key || "";
      const providerInfo = detectProvider(apiKey);
      const model = keyEntry?.model || client.aiModel || "openai/gpt-oss-20b";
      const { text, usage } = await callAI(apiKey, providerInfo.id, model, system, user, client.tempQA ?? 0.05, history || []);
      if (isAiRefusal(text)) {
        console.warn(`[Nova Chat] KB mismatch N1b: score=${score} tag=${match?.tag} msg="${message.slice(0, 80)}" (${client.name})`);
        qaResponse = match.answer;
        qaProvider = "";
        saveConversation(client, history || [], message, match.answer, "kb", "", score, geoPromise, trace);
      } else {
        saveConversation(client, history || [], message, text, "qa", providerInfo.label, score, geoPromise, trace);
        saveUsage(client.id, providerInfo.id, model, usage);
        await trackKeyUsage(keyEntry?.id || "", usage.total_tokens || 0);
        qaResponse = text;
        qaProvider = providerInfo.label;
      }
    } catch {
      qaResponse = match.answer;
      qaProvider = "";
      saveConversation(client, history || [], message, match.answer, "kb", "", score, geoPromise, trace);
    }
  }

  /* ── PAS D'IA → fallback avec contacts KB ── */
  if (!aiMode) {
    const contactInfo = findContactEntry(KB);
    let resp: string;
    if (match?.answer && score >= kbThreshold) {
      resp = match.answer;
    } else if (contactInfo) {
      resp = t(lang, "no_match_fallback_contact", client.name, contactInfo);
    } else {
      resp = t(lang, "no_match", client.name);
    }
    saveConversation(client, history || [], message, resp, match?.answer ? "kb" : "fallback", "", score, geoPromise, trace);
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
  let ragCitations: any[] = [];

  /* ── NIVEAU 2 : RAG — recherche documentaire (sauf si réponse KB exacte) ── */
  const hasSiteContext = !!(client.siteContext?.trim());
  const hasClientDoc = await hasAnyClientDoc(client.id);
  const hasAnyDoc = hasSiteContext || hasClientDoc || client.useVectorRag;
  if (score < 100 && hasAnyDoc) {
    const siteChunks = parseChunks(client.siteContext || "");
    const clientDocs = await getAllClientDocs(client.id);
    let topChunks: ChunkMeta[] = [];

    /* Positionnement + reformulation de la requête pour meilleur matching */
    const positioned = await positionAndReformulate(message, KB, apiKey, providerInfo.id, model);
    const searchQuery = expandSearchQuery(positioned.query);
    if (searchQuery !== message) {
      console.log(`[Query Reformulation] "${message.slice(0, 60)}" → "${searchQuery.slice(0, 60)}" (${client.name})`);
    }

    const activeKey = client.useVectorRag ? await getActiveEmbeddingKey(client.id) : null;
    const embedApiKey = activeKey?.key || client.hfApiKey;

    /* Recherche vectorielle (si activée) */
    const vectorResults: ChunkMeta[] = [];
    if (client.useVectorRag && embedApiKey) {
      try {
        const embedding = await generateEmbedding(searchQuery, embedApiKey, activeKey?.provider || client.embeddingProvider);
        const results = await pgSearchChunks(client.id, embedding, client.topNChunks ?? 7, client.embeddingProvider, undefined, searchQuery);
        vectorResults.push(...results.map((r) => r.chunk));
      } catch (err) {
        console.error("[Vector RAG] error:", err);
      }
      if (activeKey?.id) trackEmbeddingUsage(activeKey.id).catch(() => {});
    }

    /* Recherche keyword (toujours, sur site + documents, avec requête reformulée) */
    const docChunks = clientDocs.flatMap((d: any) => chunkDocument(d, client.chunkSize ?? 600));
    const allChunks = [...siteChunks, ...docChunks];
    const keywordResults = findBestChunks(searchQuery, allChunks, client.topNChunks ?? 7, ragThreshold);

    /* Fusion : priorité vectorielle, puis keyword pour combler */
    const seen = new Set<string>();
    const merged: ChunkMeta[] = [];
    for (const c of vectorResults) {
      const key = c.content.slice(0, 120);
      if (!seen.has(key)) { seen.add(key); merged.push(c); }
    }
    for (const c of keywordResults) {
      if (merged.length >= (client.topNChunks ?? 7)) break;
      const key = c.content.slice(0, 120);
      if (!seen.has(key)) { seen.add(key); merged.push(c); }
    }
    topChunks = merged;
    if (client.useVectorRag && vectorResults.length === 0) {
      console.warn(`[Vector RAG] 0 chunks → hybrid keyword only for "${message.slice(0, 80)}" (${client.name})`);
    }
    addStep("rag_search", { chunks: topChunks.length, vector: vectorResults.length, keyword: keywordResults.length, useVector: client.useVectorRag && !!embedApiKey });

    if (topChunks.length > 0) {
      const { system, user } = buildRAGPrompt(client, topChunks, message, isVisitor, pageUrl, pageTitle, lang, positioned.theme);
      try {
        const { text, usage } = await callAI(apiKey, providerInfo.id, model, system, user, client.tempRAG ?? 0.10, history || []);
        saveConversation(client, history || [], message, text, "rag", providerInfo.label, score, geoPromise, trace);
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
        ragCitations = buildCitations(topChunks, isVisitor);
      } catch (err: any) {
        console.error("[Nova Chat] RAG error:", err);
      }
    }
  }

  /* ── COMPARAISON QA vs RAG ── */
  if (qaResponse && ragResponse) {
    const heuristicWinner = compareWithHeuristic(qaResponse, ragResponse);
    if (heuristicWinner === "rag") {
      const { response: enrichedRag, docLinks } = await enrichWithDocLinks(client.id, message, ragResponse);
      return NextResponse.json(filterResponse({ messageId, response: enrichedRag, source: "rag", provider: ragProvider, score, chunks: ragChunks, documents: ragDocMeta, citations: ragCitations, docLinks }, isVisitor), { headers: corsHeaders });
    }
    if (heuristicWinner === "kb") {
      const { response: enrichedQa, docLinks } = await enrichWithDocLinks(client.id, message, qaResponse);
      return NextResponse.json(filterResponse({ messageId, response: enrichedQa, source: "qa", provider: qaProvider, score, source_url: match?.source_url || "", valid_until: match?.valid_until || "", suggestions: findRelated(match, KB, 3), docLinks }, isVisitor), { headers: corsHeaders });
    }
    try {
      const aiWinner = await compareWithAI(message, qaResponse, ragResponse, apiKey, providerInfo.id, model);
      if (aiWinner === "rag") {
        const { response: enrichedRag, docLinks } = await enrichWithDocLinks(client.id, message, ragResponse);
        return NextResponse.json(filterResponse({ messageId, response: enrichedRag, source: "rag", provider: ragProvider, score, chunks: ragChunks, documents: ragDocMeta, citations: ragCitations, docLinks }, isVisitor), { headers: corsHeaders });
      }
    } catch { /* fallback to QA */ }
    const { response: enrichedQa, docLinks } = await enrichWithDocLinks(client.id, message, qaResponse);
    return NextResponse.json(filterResponse({ messageId, response: enrichedQa, source: "qa", provider: qaProvider, score, source_url: match?.source_url || "", valid_until: match?.valid_until || "", suggestions: findRelated(match, KB, 3), docLinks }, isVisitor), { headers: corsHeaders });
  }

  if (qaResponse) {
    const { response: enrichedQa, docLinks } = await enrichWithDocLinks(client.id, message, qaResponse);
    return NextResponse.json(filterResponse({ messageId, response: enrichedQa, source: "qa", provider: qaProvider, score, source_url: match?.source_url || "", valid_until: match?.valid_until || "", suggestions: findRelated(match, KB, 3), docLinks }, isVisitor), { headers: corsHeaders });
  }

  if (ragResponse) {
    const { response: enrichedRag, docLinks } = await enrichWithDocLinks(client.id, message, ragResponse);
    return NextResponse.json(filterResponse({ messageId, response: enrichedRag, source: "rag", provider: ragProvider, score, chunks: ragChunks, documents: ragDocMeta, citations: ragCitations, docLinks }, isVisitor), { headers: corsHeaders });
  }

  /* ── NIVEAU 3 : ESCALADE ── */
  const kbMatch = match ? findRelated(match, KB, 3) : [];
  const { system, user, contactInfo } = buildEscaladePrompt(client, message, sessionType, KB, pageUrl, pageTitle, lang);
  addStep("escalade", { contactInfo: !!contactInfo });
  try {
    const { text, usage } = await callAI(apiKey, providerInfo.id, model, system, user, client.tempEscalade ?? 0.20, history || [], 800);
    console.warn(`[Nova Chat] ESCALADE — question non couverte: "${message.slice(0, 80)}..." (${client.name})`);
    captureEscalade({ clientId: client.id, question: message, escalationMsg: text, context: pageUrl || "" }).catch(console.error);
    const { response: enrichedEsc, docLinks } = await enrichWithDocLinks(client.id, message, text);
    saveConversation(client, history || [], message, enrichedEsc, "escalade", providerInfo.label, score, geoPromise, trace);
    saveUsage(client.id, providerInfo.id, model, usage);
    await trackKeyUsage(keyEntry?.id || "", usage.total_tokens || 0);
    return NextResponse.json(filterResponse({ messageId, response: enrichedEsc, source: "escalade", provider: providerInfo.label, score, suggestions: kbMatch, docLinks }, isVisitor), { headers: corsHeaders });
  } catch (err: any) {
    console.error("[Nova Chat] Escalade error:", err);
    const fallbackResp = contactInfo
      ? t(lang, "no_match_fallback_contact", client.name, contactInfo)
      : t(lang, "escalade_fail", client.name);
    saveConversation(client, history || [], message, fallbackResp, "fallback", "", score, geoPromise, trace);
    return NextResponse.json(filterResponse({
      messageId,
      response: fallbackResp,
      source: "fallback",
      score,
      suggestions: kbMatch,
    }, isVisitor), { headers: corsHeaders });
  }
}
