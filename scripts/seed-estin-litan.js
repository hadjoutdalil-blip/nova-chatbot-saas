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
    question: "Qu'est-ce que le laboratoire LITAN ?",
    answer: `Le Laboratoire d'Informatique et des Technologies Avancées du Numérique (LITAN) est un pôle d'excellence au sein de l'École Supérieure en Sciences et Technologies de l'Informatique et du Numérique (ESTIN). Agréé en 2022, il explore les perspectives émergentes de l'informatique et contribue à l'effort national de recherche scientifique et de développement technologique.`,
  },
  {
    question: "Quelle est la mission du LITAN ?",
    answer: `La mission du LITAN est de repousser les frontières de la connaissance dans les domaines de l'intelligence artificielle, de la cybersécurité et des systèmes intelligents. Le laboratoire s'engage à former la prochaine génération d'experts et à contribuer activement au développement technologique national et international.`,
  },
  {
    question: "Quels sont les axes de recherche du LITAN ?",
    answer: `Les thématiques principales du LITAN sont :
1. Intelligence Artificielle — Développement de modèles, apprentissage automatique et vision par ordinateur
2. Science des Données — Analyse, visualisation et prédiction à partir de données massives
3. Cyber Sécurité — Sécurité des systèmes, des données, blockchain et sûreté de fonctionnement
4. Villes Intelligentes — Numérisation et optimisation des systèmes intelligents et IoT
5. Systèmes Avancés — Infrastructures Cloud/Edge, systèmes cyber-physiques et réseaux
6. Réseaux & Télécoms — Conception et optimisation des architectures réseaux nouvelle génération`,
  },
  {
    question: "Combien d'équipes de recherche compte le LITAN ?",
    answer: "Le LITAN s'articule autour de 7 équipes de recherche spécialisées, couvrant un large spectre des technologies du numérique.",
  },
  {
    question: "Équipe 1 du LITAN : Ingénierie des connaissances et analyse d'information",
    answer: `Chef d'équipe : Dr. CHEKLAT LAMIA

Thèmes de recherche :
- Analyse de données (massives, hétérogènes, réparties)
- Production de connaissances sémantiquement riches
- Systèmes de recommandation
- Data Mining & Web Sémantique
- Machine Learning et Deep Learning`,
  },
  {
    question: "Équipe 2 du LITAN : Numérisation et optimisation des systèmes intelligents",
    answer: `Chef d'équipe : Dr. ISSAADI Baderdine

Thèmes de recherche :
- Numérisation des processus de résolution des problèmes
- Optimisation des systèmes intelligents
- Intégration de l'intelligence aux systèmes (IoT, Villes intelligentes)`,
  },
  {
    question: "Équipe 3 du LITAN : Systèmes Intelligents : Infrastructures, Technologies & Services",
    answer: `Chef d'équipe : Dr. HARFOUCHE Lydia

Thèmes de recherche :
- Modélisation d'écosystèmes Cloud/Edge Computing et IoT
- Nouvelles architectures distribuées
- Apprentissage et prise de décision pour la gestion automatique
- Planification et allocation de ressources`,
  },
  {
    question: "Équipe 4 du LITAN : Cyber Sécurité",
    answer: `Chef d'équipe : Dr. BOUCHOUCHA Lydia

Thèmes de recherche :
- Sécurité des systèmes, données et communications
- Sécurité dans l'informatique mobile et Cloud
- Contrôle d'accès et Blockchain
- Sûreté de fonctionnement des systèmes`,
  },
  {
    question: "Équipe 5 du LITAN : Big Data et Prédiction",
    answer: `Chef d'équipe : Dr. MEDJOUDJ RAFIK

Thèmes de recherche :
- Capture, stockage et traitement du Big Data
- Analyse, visualisation et prédiction de données
- Entrepôts de données & Systèmes d'aide à la décision`,
  },
  {
    question: "Équipe 6 du LITAN : Traitement d'Images et Apprentissage Automatique",
    answer: `Chef d'équipe : Dr. BOUSLA SID ALI

Thèmes de recherche :
- Traitement d'images médicales
- Apprentissage statistique pour la vision par ordinateur
- Détection d'objets et segmentation
- Reconnaissance de l'écriture manuscrite`,
  },
  {
    question: "Équipe 7 du LITAN : Techniques informatiques pour augmenter la langue",
    answer: `Chef d'équipe : Dr. SACI OUALID

Thèmes de recherche :
- Analyse du texte et de la langue (TAL/NLP)
- Analyse des médias sociaux
- Détection de contenu violent et haineux
- Exploitation des textes légaux/juridiques et pédagogiques`,
  },
  {
    question: "Qui est le directeur du laboratoire LITAN ?",
    answer: "Le directeur du laboratoire LITAN est le Dr. DJENADI Ali. Contact : djenadi@estin.dz",
  },
  {
    question: "Comment contacter le laboratoire LITAN ?",
    answer: `Pour contacter le LITAN :
- Email : djenadi@estin.dz (Dr. DJENADI Ali, Directeur du laboratoire)
- Institution : ESTIN, RN 75, Amizour 06300, Bejaia, Algérie`,
  },
  {
    question: "Où se trouve le laboratoire LITAN ?",
    answer: `Le LITAN est situé à l'ESTIN :
RN 75, Amizour 06300
Bejaia, Algérie`,
  },
  {
    question: "Quelles sont les thématiques principales du LITAN ?",
    answer: `Les thématiques principales du LITAN sont :
1. Numérisation et automatisation des systèmes informatiques
2. Données massives (Big data) et prédiction
3. Traitement d'image et apprentissage automatique
4. Ingénierie des connaissances et analyse d'information
5. Systèmes intelligents : infrastructures, technologies et services
6. Cyber sécurité : algorithmes et applications
7. Techniques informatiques pour augmenter les textes et les langues
8. Internet des objets (IoT) : vulgarisation, infrastructure et applications
9. Promotion des Villes intelligentes (smart cities)
10. Systèmes d'information avancés`,
  },
  {
    question: "Quand a été créé le laboratoire LITAN ?",
    answer: "Le laboratoire LITAN a été agréé en 2022.",
  },
  {
    question: "Est-ce que le LITAN travaille sur l'IA ?",
    answer: "Oui, l'Intelligence Artificielle est l'un des axes majeurs du LITAN : développement de modèles, apprentissage automatique, deep learning, vision par ordinateur, et traitement d'images.",
  },
  {
    question: "Est-ce que le LITAN travaille sur la cybersécurité ?",
    answer: "Oui, la Cyber Sécurité est un axe majeur du LITAN avec l'équipe 4 dédiée, qui travaille sur la sécurité des systèmes, données et communications, la blockchain, le contrôle d'accès et la sûreté de fonctionnement.",
  },
  {
    question: "Est-ce que le LITAN travaille sur le Big Data ?",
    answer: "Oui, le Big Data est un axe important avec l'équipe 5 (Big Data et Prédiction) qui travaille sur la capture, le stockage, le traitement, l'analyse, la visualisation et la prédiction de données massives.",
  },
  {
    question: "Est-ce que le LITAN travaille sur le NLP/TAL ?",
    answer: "Oui, l'équipe 7 (Techniques informatiques pour augmenter la langue) travaille sur le TAL/NLP, l'analyse des médias sociaux, la détection de contenu violent/haineux, et l'exploitation de textes légaux et pédagogiques.",
  },
  {
    question: "Quels sont les chefs d'équipe du LITAN ?",
    answer: `Les 7 équipes du LITAN et leurs chefs :
1. Ingénierie des connaissances — Dr. CHEKLAT LAMIA
2. Numérisation et optimisation — Dr. ISSAADI Baderdine
3. Systèmes Intelligents — Dr. HARFOUCHE Lydia
4. Cyber Sécurité — Dr. BOUCHOUCHA Lydia
5. Big Data et Prédiction — Dr. MEDJOUDJ RAFIK
6. Traitement d'Images — Dr. BOUSLA SID ALI
7. Techniques pour la langue — Dr. SACI OUALID`,
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
          category: "Laboratoire LITAN",
          keywords: "litan, estin, laboratoire, recherche, intelligence artificielle, cybersécurité, big data, iot, nlp, équipe",
          priority: 10,
          clientId,
        },
      });
      count++;
      console.log(`  ${count}. ${e.question.slice(0, 60)}`);
    }
    console.log(`\n✅ ${count} entrées Laboratoire LITAN insérées.`);
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await prisma.$disconnect();
  }
})();
