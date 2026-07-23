import fs from "fs/promises";
import path from "path";
import { put, list, del } from "@vercel/blob";

const isVercel = !!process.env.VERCEL;
const LOCAL_DATA_DIR = path.join(process.cwd(), "data");

export async function saveFile(
  clientSlug: string,
  subDir: "docs" | "import",
  fileName: string,
  data: Buffer,
): Promise<{ storagePath: string; url?: string }> {
  const blobKey = `${subDir}/${clientSlug}/${fileName}`;

  if (isVercel) {
    const blob = await put(blobKey, data, { access: "public", addRandomSuffix: false });
    return { storagePath: blob.url, url: blob.url };
  }

  const localDir = path.join(LOCAL_DATA_DIR, subDir, clientSlug);
  await fs.mkdir(localDir, { recursive: true });
  const filePath = path.join(localDir, fileName);
  await fs.writeFile(filePath, data);
  return { storagePath: filePath };
}

export async function readFile(
  storagePath: string,
): Promise<Buffer> {
  if (isVercel) {
    const res = await fetch(storagePath);
    if (!res.ok) throw new Error(`Failed to fetch blob: ${res.statusText}`);
    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }
  return fs.readFile(storagePath);
}

export async function deleteFile(
  clientSlug: string,
  subDir: "docs" | "import",
  fileName: string,
): Promise<void> {
  const blobKey = `${subDir}/${clientSlug}/${fileName}`;

  if (isVercel) {
    await del(blobKey);
    return;
  }

  const filePath = path.join(LOCAL_DATA_DIR, subDir, clientSlug, fileName);
  await fs.unlink(filePath).catch(() => {});
}

export async function listFiles(
  clientSlug: string,
  subDir: "docs" | "import",
): Promise<{ name: string; size: number; path: string }[]> {
  if (isVercel) {
    const prefix = `${subDir}/${clientSlug}/`;
    const blobList = await list({ prefix });
    return blobList.blobs.map((b) => ({
      name: b.pathname.replace(prefix, ""),
      size: b.size,
      path: b.url,
    }));
  }

  const localDir = path.join(LOCAL_DATA_DIR, subDir, clientSlug);
  await fs.mkdir(localDir, { recursive: true });
  const entries = await fs.readdir(localDir, { withFileTypes: true });
  const files: { name: string; size: number; path: string }[] = [];
  for (const entry of entries) {
    if (entry.isFile()) {
      const stat = await fs.stat(path.join(localDir, entry.name));
      files.push({ name: entry.name, size: stat.size, path: path.join(localDir, entry.name) });
    }
  }
  return files;
}

export function getLocalImportDir(clientSlug: string): string {
  return path.join(LOCAL_DATA_DIR, "import", clientSlug);
}

export function isLocalEnvironment(): boolean {
  return !isVercel;
}
