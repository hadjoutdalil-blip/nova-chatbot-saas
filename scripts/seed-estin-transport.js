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
    question: "Quels sont les transports en commun pour l'ESTIN ?",
    answer: `Il existe 3 lignes de bus universitaires pour se rendre à l'ESTIN :

1. Targa → ESTIN via Oued Ghir et El Kseur : départ 07h20, retour 16h45
2. Targa → ESTIN via Tala Hamza : départ 07h30, retour 16h45
3. El Kseur → ESTIN : départ 07h45, retour 16h45`,
  },
  {
    question: "Ligne de bus Targa → ESTIN via Oued Ghir",
    answer: "1ère ligne : Campus Targa → ESTIN Amizour via Oued Ghir et El Kseur. Départ : 07h20, retour : 16h45. 01 bus.",
  },
  {
    question: "Ligne de bus Targa → ESTIN via Tala Hamza",
    answer: "2ème ligne : Campus Targa → ESTIN Amizour via Tala Hamza. Départ : 07h30, retour : 16h45. 01 bus.",
  },
  {
    question: "Ligne de bus El Kseur → ESTIN",
    answer: "3ème ligne : Campus El Kseur → ESTIN Amizour. Départ : 07h45, retour : 16h45. 01 bus.",
  },
  {
    question: "Quels sont les horaires des bus pour l'ESTIN ?",
    answer: "Départs le matin : 07h20, 07h30, 07h45 selon les lignes. Retours : 16h45 pour toutes les lignes.",
  },
  {
    question: "Puis-je prendre le transport universitaire depuis Amizour pour aller à Targa ?",
    answer: "Oui, en dehors des horaires dédiés à l'ESTIN (départs matin et retours soir), les étudiants peuvent bénéficier du transport universitaire vers les campus Targa et Aboudaou à partir de la station de transport Amizour 1 et 2, située juste à côté de l'ESTIN.",
  },
  {
    question: "Où se trouve la station de bus près de l'ESTIN ?",
    answer: "La station de transport universitaire Amizour 1 et 2 est située juste à côté de l'ESTIN. Elle permet de rejoindre les campus Targa et Aboudaou en dehors des horaires réservés à l'ESTIN.",
  },
  {
    question: "Y a-t-il un transport le soir pour quitter l'ESTIN ?",
    answer: "Oui, le retour des bus universitaires pour toutes les lignes est à 16h45. En dehors de ces horaires, les étudiants peuvent utiliser la station Amizour 1 et 2 à côté de l'ESTIN.",
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
          category: "Transport ESTIN",
          keywords: "transport, bus, navette, horaires, targa, elkseur, oued ghir, tala hamza, amizour, aboudaou, station",
          priority: 7,
          clientId,
        },
      });
      count++;
      console.log(`  ${count}. ${e.question.slice(0, 60)}`);
    }
    console.log(`\n✅ ${count} entrées Transport ESTIN insérées.`);
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await prisma.$disconnect();
  }
})();
