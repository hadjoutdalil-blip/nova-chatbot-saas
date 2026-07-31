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
    question: "Comment est structuré le Cycle Préparatoire (CP) à l'ESTIN ?",
    alt_questions: "cycle préparatoire ESTIN CP1 CP2 | organisation deux années cycle préparatoire | semestres S1 S2 S3 S4",
    answer: `Le **Cycle Préparatoire (CP)** de l'ESTIN est divisé en **deux années** :
- **CP1** (Première Année) : semestres **S1** et **S2**,
- **CP2** (Deuxième Année) : semestres **S3** et **S4**.

Le cursus a bénéficié de **récentes mises à jour pédagogiques** :
- le passage du langage **Pascal** au langage **C**,
- la **permutation de certains modules** pour une meilleure progression (Structures de données et fichiers déplacée en S3, Bases de données en S4).

Cette organisation garantit une progression logique : les fondamentaux mathématiques et informatiques en CP1, puis les concepts avancés et la préparation à la spécialité en CP2.`,
    keywords: "cycle préparatoire, cp1, cp2, semestres, s1, s2, s3, s4, langage c, pascal, permutation modules, progression pédagogique",
    category: "Cycle Préparatoire – Organisation",
    priority: 10,
  },
  {
    question: "Quels sont les modules enseignés au Semestre 1 (S1) du Cycle Préparatoire ?",
    alt_questions: "modules S1 CP1 ESTIN | semestre 1 cycle préparatoire contenu | algorithmique architecture mathématiques S1",
    answer: `Le **premier semestre (S1)** de CP1 pose les bases de l'informatique et des mathématiques fondamentales :

- **Algorithmique et structures de données statiques** : introduction au raisonnement algorithmique en utilisant désormais le langage **C**.
- **Architecture des ordinateurs 1** : systèmes de numération, algèbre de Boole et fonctionnement de base d'un ordinateur.
- **Mathématiques** : Analyse 1 (nombres réels, suites, continuité) et Algèbre 1 (logique, théorie des ensembles, structures algébriques et polynômes).
- **Système et Physique** : Introduction au système d'exploitation 1 (**Linux/Ubuntu**) et bases de l'électricité (électrostatique, électrocinétique).
- **Transversal** : Techniques d'expression (rédaction académique) et Anglais 1.`,
    keywords: "s1, semestre 1, algorithmique, structures de données statiques, langage c, architecture des ordinateurs, analyse 1, algèbre 1, système d'exploitation, linux, ubuntu, électricité, techniques d'expression, anglais",
    category: "Cycle Préparatoire – CP1 S1",
    priority: 9,
  },
  {
    question: "Quels sont les modules enseignés au Semestre 2 (S2) du Cycle Préparatoire ?",
    alt_questions: "modules S2 CP1 ESTIN | semestre 2 cycle préparatoire contenu | électronique système d'information S2",
    answer: `L'**approfondissement technique** se poursuit au **Semestre 2 (S2)** de CP1 :

- **Informatique** : Algorithmique et structures de données dynamiques (pointeurs, listes chaînées, piles, files) et Introduction au système d'exploitation 2.
- **Mathématiques** : Analyse 2 (développements limités, intégration de Riemann, équations différentielles) et Algèbre 2 (espaces vectoriels, applications linéaires, matrices).
- **Spécialité et Ouverture** : Électronique 1, Système d'information et Communication axée sur l'IA (pitching, rédaction technique).
- **Langue** : Anglais 2 (anglais technique pour l'informatique).`,
    keywords: "s2, semestre 2, structures de données dynamiques, pointeurs, listes chaînées, piles, files, analyse 2, algèbre 2, électronique 1, système d'information, communication ia, pitching, anglais 2",
    category: "Cycle Préparatoire – CP1 S2",
    priority: 9,
  },
  {
    question: "Quels sont les modules enseignés au Semestre 3 (S3) du Cycle Préparatoire ?",
    alt_questions: "modules S3 CP2 ESTIN | semestre 3 cycle préparatoire contenu | POO structures de données fichiers S3",
    answer: `Le **Semestre 3 (S3)** de CP2 marque une **transition vers des concepts plus avancés** :

- **Informatique Fondamentale** : Architecture des ordinateurs 2 (systèmes mémoires, entrées/sorties), **Programmation Orientée Objet (POO)** et **Structures de données et fichiers** (manipulation de gros volumes de données).
- **Mathématiques** : Analyse 3 (séries numériques et de fonctions, séries de Fourier) et Algèbre 3 (réduction des endomorphismes, déterminants).
- **Outils de l'ingénieur** : Probabilités et statistiques 1, Électronique 2 (circuits intégrés analogiques et numériques) et Anglais 3.`,
    keywords: "s3, semestre 3, architecture des ordinateurs 2, poo, programmation orientée objet, structures de données et fichiers, analyse 3, algèbre 3, probabilités, électronique 2, anglais 3",
    category: "Cycle Préparatoire – CP2 S3",
    priority: 9,
  },
  {
    question: "Quels sont les modules enseignés au Semestre 4 (S4) du Cycle Préparatoire ?",
    alt_questions: "modules S4 CP2 ESTIN | semestre 4 cycle préparatoire contenu | bases de données génie logiciel projet tutoré S4",
    answer: `Le **Semestre 4 (S4)**, dernier semestre du cycle préparatoire, **prépare l'entrée en spécialité** :

- **Développement et Systèmes** : **Bases de données** (permuté avec S3 pour permettre d'étudier les structures de données au préalable), Génie logiciel et Logique.
- **Mathématiques et Signal** : Analyse 4 (topologie, intégrales multiples, transformées de Laplace et Fourier), Probabilités et Statistiques 2 et Traitement du signal et télécommunication.
- **Professionnalisation** : **Projet tutoré** (synthèse multidisciplinaire par la création d'un prototype logiciel ou d'une expérience en IA) et **Lean Startup** (méthodologie de création d'entreprise innovante).`,
    keywords: "s4, semestre 4, bases de données, génie logiciel, logique, analyse 4, transformées de laplace, probabilités, traitement du signal, télécommunication, projet tutoré, lean startup",
    category: "Cycle Préparatoire – CP2 S4",
    priority: 9,
  },
  {
    question: "Pourquoi les modules Structures de données et Bases de données ont-ils été permutés ?",
    alt_questions: "permutation modules S3 S4 ESTIN | pourquoi bases de données en S4 | structures de données avant bases de données",
    answer: `Une **note importante** de la mise à jour pédagogique : la matière **"Structures de données et fichiers"** a été déplacée en **S3** et **"Bases de données"** en **S4**.

Cette **permutation** a été faite pour **garantir que les étudiants maîtrisent l'organisation des données avant d'aborder les systèmes de gestion complexes**.

Ainsi, la progression pédagogique suit une logique rigoureuse :
1. **S3** : maîtrise des structures de données et des fichiers,
2. **S4** : application à la conception de bases de données.`,
    keywords: "permutation, structures de données, fichiers, bases de données, s3, s4, organisation des données, systèmes de gestion, progression pédagogique",
    category: "Cycle Préparatoire – Organisation",
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
          tag: "cycle_preparatoire",
          question: e.question,
          alt_questions: e.alt_questions || "",
          answer: e.answer,
          category: e.category,
          keywords: e.keywords,
          priority: e.priority ?? 5,
          icon: "🎓",
          source: "Cycle Préparatoire – ESTIN",
          clientId: TARGET_CLIENT_ID,
        },
      });
      count++;
      console.log(`  ${count}. ${e.question.slice(0, 60)}`);
    }
    console.log(`\n✅ ${count} entrée(s) Cycle Préparatoire insérées.`);
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await prisma.$disconnect();
  }
})();
