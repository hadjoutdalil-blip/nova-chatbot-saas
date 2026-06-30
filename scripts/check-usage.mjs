import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL }),
});

const client = await prisma.client.findFirst();
if (!client) { console.log("No clients found"); process.exit(0); }

console.log("Client:", client.id, client.slug, client.name);

const logs = await prisma.aIUsageLog.findMany({ where: { clientId: client.id } });
console.log("AIUsageLog rows:", logs.length);
for (const l of logs) {
  console.log("  ", l.provider, l.model, l.totalTokens, l.createdAt);
}

const allLogs = await prisma.aIUsageLog.findMany();
console.log("Total AIUsageLog rows:", allLogs.length);

await prisma.$disconnect();
