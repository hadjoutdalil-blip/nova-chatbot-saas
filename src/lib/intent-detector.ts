import { SMALL_TALK_PATTERNS, HORS_SUJET_PATTERNS, SMALL_TALK_RESPONSES, HORS_SUJET_RESPONSE } from "./intent-messages";

export type Intent = "SMALL_TALK" | "HORS_SUJET" | "REQUETE_METIER";

export interface IntentResult {
  intent: Intent;
  confidence: number;
  response?: string;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function regexPass(message: string, patterns: { regex: RegExp }[]): boolean {
  return patterns.some((p) => p.regex.test(message.trim()));
}

export function detectIntent(userMessage: string): IntentResult {
  const msg = userMessage.trim();
  if (!msg) {
    return { intent: "SMALL_TALK", confidence: 1.0, response: pickRandom(SMALL_TALK_RESPONSES) };
  }

  /* Passe 1 : règles déterministes */
  if (regexPass(msg, SMALL_TALK_PATTERNS)) {
    return { intent: "SMALL_TALK", confidence: 1.0, response: pickRandom(SMALL_TALK_RESPONSES) };
  }

  if (regexPass(msg, HORS_SUJET_PATTERNS)) {
    return { intent: "HORS_SUJET", confidence: 0.9, response: HORS_SUJET_RESPONSE };
  }

  /* Passe 2 : classification par LLM léger — uniquement si aiMode et clé API disponible */
  return { intent: "REQUETE_METIER", confidence: 1.0 };
}

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
        {
          role: "system",
          content:
            "Tu es un classifieur d'intention. Réponds UNIQUEMENT par un seul mot : SALUTATION, HORS_SUJET, ou METIER.\n\n" +
            "SALUTATION = salutations, remerciements, au revoir, small talk, comment ça va, qui es-tu\n" +
            "HORS_SUJET = questions sans rapport avec les activités techniques, normes, essais, laboratoires\n" +
            "METIER = tout ce qui concerne les services techniques, essais, normes, certifications, formations",
        },
        {
          role: "user",
          content: `Message: "${message}"\n\nClassification :`,
        },
      ],
      temperature: 0,
      max_tokens: 10,
    }),
  });

  if (!resp.ok) throw new Error(`Classification AI ${resp.status}`);
  const data = await resp.json();
  const text = (data.choices?.[0]?.message?.content || "").trim().toUpperCase().replace(/[^A-Z_]/g, "");

  if (text === "SALUTATION") return { intent: "SMALL_TALK", confidence: 0.8, response: pickRandom(SMALL_TALK_RESPONSES) };
  if (text === "HORS_SUJET") return { intent: "HORS_SUJET", confidence: 0.8, response: HORS_SUJET_RESPONSE };
  return { intent: "REQUETE_METIER", confidence: 0.7 };
}
