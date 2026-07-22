import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

function createPrismaClient(): PrismaClient {
  const url = process.env.DATABASE_URL || "";
  if (url.includes("neon.tech")) {
    try {
      const { PrismaNeon } = require("@prisma/adapter-neon");
      const adapter = new PrismaNeon({ connectionString: url });
      return new PrismaClient({ adapter });
    } catch {}
  }
  return new PrismaClient();
}

const prisma = globalForPrisma.prisma ?? createPrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export const db = { prisma };
export { prisma };
