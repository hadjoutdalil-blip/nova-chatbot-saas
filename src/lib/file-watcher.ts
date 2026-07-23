import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { db } from "./db";
import { getActiveEmbeddingKey } from "./embedding-keys";
import { syncDocumentChunks, deleteDocChunks } from "./vector-store";
import { upsertKBFromJSON, upsertKBFromText, removeKBBySource } from "./kb-import";
import { isLocalEnvironment, getLocalImportDir } from "./storage";

export interface ScanResult {
  added: number;
  updated: number;
  removed: number;
  unchanged: number;
  kbAdded: number;
  errors: string[];
}

function hashContent(content: string): string {
  return crypto.createHash("md5").update(content).digest("hex");
}

export async function scanLocalImport(clientId: string, clientSlug: string): Promise<ScanResult> {
  if (!isLocalEnvironment()) {
    return { added: 0, updated: 0, removed: 0, unchanged: 0, kbAdded: 0, errors: ["Scan local non disponible sur Vercel"] };
  }

  const importDir = getLocalImportDir(clientSlug);
  await fs.mkdir(importDir, { recursive: true });

  const result: ScanResult = { added: 0, updated: 0, removed: 0, unchanged: 0, kbAdded: 0, errors: [] };

  let files: string[];
  try {
    const entries = await fs.readdir(importDir, { withFileTypes: true });
    files = entries.filter((e) => e.isFile()).map((e) => e.name);
  } catch {
    return result;
  }

  const existingRecords = await db.prisma.localImportFile.findMany({ where: { clientId } });
  const existingMap = new Map(existingRecords.map((r) => [r.fileName, r]));
  const seenFiles = new Set<string>();

  for (const fileName of files) {
    seenFiles.add(fileName);
    const filePath = path.join(importDir, fileName);
    const ext = path.extname(fileName).toLowerCase();

    if (![".txt", ".json", ".md"].includes(ext)) {
      result.errors.push(`Format non supporté: ${fileName}`);
      continue;
    }

    let content: string;
    try {
      content = await fs.readFile(filePath, "utf-8");
    } catch (err: any) {
      result.errors.push(`Erreur lecture ${fileName}: ${err.message}`);
      continue;
    }

    const fileHash = hashContent(content);
    const existing = existingMap.get(fileName);

    if (existing && existing.fileHash === fileHash) {
      result.unchanged++;
      continue;
    }

    try {
      const client = await db.prisma.client.findUnique({ where: { id: clientId } });
      if (!client) continue;

      let chunkCount = 0;
      let kbCount = 0;

      if (ext === ".json") {
        try {
          const jsonData = JSON.parse(content);
          const kbResult = await upsertKBFromJSON(clientId, jsonData, fileName);
          kbCount = kbResult.kbCount;
          chunkCount = kbResult.vectorCount;
        } catch (err: any) {
          result.errors.push(`Erreur JSON ${fileName}: ${err.message}`);
          continue;
        }
      } else {
        const kbResult = await upsertKBFromText(clientId, content, fileName);
        kbCount = kbResult.kbCount;

        if (client.useVectorRag) {
          const activeKey = await getActiveEmbeddingKey(clientId);
          const apiKey = activeKey?.key || client.hfApiKey;
          const provider = activeKey?.provider || client.embeddingProvider;
          if (apiKey) {
            const docId = existing?.id || `local-${crypto.randomUUID()}`;
            if (existing) await deleteDocChunks(docId);
            await syncDocumentChunks(
              docId,
              clientId,
              content,
              fileName,
              "",
              null,
              client.chunkSize || 500,
              apiKey,
              provider,
              activeKey?.id,
            );
            chunkCount = 1;
          }
        }
      }

      if (existing) {
        await db.prisma.localImportFile.update({
          where: { id: existing.id },
          data: { fileHash, chunkCount, kbCount, lastIndexedAt: new Date(), updatedAt: new Date() },
        });
        result.updated++;
      } else {
        await db.prisma.localImportFile.create({
          data: {
            id: crypto.randomUUID(),
            clientId,
            fileName,
            filePath,
            fileHash,
            chunkCount,
            kbCount,
            lastIndexedAt: new Date(),
          },
        });
        result.added++;
      }

      result.kbAdded += kbCount;
    } catch (err: any) {
      result.errors.push(`Erreur indexation ${fileName}: ${err.message}`);
    }
  }

  for (const record of existingRecords) {
    if (!seenFiles.has(record.fileName)) {
      try {
        await deleteDocChunks(record.id);
        await removeKBBySource(clientId, record.fileName);
        await db.prisma.localImportFile.delete({ where: { id: record.id } });
        result.removed++;
      } catch (err: any) {
        result.errors.push(`Erreur suppression ${record.fileName}: ${err.message}`);
      }
    }
  }

  return result;
}
