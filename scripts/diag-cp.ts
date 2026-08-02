import "dotenv/config";
import { Pool } from "pg";
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaPg } from "@prisma/adapter-pg";
import { generateEmbeddings } from "../src/lib/embeddings";
import { searchChunks } from "../src/lib/vector-store";
import { getActiveEmbeddingKey } from "../src/lib/embedding-keys";
import { chunkDocument, findBestChunks } from "../src/lib/rag-utils";

const url = process.env.DATABASE_URL || "";
const adapter = url.includes("neon.tech")
  ? new PrismaNeon({ connectionString: url })
  : new PrismaPg({ connectionString: url });
const prisma = new PrismaClient({ adapter });
const pool = new Pool({ connectionString: url });

const QUESTION = process.argv[2] || "Quelle est la durée du premier cycle (cycle préparatoire) ?";

const markers = ["cycle préparatoire", "cycle preparatoire", "durée", "duree", "premier cycle", "1 an", "2 ans"];

async function main() {
  console.log(`\n=== Question : "${QUESTION}" ===\n`);

  /* 1. Documents correspondant au nom "cp / formation" dans les DEUX tables */
  const inClientDoc = await prisma.clientDocument.findMany({
    where: { originalName: { contains: "cp", mode: "insensitive" } },
    select: { id: true, clientId: true, originalName: true, mimeType: true, fileSize: true, status: true, content: true },
    orderBy: { updatedAt: "desc" },
    take: 10,
  });
  const inLocalDoc = await prisma.clientLocalDoc.findMany({
    where: { OR: [{ fileName: { contains: "cp", mode: "insensitive" } }, { originalName: { contains: "cp", mode: "insensitive" } }] },
    select: { id: true, clientId: true, fileName: true, mimeType: true, fileSize: true, status: true, content: true },
    orderBy: { updatedAt: "desc" },
    take: 10,
  });

  console.log(`--- ClientDocument (${inClientDoc.length}) ---`);
  for (const d of inClientDoc) {
    const cnt = await pool.query(`SELECT count(*)::int AS n FROM document_chunks WHERE "docId"=$1`, [d.id]);
    console.log(`  ${d.id} client=${d.clientId} mime=${d.mimeType} size=${d.fileSize} status=${d.status}`);
    console.log(`    name="${d.originalName}" chunks=${cnt.rows[0].n} contentLen=${(d.content || "").length}`);
    for (const m of markers) if ((d.content || "").toLowerCase().includes(m)) console.log(`    ✔ contient "${m}"`);
  }
  console.log(`\n--- ClientLocalDoc (${inLocalDoc.length}) ---`);
  for (const d of inLocalDoc) {
    const cnt = await pool.query(`SELECT count(*)::int AS n FROM document_chunks WHERE "docId"=$1`, [d.id]);
    console.log(`  ${d.id} client=${d.clientId} mime=${d.mimeType} size=${d.fileSize} status=${d.status}`);
    console.log(`    name="${d.fileName}" chunks=${cnt.rows[0].n} contentLen=${(d.content || "").length}`);
    for (const m of markers) if ((d.content || "").toLowerCase().includes(m)) console.log(`    ✔ contient "${m}"`);
  }

  /* 2. Recherche vectorielle sur le client concerné */
  const docs = [...inClientDoc, ...inLocalDoc] as any[];
  const clientIds = [...new Set(docs.map((d) => d.clientId))];
  for (const cid of clientIds) {
    const client = await prisma.client.findUnique({
      where: { id: cid },
      select: { id: true, name: true, slug: true, useVectorRag: true, embeddingProvider: true, topNChunks: true, ragThreshold: true, chunkSize: true, hfApiKey: true },
    });
    if (!client) continue;
    console.log(`\n=== Client "${client.name}" (${client.id}) ===`);
    console.log(`  useVectorRag=${client.useVectorRag} provider=${client.embeddingProvider} topN=${client.topNChunks} ragThreshold=${client.ragThreshold} chunkSize=${client.chunkSize}`);

    const ak = await getActiveEmbeddingKey(cid);
    const apiKey = ak?.key || client.hfApiKey || "";
    if (client.useVectorRag && apiKey) {
      try {
        const emb = await generateEmbeddings([QUESTION], apiKey, ak?.provider || client.embeddingProvider);
        const results = await searchChunks(cid, emb[0], client.topNChunks ?? 7, ak?.provider || client.embeddingProvider);
        console.log(`  [vectoriel] ${results.length} chunks retournés:`);
        results.forEach((r, i) => {
          console.log(`    #${i + 1} score=${r.score.toFixed(3)} section="${r.chunk.section}" src="${r.chunk.source}"`);
          console.log(`       ${r.chunk.content.slice(0, 180).replace(/\n/g, " ")}`);
        });
      } catch (e: any) {
        console.log(`  [vectoriel] ERREUR: ${e.message}`);
      }
    } else {
      console.log(`  [vectoriel] SKIPPÉ (useVectorRag=${client.useVectorRag}, clé=${!!apiKey})`);
    }

    /* keyword search sur tous les docs textuels du client (les deux tables) */
    const cDocs = await prisma.clientDocument.findMany({ where: { clientId: cid } });
    const lDocs = await prisma.clientLocalDoc.findMany({ where: { clientId: cid } });
    const all = [
      ...cDocs.map((d: any) => ({ id: d.id, content: d.content, originalName: d.originalName, source_url: d.source_url || "", valid_until: d.valid_until, version: 1 })),
      ...lDocs.map((d: any) => ({ id: d.id, content: d.content, originalName: d.fileName || d.originalName, source_url: d.sourceUrl || "", valid_until: null, version: 1 })),
    ];
    const kw = findBestChunks(QUESTION, all.flatMap((d: any) => chunkDocument(d, client.chunkSize || 600)), client.topNChunks ?? 7, client.ragThreshold);
    console.log(`  [keyword] ${kw.length} chunks retournés:`);
    kw.forEach((r, i) => {
      console.log(`    #${i + 1} score=${(r.score || 0).toFixed(3)} src="${r.source}"`);
      console.log(`       ${r.content.slice(0, 180).replace(/\n/g, " ")}`);
    });
  }

  await pool.end();
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("Erreur:", e);
  process.exit(1);
});
