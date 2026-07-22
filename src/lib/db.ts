import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

function createPrismaClient(): PrismaClient {
  const url = process.env.DATABASE_URL || "";
  const opts: any = { datasourceUrl: url };
  if (url.includes("neon.tech")) {
    try {
      const { PrismaNeon } = require("@prisma/adapter-neon");
      opts.adapter = new PrismaNeon({ connectionString: url });
    } catch {}
  }
  return new PrismaClient(opts);
}

const prisma = globalForPrisma.prisma ?? createPrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export const db = { prisma };
export { prisma };
