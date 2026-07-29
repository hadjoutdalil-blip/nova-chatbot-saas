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
    question: "Comment accéder à la bibliothèque de l'ESTIN ?",
    answer: "La bibliothèque numérique de l'ESTIN est accessible à l'adresse : https://biblio.estin.dz/",
  },
  {
    question: "Quel est le site de la bibliothèque ESTIN ?",
    answer: "Bibliothèque ESTIN : https://biblio.estin.dz/",
  },
  {
    question: "Où trouver les cours et ressources pédagogiques à l'ESTIN ?",
    answer: "Le repository des cours ESTIN est disponible à : https://estin-student.vercel.app/",
  },
  {
    question: "Comment accéder au repo des cours ESTIN ?",
    answer: "Repository des cours ESTIN : https://estin-student.vercel.app/",
  },
  {
    question: "Qu'est-ce que l'INTRANET ESTIN ?",
    answer: `L'INTRANET ESTIN est l'annuaire des applications pour les enseignants, étudiants et administrateurs de l'ESTIN. Il donne accès à :
- E-Learn (plateforme pédagogique)
- DSpace (archives numériques)
Et d'autres applications.

Accès : https://sites.google.com/estin.dz/intranet-estin/accueil`,
  },
  {
    question: "Comment accéder à l'intranet de l'ESTIN ?",
    answer: "INTRANET ESTIN : https://sites.google.com/estin.dz/intranet-estin/accueil",
  },
  {
    question: "Comment accéder à E-Learn (plateforme pédagogique) ESTIN ?",
    answer: "E-Learn ESTIN est accessible depuis l'INTRANET : https://sites.google.com/estin.dz/intranet-estin/accueil",
  },
  {
    question: "Comment accéder à DSpace ESTIN ?",
    answer: "DSpace ESTIN (archives numériques) est accessible depuis l'INTRANET : https://sites.google.com/estin.dz/intranet-estin/accueil",
  },
  {
    question: "Où trouver la web TV de l'ESTIN ?",
    answer: "La Web TV de l'ESTIN est disponible sur YouTube : https://www.youtube.com/@estinbejaia",
  },
  {
    question: "Chaîne YouTube de l'ESTIN",
    answer: "Chaîne YouTube officielle de l'ESTIN Bejaia : https://www.youtube.com/@estinbejaia",
  },
  {
    question: "Où trouver les textes réglementaires de l'ESTIN ?",
    answer: "Les textes réglementaires et lois de l'ESTIN sont disponibles à : https://sites.google.com/estin.dz/textesdelois",
  },
  {
    question: "Textes de lois et règlements ESTIN",
    answer: "Accès aux textes réglementaires de l'ESTIN : https://sites.google.com/estin.dz/textesdelois",
  },
  {
    question: "Où consulter les archives de l'ESTIN ?",
    answer: "Le dépôt des archives de l'ESTIN est accessible sur Valoria : https://valoria.estin.dz/search",
  },
  {
    question: "Comment accéder aux archives Valoria de l'ESTIN ?",
    answer: "Archives ESTIN (Valoria) : https://valoria.estin.dz/search",
  },
  {
    question: "Où vérifier le plagiat à l'ESTIN ?",
    answer: "Le détecteur de plagiat ESTIN est disponible sur Detectia : https://detectia.abysoft.net/integrity-portal/estin",
  },
  {
    question: "Détecteur de plagiat ESTIN",
    answer: "Plateforme de détection de plagiat pour l'ESTIN : https://detectia.abysoft.net/integrity-portal/estin",
  },
  {
    question: "Comment accéder au site du laboratoire LITAN ?",
    answer: "Site officiel du laboratoire LITAN : https://litan-five.vercel.app/",
  },
  {
    question: "Site web du LITAN",
    answer: "Laboratoire LITAN - Site officiel : https://litan-five.vercel.app/",
  },
  {
    question: "Comment accéder à l'œuvre sociale de l'ESTIN ?",
    answer: "L'œuvre sociale de l'ESTIN est accessible à : https://oeuvre-sociale.vercel.app/",
  },
  {
    question: "Œuvre sociale ESTIN",
    answer: "Plateforme de l'œuvre sociale ESTIN : https://oeuvre-sociale.vercel.app/",
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
          category: "Ressources ESTIN",
          keywords: "estin, ressources, bibliothèque, cours, intranet, elearn, dspace, web tv, textes, archives, plagiat, litan, oeuvre sociale",
          priority: 8,
          clientId,
        },
      });
      count++;
      console.log(`  ${count}. ${e.question.slice(0, 60)}`);
    }
    console.log(`\n✅ ${count} entrées Ressources ESTIN insérées.`);
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await prisma.$disconnect();
  }
})();
