import { ChromaClient } from "chromadb";
import { chunkDocument, ChunkMeta } from "./rag-utils";
import { generateEmbeddings } from "./embeddings";

const COLLECTION_NAME = "nova_chunks";

const noopEmbed = { generate: async (_texts: string[]) => [] };

function createClient(apiKey: string, tenant: string, database: string): ChromaClient {
  return new ChromaClient({
    host: "api.trychroma.com",
    ssl: true,
    headers: { "X-Chroma-Token": apiKey },
    tenant,
    database,
  });
}

export async function syncDocumentChunks(
  docId: string,
  clientId: string,
  content: string,
  source: string,
  sourceUrl: string,
  validUntil: string | null,
  chunkSize: number,
  chromaApiKey: string,
  chromaTenant: string,
  chromaDatabase: string,
  hfApiKey: string,
) {
  const client = createClient(chromaApiKey, chromaTenant, chromaDatabase);
  const collection = await client.getOrCreateCollection({ name: COLLECTION_NAME, embeddingFunction: noopEmbed });
  await deleteDocChunks(docId, chromaApiKey, chromaTenant, chromaDatabase);

  const chunks = chunkDocument({ id: docId, content, source_url: sourceUrl, valid_until: validUntil, originalName: source }, chunkSize);
  if (chunks.length === 0) return;

  const texts = chunks.map((c) => c.content);
  const embeddings = await generateEmbeddings(texts, hfApiKey);

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

  await collection.add({ ids, embeddings, metadatas });
}

export async function deleteDocChunks(docId: string, chromaApiKey: string, chromaTenant: string, chromaDatabase: string) {
  try {
    const client = createClient(chromaApiKey, chromaTenant, chromaDatabase);
    const collection = await client.getOrCreateCollection({ name: COLLECTION_NAME, embeddingFunction: noopEmbed });
    await collection.delete({ where: { docId } });
  } catch {
    // collection may not exist yet
  }
}

export async function searchChunks(
  clientId: string,
  questionEmbedding: number[],
  topN: number,
  chromaApiKey: string,
  chromaTenant: string,
  chromaDatabase: string,
): Promise<{ chunk: ChunkMeta; score: number }[]> {
  const client = createClient(chromaApiKey, chromaTenant, chromaDatabase);
  const collection = await client.getOrCreateCollection({ name: COLLECTION_NAME, embeddingFunction: noopEmbed });
  const data = await collection.query({ queryEmbeddings: [questionEmbedding], nResults: topN, where: { clientId } });

  const ids = data.ids?.[0] || [];
  const distances = data.distances?.[0] || [];
  const metadatas = data.metadatas?.[0] || [];

  return ids.map((_id: string, i: number) => ({
    chunk: {
      id: (metadatas[i]?.chunkId as string) || _id,
      source: (metadatas[i]?.source as string) || "",
      section: (metadatas[i]?.section as string) || "",
      keywords: ((metadatas[i]?.keywords as string) || "").split(", ").filter(Boolean),
      content: "",
      score: distances[i] !== undefined ? 1 - (distances[i] as number) : 0,
      docId: (metadatas[i]?.docId as string) || undefined,
      source_url: (metadatas[i]?.source_url as string) || "",
      valid_until: (metadatas[i]?.valid_until as string) || "",
    },
    score: distances[i] !== undefined ? 1 - (distances[i] as number) : 0,
  }));
}
