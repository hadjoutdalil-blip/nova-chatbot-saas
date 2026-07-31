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
    question: "Le Master à l'ESTIN prépare-t-il les étudiants au doctorat ?",
    alt_questions: "master estin recherche doctorale | préparation doctorat master ESTIN | master axé recherche académique",
    answer: `Oui. Le programme de **Master à l'ESTIN est spécifiquement conçu pour préparer les étudiants à la recherche académique et aux études doctorales**.

Cette orientation se manifeste à travers plusieurs dispositifs pédagogiques et structures d'accompagnement :
- des **modules de préparation à la recherche** dès le S5,
- un **PFE à visée recherche** au S6,
- un **écosystème de recherche interne** (laboratoire LITAN),
- une **coopération internationale** avec des experts de doctorat,
- un **suivi par indicateurs** du passage en doctorat.

En résumé, l'école structure son Master comme un **véritable tremplin vers le doctorat**, en offrant les outils théoriques, pratiques et les connexions internationales nécessaires pour réussir dans le monde académique.`,
    keywords: "master, doctorat, recherche académique, études doctorales, tremplin, préparation recherche, orientation recherche",
    category: "Programme Master – Recherche",
    priority: 10,
  },
  {
    question: "Quels modules de préparation à la recherche sont enseignés au S5 du Master ?",
    alt_questions: "modules préparation recherche S5 | méthodologie recherche master ESTIN | séminaires de recherche communication scientifique",
    answer: `Dès le **cinquième semestre (S5)**, le cursus intègre des modules visant à **familiariser les étudiants avec les exigences du doctorat** :

1. **Méthodologie et introduction à la recherche** : ce cours enseigne comment effectuer des recherches bibliographiques, formuler une problématique de recherche et rédiger des articles scientifiques.
2. **Séminaires de recherche et communication scientifique** : ce module prépare les étudiants à présenter leurs avancées, à participer à des débats scientifiques et à maîtriser l'éthique de la recherche.
3. **Mini-State-of-the-Art Paper** : au lieu d'un examen classique, les étudiants rédigent un article d'état de l'art sur un sujet de pointe, formaté selon les standards internationaux (IEEE, ACM ou NeurIPS), constituant une initiation directe à la publication scientifique.`,
    keywords: "s5, méthodologie, introduction à la recherche, recherches bibliographiques, problématique, rédaction articles, séminaires, communication scientifique, éthique de la recherche, mini state of the art",
    category: "Programme Master – Recherche",
    priority: 10,
  },
  {
    question: "Quelle est la visée recherche du Projet de Fin d'Études (PFE) au S6 ?",
    alt_questions: "pfe recherche S6 master | research thesis stage ESTIN | projet fin d'études à visée recherche",
    answer: `Le **semestre 6** est consacré à un stage qui peut aboutir à une **thèse de recherche** (**Research Thesis**).

L'objectif est de doter l'étudiant de **compétences avancées** :
- **analyse critique** des approches existantes,
- **étude comparative**,
- **rédaction d'un rapport de synthèse** de niveau master.

Ce PFE à visée recherche constitue la pièce maîtresse du parcours vers le doctorat.`,
    keywords: "pfe, projet fin d'études, semestre 6, research thesis, thèse de recherche, analyse critique, étude comparative, rapport de synthèse, compétences avancées",
    category: "Programme Master – Recherche",
    priority: 9,
  },
  {
    question: "Quel est le rôle du laboratoire LITAN dans la formation à la recherche ?",
    alt_questions: "laboratoire litan estin accréditation | laboratoire informatique technologies avancées numérique | structure de recherche interne ESTIN",
    answer: `L'ESTIN dispose de ses propres structures pour soutenir les futurs doctorants. Le principal est le **Laboratoire d'Informatique et des Technologies Avancées du Numérique (LITAN)**, actuellement **en cours d'accréditation**.

Il constitue **le socle de l'activité de recherche** au sein de l'école. Le programme prévoit également l'**immersion des étudiants dans des entités de recherche en Algérie** pour favoriser la recherche fondamentale et appliquée.`,
    keywords: "litam, laboratoire d'informatique et des technologies avancées du numérique, accréditation, socle de recherche, entités de recherche, algérie, recherche fondamentale, recherche appliquée",
    category: "Programme Master – Recherche",
    priority: 9,
  },
  {
    question: "Comment l'école mobilise-t-elle la coopération internationale pour le doctorat ?",
    alt_questions: "coopération internationale master recherche | experts UCD Dublin RMIT Melbourne INSA Lyon encadrement doctorat | réseau international doctorat ESTIN",
    answer: `L'école mobilise un **réseau d'experts internationaux**, dont beaucoup sont impliqués dans des **programmes de formation doctorale à l'étranger** :
- **UCD Dublin** (Irlande),
- **RMIT Melbourne** (Australie),
- **INSA Lyon** (France), etc.

Ces personnalités scientifiques **interviennent dans le cursus** pour :
- encadrer des **séminaires**,
- **soutenir les étudiants** souhaitant poursuivre un **doctorat** à l'étranger.`,
    keywords: "coopération internationale, ucd dublin, rmit melbourne, insa lyon, formation doctorale, experts internationaux, séminaires, encadrement, doctorat étranger",
    category: "Programme Master – Recherche",
    priority: 9,
  },
  {
    question: "Comment l'ESTIN mesure-t-elle la réussite de ses formations vers le doctorat ?",
    alt_questions: "indicateurs doctorat ESTIN | suivi diplômés poursuivant doctorat | comité pédagogique taux doctorat",
    answer: `L'ESTIN considère le **passage en doctorat comme un indicateur clé de la réussite** de ses formations.

Le **comité pédagogique** mesure ainsi régulièrement :
- le **nombre** de diplômés poursuivant des études doctorales,
- le **taux** de passage en doctorat,
- la **qualité** de ces poursuites (établissements, encadrement).

Ces indicateurs alimentent l'amélioration continue des formations de Master.`,
    keywords: "indicateurs, doctorat, suivi, comité pédagogique, taux de passage, diplômés, qualité des poursuites, réussite des formations",
    category: "Programme Master – Recherche",
    priority: 8,
  },
  {
    question: "Quels sont les avantages de choisir le Master ESTIN pour une carrière académique ?",
    alt_questions: "pourquoi master estin recherche | avantages master estin doctorat | atouts formation recherche ESTIN",
    answer: `Choisir le Master à l'ESTIN pour une carrière académique offre plusieurs **atouts décisifs** :

- **Préparation dès le S5** : modules de méthodologie, séminaires et Mini-State-of-the-Art Paper (initiation directe à la publication scientifique).
- **PFE à visée recherche** : possibilité de réaliser une thèse de recherche au S6.
- **Écosystème interne** : laboratoire LITAN et immersion dans les entités de recherche en Algérie.
- **Réseau international** : experts issus de programmes doctoraux (UCD Dublin, RMIT Melbourne, INSA Lyon) qui encadrent les étudiants souhaitant poursuivre un doctorat.
- **Suivi qualité** : le passage en doctorat est mesuré comme indicateur clé de réussite.

En résumé, le Master ESTIN ne se contente pas de former des ingénieurs pour l'industrie : il constitue un **tremplin structuré vers le doctorat**.`,
    keywords: "avantages, carrière académique, atouts, recherche, doctorat, publication scientifique, pfe recherche, litan, réseau international, tremplin",
    category: "Programme Master – Recherche",
    priority: 9,
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
          tag: "master_recherche",
          question: e.question,
          alt_questions: e.alt_questions || "",
          answer: e.answer,
          category: e.category,
          keywords: e.keywords,
          priority: e.priority ?? 5,
          icon: "🎓",
          source: "Programme Master ESTIN – Recherche",
          clientId: TARGET_CLIENT_ID,
        },
      });
      count++;
      console.log(`  ${count}. ${e.question.slice(0, 60)}`);
    }
    console.log(`\n✅ ${count} entrée(s) Master – Recherche insérées.`);
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await prisma.$disconnect();
  }
})();
