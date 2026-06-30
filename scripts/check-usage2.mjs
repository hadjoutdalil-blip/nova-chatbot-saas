import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const p = new PrismaClient({
  adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL }),
});

// Most recent logs
const logs = await p.aIUsageLog.findMany({ orderBy: { createdAt: "desc" }, take: 20 });
for (const l of logs) {
  console.log(l.createdAt.toISOString().slice(0, 10), l.clientId.slice(0, 8), l.provider, l.model, l.totalTokens);
}

// Per-client counts
console.log("---");
const clients = await p.client.findMany({ select: { id: true, name: true, slug: true } });
for (const c of clients) {
  const cnt = await p.aIUsageLog.count({ where: { clientId: c.id } });
  console.log(c.slug, ":", cnt, "logs");
}

await p.$disconnect();
