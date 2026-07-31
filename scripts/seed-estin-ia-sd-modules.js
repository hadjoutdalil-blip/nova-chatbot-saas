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
    question: "Comment est structuré le programme d'ingénierie IA & SD sur trois ans ?",
    alt_questions: "structure programme ingénieur IA SD 3 ans | organisation cursus IA SD tronc commun spécialisation | 6 semestres programme IA data science",
    answer: `Le programme d'ingénierie en **Intelligence Artificielle et Science des Données (IA & SD)** de l'ESTIN s'étale sur **trois ans (six semestres)**.

Il se structure comme suit :
1. **Première Année** : **tronc commun** aux spécialités, qui pose les bases avancées de l'informatique et des mathématiques nécessaires pour l'IA.
2. **Deuxième Année** : **spécialisation intensive** en IA & Science des Données (manipulation de grands volumes de données).
3. **Troisième Année** : expertise technique, **complément de formation pour l'obtention du diplôme de Master** et **PFE** au S6.

Cette architecture garantit une progression cohérente : fondations solides, puis immersion dans la spécialité, et enfin orientation recherche/master.`,
    keywords: "structure, trois ans, six semestres, tronc commun, spécialisation, master, pfe, progression, architecture du cursus",
    category: "Programme IA & SD – Modules",
    priority: 10,
  },
  {
    question: "Quels sont les modules du Semestre 1 (année de tronc commun) du programme IA & SD ?",
    alt_questions: "modules S1 IA SD tronc commun | semestre 1 système exploitation réseaux HPC | modules S1 ingénieur IA",
    answer: `Le **Semestre 1** de la première année (tronc commun) comprend :

- **Systèmes et Réseaux** : Systèmes d'exploitation, Réseaux 1.
- **Données et Architecture** : Architectures distribuées et Calcul haute performance (**HPC**), Bases de données avancées.
- **Mathématiques et Théorie** : Recherche opérationnelle 1, Processus stochastiques et files d'attente, Théorie des langages formels.
- **Ouverture** : Introduction à la sécurité informatique.`,
    keywords: "s1, systèmes d'exploitation, réseaux 1, architectures distribuées, hpc, calcul haute performance, bases de données avancées, recherche opérationnelle, processus stochastiques, files d'attente, théorie des langages formels, sécurité informatique",
    category: "Programme IA & SD – Modules",
    priority: 9,
  },
  {
    question: "Quels sont les modules du Semestre 2 (année de tronc commun) du programme IA & SD ?",
    alt_questions: "modules S2 IA SD tronc commun | semestre 2 programmation parallèle IA fondements data mining | modules S2 ingénieur IA",
    answer: `Le **Semestre 2** de la première année (tronc commun) comprend :

- **Informatique et IA** : Programmation parallèle et HPC, Réseaux 2, Intelligence Artificielle (fondements), Fondements de la Data Science et **Data Mining**.
- **Outils de l'Ingénieur** : Recherche opérationnelle 2, Complexité algorithmique, Analyse numérique.
- **Entrepreneuriat** : Entrepreneuriat et Startups numériques.`,
    keywords: "s2, programmation parallèle, hpc, réseaux 2, intelligence artificielle fondements, data science, data mining, recherche opérationnelle 2, complexité algorithmique, analyse numérique, entrepreneuriat, startups numériques",
    category: "Programme IA & SD – Modules",
    priority: 9,
  },
  {
    question: "Quels sont les modules du Semestre 3 (spécialisation IA & SD) ?",
    alt_questions: "modules S3 IA SD spécialisation | semestre 3 machine learning nosql cloud computing | modules S3 ingénieur IA",
    answer: `Le **Semestre 3** de la deuxième année plonge dans le **cœur de la spécialité** et la manipulation de grands volumes de données :

- **IA et Données** : **Machine Learning**, Bases de données **NoSQL**, Analyse de données.
- **Génie Logiciel et Systèmes** : Méthodes formelles, Génie logiciel, **Cloud Computing**.
- **Management** : Gestion de projets (incluant désormais la méthode agile **SCRUM**), Technologies numériques dans les organisations.`,
    keywords: "s3, machine learning, nosql, analyse de données, méthodes formelles, génie logiciel, cloud computing, gestion de projets, scrum, technologies numériques",
    category: "Programme IA & SD – Modules",
    priority: 9,
  },
  {
    question: "Quels sont les modules du Semestre 4 (spécialisation IA & SD) ?",
    alt_questions: "modules S4 IA SD spécialisation | semestre 4 deep learning data warehousing systèmes multi-agents | modules S4 ingénieur IA",
    answer: `Le **Semestre 4** de la deuxième année approfondit l'IA avancée et le Big Data :

- **IA Avancée** : **Deep Learning**, Ingénierie des connaissances, Systèmes Multi-Agents.
- **Big Data et Optimisation** : **Data Warehousing et Big Data**, Bases de données distribuées, Optimisation non linéaire et théorie des jeux.
- **Signaux et Statistiques** : Fondements du traitement d'images, Statistiques appliquées avancées.`,
    keywords: "s4, deep learning, ingénierie des connaissances, systèmes multi-agents, data warehousing, big data, bases de données distribuées, optimisation non linéaire, théorie des jeux, traitement d'images, statistiques appliquées",
    category: "Programme IA & SD – Modules",
    priority: 9,
  },
  {
    question: "Quels sont les modules de spécialisation IA du Semestre 5 ?",
    alt_questions: "modules S5 spécialisation IA | semestre 5 reinforcement learning NLP business intelligence | modules S5 ingénieur IA expertise",
    answer: `Le **Semestre 5** de la troisième année prépare les étudiants à l'**expertise technique** avec les modules de spécialisation IA :

- **Reinforcement Learning** (Apprentissage par renforcement),
- **Reconnaissance de formes** pour l'analyse d'images,
- **Natural Language Processing (NLP)**,
- **Business Intelligence et Éthique de l'IA**.`,
    keywords: "s5, reinforcement learning, apprentissage par renforcement, reconnaissance de formes, analyse d'images, nlp, natural language processing, business intelligence, éthique de l'ia",
    category: "Programme IA & SD – Modules",
    priority: 9,
  },
  {
    question: "Quels sont les modules du complément Master (orientation recherche) au S5 ?",
    alt_questions: "complément master S5 IA SD orientation recherche | veille technologique revue littérature IA | méthodologie introduction recherche S5",
    answer: `Le **Semestre 5** inclut un **complément de formation pour l'obtention du diplôme de Master**, orienté **recherche** :

- **Veille technologique et revue de littérature avancée** en IA,
- **Séminaires de recherche et communication scientifique**,
- **Réalité virtuelle et augmentée**,
- **Méthodologie et introduction à la recherche**.

Ces modules préparent les étudiants aux exigences de la recherche académique et des études doctorales.`,
    keywords: "s5, complément master, orientation recherche, veille technologique, revue de littérature, séminaires de recherche, communication scientifique, réalité virtuelle, réalité augmentée, méthodologie, introduction à la recherche",
    category: "Programme IA & SD – Modules",
    priority: 9,
  },
  {
    question: "Comment se déroule le Projet de Fin d'Études (PFE) au Semestre 6 ?",
    alt_questions: "pfe S6 IA SD stage mémoire soutenance | projet fin d'études six mois entreprise laboratoire | thèse de recherche master S6",
    answer: `Le **Semestre 6** est consacré au **Projet de Fin d'Études (PFE)** :

- **Stage de six mois** en **entreprise** ou en **laboratoire**,
- conclu par la rédaction d'un **mémoire** (ou d'une **thèse de recherche** pour le parcours Master),
- et une **soutenance orale**.

Ce PFE permet à l'étudiant de mettre en pratique l'ensemble de ses compétences dans un environnement professionnel ou de recherche, en lien avec les enjeux réels de l'IA et de la science des données.`,
    keywords: "s6, pfe, projet fin d'études, stage six mois, entreprise, laboratoire, mémoire, thèse de recherche, soutenance orale, master",
    category: "Programme IA & SD – Modules",
    priority: 10,
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
          tag: "ia_sd_modules",
          question: e.question,
          alt_questions: e.alt_questions || "",
          answer: e.answer,
          category: e.category,
          keywords: e.keywords,
          priority: e.priority ?? 5,
          icon: "🎓",
          source: "Programme IA & SD – ESTIN",
          clientId: TARGET_CLIENT_ID,
        },
      });
      count++;
      console.log(`  ${count}. ${e.question.slice(0, 60)}`);
    }
    console.log(`\n✅ ${count} entrée(s) Programme IA & SD – Modules insérées.`);
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await prisma.$disconnect();
  }
})();
