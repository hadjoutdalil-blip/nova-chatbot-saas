import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import * as bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const clientId = randomUUID();
  const userId = randomUUID();
  const clientUserId = randomUUID();

  await prisma.client.create({
    data: {
      id: clientId,
      name: "CETIM Algérie",
      slug: "cetim",
      plan: "support",
      subdomain: "cetim",
      relanceActive: true,
    },
  });

  await prisma.user.createMany({
    data: [
      {
        id: userId,
        email: "admin@nova.dz",
        password: bcrypt.hashSync("admin123", 10),
        name: "Admin Nova",
        role: "admin",
        clientId,
      },
      {
        id: clientUserId,
        email: "client@cetim.dz",
        password: bcrypt.hashSync("client123", 10),
        name: "Client CETIM",
        role: "client",
        clientId,
      },
    ],
  });

  await prisma.widgetConfig.create({
    data: {
      id: randomUUID(),
      welcomeTitle: "Bienvenue chez CETIM",
      welcomeSub: "Je combine une base de connaissances et une IA.",
      showBrand: true,
      clientId,
    },
  });

  await prisma.kBEntry.createMany({
    data: [
      { id: randomUUID(), question: "Quels sont vos horaires d'ouverture ?", answer: "Nous sommes ouverts du lundi au vendredi de 8h30 à 18h00 et le samedi de 9h00 à 12h00.", category: "Horaires", keywords: "horaires, ouverture, fermeture", clientId },
      { id: randomUUID(), question: "Comment créer un compte ?", answer: "Rendez-vous sur notre page d'inscription.", category: "Compte", keywords: "création, compte", clientId },
      { id: randomUUID(), question: "J'ai oublié mon mot de passe", answer: "Cliquez sur 'Mot de passe oublié' sur la page de connexion.", category: "Compte", keywords: "mot de passe", clientId },
      { id: randomUUID(), question: "Comment résilier mon abonnement ?", answer: "Vous pouvez résilier depuis votre espace client.", category: "Abonnement", keywords: "résiliation", clientId },
      { id: randomUUID(), question: "Puis-je changer de formule ?", answer: "Oui, vous pouvez changer de formule à tout moment.", category: "Abonnement", keywords: "formule", clientId },
    ],
  });

  console.log("Seed done: CETIM client + admin + client user created in PostgreSQL");
}

main().catch(console.error).finally(() => prisma.$disconnect());
