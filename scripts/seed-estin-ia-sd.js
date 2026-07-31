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
    question: "Qu'est-ce que le programme en Intelligence Artificielle et Science des Données (IA & SD) de l'ESTIN ?",
    alt_questions: "présentation programme IA et science des données | qu'est ce que la formation IA & SD | c'est quoi le programme IA et SD à l'ESTIN",
    answer: `Le programme en **Intelligence Artificielle et Science des Données (IA & SD)** de l'ESTIN poursuit des objectifs à la fois professionnels et académiques, visant à répondre à la demande croissante de compétences dans ces secteurs à haut potentiel.

L'objectif principal est de former des **ingénieurs multidisciplinaires** capables de maîtriser l'ensemble du cycle de vie de la donnée : stockage, extraction, analyse et exploitation de grands volumes d'informations.`,
    keywords: "ia, intelligence artificielle, science des données, data science, programme, formation, ingénieur, multidisciplinaire, cycle de vie, donnée",
    category: "Formation IA & SD",
    priority: 10,
  },
  {
    question: "Quels sont les objectifs du programme IA & SD de l'ESTIN ?",
    alt_questions: "objectifs formation IA et SD | buts du programme IA science des données | à quoi sert la formation IA & SD",
    answer: `Le programme IA & SD de l'ESTIN vise à former des ingénieurs multidisciplinaires maîtrisant l'ensemble du cycle de vie de la donnée (stockage, extraction, analyse et exploitation de grands volumes d'informations). Ces compétences sont destinées à plusieurs finalités :

1. **Aide à la décision** : fournir des outils pour évaluer, optimiser et prédire des scénarios complexes.
2. **Innovation technologique** : mettre en œuvre des solutions numériques adaptées aux besoins spécifiques du marché du travail.
3. **Recherche** : préparer les étudiants à la recherche fondamentale et appliquée à travers une immersion dans des entités de recherche.
4. **Entrepreneuriat** : encourager et soutenir les étudiants dans la création de leurs propres entreprises ou start-up via le Pôle Entrepreneuriat.`,
    keywords: "objectifs, formation, ia, intelligence artificielle, science des données, aide à la décision, innovation, recherche, entrepreneuriat, cycle de vie de la donnée",
    category: "Formation IA & SD",
    priority: 9,
  },
  {
    question: "Quelles sont les finalités du programme IA & SD ?",
    alt_questions: "à quoi prépare le programme IA et SD | finalités de la formation IA science des données",
    answer: `Le programme IA & SD de l'ESTIN prépare les étudiants à :

- **Aide à la décision** : évaluer, optimiser et prédire des scénarios complexes.
- **Innovation technologique** : développer des solutions numériques adaptées au marché du travail.
- **Recherche** : recherche fondamentale et appliquée via une immersion dans des entités de recherche.
- **Entrepreneuriat** : création d'entreprises ou de start-up via le Pôle Entrepreneuriat.

Le complément de master vise spécifiquement à doter les étudiants de compétences pour formuler des problèmes de recherche, analyser des articles scientifiques et réaliser des revues de l'état de l'art.`,
    keywords: "finalités, aide à la décision, innovation, recherche, entrepreneuriat, start-up, pôle entrepreneuriat, master, état de l'art",
    category: "Formation IA & SD",
    priority: 8,
  },
  {
    question: "Quels sont les débouchés professionnels du programme IA & SD ?",
    alt_questions: "débouchés formation IA et science des données | métiers après le programme IA & SD | carrières IA SD ESTIN",
    answer: `Les diplômés du programme IA & SD de l'ESTIN peuvent prétendre à une grande variété de métiers spécialisés, notamment :

- Ingénieur en IA et Data Scientist
- Data Engineer et Data Designer
- Chef de projet Big Data ou Chef de projet transformation digitale
- Développeur Big Data et Consultant Analytics`,
    keywords: "débouchés, métiers, carrières, data scientist, data engineer, big data, transformation digitale, consultant analytics, chef de projet",
    category: "Formation IA & SD",
    priority: 10,
  },
  {
    question: "Dans quels secteurs d'activité les diplômés IA & SD peuvent-ils travailler ?",
    alt_questions: "domaines d'application IA et SD | secteurs d'activité data science | où travaillent les diplômés IA SD",
    answer: `Le programme IA & SD de l'ESTIN cible des secteurs stratégiques où l'IA apporte une valeur ajoutée significative :

1. **Santé Publique** : numérisation des dossiers patients (Smart Healthcare), aide au diagnostic médical, imagerie médicale et prédiction de crises sanitaires.
2. **Secteur Industriel** : maintenance prédictive, robotique intelligente, automatisation et optimisation des processus de production.
3. **Économie et Marketing** : analyse des tendances du marché et ciblage précis des clients grâce à l'IA.
4. **Finance (Banques et Assurances)** : détection de fraudes, évaluation des risques et optimisation des offres clients.
5. **E-Gouvernance** : numérisation des administrations publiques et mise en place de systèmes d'aide à la décision pour les services de l'État.`,
    keywords: "secteurs, domaines, santé, industrie, maintenance prédictive, marketing, finance, banque, assurance, e-gouvernance, fraudes, imagerie médicale, robotique",
    category: "Formation IA & SD",
    priority: 9,
  },
  {
    question: "Le programme IA & SD forme-t-il à la recherche ?",
    alt_questions: "recherche programme IA SD | formation à la recherche scientifique IA data | master recherche IA",
    answer: `Oui, le programme IA & SD de l'ESTIN prépare les étudiants à la recherche fondamentale et appliquée à travers une immersion dans des entités de recherche. Le complément de master vise spécifiquement à doter les étudiants de compétences pour formuler des problèmes de recherche, analyser des articles scientifiques et réaliser des revues de l'état de l'art.`,
    keywords: "recherche, master, recherche fondamentale, recherche appliquée, état de l'art, articles scientifiques, immersion, entités de recherche",
    category: "Formation IA & SD",
    priority: 8,
  },
  {
    question: "Le programme IA & SD encourage-t-il l'entrepreneuriat ?",
    alt_questions: "entrepreneuriat programme IA SD | création de start-up IA SD | pôle entrepreneuriat ESTIN",
    answer: `Oui, le programme IA & SD de l'ESTIN encourage et soutient les étudiants dans la création de leurs propres entreprises ou start-up via le Pôle Entrepreneuriat de l'école.`,
    keywords: "entrepreneuriat, start-up, pôle entrepreneuriat, création d'entreprise, innovation",
    category: "Formation IA & SD",
    priority: 7,
  },
  {
    question: "Quelles compétences le programme IA & SD développe-t-il chez les étudiants ?",
    alt_questions: "compétences acquises formation IA SD | ce que les étudiants apprennent IA data science",
    answer: `Le programme IA & SD de l'ESTIN développe chez les étudiants la maîtrise de l'ensemble du cycle de vie de la donnée : stockage, extraction, analyse et exploitation de grands volumes d'informations, afin de former des ingénieurs multidisciplinaires capables d'appliquer l'IA à l'aide à la décision, à l'innovation technologique, à la recherche et à l'entrepreneuriat.`,
    keywords: "compétences, cycle de vie de la donnée, stockage, extraction, analyse, exploitation, grands volumes, multidisciplinaire",
    category: "Formation IA & SD",
    priority: 8,
  },
];

