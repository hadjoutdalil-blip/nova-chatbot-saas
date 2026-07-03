import { SMALL_TALK_PATTERNS, HORS_SUJET_PATTERNS, AVIS_PATTERNS, HORS_SUJET_RESPONSE } from "./intent-messages";

export type Intent = "SMALL_TALK" | "HORS_SUJET" | "AVIS" | "REQUETE_METIER";

export interface IntentResult {
  intent: Intent;
  confidence: number;
}

function regexPass(message: string, patterns: { regex: RegExp }[]): boolean {
  return patterns.some((p) => p.regex.test(message.trim()));
}

export function detectIntent(userMessage: string): IntentResult {
  const msg = userMessage.trim();
  if (!msg) {
    return { intent: "SMALL_TALK", confidence: 1.0 };
  }

  /* Passe 1 : règles déterministes */
  if (regexPass(msg, SMALL_TALK_PATTERNS)) {
    return { intent: "SMALL_TALK", confidence: 1.0 };
  }

  if (regexPass(msg, HORS_SUJET_PATTERNS)) {
    return { intent: "HORS_SUJET", confidence: 0.9 };
  }

  if (regexPass(msg, AVIS_PATTERNS)) {
    return { intent: "AVIS", confidence: 0.9 };
  }

  return { intent: "REQUETE_METIER", confidence: 1.0 };
}

const CLASSIFICATION_SYSTEM =
  "Tu es un classifieur d'intention. Réponds UNIQUEMENT par un seul mot : SALUTATION, HORS_SUJET, AVIS, ou METIER.\n\n" +
  "SALUTATION = salutations, remerciements, au revoir, small talk, comment ça va, qui es-tu\n" +
  "HORS_SUJET = questions sans rapport avec les activités techniques, normes, essais, laboratoires\n" +
  "AVIS = expression d'opinion sur CETIM, ses services, le chatbot (j'aime, je n'aime pas, c'est bien/nul)\n" +
  "METIER = tout ce qui concerne le CETIM, ses services techniques, essais, normes, certifications, formations, laboratoires, inspection, métrologie, géotechnique, organisation, direction, contact, informations générales";

export async function classifyIntentWithAI(
  message: string,
  apiKey: string,
  endpoint: string,
  model: string
): Promise<IntentResult> {
  const resp = await fetch(endpoint, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: CLASSIFICATION_SYSTEM },
        { role: "user", content: `Message: "${message}"\n\nClassification :` },
      ],
      temperature: 0,
      max_tokens: 10,
    }),
  });

  if (!resp.ok) throw new Error(`Classification AI ${resp.status}`);
  const data = await resp.json();
  const text = (data.choices?.[0]?.message?.content || "").trim().toUpperCase().replace(/[^A-Z_]/g, "");

  if (text === "SALUTATION") return { intent: "SMALL_TALK", confidence: 0.8 };
  if (text === "HORS_SUJET") return { intent: "HORS_SUJET", confidence: 0.8 };
  if (text === "AVIS") return { intent: "AVIS", confidence: 0.8 };
  return { intent: "REQUETE_METIER", confidence: 0.7 };
}
