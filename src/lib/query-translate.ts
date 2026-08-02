const PROVIDER_ENDPOINTS: Record<string, string> = {
  groq: "https://api.groq.com/openai/v1/chat/completions",
  cerebras: "https://api.cerebras.ai/v1/chat/completions",
  xai: "https://api.x.ai/v1/chat/completions",
  gemini: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
};

/* Traduit la question en FR / EN / AR (une seule requête LLM), pour une recherche
   vectorielle multilingue. En cas d'échec, retourne uniquement la question d'origine. */
export async function translateQueryVariants(
  question: string,
  apiKey: string,
  providerId: string,
  model: string,
): Promise<string[]> {
  try {
    const endpoint = PROVIDER_ENDPOINTS[providerId] || PROVIDER_ENDPOINTS.groq;
    const resp = await fetch(endpoint, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content: `Traduis la question du client dans exactement trois langues : français (clé "fr"), anglais (clé "en") et arabe (clé "ar"). Conserve les sigles (IA, AI, DS, RAG, ML, NLP...), les noms propres, les chiffres et la ponctuation. Réponds UNIQUEMENT en JSON sans balises, au format : {"fr":"...","en":"...","ar":"..."}`,
          },
          { role: "user", content: question },
        ],
        temperature: 0,
        max_tokens: 250,
      }),
    });
    if (!resp.ok) return [question];
    const data = await resp.json();
    const raw = (data.choices?.[0]?.message?.content || "").trim();
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return [question];
    const parsed = JSON.parse(jsonMatch[0]);
    const variants = [question, parsed.fr, parsed.en, parsed.ar]
      .filter((v): v is string => typeof v === "string" && v.trim().length > 0)
      .map((v) => v.trim());
    return [...new Set(variants)];
  } catch {
    return [question];
  }
}
