import fs from "fs";
import path from "path";
import { db } from "../src/lib/db";

const DATA_DIR = path.join(process.cwd(), "data");

const COLLECTIONS = ["clients", "users", "widget_configs", "kb_entries", "conversations"];

for (const col of COLLECTIONS) {
  const fp = path.join(DATA_DIR, `${col}.json`);
  if (!fs.existsSync(fp)) {
    console.log(`  ${col}: fichier introuvable, ignoré`);
    continue;
  }
  const data = JSON.parse(fs.readFileSync(fp, "utf-8"));
  if (!Array.isArray(data) || data.length === 0) {
    console.log(`  ${col}: vide, ignoré`);
    continue;
  }
  db.write(col, data);
  console.log(`  ${col}: ${data.length} entrée(s) migrée(s)`);
}

console.log("Migration JSON → SQLite terminée.");
