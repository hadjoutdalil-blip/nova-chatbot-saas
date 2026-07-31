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
    question: "Comment s'organise l'immersion des étudiants au laboratoire LITAN ?",
    alt_questions: "immersion laboratoire LITAN ESTIN | organisation immersion recherche LITAN | accès étudiants laboratoire LITAN",
    answer: `L'organisation de l'immersion au sein du **Laboratoire d'Informatique et des Technologies Avancées du Numérique (LITAN)** s'inscrit dans la volonté de l'ESTIN de **préparer ses étudiants à la recherche académique et au doctorat**.

Bien que le laboratoire soit actuellement **en cours d'accréditation**, il constitue le **pivot de l'écosystème de recherche** de l'école. Son interaction avec les étudiants s'organise selon plusieurs axes :

1. **Orientation vers la recherche (S5)** : modules visant à "démystifier le monde de la recherche".
2. **PFE à visée recherche (S6)** : immersion physique et technique via une thèse de recherche.
3. **Encadrement et infrastructure** : infrastructure dédiée et experts internationaux.

En résumé, l'immersion au LITAN ne se limite pas à une présence physique : c'est un **parcours de professionnalisation à la recherche** qui commence par la maîtrise des normes académiques en S5 et culmine avec la réalisation d'une **thèse de recherche au sein du laboratoire en S6**.`,
    keywords: "litam, immersion, laboratoire, recherche, écosystème, parcours, professionnalisation, s5, s6, accréditation",
    category: "Programme Master – LITAN",
    priority: 10,
  },
  {
    question: "Comment la formation en S5 prépare-t-elle les étudiants à la recherche au LITAN ?",
    alt_questions: "orientation recherche S5 LITAN | démystifier le monde de la recherche | préparation immersion laboratoire master",
    answer: `Dès le **cinquième semestre (S5)**, le programme de Master est conçu pour **"démystifier le monde de la recherche"**. Cette immersion théorique et pratique se manifeste par :

1. **Le "Mini-State-of-the-Art Paper"** : en remplacement de l'examen traditionnel, les étudiants doivent produire un article d'état de l'art sur un sujet de pointe, formaté selon les standards internationaux (styles LaTeX de l'IEEE, ACM ou NeurIPS).
2. **Séminaires et Communication Scientifique** : ce module inclut des activités pratiques telles que :
   - l'organisation et l'animation de **séminaires scientifiques**,
   - la **présentation de papiers de recherche**,
   - la **participation à des événements scientifiques** locaux ou virtuels.`,
    keywords: "s5, démystifier la recherche, mini state of the art paper, séminaires, communication scientifique, présentation papiers, événements scientifiques",
    category: "Programme Master – LITAN",
    priority: 9,
  },
  {
    question: "En quoi consiste l'immersion au LITAN pendant le PFE de S6 ?",
    alt_questions: "pfe recherche S6 LITAN | research thesis laboratoire LITAN | thèse de recherche S6 encadreur jury",
    answer: `Le **sixième semestre (S6)** est le moment privilégié pour l'**immersion physique et technique** au LITAN. L'étudiant réalise une **thèse de recherche** (**Research Thesis**) qui lui permet de **s'intégrer dans une entité de recherche**.

Sous la supervision d'un **encadreur**, l'étudiant doit :
- mener une **recherche bibliographique approfondie**,
- effectuer une **étude comparative** des approches existantes,
- rédiger un **rapport de synthèse** et **soutenir ses travaux devant un jury**.`,
    keywords: "s6, pfe, thèse de recherche, research thesis, entité de recherche, encadreur, bibliographie approfondie, étude comparative, rapport de synthèse, jury, soutenance",
    category: "Programme Master – LITAN",
    priority: 10,
  },
  {
    question: "Quelles sont les infrastructures du LITAN qui soutiennent les formations ?",
    alt_questions: "infrastructure LITAN IA cybersécurité IoT | laboratoire support formations ESTIN | équipements laboratoire LITAN",
    answer: `Le **LITAN** est cité comme l'un des **principaux laboratoires supportant les formations** de l'ESTIN dans les domaines :
- de l'**Intelligence Artificielle (IA)**,
- de la **Cybersécurité**,
- de l'**IoT**.

Cette **infrastructure dédiée** permet aux étudiants des trois spécialités de Master de mener leurs travaux de recherche dans des conditions matérielles adaptées aux technologies de pointe.`,
    keywords: "infrastructure, litan, ia, intelligence artificielle, cybersécurité, iot, laboratoire support, équipements, spécialités",
    category: "Programme Master – LITAN",
    priority: 8,
  },
  {
    question: "Quels experts internationaux interviennent dans l'encadrement au LITAN ?",
    alt_questions: "experts internationaux LITAN UCD Dublin RMIT INSA Lyon | figures scientifiques mondiales encadrement séminaires | intervention à distance experts doctorat",
    answer: `L'immersion au LITAN bénéficie d'un **réseau de figures scientifiques mondiales**, provenant d'universités telles que :
- **UCD Dublin** (Irlande),
- **RMIT Melbourne** (Australie),
- **INSA Lyon** (France).

Ces experts interviennent, **parfois à distance**, pour :
- **encadrer des séminaires de fin de cycle**,
- soutenir les **programmes doctoraux** des étudiants.`,
    keywords: "experts internationaux, figures scientifiques, ucd dublin, rmit melbourne, insa lyon, encadrement séminaires, fin de cycle, programmes doctoraux, intervention à distance",
    category: "Programme Master – LITAN",
    priority: 8,
  },
  {
    question: "Quel est le parcours de l'étudiant vers la recherche au LITAN ?",
    alt_questions: "parcours étudiant LITAN S5 S6 | étapes professionnalisation recherche ESTIN | devenir chercheur via LITAN",
    answer: `Le parcours de l'étudiant vers la recherche au LITAN se déroule en **deux grandes étapes** :

**Étape 1 – S5 : maîtrise des normes académiques**
- Rédaction du **Mini-State-of-the-Art Paper** (format IEEE, ACM ou NeurIPS),
- **Séminaires et communication scientifique** (organisation de séminaires, présentation de papiers, participation à des événements scientifiques).

**Étape 2 – S6 : réalisation de la thèse de recherche**
- Immersion physique au sein de l'entité de recherche,
- Recherche bibliographique approfondie et étude comparative,
- Rédaction du rapport de synthèse et **soutenance devant un jury**.

Ainsi, l'immersion au LITAN est un **parcours complet de professionnalisation à la recherche** : elle commence par l'acquisition des codes académiques et culmine par une véritable thèse de recherche au sein du laboratoire.`,
    keywords: "parcours, étapes, professionnalisation, normes académiques, mini state of the art, séminaires, thèse de recherche, soutenance, jury, devenir chercheur",
    category: "Programme Master – LITAN",
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
          tag: "master_litan",
          question: e.question,
          alt_questions: e.alt_questions || "",
          answer: e.answer,
          category: e.category,
          keywords: e.keywords,
          priority: e.priority ?? 5,
          icon: "🎓",
          source: "Programme Master ESTIN – LITAN",
          clientId: TARGET_CLIENT_ID,
        },
      });
      count++;
      console.log(`  ${count}. ${e.question.slice(0, 60)}`);
    }
    console.log(`\n✅ ${count} entrée(s) Master – LITAN insérées.`);
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await prisma.$disconnect();
  }
})();
