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
  const entries = await prisma.kBEntry.findMany({ where: { clientId: client.id }, take: 5, orderBy: { createdAt: "desc" } });
  console.log("Last 5 entries in DB:");
  for (const e of entries) {
    console.log(`  [${e.tag}] ${e.question.substring(0,80)} | source: ${e.source}`);
  }
  await prisma.$disconnect();
})();
