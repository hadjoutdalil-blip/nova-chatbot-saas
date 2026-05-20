import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");

function dataPath(collection: string) {
  return path.join(DATA_DIR, `${collection}.json`);
}

function read<T>(collection: string): T[] {
  const fp = dataPath(collection);
  if (!fs.existsSync(fp)) return [];
  return JSON.parse(fs.readFileSync(fp, "utf-8"));
}

function write<T>(collection: string, data: T[]) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(dataPath(collection), JSON.stringify(data, null, 2));
}

export const db = {
  read,
  write,
  DATA_DIR,
};
