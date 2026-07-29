const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaNeon } = require("@prisma/adapter-neon");
require("dotenv").config();

const url = process.env.DATABASE_URL || "";
const adapter = url.includes("neon.tech")
  ? new PrismaNeon({ connectionString: url })
  : new PrismaPg({ connectionString: url });
const prisma = new PrismaClient({ adapter });

const entries = [
  {
    question: "Y a-t-il une salle de sport à l'ESTIN ?",
    answer: "Oui, l'ESTIN dispose d'une salle de sport moderne, lumineuse et conviviale, ouverte aux étudiants et au personnel. Elle est conçue pour favoriser la forme physique, la détente et le bien-être au quotidien.",
  },
  {
    question: "Quels équipements sont disponibles à la salle de sport ESTIN ?",
    answer: "La salle de sport de l'ESTIN est équipée d'appareils de musculation, de cardio-training et d'espaces polyvalents pour les activités collectives.",
  },
  {
    question: "Quelles activités sportives sont proposées à l'ESTIN ?",
    answer: "La salle de sport de l'ESTIN propose des activités collectives telles que le fitness, le yoga et le renforcement musculaire, permettant à chacun de pratiquer une activité adaptée à ses besoins et à son niveau.",
  },
  {
    question: "Qui peut accéder à la salle de sport de l'ESTIN ?",
    answer: "La salle de sport de l'ESTIN est accessible aux étudiants et au personnel de l'école.",
  },
  {
    question: "La salle de sport ESTIN est-elle bien équipée ?",
    answer: "Oui, la salle de sport de l'ESTIN est un espace moderne et lumineux, équipée d'appareils de musculation, de cardio-training et d'espaces polyvalents pour les activités collectives (fitness, yoga, renforcement musculaire).",
  },
  {
    question: "Est-ce que l'ESTIN propose des activités de bien-être ?",
    answer: "Oui, l'ESTIN propose des activités de bien-être dans sa salle de sport, notamment le yoga, le fitness et le renforcement musculaire, dans un espace conçu pour la détente et le bien-être au quotidien.",
  },
];

const TARGET_CLIENT_ID = "4e58898f-148a-4b64-9367-1e74cd74f9f0";

(async () => {
  try {
    const clientId = TARGET_CLIENT_ID;
    console.log(`Client ESTIN ID: ${clientId}`);

    let count = 0;
    for (const e of entries) {
      await prisma.kBEntry.create({
        data: {
          question: e.question,
          answer: e.answer,
          category: "Sport & Bien-être ESTIN",
          keywords: "sport, salle de sport, fitness, yoga, musculation, cardio, bien-être, étudiants, personnel",
          priority: 6,
          clientId,
        },
      });
      count++;
      console.log(`  ${count}. ${e.question.slice(0, 60)}`);
    }
    console.log(`\n✅ ${count} entrées Sport ESTIN insérées.`);
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await prisma.$disconnect();
  }
})();