const TARGET_CLIENT_ID = "4e58898f-148a-4b64-9367-1e74cd74f9f0";

(async () => {
  try {
    const client = await prisma.client.findUnique({ where: { id: TARGET_CLIENT_ID } });
    if (!client) {
      console.error("Client ESTIN introuvable avec cet ID. Vérifiez l'ID.");
      process.exit(1);
    }
    console.log(`Client: ${client.name} (${client.id})`);

    let count = 0;
    for (const e of entries) {
      const existing = await prisma.kBEntry.findFirst({
        where: { clientId: TARGET_CLIENT_ID, question: e.question },
      });
      if (existing) {
        console.log(`  ⏭️  existe déjà: ${e.question.slice(0, 60)}`);
        continue;
      }
      await prisma.kBEntry.create({
        data: {
          tag: "ia_sd",
          question: e.question,
          alt_questions: e.alt_questions || "",
          answer: e.answer,
          category: e.category,
          keywords: e.keywords,
          priority: e.priority ?? 5,
          icon: "🤖",
          source: "Programme IA & SD – ESTIN",
          clientId: TARGET_CLIENT_ID,
        },
      });
      count++;
      console.log(`  ${count}. ${e.question.slice(0, 60)}`);
    }
    console.log(`\n✅ ${count} entrée(s) IA & SD insérées.`);
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await prisma.$disconnect();
  }
})();
