import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

function getDbPath(): string {
  const src = path.join(process.cwd(), "data", "app.db");
  if (!process.env.VERCEL) return src;

  const dest = path.join("/tmp", "app.db");
  if (!fs.existsSync(dest) && fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
  }
  return dest;
}

const DB_PATH = getDbPath();

let _db: Database.Database | null = null;

function getDb(): Database.Database {
  if (!_db) {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    _db = new Database(DB_PATH);
    _db.pragma("journal_mode = WAL");
    _db.pragma("foreign_keys = ON");
    initSchema(_db);
  }
  return _db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      plan TEXT DEFAULT 'custom',
      subdomain TEXT,
      logo TEXT DEFAULT '',
      primaryColor TEXT DEFAULT '#7c3aed',
      apiKey TEXT DEFAULT '',
      aiModel TEXT DEFAULT 'llama-3.1-8b-instant',
      aiProvider TEXT DEFAULT 'groq',
      kbThreshold INTEGER DEFAULT 60,
      relanceActive INTEGER DEFAULT 1,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'client',
      clientId TEXT NOT NULL REFERENCES clients(id)
    );

    CREATE TABLE IF NOT EXISTS widget_configs (
      id TEXT PRIMARY KEY,
      welcomeTitle TEXT DEFAULT 'Bienvenue !',
      welcomeSub TEXT DEFAULT '',
      showBrand INTEGER DEFAULT 1,
      position TEXT DEFAULT 'right',
      marginBottom INTEGER DEFAULT 20,
      marginRight INTEGER DEFAULT 20,
      avatarIcon TEXT DEFAULT 'robot',
      clientId TEXT NOT NULL REFERENCES clients(id)
    );

    CREATE TABLE IF NOT EXISTS kb_entries (
      id TEXT PRIMARY KEY,
      question TEXT NOT NULL,
      answer TEXT NOT NULL,
      category TEXT DEFAULT '',
      keywords TEXT DEFAULT '',
      clientId TEXT NOT NULL REFERENCES clients(id),
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      messages TEXT DEFAULT '[]',
      clientId TEXT NOT NULL REFERENCES clients(id),
      createdAt TEXT NOT NULL
    );
  `);
}

function read<T>(collection: string): T[] {
  const db = getDb();
  const stmt = db.prepare(`SELECT * FROM ${quote(collection)}`);
  return stmt.all() as T[];
}

function write<T extends { id: string }>(collection: string, data: T[]) {
  const db = getDb();
  const table = quote(collection);

  const insert = db.transaction((rows: T[]) => {
    const existing = db.prepare(`SELECT id FROM ${table}`).all() as { id: string }[];
    const oldIds = new Set(existing.map((r) => r.id));
    const newIds = new Set(rows.map((r) => r.id));

    for (const id of oldIds) {
      if (!newIds.has(id)) {
        db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(id);
      }
    }

    if (rows.length === 0) return;

    const cols = [...new Set(rows.flatMap((r) => Object.keys(r)))];
    const placeholders = cols.map(() => "?").join(", ");
    const colList = cols.map(quote).join(", ");
    const upsert = db.prepare(
      `INSERT INTO ${table} (${colList}) VALUES (${placeholders})
       ON CONFLICT(id) DO UPDATE SET ${cols
         .filter((c) => c !== "id")
         .map((c) => `${quote(c)} = excluded.${quote(c)}`)
         .join(", ")}`
    );

    for (const row of rows) {
      const vals = cols.map((c) => {
        const v = (row as any)[c];
        if (typeof v === "boolean") return v ? 1 : 0;
        if (v === null || v === undefined) return null;
        return v;
      });
      upsert.run(...vals);
    }
  });

  insert(data);
}

function quote(name: string): string {
  return `"${name}"`;
}

export const db = {
  read,
  write,
  DB_PATH,
};
