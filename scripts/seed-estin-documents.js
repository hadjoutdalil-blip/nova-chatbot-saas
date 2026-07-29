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
    question: "Où trouver le formulaire de demande de réintégration ESTIN ?",
    answer: "Formulaire de demande de réintégration : https://estin.dz/wp-content/uploads/2022/10/Formulaire-de-demande-de-reintegration.pdf",
  },
  {
    question: "Où trouver le quitus pour congé académique ESTIN ?",
    answer: "Quitus congé académique : https://estin.dz/wp-content/uploads/2022/10/Quitus-Conge-Academique.pdf",
  },
  {
    question: "Documents pour un congé académique à l'ESTIN",
    answer: "Les documents pour un congé académique sont :\n- Formulaire de demande de réintégration : https://estin.dz/wp-content/uploads/2022/10/Formulaire-de-demande-de-reintegration.pdf\n- Quitus congé académique : https://estin.dz/wp-content/uploads/2022/10/Quitus-Conge-Academique.pdf",
  },
  {
    question: "Où trouver la convention de stage ESTIN ?",
    answer: "Convention de stage ESTIN : https://estin.dz/wp-content/uploads/2025/11/internship-agreement.pdf",
  },
  {
    question: "Où trouver le formulaire de demande de stage ESTIN ?",
    answer: "Formulaire de demande de stage : https://estin.dz/wp-content/uploads/2025/11/request-for-internship.pdf",
  },
  {
    question: "Documents pour une convention de stage à l'ESTIN",
    answer: "Les documents pour une convention de stage sont :\n- Convention de stage : https://estin.dz/wp-content/uploads/2025/11/internship-agreement.pdf\n- Demande de stage : https://estin.dz/wp-content/uploads/2025/11/request-for-internship.pdf",
  },
  {
    question: "Comment faire une demande de devis à l'ESTIN ?",
    answer: "La demande de devis s'effectue via le formulaire en ligne : https://docs.google.com/forms/d/e/1FAIpQLSf_YiOLRv-fw50huEULWnOZpsVhWa-OEmWBPizYgufXB-vL9A/closedform",
  },
  {
    question: "Formulaire de demande de devis ESTIN",
    answer: "Demande de devis ESTIN : https://docs.google.com/forms/d/e/1FAIpQLSf_YiOLRv-fw50huEULWnOZpsVhWa-OEmWBPizYgufXB-vL9A/closedform",
  },
  {
    question: "Où trouver le dépliant de présentation de l'ESTIN ?",
    answer: "Dépliant ESTIN : https://drive.google.com/file/d/1EprevSqVLgGc7rIeG1Om16EyQZLdfSO9/view",
  },
  {
    question: "Où trouver l'organigramme de l'ESTIN ?",
    answer: "Organigramme de l'ESTIN : https://estin.dz/wp-content/uploads/2026/04/Untitled-2.pdf",
  },
  {
    question: "Où télécharger la brochure de présentation de l'ESTIN ?",
    answer: "Brochure de présentation ESTIN : https://estin.dz/wp-content/uploads/2020/10/Brochure_ESTIN.pdf",
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
          category: "Documents & Formulaires ESTIN",
          keywords: "estin, documents, formulaires, congé académique, stage, devis, dépliant, organigramme, brochure, réintégration",
          priority: 7,
          clientId,
        },
      });
      count++;
      console.log(`  ${count}. ${e.question.slice(0, 60)}`);
    }
    console.log(`\n✅ ${count} entrées Documents ESTIN insérées.`);
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await prisma.$disconnect();
  }
})();
