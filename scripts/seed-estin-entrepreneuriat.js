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
    question: "L'ESTIN offre-t-elle des opportunités en entrepreneuriat pour ses étudiants ?",
    alt_questions: "quelles opportunités en entrepreneuriat à l'ESTIN | comment l'ESTIN favorise l'esprit d'entreprise | y a t il de l'entrepreneuriat à l'ESTIN",
    answer: `Oui, l'ESTIN offre de nombreuses opportunités pour favoriser l'esprit d'entreprise chez ses étudiants, en intégrant l'entrepreneuriat directement dans ses programmes académiques et en proposant des structures d'accompagnement dédiées.

Les principales opportunités sont :

1. **Modules de formation spécialisés** : Entrepreneuriat et Startups dans le Secteur Numérique, Lean Startup, Communication axée sur l'IA.
2. **Structures d'accompagnement** : le Pôle Entrepreneuriat et la mise en réseau avec le secteur socio-économique.
3. **Débouché majeur des programmes** : IA, Science des Données et systèmes connectés (ISIC) encouragent la transformation des résultats de recherche en projets commerciaux viables.

L'ESTIN ne se contente pas de former des ingénieurs salariés, mais cherche activement à stimuler une dynamique entrepreneuriale locale pour réduire la dépendance technologique et promouvoir l'innovation nationale.`,
    keywords: "entrepreneuriat, esprit d'entreprise, start-up, pôle entrepreneuriat, création d'entreprise, innovation, business plan",
    category: "Entrepreneuriat",
    priority: 10,
  },
  {
    question: "Quels sont les modules d'entrepreneuriat enseignés à l'ESTIN ?",
    alt_questions: "quels cours d'entrepreneuriat à l'ESTIN | modules entrepreneuriat et startups | formation à la création d'entreprise ESTIN",
    answer: `L'ESTIN a intégré plusieurs modules obligatoires pour former les étudiants aux bases de la création d'entreprise :

1. **Entrepreneuriat et Startups dans le Secteur Numérique** (S2) : développement des compétences essentielles pour lancer une startup numérique en Algérie. Les étudiants y apprennent à élaborer un Business Plan, à maîtriser la propriété intellectuelle (brevets, droits d'auteur) et à comprendre les mécanismes de financement et d'incubation.

2. **Lean Startup** (S4, deuxième année du second cycle) : méthodologie Lean Startup pour bâtir des projets innovants dans des environnements incertains, avec l'accent sur l'expérimentation, la validation d'hypothèses et le développement d'un Produit Minimum Viable (MVP).

3. **Communication axée sur l'IA** : exercices de "pitching" de projets (présentations courtes et percutantes), préparant les étudiants à présenter leurs idées devant des panels d'évaluation ou des investisseurs.`,
    keywords: "modules, cours, entrepreneuriat, lean startup, business plan, propriété intellectuelle, financement, incubation, mvp, pitching",
    category: "Entrepreneuriat",
    priority: 9,
  },
  {
    question: "Qu'est-ce que le module Entrepreneuriat et Startups dans le Secteur Numérique ?",
    alt_questions: "module entrepreneuriat et startups secteur numérique S2 | cours business plan startup numérique",
    answer: `Le module **Entrepreneuriat et Startups dans le Secteur Numérique** (S2) vise à développer les compétences essentielles pour lancer une startup numérique en Algérie.

Les étudiants y apprennent :
- à élaborer un **Business Plan**,
- à maîtriser la **propriété intellectuelle** (brevets, droits d'auteur),
- à comprendre les mécanismes de **financement et d'incubation**.`,
    keywords: "module, entrepreneuriat, startups, secteur numérique, business plan, propriété intellectuelle, brevets, financement, incubation",
    category: "Entrepreneuriat",
    priority: 8,
  },
  {
    question: "Qu'est-ce que le cours Lean Startup à l'ESTIN ?",
    alt_questions: "cours lean startup S4 ESTIN | méthodologie lean startup | produit minimum viable MVP",
    answer: `Le cours **Lean Startup**, dispensé en deuxième année du second cycle (S4), enseigne la méthodologie Lean Startup pour bâtir des projets innovants dans des environnements incertains.

Il met l'accent sur :
- l'**expérimentation**,
- la **validation d'hypothèses**,
- le développement d'un **Produit Minimum Viable (MVP)**.`,
    keywords: "lean startup, méthodologie, mvp, produit minimum viable, expérimentation, validation, hypothèses, S4, projets innovants",
    category: "Entrepreneuriat",
    priority: 8,
  },
  {
    question: "Comment l'ESTIN prépare-t-elle les étudiants à pitcher leurs projets ?",
    alt_questions: "pitching projets ESTIN | présentation devant investisseurs | module communication axée sur l'IA",
    answer: `Le module **Communication axée sur l'IA** inclut des exercices de **"pitching" de projets** (présentations courtes et percutantes), préparant les étudiants à présenter leurs idées devant des panels d'évaluation ou des investisseurs.`,
    keywords: "pitching, pitch, communication, présentation, investisseurs, panels d'évaluation, module communication IA",
    category: "Entrepreneuriat",
    priority: 7,
  },
  {
    question: "Qu'est-ce que le Pôle Entrepreneuriat de l'ESTIN ?",
    alt_questions: "pôle entrepreneuriat ESTIN | structure d'accompagnement création d'entreprise | soutien aux start-up ESTIN",
    answer: `L'ESTIN dispose d'un **Pôle Entrepreneuriat** dont la mission est de soutenir les étudiants dans la création de leurs propres entreprises ou start-up. C'est la structure d'accompagnement dédiée de l'école pour l'entrepreneuriat étudiant.`,
    keywords: "pôle entrepreneuriat, accompagnement, soutien, création d'entreprise, start-up, structure",
    category: "Entrepreneuriat",
    priority: 9,
  },
  {
    question: "L'ESTIN collabore-t-elle avec le secteur socio-économique pour l'entrepreneuriat ?",
    alt_questions: "partenariats entrepreneuriat ESTIN | réseau socio-économique | agences de soutien à l'emploi",
    answer: `Oui, l'ESTIN collabore avec des **agences de soutien à l'emploi** et des **opérateurs publics et privés** pour anticiper les nouveaux métiers et faciliter l'intégration des projets entrepreneuriaux des diplômés. Cette mise en réseau avec le secteur socio-économique vise à soutenir concrètement la création de start-up.`,
    keywords: "secteur socio-économique, partenariats, agences de soutien à l'emploi, opérateurs publics, opérateurs privés, intégration, nouveaux métiers",
    category: "Entrepreneuriat",
    priority: 8,
  },
  {
    question: "L'entrepreneuriat est-il un débouché du programme IA & SD et des systèmes connectés ?",
    alt_questions: "entrepreneuriat programme IA et IoT | transformation des recherches en projets commerciaux | start-up ISIC",
    answer: `Oui, l'entrepreneuriat est cité comme un **débouché majeur** pour les différentes spécialités de l'ESTIN. Les programmes en **Intelligence Artificielle** et en **systèmes connectés (ISIC)** encouragent explicitement les étudiants à transformer leurs résultats de recherche en projets commerciaux viables.

De plus, les indicateurs de performance de l'école mesurent spécifiquement le **taux de création de start-up** par les diplômés, soulignant l'importance accordée à cette voie.`,
    keywords: "débouché, ia, iot, systèmes connectés, isic, projets commerciaux, recherche, taux de création de start-up, indicateurs",
    category: "Entrepreneuriat",
    priority: 8,
  },
  {
    question: "Pourquoi l'ESTIN encourage-t-elle l'entrepreneuriat ?",
    alt_questions: "objectifs de l'entrepreneuriat ESTIN | pourquoi stimuler la dynamique entrepreneuriale",
    answer: `L'ESTIN ne se contente pas de former des ingénieurs salariés. Elle cherche activement à **stimuler une dynamique entrepreneuriale locale** pour :
- **réduire la dépendance technologique**,
- **promouvoir l'innovation nationale**.

C'est pourquoi l'entrepreneuriat est intégré dans les programmes académiques et soutenu par des structures dédiées comme le Pôle Entrepreneuriat.`,
    keywords: "pourquoi, objectifs, dynamique entrepreneuriale, dépendance technologique, innovation nationale, promotion, économie locale",
    category: "Entrepreneuriat",
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
          tag: "entrepreneuriat",
          question: e.question,
          alt_questions: e.alt_questions || "",
          answer: e.answer,
          category: e.category,
          keywords: e.keywords,
          priority: e.priority ?? 5,
          icon: "🚀",
          source: "Entrepreneuriat – ESTIN",
          clientId: TARGET_CLIENT_ID,
        },
      });
      count++;
      console.log(`  ${count}. ${e.question.slice(0, 60)}`);
    }
    console.log(`\n✅ ${count} entrée(s) Entrepreneuriat insérées.`);
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await prisma.$disconnect();
  }
})();
