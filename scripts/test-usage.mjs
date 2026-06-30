import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { randomUUID } from "crypto";

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  // 1. List delegates
  const keys = Object.keys(prisma).filter(k => !k.startsWith("_") && !k.startsWith("$"));
  console.log("Delegates:", keys.join(", "));
  console.log("Has aIUsageLog:", "aIUsageLog" in prisma);

  // 2. Find a real client
  const client = await prisma.client.findFirst();
  if (!client) { console.log("No client in DB"); return; }
  console.log("Using client:", client.id, client.name);

  // 3. Create test entry with real clientId
  const id = randomUUID();
  console.log("Creating entry...");
  await prisma.aIUsageLog.create({
    data: {
      id,
      clientId: client.id,
      provider: "groq",
      model: "llama-3.1-8b-instant",
      promptTokens: 10,
      completionTokens: 5,
      totalTokens: 15,
    },
  });
  console.log("Created");

  // 4. Read it back
  const found = await prisma.aIUsageLog.findMany({ where: { id } });
  console.log("Found:", found.length, JSON.stringify(found[0]));

  // 5. Delete
  await prisma.aIUsageLog.delete({ where: { id } });
  console.log("Deleted - OK");

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("ERROR:", e?.message || e);
  process.exit(1);
});
