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

  /* Passe 2 : classification par LLM léger (réservé pour une itération future) */

  return { intent: "REQUETE_METIER", confidence: 1.0 };
}
