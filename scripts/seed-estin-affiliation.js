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
    question: "Quelle est l'affiliation officielle pour les publications à l'ESTIN ?",
    answer: `L'affiliation des enseignants-chercheurs et doctorants de l'ESTIN adoptée par le Conseil Scientifique est :

Laboratoire LITAN
École supérieure en Sciences et Technologies de l'Informatique et du Numérique
RN 75, Amizour 06300, Bejaia, Algérie.`,
  },
  {
    question: "Quelle est l'affiliation pour les doctorants de l'ESTIN ?",
    answer: `L'affiliation officielle pour les doctorants est :

Laboratoire LITAN
École supérieure en Sciences et Technologies de l'Informatique et du Numérique
RN 75, Amizour 06300, Bejaia, Algérie.`,
  },
  {
    question: "Quelle est l'affiliation pour les enseignants-chercheurs de l'ESTIN ?",
    answer: `L'affiliation officielle pour les enseignants-chercheurs est :

Laboratoire LITAN
École supérieure en Sciences et Technologies de l'Informatique et du Numérique
RN 75, Amizour 06300, Bejaia, Algérie.`,
  },
  {
    question: "À partir de quelle date l'affiliation ESTIN est-elle obligatoire ?",
    answer: "Toute publication scientifique acceptée à compter du 8 octobre 2022 doit impérativement inclure l'affiliation officielle de l'ESTIN.",
  },
  {
    question: "Que se passe-t-il si je n'utilise pas la bonne affiliation dans ma publication ?",
    answer: "Toute publication scientifique acceptée à compter du 8/10/2022, n'incluant pas l'écriture exacte de l'affiliation, ne sera pas retenue pour les soutenances de doctorat et les candidatures à l'habilitation universitaire.",
  },
  {
    question: "Quel est le laboratoire de recherche à l'ESTIN ?",
    answer: "Le laboratoire de recherche de l'ESTIN est le Laboratoire LITAN (Laboratoire d'Informatique et des Technologies Avancées et du Numérique).",
  },
  {
    question: "Quelle est l'adresse postale de l'ESTIN ?",
    answer: "École supérieure en Sciences et Technologies de l'Informatique et du Numérique\nRN 75, Amizour 06300, Bejaia, Algérie.",
  },
  {
    question: "Quelle est l'affiliation exacte à écrire sur une publication ESTIN ?",
    answer: `L'écriture exacte à reproduire est :

Laboratoire LITAN
École supérieure en Sciences et Technologies de l'Informatique et du Numérique
RN 75, Amizour 06300, Bejaia, Algérie.

À partir du 8 octobre 2022.`,
  },
  {
    question: "Affiliation pour soutenance de doctorat ESTIN",
    answer: `Pour que votre publication soit retenue pour la soutenance de doctorat, vous devez impérativement utiliser l'affiliation suivante :

Laboratoire LITAN
École supérieure en Sciences et Technologies de l'Informatique et du Numérique
RN 75, Amizour 06300, Bejaia, Algérie.

(Publications à compter du 8/10/2022)`,
  },
  {
    question: "Affiliation pour candidature à l'habilitation universitaire ESTIN",
    answer: `Pour que votre publication soit retenue pour l'habilitation universitaire, vous devez impérativement utiliser l'affiliation suivante :

Laboratoire LITAN
École supérieure en Sciences et Technologies de l'Informatique et du Numérique
RN 75, Amizour 06300, Bejaia, Algérie.

(Publications à compter du 8/10/2022)`,
  },
  {
    question: "Comment écrire correctement l'affiliation ESTIN dans un article scientifique ?",
    answer: `L'affiliation doit être écrite exactement comme suit, sans modification :

Laboratoire LITAN
École supérieure en Sciences et Technologies de l'Informatique et du Numérique
RN 75, Amizour 06300, Bejaia, Algérie.`,
  },
  {
    question: "C'est quoi LITAN ?",
    answer: "LITAN est le laboratoire de recherche de l'ESTIN : Laboratoire d'Informatique et des Technologies Avancées et du Numérique. C'est le laboratoire de rattachement pour l'affiliation des publications scientifiques.",
  },
  {
    question: "Où se trouve l'ESTIN exactement ?",
    answer: "L'ESTIN (École supérieure en Sciences et Technologies de l'Informatique et du Numérique) est située sur la RN 75, à Amizour 06300, Wilaya de Bejaia, Algérie.",
  },
  {
    question: "Affiliation ESTIN laboratoire LITAN adresse",
    answer: `Laboratoire LITAN
École supérieure en Sciences et Technologies de l'Informatique et du Numérique
RN 75, Amizour 06300, Bejaia, Algérie.`,
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
          category: "Affiliation ESTIN",
          keywords: "affiliation, estin, litan, publication, recherche, doctorat, laboratoire, adresse, amizour, bejaia",
          priority: 10,
          clientId,
        },
      });
      count++;
      console.log(`  ${count}. ${e.question.slice(0, 60)}`);
    }
    console.log(`\n✅ ${count} entrées Affiliation ESTIN insérées.`);
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await prisma.$disconnect();
  }
})();
