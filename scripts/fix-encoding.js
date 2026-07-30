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
  const count = await prisma.kBEntry.deleteMany({ where: { clientId: client.id, tag: "labo_metrologie" } });
  console.log("Deleted:", count.count);
  await prisma.$disconnect();
})();
