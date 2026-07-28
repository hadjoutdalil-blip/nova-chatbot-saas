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
  const clients = await prisma.client.findMany({ select: { id: true, name: true, slug: true } });
  console.log("Clients found:");
  for (const c of clients) console.log(`  ${c.id}  |  ${c.name}  (${c.slug})`);
  await prisma.$disconnect();
})();
