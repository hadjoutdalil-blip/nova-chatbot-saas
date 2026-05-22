import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const client = await prisma.client.findUnique({ where: { slug: "NC" } });
  if (!client) {
    console.log("No client found with slug: NC");
    return;
  }
  console.log("Client:", client.name, client.id);
  const users = await prisma.user.findMany({ where: { clientId: client.id } });
  console.log("Users:", users.length);
  for (const u of users) {
    console.log("  -", u.email, u.role, u.name);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
