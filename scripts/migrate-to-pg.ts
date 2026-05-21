import fs from "fs";
import path from "path";
import Database from "better-sqlite3";
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter });

const SQLITE_PATH = path.join(process.cwd(), "data", "app.db");

if (!fs.existsSync(SQLITE_PATH)) {
  console.error("SQLite database not found at", SQLITE_PATH);
  process.exit(1);
}

const sqlite = new Database(SQLITE_PATH);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

interface Row {
  [key: string]: unknown;
}

function normalizeRow(row: Row): Row {
  const out: Row = {};
  for (const [k, v] of Object.entries(row)) {
    if (k === "showBrand" || k === "relanceActive") {
      out[k] = v === 1 || v === true;
    } else if (
      (k === "createdAt" || k === "updatedAt") &&
      typeof v === "string"
    ) {
      out[k] = new Date(v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

async function migrateTable(
  table: string,
  prismaModel: string
) {
  const rows = sqlite.prepare(`SELECT * FROM "${table}"`).all() as Row[];
  if (rows.length === 0) {
    console.log(`  ${table}: vide, ignoré`);
    return;
  }

  const delegate = (prisma as any)[prismaModel];
  for (const row of rows) {
    const normalized = normalizeRow(row);
    await delegate.upsert({
      where: { id: normalized.id as string },
      create: normalized,
      update: normalized,
    });
  }
  console.log(`  ${table}: ${rows.length} entrée(s) migrée(s)`);
}

async function main() {
  console.log("Migration SQLite → PostgreSQL...\n");

  await migrateTable("clients", "client");
  await migrateTable("users", "user");
  await migrateTable("widget_configs", "widgetConfig");
  await migrateTable("kb_entries", "kBEntry");
  await migrateTable("conversations", "conversation");

  console.log("\nMigration terminée.");
}

main()
  .catch(console.error)
  .finally(() => {
    sqlite.close();
    prisma.$disconnect();
  });
