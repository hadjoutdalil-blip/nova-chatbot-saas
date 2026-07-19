const COHERE_EMBED_URL = "https://api.cohere.ai/v1/embed";
const NOMIC_EMBED_URL = "https://api-atlas.nomic.ai/v1/embedding/text";
const BATCH_SIZE = 96;

export const VECTOR_DIMS: Record<string, number> = {
  cohere: 384,
  nomic: 768,
};

export function getEmbeddingDimension(provider = "cohere"): number {
  return VECTOR_DIMS[provider] || 384;
}

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

async function nomicEmbed(texts: string[], apiKey: string): Promise<number[][]> {
  const res = await fetch(NOMIC_EMBED_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: "nomic-embed-text-v1.5", texts }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Nomic error ${res.status}: ${err.slice(0, 300)}`);
  }
  const data = await res.json();
  return data.embeddings;
}

export async function generateEmbedding(text: string, apiKey: string, provider = "cohere"): Promise<number[]> {
  const fn = provider === "nomic" ? nomicEmbed : cohereEmbed;
  const results = await fn([text], apiKey);
  return results[0];
}

export async function generateEmbeddings(texts: string[], apiKey: string, provider = "cohere"): Promise<number[][]> {
  const fn = provider === "nomic" ? nomicEmbed : cohereEmbed;
  if (texts.length <= BATCH_SIZE) {
    return fn(texts, apiKey);
  }
  const all: number[][] = [];
  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    const batchEmbeddings = await fn(batch, apiKey);
    all.push(...batchEmbeddings);
  }
  return all;
}
