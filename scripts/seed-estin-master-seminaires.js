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
    question: "En quoi consiste le module Research Seminars and Scientific Communication ?",
    alt_questions: "module séminaires de recherche communication scientifique | cours research seminars ESTIN master | séminaires de recherche commun aux spécialités",
    answer: `Le module **"Research Seminars and Scientific Communication"** (**Séminaires de recherche et communication scientifique**) est **commun aux trois spécialités du Master** : IA, Cybersécurité et IoT.

Il aborde **quatre thèmes principaux** :

1. **Organisation des séminaires de recherche** : le rôle des séminaires au sein des communautés scientifiques, la présentation des avancées récentes et les techniques de discussion et de débat scientifique.
2. **Compétences en présentation scientifique** : concevoir des présentations de recherche efficaces (structure type d'un exposé scientifique).
3. **Participation aux conférences et ateliers** : s'intégrer dans les événements scientifiques (conférences, workshops, symposiums).
4. **Éthique de la recherche et intégrité académique** : les pratiques responsables dans le monde de la recherche.

En complément des cours, les étudiants participent à des **activités pratiques** : animation de séminaires par les étudiants eux-mêmes, présentation d'articles de recherche et participation à des événements scientifiques locaux ou virtuels.`,
    keywords: "research seminars, scientific communication, séminaires de recherche, communication scientifique, ia, cybersécurité, iot, thèmes, conférences, éthique, activités pratiques",
    category: "Programme Master – Séminaires",
    priority: 10,
  },
  {
    question: "Que couvre le thème Organisation des séminaires de recherche ?",
    alt_questions: "organisation séminaires recherche ESTIN | rôle des séminaires scientifiques | présentation avancées récentes débat scientifique",
    answer: `Ce premier thème **explore le rôle des séminaires au sein des communautés scientifiques**. Il traite de :

- La **présentation des avancées récentes** de la recherche,
- Les **techniques de discussion et de débat scientifique**.

Les étudiants apprennent ainsi à animer et structurer des séminaires comme le font les communautés de recherche internationales.`,
    keywords: "organisation séminaires, rôle des séminaires, communautés scientifiques, avancées récentes, discussion, débat scientifique",
    category: "Programme Master – Séminaires",
    priority: 8,
  },
  {
    question: "Que couvre le thème Compétences en présentation scientifique ?",
    alt_questions: "compétences présentation scientifique | structure exposé scientifique | techniques communication visuelle questions réponses",
    answer: `L'objectif de ce thème est d'apprendre à **concevoir des présentations de recherche efficaces**. Les étudiants étudient la **structure type d'un exposé scientifique** :

1. **Motivation et énoncé du problème**,
2. **Méthodologie et résultats**,
3. **Perspectives futures**,

ainsi que les :
- **techniques de communication visuelle**,
- la **gestion des questions-réponses** (Q&A).`,
    keywords: "présentation scientifique, exposé scientifique, structure, motivation, énoncé du problème, méthodologie, résultats, perspectives futures, communication visuelle, questions-réponses",
    category: "Programme Master – Séminaires",
    priority: 8,
  },
  {
    question: "Que couvre le thème Participation aux conférences et ateliers ?",
    alt_questions: "participation conférences workshops symposiums | préparation abstract poster présentation orale | intégration événements scientifiques",
    answer: `Ce volet **prépare les étudiants à s'intégrer dans les événements scientifiques** : conférences, **workshops** (ateliers) et **symposiums**.

Il couvre la préparation de :
- **Résumés de conférence** (**abstracts**),
- **Présentations par posters**,
- **Présentations orales**.

Les étudiants acquièrent ainsi les codes concrets de la communication scientifique dans les événements internationaux.`,
    keywords: "conférences, workshops, symposiums, abstracts, résumés, posters, présentations orales, événements scientifiques, intégration",
    category: "Programme Master – Séminaires",
    priority: 8,
  },
  {
    question: "Que couvre le thème Éthique de la recherche et intégrité académique ?",
    alt_questions: "éthique de la recherche ESTIN | intégrité académique prévention plagiat | reproductibilité transparence recherche",
    answer: `Un **accent particulier** est mis sur les **pratiques responsables dans le monde de la recherche** :

- **Prévention du plagiat**,
- **Utilisation responsable des ressources scientifiques**,
- **Reproductibilité et transparence** des travaux de recherche.

Ce thème garantit que les futurs chercheurs de l'ESTIN respectent les standards d'intégrité exigés par la communauté scientifique internationale.`,
    keywords: "éthique de la recherche, intégrité académique, prévention du plagiat, ressources scientifiques, reproductibilité, transparence, pratiques responsables",
    category: "Programme Master – Séminaires",
    priority: 9,
  },
  {
    question: "Quelles sont les activités pratiques du module Research Seminars ?",
    alt_questions: "activités pratiques séminaires de recherche | animation séminaires par les étudiants | présentation articles recherche événements locaux",
    answer: `En complément des cours, les étudiants participent à des **activités pratiques** :

- **Animation de séminaires par les étudiants eux-mêmes**,
- **Présentation d'articles de recherche**,
- **Participation à des événements scientifiques locaux ou virtuels**.

Ces mises en situation concrètes permettent d'appliquer immédiatement les compétences théoriques acquises dans les quatre thèmes du module.`,
    keywords: "activités pratiques, animation séminaires, étudiants, présentation articles, événements scientifiques locaux, événements virtuels, mise en situation",
    category: "Programme Master – Séminaires",
    priority: 8,
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
          tag: "master_seminaires",
          question: e.question,
          alt_questions: e.alt_questions || "",
          answer: e.answer,
          category: e.category,
          keywords: e.keywords,
          priority: e.priority ?? 5,
          icon: "🎓",
          source: "Programme Master ESTIN – Séminaires",
          clientId: TARGET_CLIENT_ID,
        },
      });
      count++;
      console.log(`  ${count}. ${e.question.slice(0, 60)}`);
    }
    console.log(`\n✅ ${count} entrée(s) Master – Séminaires insérées.`);
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await prisma.$disconnect();
  }
})();
