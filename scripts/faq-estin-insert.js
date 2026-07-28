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
  { question: "Pour les jours de réception des étudiants", answer: "Dimanche, Mardi et Jeudi" },
  { question: "Pour tout problème de messagerie (compte, Mot de passe)", answer: "Envoyer un message à ing_aitikhlef @ estin.dz" },
  { question: "Dans quels cas je peux demander un duplicata d'un document?", answer: "En cas de perte ou abime de document. Il faut présenter une déclaration sur l'honneur légalisée à la mairie (Bureau n° 2 et bureau n°3)" },
  { question: "Pour tout problème de talents ou elearn", answer: "Envoyer un message à ing_ouaret @ estin.dz et ing_guellal @ estin.dz" },
  { question: "Je veux le directeur adjoint pour problème personnel", answer: "Contacter le par e-mail d'abord," },
  { question: "Puis-je obtenir une copie conforme de mon relevé de note du BAC", answer: "Oui, il faut déposer une copie du relevé du BAC dans le (Bureau n°2), et repasser après 4 jours." },
  { question: "Puis-je obtenir une copie conforme immédiatement ?", answer: "Non, il y a une procédure de vérification. Cela prend du temps." },
  { question: "Puis-je retirer définitivement l'original du bac définitivement", answer: "Oui, vous devez remplir la déclaration sur l'honneur et le faire approuver par la mairie + quitus + décharge (Bureau n°2 et bureau n°3)" },
  { question: "Puis-je demander une attestation de langue, de bonne conduite et de classement", answer: "Contacter ade @ estin.dz" },
  { question: "Comment faire pour contacter un de mes enseignants de cours ou TD", answer: "Contacter par e-mail https://estin.dz/annuaire-des-enseignants/" },
  { question: "Comment faire pour contacter le directeur de ESTIN", answer: "Contacter par e-mail son assistante pour prendre un rendez-vous adg @ estin.dz" },
  { question: "Pour tout ce qui la bourse et l'hébergement de l'étudiant", answer: "Contacter la DOUB d'Elkseur (http://doub-elkseur.dz/), (située à la résidence Berchiche 3) et la résidence Amizour 2" },
  { question: "Pour vos problèmes de santé", answer: "Se rapprocher du centre médical de l'ESTIN ou contacter le médecin par e-mail medecin @ estin.dz" },
  { question: "Pour vos justificatifs médicaux", answer: "Se rapprocher du secrétariat des départements CP et CS ou les envoyer par e-mail (Bureau n°4)" },
  { question: "Comment faire pour avoir un congé académique", answer: "Dépôt de dossier avant les examens pour étude (Bureau n°2 et bureau n°3)" },
  { question: "Pour tout ce qui concerne les vacations des enseignants (Dossier à déposer, emploi du temps individuels)", answer: "Se rapprocher du secrétariat des départements CP et CS (Bureau n°4)" },
  { question: "Retirer l'attestation de fonction ATS et Enseignant", answer: "Contacter service personnel sdpersonnel @ estin.dz" },
  { question: "Retirer les listes des groupes, marqueurs, brosses", answer: "Se rapprocher du secrétariat des départements CP et CS (Bureau n°4)" },
  { question: "Remplir PV de carence (absence collective des étudiants)", answer: "Se rapprocher du secrétariat des départements CP et CS (Bureau n°4)" },
  { question: "Pour la documentation", answer: "Se rapprocher de la bibliothèque de l'école bibliothèque @ estin.dz" },
  { question: "Pour ce qui concerne le doctorat LMD", answer: "Se rapprocher du secrétariat de directeur adjoint chargé de la formation doctorale, de la recherche scientifique et du développement technologique, de l'innovation et de la promotion de l'entreprenariat. (Bureau n°12)" },
  { question: "Pour ce qui concerne les relations extérieures", answer: "Se rapprocher du secrétariat de directeur adjoint chargé des systèmes d'informations et de communication et des relations extérieures. (Bureau n°12)" },
  { question: "Ce qui concerne les CLUBS de l'école", answer: "Contacter service des activités culturelles: activites_culturelles @ estin.dz" },
  { question: "Ce qui concerne la sécurité", answer: "Contacter Monsieur AOUGHLIS Nabil: surete @ estin.dz" },
];

async function getClientId() {
  const client = await prisma.client.findFirst({ where: { slug: "estin" } });
  if (!client) throw new Error("Client ESTIN introuvable. Vérifie le slug dans la table Client.");
  return client.id;
}

(async () => {
  try {
    const clientId = await getClientId();
    console.log(`Client ESTIN ID: ${clientId}`);

    let count = 0;
    for (const e of entries) {
      await prisma.kBEntry.create({
        data: {
          question: e.question,
          answer: e.answer,
          category: "FAQ ESTIN",
          keywords: e.question.toLowerCase().split(" ").slice(0, 5).join(", "),
          priority: 5,
          clientId,
        },
      });
      count++;
      console.log(`  ${count}. ${e.question.slice(0, 50)}...`);
    }
    console.log(`\n${count} entrées FAQ ESTIN insérées.`);
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await prisma.$disconnect();
  }
})();
