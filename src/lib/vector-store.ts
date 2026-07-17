import { chunkDocument, ChunkMeta } from "./rag-utils";
import { generateEmbeddings } from "./embeddings";

const COLLECTION_NAME = "nova_chunks";

async function getCollectionId(baseUrl: string, apiKey: string): Promise<string> {
  const res = await fetch(`${baseUrl}/api/v1/collections?name=${COLLECTION_NAME}`, {
    headers: { "X-Chroma-Token": apiKey },
  });
  if (res.status === 404) {
    const create = await fetch(`${baseUrl}/api/v1/collections`, {
      method: "POST",
      headers: { "X-Chroma-Token": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({ name: COLLECTION_NAME }),
    });
    if (!create.ok) throw new Error(`Chroma create collection error ${create.status}`);
    const data = await create.json();
    return data.id || data.uuid;
  }
  if (!res.ok) throw new Error(`Chroma get collection error ${res.status}`);
  const data = await res.json();
  return data.id || data.uuid;
}

export async function syncDocumentChunks(
  docId: string,
  clientId: string,
  content: string,
  source: string,
  sourceUrl: string,
  validUntil: string | null,
  chunkSize: number,
  chromaUrl: string,
  chromaApiKey: string,
  jinaApiKey: string,
) {
  const collectionId = await getCollectionId(chromaUrl, chromaApiKey);
  await deleteDocChunks(docId, chromaUrl, chromaApiKey);

  const chunks = chunkDocument({ id: docId, content, source_url: sourceUrl, valid_until: validUntil, originalName: source }, chunkSize);
  if (chunks.length === 0) return;

  const texts = chunks.map((c) => c.content);
  const embeddings = await generateEmbeddings(texts, jinaApiKey);

  const ids = chunks.map((c, i) => `${docId}__${i}`);
  const metadatas = chunks.map((c) => ({
    clientId,
    docId,
    chunkId: c.id,
    source: c.source,
    section: c.section,
    keywords: c.keywords.join(", "),
    source_url: sourceUrl,
    valid_until: validUntil || "",
  }));

  const res = await fetch(`${chromaUrl}/api/v1/collections/${collectionId}/upsert`, {
    method: "POST",
    headers: { "X-Chroma-Token": chromaApiKey, "Content-Type": "application/json" },
    body: JSON.stringify({ ids, embeddings, metadatas }),
  });
  if (!res.ok) throw new Error(`Chroma upsert error ${res.status}`);
}

export async function deleteDocChunks(docId: string, chromaUrl: string, chromaApiKey: string) {
  try {
    const collectionId = await getCollectionId(chromaUrl, chromaApiKey);
    await fetch(`${chromaUrl}/api/v1/collections/${collectionId}/delete`, {
      method: "POST",
      headers: { "X-Chroma-Token": chromaApiKey, "Content-Type": "application/json" },
      body: JSON.stringify({ where: { docId } }),
    });
  } catch {
    // collection may not exist yet
  }
}

export async function searchChunks(
  clientId: string,
  questionEmbedding: number[],
  topN: number,
  chromaUrl: string,
  chromaApiKey: string,
): Promise<{ chunk: ChunkMeta; score: number }[]> {
  const collectionId = await getCollectionId(chromaUrl, chromaApiKey);
  const res = await fetch(`${chromaUrl}/api/v1/collections/${collectionId}/query`, {
    method: "POST",
    headers: { "X-Chroma-Token": chromaApiKey, "Content-Type": "application/json" },
    body: JSON.stringify({
      query_embeddings: [questionEmbedding],
      n_results: topN,
      where: { clientId },
    }),
  });
  if (!res.ok) throw new Error(`Chroma query error ${res.status}`);
  const data = await res.json();
  const ids: string[][] = data.ids || [];
  const distances: number[][] = data.distances || [];
  const metadatas: any[][] = data.metadatas || [];
  if (!ids[0]) return [];
  return ids[0].map((_id, i) => ({
    chunk: {
      id: metadatas[0]?.[i]?.chunkId || _id,
      source: metadatas[0]?.[i]?.source || "",
      section: metadatas[0]?.[i]?.section || "",
      keywords: (metadatas[0]?.[i]?.keywords || "").split(", ").filter(Boolean),
      content: "",
      score: distances[0]?.[i] !== undefined ? 1 - distances[0][i] : 0,
      docId: metadatas[0]?.[i]?.docId,
      source_url: metadatas[0]?.[i]?.source_url || "",
      valid_until: metadatas[0]?.[i]?.valid_until || "",
    },
    score: distances[0]?.[i] !== undefined ? 1 - distances[0][i] : 0,
  }));
}
