import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { randomUUID } from "crypto";
import { KB } from "./data/cetim-kb";

const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const client = await prisma.client.findUnique({ where: { slug: "cetim" } });
  if (!client) {
    console.error("Client with slug 'cetim' not found. Run scripts/seed.ts first.");
    process.exit(1);
  }

  console.log(`Found client: ${client.name} (${client.id})`);

  const existing = await prisma.kBEntry.findMany({ where: { clientId: client.id } });
  if (existing.length > 0) {
    console.log(`Deleting ${existing.length} existing KB entries for this client...`);
    await prisma.kBEntry.deleteMany({ where: { clientId: client.id } });
  }

  const data = KB.map((entry) => ({
    id: randomUUID(),
    tag: entry.tag,
    question: entry.qs[0],
    alt_questions: entry.qs.slice(1).join(" || "),
    short_resp: entry.short_resp,
    answer: entry.resp,
    category: entry.cat,
    keywords: entry.kw.join(", "),
    priority: entry.priority,
    related_tags: (entry.related_tags || []).join(", "),
    icon: entry.icon,
    clientId: client.id,
  }));

  await prisma.kBEntry.createMany({ data });
  console.log(`Created ${data.length} KB entries for ${client.name}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
