import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const users = await prisma.user.findMany({ include: { client: true } });
  for (const u of users) {
    console.log(`Email: ${u.email}`);
    console.log(`  Name: ${u.name}`);
    console.log(`  Role: ${u.role}`);
    console.log(`  Client: ${u.client?.name || "N/A"} (slug: ${u.client?.slug || "N/A"})`);
    console.log(`  Client ID: ${u.clientId}`);
    console.log("");
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
