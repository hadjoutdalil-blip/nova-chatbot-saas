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
    question: "Quelles sont les spécialités disponibles à l'ESTIN ?",
    alt_questions: "quelles sont les spécialités proposées à l'ESTIN | les spécialités de l'ESTIN | spécialités ESTIN | formations spécialités ESTIN | quels masters spécialités ESTIN",
    answer: `L'ESTIN propose des **formations d'ingénieur et de Master** dans **trois spécialités** :

1. **Intelligence Artificielle et Science des Données (IA & SD)** : formation en IA, machine learning, deep learning, big data et data science.
2. **Cybersecurity (Cybersécurité)** : sécurité des systèmes et réseaux, cryptographie, pentest, audit de sécurité, gestion des incidents.
3. **IoT – Systèmes connectés (ISIC)** : internet des objets, systèmes embarqués et connectés, état de l'art et standardisation des écosystèmes IoT.

Le cursus démarre par une **année de tronc commun** (bases en informatique et mathématiques), suivie de **deux années de spécialisation intensive**, avec un **complément de formation pour l'obtention du diplôme de Master** en troisième année.`,
    keywords: "spécialités, spécialité, ia, intelligence artificielle, science des données, cybersecurity, cybersécurité, iot, isic, systèmes connectés, tronc commun, formations",
    category: "Formations & Spécialités",
    priority: 10,
  },
  {
    question: "Quelles sont les spécialités du programme d'ingénieur à l'ESTIN ?",
    alt_questions: "spécialités cycle ingénieur ESTIN | spécialités ingénieur ESTIN | programmes ingénieur ESTIN",
    answer: `Le **cycle d'ingénieur** à l'ESTIN couvre **trois spécialités** :

- **Intelligence Artificielle et Science des Données (IA & SD)**,
- **Cybersecurity (Cybersécurité)**,
- **IoT – Systèmes connectés (ISIC)**.

Le parcours de **5 ans** se structure en :
1. **Cycle Préparatoire (2 ans)** : fondements mathématiques et informatiques,
2. **Tronc Commun (1 an)** : bases de l'IA, du Big Data et des technologies numériques,
3. **Cycle de Spécialisation (2 ans)** : immersion dans la spécialité, avec un **internat de 6 mois en entreprise** en dernière année.`,
    keywords: "cycle ingénieur, ingénieur, spécialités ingénieur, ia sd, cybersecurity, iot, isic, 5 ans, cycle préparatoire, tronc commun, spécialisation",
    category: "Formations & Spécialités",
    priority: 10,
  },
  {
    question: "Quelles sont les spécialités du Master à l'ESTIN ?",
    alt_questions: "spécialités master ESTIN | masters proposés ESTIN | masters IA cybersecurity IoT ESTIN | spécialisations master ESTIN",
    answer: `Le **Master** à l'ESTIN propose **trois spécialités**, axées sur la **recherche académique** et la préparation au **doctorat** :

1. **IA & Science des Données** : modules de veille technologique, revue de littérature avancée et Mini-State-of-the-Art Paper.
2. **Cybersecurity** : cyber threat intelligence, veille de vulnérabilités et revue académique.
3. **IoT (ISIC)** : état de l'art et standardisation des écosystèmes IoT.

Le **complément Master (S5)** oriente les étudiants vers la recherche : méthodologie, séminaires scientifiques et communication académique. Le **S6** est consacré à un stage pouvant aboutir à une **thèse de recherche**, avec le soutien du laboratoire **LITAN** et d'experts internationaux (UCD Dublin, RMIT Melbourne, INSA Lyon).`,
    keywords: "master, spécialités master, masters, ia science des données, cybersecurity, iot, isic, recherche, doctorat, litan",
    category: "Formations & Spécialités",
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
          tag: "specialites",
          question: e.question,
          alt_questions: e.alt_questions || "",
          answer: e.answer,
          category: e.category,
          keywords: e.keywords,
          priority: e.priority ?? 5,
          icon: "🎓",
          source: "Formations & Spécialités – ESTIN",
          clientId: TARGET_CLIENT_ID,
        },
      });
      count++;
      console.log(`  ${count}. ${e.question.slice(0, 60)}`);
    }
    console.log(`\n✅ ${count} entrée(s) Spécialités ESTIN insérées.`);
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await prisma.$disconnect();
  }
})();
