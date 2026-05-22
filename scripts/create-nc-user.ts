import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import * as bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const client = await prisma.client.findUnique({ where: { slug: "NC" } });
  if (!client) {
    console.error("Client NC not found");
    return;
  }

  const existing = await prisma.user.findUnique({ where: { email: "client@nova.dz" } });
  if (existing) {
    console.log("User client@nova.dz already exists, updating password...");
    await prisma.user.update({
      where: { email: "client@nova.dz" },
      data: { password: bcrypt.hashSync("nova123", 10) },
    });
    console.log("Password updated");
    return;
  }

  await prisma.user.create({
    data: {
      id: randomUUID(),
      email: "client@nova.dz",
      password: bcrypt.hashSync("nova123", 10),
      name: "Client Nova Chatbot",
      role: "client",
      clientId: client.id,
    },
  });

  console.log("Created user: client@nova.dz / nova123 for Nova Chatbot");
}

main().catch(console.error).finally(() => prisma.$disconnect());
