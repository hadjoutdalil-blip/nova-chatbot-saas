import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaPg } from "@prisma/adapter-pg";
import { readFile } from "../src/lib/storage";
import { extractPdfText, isPdfMime, isPdfName } from "../src/lib/pdf-extractor";
import { syncDocumentChunks, syncKBEntry } from "../src/lib/vector-store";
import { getActiveEmbeddingKey } from "../src/lib/embedding-keys";

const url = process.env.DATABASE_URL || "";
const adapter = url.includes("neon.tech")
  ? new PrismaNeon({ connectionString: url })
  : new PrismaPg({ connectionString: url });
const prisma = new PrismaClient({ adapter });

const args = process.argv.slice(2);
const clientArg = args.find((a) => a.startsWith("--client="))?.split("=")[1];
const pdfsOnly = args.includes("--pdfs-only");
const withKb = args.includes("--kb");

function printHelp() {
  console.log(`Usage: tsx scripts/reindex-pdfs.ts [options]
Options:
  --client=<id>   Ne traiter que ce client
  --pdfs-only     Ré-extraire seulement les PDFs (sans re-vectoriser les autres docs)
  --kb            Re-vectoriser aussi les entrées KB`);
}

async function main() {
  if (args.includes("--help") || args.includes("-h")) {
    printHelp();
    return;
  }

  const where = clientArg ? { id: clientArg } : {};
  const clients = await prisma.client.findMany({ where, select: { id: true, name: true } });

  console.log(`\n=== Ré-indexation : ${clients.length} client(s) ===`);

  const summary = { pdfs: 0, docs: 0, kb: 0, errors: [] as string[] };

  for (const client of clients) {
    console.log(`\n[${client.name || client.id}]`);
    const ak = await getActiveEmbeddingKey(client.id);
    const clientRow = await prisma.client.findUnique({ where: { id: client.id } });
    if (!clientRow) continue;
    const apiKey = ak?.key || clientRow.hfApiKey;
    const provider = ak?.provider || clientRow.embeddingProvider;
    const chunkSize = clientRow.chunkSize || 600;
    const useVector = clientRow.useVectorRag;

    if (!useVector) {
      console.log("  → RAG vectoriel désactivé, client ignoré");
      continue;
    }
    if (!apiKey) {
      console.log("  → Pas de clé API embedding, client ignoré");
      continue;
    }

    /* 1. PDFs stockés localement / Blob → ré-extraction du texte */
    const localDocs = await prisma.clientLocalDoc.findMany({ where: { clientId: client.id } });
    for (const doc of localDocs) {
      const isPdf = isPdfMime(doc.mimeType || "") || isPdfName(doc.fileName || doc.originalName || "");
      if (!isPdf) {
        if (!pdfsOnly) {
          try {
            await syncDocumentChunks(doc.id, client.id, doc.content || "", doc.fileName || doc.originalName, doc.sourceUrl, null, chunkSize, apiKey, provider, ak?.id);
            summary.docs++;
            console.log(`  ✓ doc ${doc.fileName}`);
          } catch (err: any) {
            summary.errors.push(`${doc.fileName}: ${err.message}`);
          }
        }
        continue;
      }
      try {
        const data = await readFile(doc.storagePath);
        const extracted = await extractPdfText(data);
        if (!extracted.trim()) {
          summary.errors.push(`${doc.fileName}: PDF sans texte`);
          continue;
        }
        await syncDocumentChunks(doc.id, client.id, extracted, doc.fileName || doc.originalName, doc.sourceUrl, null, chunkSize, apiKey, provider, ak?.id);
        await prisma.clientLocalDoc.update({ where: { id: doc.id }, data: { content: extracted } });
        summary.pdfs++;
        console.log(`  ✓ PDF ${doc.fileName} (${extracted.length} caractères)`);
      } catch (err: any) {
        summary.errors.push(`${doc.fileName}: ${err.message}`);
      }
    }

    /* 2. Documents texte (import web, uploads) → re-vectorisation */
    if (!pdfsOnly) {
      const docs = await prisma.clientDocument.findMany({ where: { clientId: client.id } });
      for (const doc of docs) {
        if (!doc.content) continue;
        try {
          await syncDocumentChunks(doc.id, client.id, doc.content, doc.originalName || doc.source_url, doc.source_url, doc.valid_until?.toISOString() || null, chunkSize, apiKey, provider, ak?.id);
          summary.docs++;
        } catch (err: any) {
          summary.errors.push(`${doc.originalName}: ${err.message}`);
        }
      }
    }

    /* 3. KB entries (optionnel) */
    if (withKb) {
      const kbEntries = await prisma.kBEntry.findMany({ where: { clientId: client.id } });
      for (const kb of kbEntries) {
        try {
          await syncKBEntry(client.id, {
            id: kb.id,
            tag: kb.tag,
            question: kb.question,
            alt_questions: kb.alt_questions || null,
            answer: kb.answer,
            source_url: kb.source_url || null,
            valid_until: kb.valid_until || null,
          }, apiKey, provider, ak?.id);
          summary.kb++;
        } catch (err: any) {
          summary.errors.push(`kb ${kb.id}: ${err.message}`);
        }
      }
    }
  }

  console.log("\n=== Résumé ===");
  console.log(`PDFs ré-extraits : ${summary.pdfs}`);
  console.log(`Documents re-vectorisés : ${summary.docs}`);
  console.log(`Entrées KB : ${summary.kb}`);
  console.log(`Erreurs : ${summary.errors.length}`);
  for (const e of summary.errors) console.log("  ✗", e);
}

main()
  .catch((err) => {
    console.error("Erreur:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
