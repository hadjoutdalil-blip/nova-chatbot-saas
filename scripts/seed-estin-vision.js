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
    question: "Quelle est la vision de l'ESTIN ?",
    answer: `La vision de l'ESTIN est d'être une école supérieure :

- où les étudiants du premier et du deuxième cycle reçoivent un enseignement de haute qualité qui débouche sur des emplois de qualité,
- où les professeurs s'engagent et forment les étudiants à la recherche et à l'innovation de pointe,
- où les thèmes de recherche convergents se croisent et sont le moteur de la recherche dans de nombreuses autres disciplines,
- où les anciens élèves sont activement engagés,
- où le tissu socio-économique de l'école bénéficie de notre savoir et savoir-faire.`,
  },
  {
    question: "Quelle est la mission de l'ESTIN ?",
    answer: `L'ESTIN vise l'excellence dans l'enseignement, la recherche et les services. Ses missions sont :

1. Offrir des programmes rigoureux qui préparent les étudiants à entrer directement sur le marché du travail ou à poursuivre des études supérieures
2. Mener l'avancement de l'informatique, des technologies de l'information, du numérique et de la cybersécurité par la recherche et l'enseignement reconnus à l'international
3. Préparer les étudiants à participer pleinement et de manière éthique à une société diversifiée
4. Former les étudiants aux meilleures pratiques du domaine et intégrer les dernières recherches dans le programme
5. Favoriser le développement des compétences en résolution de problèmes et en communication
6. Fournir des expériences d'apprentissage de qualité avec des pratiques de classe efficaces
7. Faire bénéficier notre environnement socio-économique de nos compétences dans le domaine numérique
8. Servir de conseiller aux responsables de la wilaya de Bejaia et de l'État algérien pour les impacts des technologies du numérique`,
  },
  {
    question: "Quels sont les objectifs de formation de l'ESTIN ?",
    answer: `L'ESTIN forme des ingénieurs capables de :

1. Analyser un problème informatique complexe et appliquer les principes de l'informatique pour identifier des solutions
2. Concevoir, implémenter et évaluer une solution informatique pour répondre à un ensemble d'exigences
3. Communiquer efficacement dans une variété de contextes professionnels
4. Reconnaître les responsabilités professionnelles et faire des jugements éclairés basés sur des principes légaux et éthiques
5. Fonctionner efficacement en tant que membre ou chef d'une équipe
6. Appliquer la théorie de l'informatique et les principes du développement de logiciels pour produire des solutions informatiques`,
  },
  {
    question: "Quels types d'ingénieurs l'ESTIN forme-t-elle ?",
    answer: "L'ESTIN forme des ingénieurs compétents en analyse de problèmes complexes, conception de solutions informatiques, communication professionnelle, éthique, travail d'équipe et développement logiciel. Les diplômés sont préparés à entrer directement sur le marché du travail ou à poursuivre des études supérieures.",
  },
  {
    question: "Quel est l'engagement de l'ESTIN envers la recherche ?",
    answer: "L'ESTIN s'engage à mener l'avancement de l'informatique, des technologies de l'information, du numérique et de la cybersécurité par une recherche et un enseignement reconnus à l'échelle internationale, ainsi que par le transfert de technologie.",
  },
  {
    question: "Quel est le rôle de l'ESTIN dans le développement local ?",
    answer: "L'ESTIN fait bénéficier son environnement socio-économique de ses compétences dans le domaine numérique et sert de conseiller aux responsables de la wilaya de Bejaia et de l'État algérien concernant les impacts des technologies du numérique.",
  },
  {
    question: "Quelles compétences les diplômés ESTIN acquièrent-ils ?",
    answer: `- Analyse de problèmes informatiques complexes
- Conception et implémentation de solutions informatiques
- Communication efficace en contexte professionnel
- Jugement éthique et responsabilité professionnelle
- Travail d'équipe et leadership
- Application de la théorie informatique et développement logiciel`,
  },
  {
    question: "Est-ce que l'ESTIN prépare à l'emploi ou aux études supérieures ?",
    answer: "L'ESTIN offre des programmes rigoureux qui préparent les étudiants à entrer directement sur le marché du travail ou à poursuivre des études supérieures, selon leur choix.",
  },
  {
    question: "Quelle est la philosophie pédagogique de l'ESTIN ?",
    answer: "L'ESTIN suit une philosophie pédagogique basée sur des pratiques de classe efficaces, des styles d'enseignement actifs et des opportunités d'interactions significatives entre les étudiants et le corps enseignant, en intégrant les dernières recherches dans le programme d'études.",
  },
  {
    question: "L'ESTIN forme-t-elle à l'éthique ?",
    answer: "Oui, l'ESTIN prépare les étudiants à participer pleinement et de manière éthique à une société diversifiée. Les diplômés doivent reconnaître leurs responsabilités professionnelles et faire des jugements éclairés basés sur des principes légaux et éthiques.",
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
          category: "Vision & Mission ESTIN",
          keywords: "estin, vision, mission, objectifs, formation, ingénieur, compétences, recherche, éthique, pédagogie",
          priority: 8,
          clientId,
        },
      });
      count++;
      console.log(`  ${count}. ${e.question.slice(0, 60)}`);
    }
    console.log(`\n✅ ${count} entrées Vision & Mission ESTIN insérées.`);
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await prisma.$disconnect();
  }
})();
