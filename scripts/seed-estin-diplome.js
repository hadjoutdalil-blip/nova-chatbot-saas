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
    question: "Comment retirer le diplôme final d'ingénieur à l'ESTIN ?",
    answer: "Le diplôme définitif d'ingénieur d'État est délivré sur demande. L'intéressé(e) doit déposer un dossier complet auprès du service des diplômes, en y incluant les pièces requises.",
  },
  {
    question: "Quels sont les documents requis pour le retrait du diplôme d'ingénieur ESTIN ?",
    answer: "Pour retirer votre diplôme final d'ingénieur à l'ESTIN, vous devez fournir les documents suivants :\n1. Extrait de naissance\n2. Original du Relevé de notes du BAC\n3. Originaux des Relevés de Notes du Cursus\n4. Attestation provisoire de succès\n5. Fiche de Renseignements (Ingénieur) à télécharger\n6. Demande manuscrite",
  },
  {
    question: "Comment contacter le service des diplômes de l'ESTIN ?",
    answer: "Pour toute information concernant les diplômes, contactez le service des diplômes par e-mail : service_des_diplomes@estin.dz",
  },
  {
    question: "Quel est l'email du service des diplômes ESTIN ?",
    answer: "service_des_diplomes@estin.dz",
  },
  {
    question: "Fiche de renseignements pour le diplôme d'ingénieur ESTIN",
    answer: "Une fiche de renseignements (Ingénieur) est à remplir et à joindre au dossier de demande de diplôme. Elle est disponible en téléchargement auprès du service des diplômes.",
  },
  {
    question: "Que faut-il pour la demande manuscrite du diplôme ESTIN ?",
    answer: "Une demande manuscrite doit être jointe au dossier de retrait du diplôme final d'ingénieur à l'ESTIN.",
  },
  {
    question: "Extrait de naissance pour le diplôme ESTIN",
    answer: "Un extrait de naissance est requis parmi les pièces à fournir pour le retrait du diplôme final d'ingénieur à l'ESTIN.",
  },
  {
    question: "Relevé de notes du BAC pour le diplôme ESTIN",
    answer: "L'original du relevé de notes du BAC doit être fourni pour le retrait du diplôme final d'ingénieur à l'ESTIN.",
  },
  {
    question: "Originaux des relevés de notes du cursus pour le diplôme ESTIN",
    answer: "Les originaux des relevés de notes de l'ensemble du cursus doivent être fournis pour le retrait du diplôme final d'ingénieur à l'ESTIN.",
  },
  {
    question: "Attestation provisoire de succès pour le diplôme ESTIN",
    answer: "L'attestation provisoire de succès doit être jointe au dossier de demande de diplôme final d'ingénieur à l'ESTIN.",
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
          category: "Diplômes ESTIN",
          keywords: "diplôme, ingénieur, retrait, dossier, documents, service diplômes, extrait naissance, relevé notes, attestation, demande manuscrite",
          priority: 9,
          clientId,
        },
      });
      count++;
      console.log(`  ${count}. ${e.question.slice(0, 60)}`);
    }
    console.log(`\n✅ ${count} entrées Diplôme ESTIN insérées.`);
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await prisma.$disconnect();
  }
})();
