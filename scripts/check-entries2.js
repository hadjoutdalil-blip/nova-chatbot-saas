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
  const client = await prisma.client.findUnique({ where: { slug: "cetim" } });
  const entries = await prisma.kBEntry.findMany({ where: { clientId: client.id, tag: "labo_metrologie" }, orderBy: { createdAt: "desc" }, take: 5 });
  for (const e of entries) {
    console.log("Q:", e.question.substring(0, 80));
    console.log("  source:", e.source);
  }
  const total = await prisma.kBEntry.count({ where: { clientId: client.id, tag: "labo_metrologie" } });
  console.log("Total metrologie entries:", total);
  await prisma.$disconnect();
})();
