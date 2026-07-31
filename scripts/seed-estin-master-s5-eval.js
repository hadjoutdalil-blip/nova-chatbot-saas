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
    question: "Qu'est-ce que le Mini-State-of-the-Art Paper à l'ESTIN ?",
    alt_questions: "mini article état de l'art ESTIN | qu'est ce que le mini state of the art paper | définition mini state of the art master",
    answer: `Le **"Mini-State-of-the-Art Paper"** (mini-article d'état de l'art) est le **mode d'évaluation privilégié** pour remplacer l'examen traditionnel dans certaines **Unités d'Enseignement (UE)** du programme de **Master (S5)** à l'ESTIN.

Il s'agit d'un **exercice de veille technologique et scientifique** qui prépare les étudiants aux exigences de la **recherche académique** et du **développement industriel de haut niveau**, en les forçant à produire un document respectant les **standards de publication internationaux**.`,
    keywords: "mini state of the art paper, mini article état de l'art, évaluation, examen traditionnel, master s5, veille technologique, recherche académique, standards publication",
    category: "Programme Master – Évaluation S5",
    priority: 10,
  },
  {
    question: "Quel est l'objectif pédagogique du Mini-State-of-the-Art Paper ?",
    alt_questions: "objectif mini article état de l'art | but pédagogique state of the art paper ESTIN",
    answer: `L'objectif pédagogique de ce format est de **tester la capacité de l'étudiant à** :

- **Explorer le monde de la recherche**,
- **S'approprier les normes professionnelles** du domaine,
- **Synthétiser des informations** sur des **technologies de pointe** (cutting-edge technologies).

L'étudiant doit ainsi démontrer qu'il sait naviguer dans la littérature scientifique internationale et en restituer l'essentiel de manière professionnelle.`,
    keywords: "objectif pédagogique, exploration recherche, normes professionnelles, synthèse, technologies de pointe, cutting-edge, littérature scientifique",
    category: "Programme Master – Évaluation S5",
    priority: 9,
  },
  {
    question: "Comment choisir le sujet du Mini-State-of-the-Art Paper ?",
    alt_questions: "choix du sujet mini article état de l'art | sujet au choix master ESTIN",
    answer: `L'étudiant doit rédiger un article sur un **sujet de pointe** (**cutting-edge topic**) **de son choix**, en lien avec sa **spécialité**.

Cette liberté de choix lui permet d'approfondir un domaine qui l'intéresse particulièrement tout en restant en cohérence avec les enseignements de son Master.`,
    keywords: "choix du sujet, cutting-edge topic, sujet de pointe, spécialité, liberté de choix, thématique",
    category: "Programme Master – Évaluation S5",
    priority: 9,
  },
  {
    question: "Quelles sont les exigences de formatage du Mini-State-of-the-Art Paper ?",
    alt_questions: "format mini article ESTIN | modèle LaTeX IEEE ACM NeurIPS | règles de mise en forme état de l'art",
    answer: `Le document doit être formaté **exactement** selon les **modèles standards utilisés dans la recherche internationale**, notamment les **styles LaTeX** de :

- **IEEE** (Institute of Electrical and Electronics Engineers),
- **ACM** (Association for Computing Machinery),
- **NeurIPS** (Conference on Neural Information Processing Systems).

Ce formatage rigoureux garantit que l'étudiant maîtrise dès la formation les normes de rédaction scientifique exigées par les conférences et journaux internationaux.`,
    keywords: "formatage, latex, ieee, acm, neurips, mise en forme, modèles standards, rédaction scientifique, conférences internationales",
    category: "Programme Master – Évaluation S5",
    priority: 9,
  },
  {
    question: "Quel module est concerné par ce mode d'évaluation en IA & Science des Données ?",
    alt_questions: "module state of the art IA data science | master IA SD S5 évaluation | advanced literature review trend scouting",
    answer: `Dans la spécialité **IA & Science des Données**, le Mini-State-of-the-Art Paper s'applique au module :

- **"Advanced Literature Review and Trend Scouting in AI & Data Science"** (Revue de littérature avancée et veille des tendances en IA & Data Science).

Ce module initie les étudiants de Master (S5) aux pratiques de revue bibliographique rigoureuse et de veille sur les tendances émergentes de l'IA.`,
    keywords: "ia data science, advanced literature review, trend scouting, revue de littérature, veille tendances, master s5",
    category: "Programme Master – Évaluation S5",
    priority: 10,
  },
  {
    question: "Quel module est concerné par ce mode d'évaluation en Cybersecurity ?",
    alt_questions: "module state of the art cybersécurité | master cybersecurity S5 évaluation | cyber threat intelligence vulnerability veille",
    answer: `Dans la spécialité **Cybersecurity**, le Mini-State-of-the-Art Paper s'applique au module :

- **"Cyber Threat Intelligence, Vulnerability Veille, and Academic Review"** (Renseignement sur les cybermenaces, veille de vulnérabilités et revue académique).

Ce module forme les étudiants à la collecte et l'analyse d'informations sur les menaces et vulnérabilités, ainsi qu'à la revue de la littérature académique en cybersécurité.`,
    keywords: "cybersecurity, cyber threat intelligence, vulnerability veille, academic review, cybermenaces, vulnérabilités, master s5",
    category: "Programme Master – Évaluation S5",
    priority: 10,
  },
  {
    question: "Quel module est concerné par ce mode d'évaluation en IoT (ISIC) ?",
    alt_questions: "module state of the art IoT | master ISIC S5 évaluation | state of the art standardization monitoring IoT",
    answer: `Dans la spécialité **IoT (ISIC)**, le Mini-State-of-the-Art Paper s'applique au module :

- **"State-of-the-Art and Standardization Monitoring in IoT Ecosystems"** (État de l'art et surveillance de la standardisation dans les écosystèmes IoT).

Ce module sensibilise les étudiants à l'évolution rapide des technologies IoT et au suivi des **normes de standardisation** qui structurent l'écosystème.`,
    keywords: "iot, isic, state of the art, standardization monitoring, écosystèmes iot, normes standardisation, master s5",
    category: "Programme Master – Évaluation S5",
    priority: 10,
  },
  {
    question: "Résumé : en quoi consiste le Mini-State-of-the-Art Paper ?",
    alt_questions: "résumé mini state of the art | synthèse évaluation veille ESTIN master",
    answer: `En résumé, le **Mini-State-of-the-Art Paper** est un **exercice de veille technologique et scientifique** qui :

1. **Prépare les étudiants** aux exigences de la **recherche académique** et du **développement industriel de haut niveau**,
2. **Les force à produire un document** respectant les **standards de publication internationaux** (LaTeX IEEE, ACM, NeurIPS),
3. S'applique aux **trois spécialités du Master (S5)** :
   - IA & Science des Données,
   - Cybersecurity,
   - IoT (ISIC).

Ce format remplace avantageusement l'examen traditionnel en évaluant la capacité d'analyse, de synthèse et de professionnalisation de l'étudiant.`,
    keywords: "résumé, synthèse, veille technologique, veille scientifique, recherche académique, développement industriel, standards internationaux, trois spécialités",
    category: "Programme Master – Évaluation S5",
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
          tag: "master_s5_eval",
          question: e.question,
          alt_questions: e.alt_questions || "",
          answer: e.answer,
          category: e.category,
          keywords: e.keywords,
          priority: e.priority ?? 5,
          icon: "🎓",
          source: "Programme Master S5 – ESTIN",
          clientId: TARGET_CLIENT_ID,
        },
      });
      count++;
      console.log(`  ${count}. ${e.question.slice(0, 60)}`);
    }
    console.log(`\n✅ ${count} entrée(s) Mini-State-of-the-Art Paper insérées.`);
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await prisma.$disconnect();
  }
})();
