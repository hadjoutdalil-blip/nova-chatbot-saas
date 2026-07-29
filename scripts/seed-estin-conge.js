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
    question: "Comment faire une demande de congé académique à l'ESTIN ?",
    answer: `Pour demander un congé académique à l'ESTIN pour l'année 2025/2026 :

1. Télécharger et renseigner le Formulaire de demande de Congé Académique
2. Constituer le dossier complet (les pièces requises sont indiquées sur le formulaire)
3. Déposer le dossier au Service de la pédagogie, bureau N°03
4. Dernier délai : 18/12/2025`,
  },
  {
    question: "Quelles sont les raisons valables pour un congé académique ESTIN ?",
    answer: "Les raisons exceptionnelles acceptées pour un congé académique sont :\n- Maladie chronique invalidante\n- Maternité\n- Maladie longue durée\n- Service National\n- Obligations familiales (ascendants, descendants, déplacement du conjoint ou des parents lié à la fonction)",
  },
  {
    question: "Où déposer le dossier de congé académique ESTIN ?",
    answer: "Le dossier de congé académique doit être déposé au Service de la pédagogie, bureau N°03 de l'ESTIN. Dernier délai : 18/12/2025.",
  },
  {
    question: "Quelle est la date limite pour le dépôt du congé académique ESTIN 2025/2026 ?",
    answer: "La date limite de dépôt des dossiers de congé académique est le 18 décembre 2025.",
  },
  {
    question: "Où sont affichés les résultats des demandes de congé académique ESTIN ?",
    answer: "Les résultats de l'étude des demandes de congé académique sont affichés sur le site officiel de l'école : https://estin.dz/",
  },
  {
    question: "Comment retirer la décision de congé académique ESTIN ?",
    answer: "Si votre dossier est accepté, vous devez faire signer le Quitus Congé Académique (à télécharger) et retirer la « Décision de Congé Académique » au plus tard 15 jours après l'affichage des résultats. Le non-retrait entraîne l'annulation du congé.",
  },
  {
    question: "Que se passe-t-il si je ne retire pas ma décision de congé académique ?",
    answer: "Le non-retrait de la décision dans les 15 jours suivant l'affichage des résultats entraîne l'annulation du Congé Académique accordé.",
  },
  {
    question: "Comment réintégrer l'ESTIN après un congé académique ?",
    answer: `Pour réintégrer après un congé académique 2025/2026 :

1. Réinscription en ligne du 13 au 25 juillet 2026
2. Demande de réintégration en ligne du 21 au 27 juillet 2026 via : https://docs.google.com/forms/d/e/1FAIpQLSdvkG90cfSt0mNv_AVaWz6sMmDgQCMTYJp7TSle5EUpSGkjjw/viewform
3. Dépôt du dossier de réintégration à l'administration en septembre 2026`,
  },
  {
    question: "Quels documents pour la réintégration après congé académique ESTIN ?",
    answer: `Dossier de réintégration à fournir :
1. Fiche de demande de réintégration (à télécharger sur le site de l'école)
2. Copie de la Décision du Congé Académique 2025/2026
3. Pour les cas médicaux : autorisation de reprise des études délivrée par le médecin traitant`,
  },
  {
    question: "Quand faire la réinscription après un congé académique ESTIN ?",
    answer: "Réinscription en ligne du 13 au 25 juillet 2026. Demande de réintégration en ligne du 21 au 27 juillet 2026. Dépôt du dossier physique en septembre 2026.",
  },
  {
    question: "Lien pour la réintégration en ligne après congé académique ESTIN",
    answer: "Demande de réintégration en ligne : https://docs.google.com/forms/d/e/1FAIpQLSdvkG90cfSt0mNv_AVaWz6sMmDgQCMTYJp7TSle5EUpSGkjjw/viewform",
  },
  {
    question: "Faut-il joindre la décision de congé académique à la réintégration ?",
    answer: "Oui, une copie de la Décision du Congé Académique 2025/2026 doit être jointe au dossier de réintégration. L'étudiant doit également présenter cette attestation pour justifier la suspension des études dans son cursus.",
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
          category: "Congé Académique ESTIN",
          keywords: "congé académique, suspension, réintégration, réinscription, dossier, pédagogie, quitus, décision",
          priority: 9,
          clientId,
        },
      });
      count++;
      console.log(`  ${count}. ${e.question.slice(0, 60)}`);
    }
    console.log(`\n✅ ${count} entrées Congé Académique ESTIN insérées.`);
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await prisma.$disconnect();
  }
})();
