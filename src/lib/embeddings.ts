const COHERE_EMBED_URL = "https://api.cohere.ai/v1/embed";

async function cohereEmbed(texts: string[], apiKey: string): Promise<number[][]> {
  const res = await fetch(COHERE_EMBED_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ texts, model: "embed-english-light-v3.0", input_type: "search_document" }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Cohere error ${res.status}: ${err.slice(0, 300)}`);
  }
  const data = await res.json();
  return data.embeddings;
}

export async function generateEmbedding(text: string, apiKey: string): Promise<number[]> {
  const results = await cohereEmbed([text], apiKey);
  return results[0];
}

export async function generateEmbeddings(texts: string[], apiKey: string): Promise<number[][]> {
  return cohereEmbed(texts, apiKey);
}
