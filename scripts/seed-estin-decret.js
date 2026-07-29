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
    question: "Qu'est-ce que le décret exécutif n° 24-103 du 7 mars 2024 ?",
    answer: "Le décret exécutif n° 24-103 du 7 mars 2024 modifie et complète le décret exécutif n° 08-130 du 3 mai 2008 portant statut particulier de l'enseignant chercheur. Il prend effet au 1er janvier 2024.",
  },
  {
    question: "Quel est le volume horaire d'enseignement pour un enseignant chercheur ?",
    answer: "Le service d'enseignement de référence est de 192 heures de cours par an, ou 288 heures de travaux dirigés (TD) ou travaux pratiques (TP). 1h de cours = 1h30 de TD/TP.",
  },
  {
    question: "Quel est le nombre de semaines minimum d'enseignement par semestre ?",
    answer: "L'enseignant chercheur doit effectuer un volume d'enseignement semestriel minimal de 13 semaines, hors sessions d'examens.",
  },
  {
    question: "Quelles sont les missions des enseignants chercheurs ?",
    answer: "Les enseignants chercheurs doivent : dispenser un enseignement de qualité et actualisé (présentiel ou distance), participer à l'élaboration du savoir, contribuer à la dynamique de la recherche scientifique, adhérer aux entités de recherche, accompagner les étudiants vers l'insertion professionnelle, et promouvoir l'esprit entrepreneurial.",
  },
  {
    question: "Quels sont les grades dans le corps des enseignants chercheurs ?",
    answer: "Les grades sont : Assistant, Maître-assistant (classe B, classe A, et le nouveau grade Maître-assistant), Maître de conférences (classe B et A), et Professeur. Les grades Maître-assistant classe B et A sont mis en voie d'extinction.",
  },
  {
    question: "Qu'est-ce que le nouveau grade de Maître-assistant ?",
    answer: "Créé par le décret 24-103, le grade de Maître-assistant remplace les anciens grades Maître-assistant classe B et A (mis en voie d'extinction). Il est recruté sur titre (majors de promotion doctorat étranger) ou par concours sur titre (doctorat d'État ou équivalent).",
  },
  {
    question: "Quelles sont les tâches d'un Maître-assistant ?",
    answer: "Assurer les cours et/ou TD/TP, évaluer les étudiants, surveiller les examens, préparer et actualiser les cours, corriger les copies, participer aux jurys et délibérations, élaborer des polycopiés et manuels, encadrer les projets de fin d'études, promouvoir l'entrepreneuriat, accompagner les projets innovants, et recevoir les étudiants 3h/semaine.",
  },
  {
    question: "Quelles sont les tâches d'un Maître de conférences classe B ?",
    answer: "Assurer les cours et TD/TP, évaluer les étudiants, élaborer des polycopiés, surveiller les examens, participer aux jurys et à la préparation des sujets, encadrer les activités de formation externe, encadrer les PFE, contribuer à l'amélioration des méthodes pédagogiques, contribuer à la recherche et l'innovation, promouvoir l'entrepreneuriat, et recevoir les étudiants 3h/semaine.",
  },
  {
    question: "Quelles sont les tâches d'un Maître de conférences classe A ?",
    answer: "Assurer en priorité les cours et TD/TP, assurer des conférences et séminaires au niveau doctoral, évaluer les étudiants, surveiller les examens, encadrer les PFE, contribuer à l'amélioration pédagogique, contribuer à la recherche et l'innovation, promouvoir l'entrepreneuriat, et accompagner la création de filiales économiques.",
  },
  {
    question: "Quelles sont les tâches d'un Professeur ?",
    answer: "Assurer les cours, des conférences et séminaires au niveau doctoral, évaluer les étudiants, surveiller les examens, encadrer les PFE, contribuer à l'amélioration pédagogique, contribuer à la recherche et l'innovation, promouvoir l'entrepreneuriat, et accompagner la création de filiales économiques (start-up, PME, bureaux d'études).",
  },
  {
    question: "Les enseignants chercheurs doivent-ils recevoir les étudiants ?",
    answer: "Oui, tous les enseignants chercheurs (du Maître-assistant au Professeur) doivent recevoir les étudiants pendant 3 heures par semaine pour les conseiller et les orienter.",
  },
  {
    question: "Qu'est-ce que la liberté académique pour les enseignants chercheurs ?",
    answer: "Les enseignants chercheurs jouissent des libertés académiques dans les limites du respect des valeurs universitaires, des constantes nationales, de l'ordre public et des règles d'éthique et de déontologie de la profession universitaire.",
  },
  {
    question: "Les enseignants chercheurs ont-ils des droits sur leurs inventions ?",
    answer: "Oui, les enseignants chercheurs bénéficient de l'application de la législation en vigueur en matière de droits d'auteur et de droits voisins pour les inventions, découvertes et autres résultats de recherche réalisés.",
  },
  {
    question: "Quelle est la durée du stage probatoire pour un enseignant chercheur ?",
    answer: "Les enseignants chercheurs sont recrutés en qualité de stagiaires et doivent accomplir un stage probatoire d'une durée d'un an avant leur titularisation. Ils doivent suivre avec succès une formation pédagogique durant cette période.",
  },
  {
    question: "Comment se fait la titularisation d'un enseignant chercheur ?",
    answer: "La titularisation est prononcée par le responsable de l'établissement, sur proposition du doyen/directeur/chef de département, en prenant en compte les résultats de la formation pédagogique.",
  },
  {
    question: "Peut-on être muté en tant qu'enseignant chercheur ?",
    answer: "Oui, la mutation ne peut être prononcée que sur demande de l'enseignant chercheur. Les modalités sont fixées par arrêté du ministre de l'Enseignement supérieur.",
  },
  {
    question: "Qu'est-ce que la mise à disposition d'un enseignant chercheur ?",
    answer: "Un enseignant chercheur peut être mis à disposition d'un autre établissement universitaire pour un semestre ou une année, avec son accord, pour effectuer des tâches d'enseignement et de formation. Il continue à percevoir son salaire de son établissement d'origine.",
  },
  {
    question: "Quelle formation continue pour les enseignants chercheurs ?",
    answer: "L'administration doit organiser une formation continue permanente pour le perfectionnement et le développement des aptitudes professionnelles des enseignants chercheurs, notamment les nouvelles pratiques pédagogiques et les TIC.",
  },
  {
    question: "Qu'est-ce que l'éméritat pour les enseignants chercheurs ?",
    answer: "Les professeurs admis à la retraite remplissant les conditions peuvent bénéficier de l'éméritat à titre honorifique, après avis de la commission nationale de l'éméritat.",
  },
  {
    question: "Classification et indices des grades des enseignants chercheurs",
    answer: "Professeur : Hors catégorie, indice 1680. Maître de conférences A : Subdivision 7, indice 1480. Maître de conférences B : Subdivision 6, indice 1325. Maître-assistant A : Subdivision 4, indice 1255. Maître-assistant B : Subdivision 3, indice 1130. Maître-assistant : Subdivision 1, indice 1130. Assistant : Catégorie 13, indice 778.",
  },
  {
    question: "Bonification indiciaire des postes supérieurs enseignants chercheurs",
    answer: "Responsable d'équipe du domaine de formation : niveau 12, indice 585. Responsable d'équipe de la filière : niveau 11, indice 495. Responsable d'équipe de la spécialité : niveau 10, indice 415.",
  },
  {
    question: "Qu'est-ce que le décret exécutif n° 08-130 du 3 mai 2008 ?",
    answer: "C'est le décret portant statut particulier de l'enseignant chercheur, modifié et complété par le décret n° 24-103 du 7 mars 2024. Il définit les droits, obligations, missions, grades, recrutement et carrière des enseignants chercheurs.",
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
          category: "Textes Réglementaires",
          keywords: "décret, enseignant chercheur, statut, 24-103, 08-130, grade, maître-assistant, professeur, titularisation, stage, mutation, éméritat, volume horaire",
          priority: 7,
          clientId,
        },
      });
      count++;
      console.log(`  ${count}. ${e.question.slice(0, 60)}`);
    }
    console.log(`\n✅ ${count} entrées Textes Réglementaires insérées.`);
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await prisma.$disconnect();
  }
})();
