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
  try {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "siteUrl" TEXT NOT NULL DEFAULT ''`
    );
    console.log("OK: added siteUrl to Client");
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await prisma.$disconnect();
  }
})();
