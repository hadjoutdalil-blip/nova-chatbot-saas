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
    question: "Peut-on réaliser son PFE dans une entreprise partenaire comme Sonatrach ?",
    alt_questions: "pfe chez sonatrach ESTIN | projet fin d'études en entreprise partenaire | stage pfe sonatrach master",
    answer: `Oui, il est tout à fait possible et même **encouragé** de réaliser son **Projet de Fin d'Études (PFE)** au sein d'une **entreprise partenaire** telle que **Sonatrach**.

Ceci est confirmé par plusieurs éléments des programmes de l'ESTIN :

1. **Partenariat officiel** : Sonatrach est explicitement listée parmi les partenaires du secteur socio-économique avec lesquels l'ESTIN établit des conventions pour l'ensemble de ses spécialités (IA, Cybersécurité et IoT).
2. **Lieux de stage identifiés** : Sonatrach figure dans les tableaux récapitulatifs des « Lieux de stage et formation en entreprise » (capacité d'accueil et durées de stage prévues).
3. **Objectif d'intégration professionnelle** : les programmes visent à préparer les étudiants à intégrer de grandes entreprises nationales stratégiques (Sonatrach, Cevital, Algérie Télécom).
4. **Nature du PFE** : le S6 est entièrement consacré à un stage en entreprise, idéalement lié à des environnements industriels réels.

En résumé, **Sonatrach fait partie des partenaires privilégiés** de l'école pour accueillir les futurs ingénieurs lors de leur **immersion professionnelle finale**.`,
    keywords: "sonatrach, pfe, projet fin d'études, entreprise partenaire, conventions, secteur socio-économique, lieux de stage, immersion professionnelle",
    category: "Programme Master – PFE Entreprises",
    priority: 10,
  },
  {
    question: "Quelles sont les conventions de partenariat de l'ESTIN avec le secteur économique ?",
    alt_questions: "conventions ESTIN Sonatrach | partenaires socio-économiques ESTIN | conventions IA cybersécurité IoT",
    answer: `**Sonatrach** est explicitement listée comme l'un des **partenaires du secteur socio-économique** avec lesquels l'ESTIN établit des **conventions** pour l'ensemble de ses spécialités :
- **Intelligence Artificielle**,
- **Cybersécurité**,
- **IoT**.

Ces conventions encadrent l'accueil des étudiants en stage et leur immersion professionnelle au sein de ces grandes entreprises nationales.`,
    keywords: "conventions, partenaires, secteur socio-économique, sonatrach, ia, cybersécurité, iot, entreprises nationales",
    category: "Programme Master – PFE Entreprises",
    priority: 8,
  },
  {
    question: "Quelles sont les capacités d'accueil en stage chez Sonatrach ?",
    alt_questions: "capacité accueil stage sonatrach ESTIN | lieux de stage et formation en entreprise | durée stage sonatrach",
    answer: `Les offres de formation de l'ESTIN mentionnent spécifiquement **Sonatrach** dans leurs tableaux récapitulatifs des **« Lieux de stage et formation en entreprise »**.

À titre d'exemple, une **capacité d'accueil de 10 étudiants** est indiquée pour des **durées de stage de 2 mois**, ce qui **prépare le terrain pour les stages de fin de cycle**.

Ces capacités d'accueil démontrent la volonté de l'école de garantir des places de stage concrètes dans ses entreprises partenaires.`,
    keywords: "capacité d'accueil, 10 étudiants, 2 mois, lieux de stage, formation en entreprise, sonatrach, stages de fin de cycle",
    category: "Programme Master – PFE Entreprises",
    priority: 9,
  },
  {
    question: "Quels sont les objectifs d'intégration professionnelle du programme ESTIN ?",
    alt_questions: "intégration grandes entreprises ESTIN | objectif carrière sonatrach cevital algérie télécom | insertion professionnelle étudiants",
    answer: `L'un des **objectifs affichés** des programmes de l'école est de **préparer les étudiants à intégrer de grandes entreprises nationales stratégiques**, citant nommément :
- **SONATRACH**,
- **CEVITAL**,
- **Algérie Télécom**.

Cette orientation professionnelle garantit que les diplômés de l'ESTIN répondent aux besoins des secteurs économiques stratégiques du pays.`,
    keywords: "intégration professionnelle, grandes entreprises, sonatrach, cevital, algérie télécom, stratégique, insertion professionnelle, objectifs",
    category: "Programme Master – PFE Entreprises",
    priority: 8,
  },
  {
    question: "Comment se déroule le PFE en entreprise au S6 ?",
    alt_questions: "déroulement PFE S6 entreprise | stage entreprise mémoire soutenance orale | projet lié environnement industriel réel",
    answer: `Le **sixième semestre (S6)** est **entièrement consacré à un stage en entreprise**, évalué par :
- un **mémoire**,
- une **soutenance orale**.

Ce projet doit **idéalement être lié à des environnements industriels réels**, ce qui correspond parfaitement au cadre offert par un partenaire comme **Sonatrach**.

Réaliser son PFE dans une telle entreprise permet ainsi de :
- travailler sur des **problématiques industrielles concrètes**,
- se constituer un **réseau professionnel**,
- faciliter son **insertion professionnelle** à l'issue du diplôme.`,
    keywords: "s6, stage en entreprise, mémoire, soutenance orale, environnement industriel réel, sonatrach, insertion professionnelle, réseau professionnel",
    category: "Programme Master – PFE Entreprises",
    priority: 10,
  },
  {
    question: "Quels sont les avantages de faire son PFE chez Sonatrach ?",
    alt_questions: "avantages PFE sonatrach | bénéfices stage sonatrach étudiants | pourquoi choisir sonatrach pfe",
    answer: `Faire son PFE chez **Sonatrach** offre plusieurs **avantages décisifs** :

1. **Cadre industriel réel** : travailler sur des problématiques concrètes d'un leader national stratégique.
2. **Partenariat officiel** : des conventions ESTIN garantissent l'encadrement de votre stage.
3. **Insertion professionnelle** : l'école vise explicitement l'intégration de ses diplômés dans des entreprises comme Sonatrach.
4. **Réseau professionnel** : développer des contacts précieux pour votre carrière.
5. **PFE valorisé** : un projet lié à un environnement industriel réel, évalué par mémoire et soutenance orale.

Sonatrach fait ainsi partie des **partenaires privilégiés** pour accueillir les futurs ingénieurs lors de leur **immersion professionnelle finale**.`,
    keywords: "avantages, bénéfices, sonatrach, pfe, cadre industriel, insertion professionnelle, réseau, conventions, carrière",
    category: "Programme Master – PFE Entreprises",
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
          tag: "master_pfe_entreprises",
          question: e.question,
          alt_questions: e.alt_questions || "",
          answer: e.answer,
          category: e.category,
          keywords: e.keywords,
          priority: e.priority ?? 5,
          icon: "🎓",
          source: "Programme Master ESTIN – PFE & Entreprises",
          clientId: TARGET_CLIENT_ID,
        },
      });
      count++;
      console.log(`  ${count}. ${e.question.slice(0, 60)}`);
    }
    console.log(`\n✅ ${count} entrée(s) Master – PFE Entreprises insérées.`);
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await prisma.$disconnect();
  }
})();
