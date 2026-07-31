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
    question: "Comment est structuré le programme de formation en Cybersecurity à l'ESTIN ?",
    alt_questions: "structure programme cybersécurité ESTIN 3 ans | organisation cursus cybersecurity tronc commun spécialisation | objectif formation sécurité ESTIN",
    answer: `Le programme de formation en **Cybersecurity** à l'ESTIN s'étend sur **trois ans** et est structuré pour **transformer les étudiants en experts** capables de :
- **sécuriser des infrastructures complexes**,
- **gérer des incidents** de sécurité,
- **mener des audits de sécurité**.

Le cursus se déroule comme suit :
1. **Première Année (Tronc Commun)** : bases communes aux trois spécialités.
2. **Deuxième Année (Spécialisation Cybersecurity)** : aspects techniques et méthodologiques de la sécurité.
3. **Troisième Année** : expertise industrielle et recherche académique, complément Master et **PFE** au S6.`,
    keywords: "structure, trois ans, cybersecurity, cybersécurité, tronc commun, spécialisation, expert sécurité, infrastructures complexes, incidents, audits de sécurité",
    category: "Programme Cybersecurity – Modules",
    priority: 10,
  },
  {
    question: "Quels sont les modules du Semestre 1 (tronc commun) du programme Cybersecurity ?",
    alt_questions: "modules S1 cybersecurity tronc commun | semestre 1 sécurité informatique cryptographie | modules S1 ingénieur cybersécurité",
    answer: `Le **Semestre 1** de la première année commence par un semestre de base commun aux trois spécialités :

- **Fondamentaux** : Systèmes d'exploitation, Réseaux 1, Architectures distribuées et calcul haute performance (**HPC**), Bases de données avancées.
- **Outils et Théorie** : Recherche opérationnelle 1, Processus stochastiques et files d'attente, Théorie des langages formels.
- **Sécurité** : **Introduction à la sécurité informatique** (cryptographie classique et moderne).`,
    keywords: "s1, systèmes d'exploitation, réseaux 1, architectures distribuées, hpc, bases de données avancées, recherche opérationnelle, processus stochastiques, files d'attente, théorie des langages formels, introduction sécurité informatique, cryptographie",
    category: "Programme Cybersecurity – Modules",
    priority: 9,
  },
  {
    question: "Quels sont les modules du Semestre 2 (tronc commun) du programme Cybersecurity ?",
    alt_questions: "modules S2 cybersecurity tronc commun | semestre 2 réseaux 2 IPv6 IA data mining | modules S2 ingénieur cybersécurité",
    answer: `Le **Semestre 2** de la première année (tronc commun) comprend :

- **Informatique et IA** : Programmation parallèle et HPC, Réseaux 2 (**IPv6, routage dynamique, QoS**), Intelligence Artificielle, Data Science et **Data Mining**.
- **Mathématiques** : Recherche opérationnelle 2, Complexité algorithmique, Analyse numérique.
- **Professionnalisation** : Entrepreneuriat et startups numériques.`,
    keywords: "s2, programmation parallèle, hpc, réseaux 2, ipv6, routage dynamique, qos, intelligence artificielle, data science, data mining, recherche opérationnelle 2, complexité algorithmique, analyse numérique, entrepreneuriat",
    category: "Programme Cybersecurity – Modules",
    priority: 9,
  },
  {
    question: "Quels sont les modules du Semestre 3 (spécialisation Cybersecurity) ?",
    alt_questions: "modules S3 cybersecurity spécialisation | semestre 3 machine learning cybersécurité nosql méthodes formelles | modules S3 ingénieur cybersécurité",
    answer: `Le **Semestre 3** de la deuxième année se concentre intensément sur les **aspects techniques et méthodologiques de la sécurité** :

- **Cœur technique** : **Machine Learning pour la cybersécurité**, Bases de données **NoSQL** (et leur sécurisation), Méthodes formelles pour la modélisation de systèmes.
- **Ingénierie** : Génie logiciel, Cloud Computing, Gestion de projets (incluant la méthode **SCRUM**), Analyse de données.
- **Administration** : Administration des systèmes et des réseaux.`,
    keywords: "s3, machine learning cybersécurité, nosql, méthodes formelles, modélisation systèmes, génie logiciel, cloud computing, gestion de projets, scrum, analyse de données, administration systèmes réseaux",
    category: "Programme Cybersecurity – Modules",
    priority: 9,
  },
  {
    question: "Quels sont les modules du Semestre 4 (spécialisation Cybersecurity) ?",
    alt_questions: "modules S4 cybersecurity spécialisation | semestre 4 devsecops cryptographie avancée audit sécurité | modules S4 ingénieur cybersécurité",
    answer: `Le **Semestre 4** de la deuxième année approfondit la **sécurité opérationnelle** et l'expertise :

- **Sécurité Opérationnelle** : **DevSecOps** et sécurité (**Kubernetes, Docker**), Méthodes formelles pour la sécurité, **Gestion des incidents de sécurité (CSIRT/ISIRT)**.
- **Expertise** : **Cryptographie avancée** (**ZKP, crypto post-quantique, blockchain**), Sécurité des réseaux, **Audit de sécurité** des systèmes d'information, Sécurité avancée des systèmes d'exploitation.
- **Biométrie** : Fondamentaux et modalités biométriques.`,
    keywords: "s4, devsecops, kubernetes, docker, méthodes formelles, gestion des incidents, csirt, isirt, cryptographie avancée, zkp, crypto post-quantique, blockchain, sécurité des réseaux, audit de sécurité, biométrie",
    category: "Programme Cybersecurity – Modules",
    priority: 9,
  },
  {
    question: "Quels sont les modules de spécialité du Semestre 5 en Cybersecurity ?",
    alt_questions: "modules S5 spécialité cybersécurité | semestre 5 pentest security cloud iot ethical hacking | modules S5 expertise sécurité",
    answer: `Le **Semestre 5** de la troisième année prépare à l'**expertise industrielle** :

- **Sécurité applicative et logicielle** : Analyse de code, **Pentest applicatif** et sécurité Web.
- **Sécurité des infrastructures** : Sécurité du **Cloud** et de l'**IoT**, Sécurité des **Blockchains**.
- **Défense active** : Techniques d'intrusion et de défense, **Anonymisation des données**, **Gouvernance de la sécurité et conformité** (RGPD, ISO 27001), **Ethical Hacking** (Hack éthique).`,
    keywords: "s5, analyse de code, pentest, sécurité web, sécurité cloud, sécurité iot, blockchains, techniques d'intrusion, anonymisation des données, gouvernance de la sécurité, rgpd, iso 27001, ethical hacking",
    category: "Programme Cybersecurity – Modules",
    priority: 9,
  },
  {
    question: "Quels sont les modules du complément Master (orientation recherche) au S5 en Cybersecurity ?",
    alt_questions: "complément master S5 cybersecurity recherche | veille cyber-menaces cyber threat intelligence | méthodologie recherche cybersécurité S5",
    answer: `Le **Semestre 5** inclut le **complément de formation pour l'obtention du diplôme de Master**, orienté **recherche** :

- **Veille sur les cyber-menaces (Cyber Threat Intelligence) et vulnérabilités**,
- **Séminaires de recherche et communication scientifique**,
- **Réalité virtuelle et augmentée**,
- **Méthodologie et introduction à la recherche**.

Ces modules préparent les étudiants de Cybersecurity à la recherche académique et aux études doctorales.`,
    keywords: "s5, complément master, cyber threat intelligence, veille cyber-menaces, vulnérabilités, séminaires de recherche, communication scientifique, réalité virtuelle, réalité augmentée, méthodologie, introduction à la recherche",
    category: "Programme Cybersecurity – Modules",
    priority: 9,
  },
  {
    question: "Comment se déroule le PFE du programme Cybersecurity au Semestre 6 ?",
    alt_questions: "pfe S6 cybersecurity stage mémoire soutenance | projet fin d'études sécurité six mois | diplôme ingénieur master cybersecurity",
    answer: `Le **Semestre 6** est consacré au **Projet de Fin d'Études (PFE)** :

- **Stage de six mois** en **entreprise** ou en **laboratoire de recherche**,
- conclu par un **mémoire** et une **soutenance orale**.

Ce PFE permet l'obtention du **diplôme d'ingénieur** et du **Master**, en appliquant les compétences de sécurité à un environnement professionnel ou de recherche réel.`,
    keywords: "s6, pfe, projet fin d'études, stage six mois, entreprise, laboratoire de recherche, mémoire, soutenance orale, diplôme d'ingénieur, master",
    category: "Programme Cybersecurity – Modules",
    priority: 10,
  },
];

const TARGET_CLIENT_ID = "b1993bb4-74df-404c-8b3c-93cc891336d3";

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
          tag: "cybersecurity_modules",
          question: e.question,
          alt_questions: e.alt_questions || "",
          answer: e.answer,
          category: e.category,
          keywords: e.keywords,
          priority: e.priority ?? 5,
          icon: "🎓",
          source: "Programme Cybersecurity – ESTIN",
          clientId: TARGET_CLIENT_ID,
        },
      });
      count++;
      console.log(`  ${count}. ${e.question.slice(0, 60)}`);
    }
    console.log(`\n✅ ${count} entrée(s) Programme Cybersecurity – Modules insérées.`);
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await prisma.$disconnect();
  }
})();
