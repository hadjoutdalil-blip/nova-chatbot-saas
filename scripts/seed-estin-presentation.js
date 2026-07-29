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
    question: "Présentation générale de l'ESTIN",
    answer: `L'École Supérieure en Sciences et Technologies de l'Informatique et du Numérique (ESTIN) est une grande école située à Amizour, Béjaia.

Site : Campus Amizour, Béjaia
Coordonnées : N36°39'54" E4°54'36"
Surface totale : 08 hectares
Surface constructible : 50 000 m²

L'ESTIN est dirigée par un directeur assisté de directeurs adjoints (pédagogie, recherche, RELEX), d'un secrétaire général et d'un directeur de la bibliothèque conformément au décret exécutif n° 16-176 du 14/06/2016 portant statut des grandes écoles.`,
  },
  {
    question: "Où se trouve l'ESTIN ?",
    answer: "L'ESTIN est située sur le Campus Amizour, à Béjaia, Algérie. Coordonnées GPS : N36°39'54\" E4°54'36\".",
  },
  {
    question: "Quelle est la superficie de l'ESTIN ?",
    answer: "L'ESTIN dispose d'une assiette foncière de 08 hectares, avec une surface constructible de 50 000 m².",
  },
  {
    question: "Quel est le statut juridique de l'ESTIN ?",
    answer: "L'ESTIN est régie par le décret exécutif n° 16-176 du 14/06/2016 portant statut des grandes écoles. Elle est dotée d'organes administratifs et scientifiques pour évaluer les activités pédagogiques et scientifiques.",
  },
  {
    question: "Comment est organisée l'ESTIN ?",
    answer: `L'ESTIN est dirigée par un Directeur de l'École, administrée par un Conseil d'administration, et dotée d'un Conseil scientifique.

Le Directeur est assisté par :
- Directeur adjoint chargé des enseignements, des diplômes et de la formation continue
- Directeur adjoint chargé de la formation doctorale, de la recherche scientifique, du développement technologique, de l'innovation et de l'entreprenariat
- Directeur adjoint chargé des systèmes d'information et de communication et des relations extérieures
- Secrétaire général
- Directeur de la Bibliothèque
- Chefs de départements`,
  },
  {
    question: "Qui dirige l'ESTIN ?",
    answer: `L'ESTIN est dirigée par un Directeur de l'École, administrée par un Conseil d'administration, et dotée d'un Conseil scientifique. Le Directeur est responsable du fonctionnement général de l'École.`,
  },
  {
    question: "Quels sont les directeurs adjoints de l'ESTIN ?",
    answer: `Le Directeur de l'ESTIN est assisté par trois directeurs adjoints :
1. Directeur adjoint chargé des enseignements, des diplômes et de la formation continue
2. Directeur adjoint chargé de la formation doctorale, de la recherche scientifique et du développement technologique, de l'innovation et de la promotion de l'entreprenariat
3. Directeur adjoint chargé des systèmes d'information et de communication et des relations extérieures`,
  },
  {
    question: "Organisation du Directeur adjoint chargé des enseignements et diplômes",
    answer: `Le Directeur adjoint chargé des enseignements, des diplômes et de la formation continue est assisté par :
- Chef de service des enseignements, de l'évaluation et des stages
- Chef de service de la formation continue
- Chef de service des diplômes et des équivalences`,
  },
  {
    question: "Organisation du Directeur adjoint chargé de la recherche et de l'innovation",
    answer: `Le Directeur adjoint chargé de la formation doctorale, de la recherche scientifique et du développement technologique, de l'innovation et de la promotion de l'entreprenariat est assisté par :
- Chef de service de la formation de troisième cycle et de la post-graduation spécialisée
- Chef de service de la recherche et de la valorisation de ses résultats
- Chef de service de l'innovation et de la promotion de l'entreprenariat`,
  },
  {
    question: "Organisation du Directeur adjoint chargé des systèmes d'information et RELEX",
    answer: `Le Directeur adjoint chargé des systèmes d'information et de communication et des relations extérieures est assisté par :
- Chef de service de l'information et de la communication
- Chef de service des relations extérieures
- Chef de service des statistiques et de l'orientation`,
  },
  {
    question: "Organisation du Secrétaire général de l'ESTIN",
    answer: `Le Secrétaire général de l'ESTIN est assisté par :
- Sous-directeur des personnels, de la formation et des activités culturelles et sportives
- Sous-directeur des finances et des moyens`,
  },
  {
    question: "Organisation de la Bibliothèque de l'ESTIN",
    answer: `Le Directeur de la bibliothèque est assisté par :
- Chef de service de l'acquisition et traitement
- Chef de service de la recherche bibliographique
- Chef de service de l'accueil et de l'orientation`,
  },
  {
    question: "Organisation des départements à l'ESTIN",
    answer: "Le Chef de département est assisté par :\n- Chef de service de la formation du premier et second cycle\n- Chef de service de la formation de troisième cycle et des activités de la recherche scientifique",
  },
  {
    question: "Quels sont les organes de gouvernance de l'ESTIN ?",
    answer: "L'ESTIN est administrée par un Conseil d'administration et dotée d'un Conseil scientifique, conformément au décret exécutif n° 16-176 du 14/06/2016.",
  },
  {
    question: "Où télécharger la brochure de présentation de l'ESTIN ?",
    answer: "La brochure de présentation de l'ESTIN (Brochure_ESTIN) est disponible en téléchargement. Contactez l'administration pour l'obtenir.",
  },
  {
    question: "Quel est le texte fondateur de l'ESTIN ?",
    answer: "L'ESTIN est régie par le décret exécutif n° 16-176 du 14/06/2016, portant statut des grandes écoles.",
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
          category: "Présentation ESTIN",
          keywords: "estin, présentation, organisation, direction, département, conseil, administration, directeur, pédagogie, recherche, relex",
          priority: 10,
          clientId,
        },
      });
      count++;
      console.log(`  ${count}. ${e.question.slice(0, 60)}`);
    }
    console.log(`\n✅ ${count} entrées Présentation ESTIN insérées.`);
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await prisma.$disconnect();
  }
})();
