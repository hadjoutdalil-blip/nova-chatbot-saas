const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaNeon } = require("@prisma/adapter-neon");
require("dotenv").config();

const url = process.env.DATABASE_URL || "";
const adapter = url.includes("neon.tech")
  ? new PrismaNeon({ connectionString: url })
  : new PrismaPg({ connectionString: url });
const prisma = new PrismaClient({ adapter });

(async () => {
  const clientId = "4e58898f-148a-4b64-9367-1e74cd74f9f0";
  const cats = await prisma.$queryRawUnsafe(
    `SELECT category, tag, count(*) AS n FROM "KBEntry" WHERE "clientId" = '${clientId}' GROUP BY category, tag ORDER BY category`
  );
  console.log("Catégories / tags ESTIN (LITAN):");
  for (const c of cats) console.log("  ", c.category, "|", c.tag, "|", c.n);

  const sample = await prisma.$queryRawUnsafe(
    `SELECT tag, question, category, keywords, priority, substr(answer,1,120) AS answer FROM "KBEntry" WHERE "clientId" = '${clientId}' AND category ILIKE '%Présentation%' LIMIT 6`
  );
  console.log("\nExemple entrées Présentation:");
  for (const s of sample) console.log("  TAG:", s.tag, "| Q:", s.question, "| KW:", s.keywords, "| PRIO:", s.priority);
  await prisma.$disconnect();
})();
