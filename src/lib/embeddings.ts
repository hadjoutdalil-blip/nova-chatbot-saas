const HF_EMBED_MODEL = "sentence-transformers/all-MiniLM-L6-v2";
const HF_EMBED_URL = `https://api-inference.huggingface.co/models/${HF_EMBED_MODEL}`;

async function hfEmbed(inputs: string[], apiKey: string): Promise<number[][]> {
  const res = await fetch(HF_EMBED_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ inputs }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`HuggingFace error ${res.status}: ${err.slice(0, 300)}`);
  }
  const data = await res.json();
  return data;
}

export async function generateEmbedding(text: string, apiKey: string): Promise<number[]> {
  const results = await hfEmbed([text], apiKey);
  return results[0];
}

export async function generateEmbeddings(texts: string[], apiKey: string): Promise<number[][]> {
  return hfEmbed(texts, apiKey);
}
