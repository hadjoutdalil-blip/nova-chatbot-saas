import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { randomUUID } from "crypto";
import * as fs from "fs";
import * as path from "path";

const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const client = await prisma.client.findFirst({ where: { slug: "cetim" } });
  if (!client) {
    console.error("Client CETIM introuvable – exécutez d'abord le seed.");
    process.exit(1);
  }

  const clientId = client.id;
  const raw = fs.readFileSync(path.join(__dirname, "cetim-kb.json"), "utf-8");
  const entries: any[] = JSON.parse(raw);

  // Delete existing CETIM entries
  await prisma.kBEntry.deleteMany({ where: { clientId } });

  for (const e of entries) {
    const qs = Array.isArray(e.qs) ? e.qs : [e.question || ""];
    const kw = Array.isArray(e.kw) ? e.kw.join(", ") : (e.keywords || "");
    const relatedTags = Array.isArray(e.related_tags) ? e.related_tags.join(", ") : (e.related_tags || "");

    await prisma.kBEntry.create({
      data: {
        id: randomUUID(),
        tag: e.tag || "",
        question: qs[0] || "",
        alt_questions: qs.slice(1).join(" || ") || "",
        short_resp: e.short_resp || "",
        answer: e.resp || e.answer || "",
        category: e.cat || e.category || "",
        keywords: kw,
        priority: e.priority ?? 5,
        related_tags: relatedTags,
        icon: e.icon || "",
        clientId,
      },
    });
  }

  console.log(`Importé ${entries.length} entrées KB pour CETIM.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
