const GENERIC_PATTERNS = [
  "je n'ai pas trouvé",
  "contactez-nous",
  "n'hésitez pas",
  "notre équipe se fera un plaisir",
  "veuillez réessayer",
  "je n'ai pas pu traiter",
  "contactez notre équipe",
  "aucune information",
  "je ne peux pas répondre",
];

const PROVIDERS: Record<string, string> = {
  groq: "https://api.groq.com/openai/v1/chat/completions",
  cerebras: "https://api.cerebras.ai/v1/chat/completions",
  xai: "https://api.x.ai/v1/chat/completions",
  gemini: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
};

export function isGenericResponse(text: string): boolean {
  const lower = text.toLowerCase();
  return GENERIC_PATTERNS.some(p => lower.includes(p));
}

export function compareWithHeuristic(kbResponse: string, ragResponse: string): "kb" | "rag" | null {
  const kbGeneric = isGenericResponse(kbResponse);
  const ragGeneric = isGenericResponse(ragResponse);
  if (kbGeneric && !ragGeneric) return "rag";
  if (!kbGeneric && ragGeneric) return "kb";
  return null;
}

function stripPrefix(id: string): string {
  const slash = id.lastIndexOf("/");
  return slash >= 0 ? id.slice(slash + 1) : id;
}

export async function compareWithAI(
  question: string,
  kbResponse: string,
  ragResponse: string,
  apiKey: string,
  providerId: string,
  model: string,
): Promise<"kb" | "rag" | "egal"> {
  const endpoint = PROVIDERS[providerId];
  if (!endpoint) return "kb";

  const system = "Tu compares deux réponses à une question. Choisis la meilleure.";
  const user = [
    `Question : ${question}`,
    "",
    `Réponse A (Base de connaissance) :`,
    stripPrefix(kbResponse).slice(0, 2000),
    "",
    `Réponse B (Recherche documentaire RAG) :`,
    stripPrefix(ragResponse).slice(0, 2000),
    "",
    `Réponds UNIQUEMENT par : KB si A est meilleure, RAG si B est meilleure, EGAL si équivalentes.`,
  ].join("\n");

  try {
    const resp = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        temperature: 0,
        max_tokens: 10,
      }),
    });

    if (!resp.ok) return "kb";

    const data = await resp.json();
    const choice = (data.choices?.[0]?.message?.content || "").trim().toUpperCase();
    if (choice === "RAG") return "rag";
    if (choice === "EGAL" || choice === "ÉGAL") return "egal";
    return "kb";
  } catch {
    return "kb";
  }
}
