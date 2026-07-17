const JINA_EMBED_URL = "https://api.jina.ai/v1/embeddings";

export async function generateEmbedding(text: string, apiKey: string): Promise<number[]> {
  const res = await fetch(JINA_EMBED_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: "jina-embeddings-v3", input: [text] }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Jina AI error ${res.status}: ${err}`);
  }
  const data = await res.json();
  return data.data?.[0]?.embedding;
}

export async function generateEmbeddings(texts: string[], apiKey: string): Promise<number[][]> {
  const res = await fetch(JINA_EMBED_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: "jina-embeddings-v3", input: texts }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Jina AI error ${res.status}: ${err}`);
  }
  const data = await res.json();
  return data.data.map((d: any) => d.embedding);
}
