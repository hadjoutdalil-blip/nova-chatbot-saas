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
  /* ── 1. VISION STRATÉGIQUE ET IDENTITÉ ── */
  {
    question: "Qu'est-ce que l'ESTIN et quel est son ancrage institutionnel ?",
    alt_questions: "qui est l'ESTIN | ESTIN tutelle ministère enseignement supérieur | statut légal ESTIN | décret exécutif 20-235",
    answer: `L'ESTIN est une **École Supérieure d'excellence** sous la tutelle du **Ministère de l'Enseignement Supérieur et de la Recherche Scientifique**.

Son cadre légal est rigoureusement défini par le **décret exécutif n° 20-235 du 22 août 2020**, qui régit l'organisation de son second cycle et l'accréditation de ses diplômes d'ingénieur.

Le programme d'ingénierie de l'ESTIN se positionne comme le **fer de lance de la transformation numérique nationale** en Algérie. Premier cursus de ce type dans la région, il a été conçu pour répondre à un impératif de **souveraineté numérique**, formant une élite capable de transformer les données massives en leviers de décision stratégique.`,
    keywords: "estin, école supérieure, tutelle, ministère enseignement supérieur, décret 20-235, souveraineté numérique, ancrage institutionnel, transformation numérique",
    category: "Programme IA & SD – Vision",
    priority: 10,
  },
  {
    question: "Quels sont les objectifs fondamentaux du programme d'ingénierie IA & SD ?",
    alt_questions: "objectifs du programme ingénieur IA SD | mission de la formation IA science des données | objectifs fondamentaux ESTIN IA",
    answer: `La mission centrale du programme d'ingénierie IA & SD est de **former des ingénieurs multidisciplinaires maîtrisant l'intégralité de la chaîne de valeur de la donnée**.

Le cursus prépare les étudiants à :
- concevoir des **systèmes complexes de stockage, d'extraction et d'analyse de volumes massifs** (Big Data),
- utiliser l'**IA** pour l'optimisation industrielle,
- la **prédiction de tendances**,
- l'**aide à la décision automatisée**.

Ce programme ne se contente pas d'accompagner l'innovation ; il la **précède** en dotant le pays d'experts hautement qualifiés dans les technologies de rupture.`,
    keywords: "objectifs, mission, ingénieurs multidisciplinaires, chaîne de valeur, big data, optimisation industrielle, prédiction, aide à la décision, technologies de rupture",
    category: "Programme IA & SD – Vision",
    priority: 10,
  },
  {
    question: "Comment la spécialisation IA et Science des Données est-elle structurée ?",
    alt_questions: "structure spécialisation IA data science | équilibre socle commun informatique spécialisation | architecture du cursus IA SD",
    answer: `Le cursus articule un **équilibre précis** entre un **socle commun en informatique de haut niveau** et une **spécialisation pointue**.

Après avoir consolidé les fondamentaux algorithmiques et matériels, l'étudiant plonge dans les domaines de l'**Intelligence Artificielle** et de la **Data Science**.

Cette architecture garantit que les diplômés possèdent :
- l'**expertise technique en IA**,
- une **vision holistique des systèmes informatiques** sur lesquels elle repose.`,
    keywords: "structure, spécialisation, socle commun, informatique, fondamentaux algorithmiques, intelligence artificielle, data science, vision holistique",
    category: "Programme IA & SD – Vision",
    priority: 9,
  },

  /* ── 2. ORGANISATION PÉDAGOGIQUE ET STRUCTURE DU CURSUS ── */
  {
    question: "Quelle est la structure des 5 années d'études du programme IA & SD ?",
    alt_questions: "organisation du cursus 5 ans ESTIN IA | cycle préparatoire tronc commun spécialisation | phases du parcours ingénieur IA SD",
    answer: `Le parcours de **cinq ans** se décline en **trois phases clés** :

1. **Cycle Préparatoire (2 ans)** : acquisition intensive des fondements mathématiques et informatiques.
2. **Tronc Commun (1 an)** : initiation aux bases de l'IA, du Big Data et des technologies numériques émergentes.
3. **Cycle de Spécialisation (2 ans)** : immersion totale dans l'IA et la Data Science, incluant une composante de recherche et se concluant par un **internat de 6 mois en entreprise**.

C'est un voyage progressif vers l'expertise, conçu pour transformer des profils scientifiques à fort potentiel en leaders technologiques opérationnels.`,
    keywords: "5 ans, cycle préparatoire, tronc commun, spécialisation, phases, internat, entreprise, parcours, structure études",
    category: "Programme IA & SD – Cursus",
    priority: 10,
  },
  {
    question: "Quel est le volume horaire et les crédits ECTS du programme IA & SD ?",
    alt_questions: "volume horaire formation IA SD | crédits ECTS programme | charge de travail second cycle ESTIN",
    answer: `Le programme totalise **180 crédits ECTS** sur le second cycle (3 ans), avec une charge de travail totale de **4 018 heures** :

| Type d'enseignement | Volume Horaire | % Volume Global |
| ------ | ------ | ------ |
| Enseignement Supervisé | 2 002h 30min | 49,83 % |
| Formation Guidée | 2 015h 30min | 50,17 % |
| Total Global | 4 018h 00min | 100 % |

L'enseignement supervisé comprend les cours magistraux, TD et TP en laboratoire.

**Note** : La formation guidée inclut :
- 1 548h de travail personnel (soit 76,81% de ce bloc),
- 250h de stage en entreprise,
- 100h dédiées au Projet de Fin d'Études (PFE).`,
    keywords: "volume horaire, ects, crédits, 4018 heures, enseignement supervisé, formation guidée, pfe, stage, travail personnel, charge de travail",
    category: "Programme IA & SD – Cursus",
    priority: 10,
  },
  {
    question: "Quelles sont les Unités d'Enseignement (UE) du programme IA & SD ?",
    alt_questions: "unités d'enseignement UE IA SD | répartition des crédits par UE | UE fondamentales méthodologiques",
    answer: `Le cursus est pondéré pour favoriser les compétences de cœur de métier :

- **UE Fondamentales (61,80% des crédits)** : Systèmes, Réseaux, IA, Bases de données.
- **UE Méthodologiques (32,58%)** : Recherche opérationnelle, Gestion de projet, Cloud Computing.
- **UE de Découverte (3,37%)** : Introduction à la sécurité informatique.
- **UE Transversales (2,25%)** : Entrepreneuriat, Startups et Éthique de l'IA.`,
    keywords: "unités d'enseignement, ue, crédits, fondamentales, méthodologiques, découverte, transversales, systèmes, réseaux, ia, bases de données, cloud computing, sécurité informatique",
    category: "Programme IA & SD – Cursus",
    priority: 9,
  },
  {
    question: "Quels sont les modules critiques enseignés par semestre dans le programme IA & SD ?",
    alt_questions: "modules par semestre IA SD | contenu pédagogique semestres S3 S4 S5 | machine learning deep learning reinforcement learning",
    answer: `Dès le premier semestre (S1) du second cycle, la rigueur mathématique est instaurée avec la **Théorie des Langages Formels** (Formal Language Theory).

La progression se poursuit avec :
- **S3** : Machine Learning, Cloud Computing, NoSQL.
- **S4** : Deep Learning, Data Warehousing, Ingénierie des connaissances.
- **S5** : Reinforcement Learning (Apprentissage par renforcement), Traitement du Langage Naturel (NLP) et Business Intelligence.`,
    keywords: "modules, semestre, s1, s3, s4, s5, machine learning, deep learning, cloud computing, nosql, data warehousing, reinforcement learning, nlp, business intelligence",
    category: "Programme IA & SD – Cursus",
    priority: 9,
  },

  /* ── 3. CORPS ENSEIGNANT ET EXCELLENCE SCIENTIFIQUE ── */
  {
    question: "Quelle est l'expertise de l'équipe pédagogique interne de l'ESTIN ?",
    alt_questions: "équipe pédagogique ESTIN IA SD | professeurs maîtres de conférences | encadrement académique programme IA",
    answer: `L'encadrement est assuré par des **Professeurs et Maîtres de Conférences (MCA/MCB)** spécialisés dans des domaines de pointe tels que :
- la recherche opérationnelle,
- les bases de données distribuées,
- le Deep Learning,
- le traitement du signal.

Cette expertise interne assure un **suivi académique continu** et une **cohérence pédagogique exemplaire**.`,
    keywords: "équipe pédagogique, professeurs, maîtres de conférences, mca, mcb, recherche opérationnelle, bases de données distribuées, deep learning, traitement du signal",
    category: "Programme IA & SD – Enseignants",
    priority: 8,
  },
  {
    question: "Comment s'exprime le rayonnement international de l'école dans le programme IA & SD ?",
    alt_questions: "professeurs internationaux ESTIN | diaspora algérienne experts étrangers | partenaires académiques étrangers programme IA",
    answer: `L'ESTIN bénéficie d'un **soutien exceptionnel de la diaspora algérienne** et d'experts basés à l'étranger (USA, Irlande, France). Ces scientifiques de renom co-enseignent des modules ou animent des séminaires :

- **University College Dublin (Irlande)** : Pr. Kechadi (Big Data, Digital Forensics).
- **INSA Lyon (France)** : Pr. Kheddouci (Graphes, Réseaux Sémantiques).
- **Université Paris-Est (France)** : Pr. Amirat (Fuzzy Logic).
- **Autres partenaires** : ENSEEIHT Toulouse, RMIT Melbourne, Université de Poitiers.`,
    keywords: "international, diaspora algérienne, experts étrangers, university college dublin, insa lyon, paris-est, enseeiht, rmit melbourne, poitiers, kechadi, kheddouci, amirat",
    category: "Programme IA & SD – Enseignants",
    priority: 8,
  },
  {
    question: "Quelle est la place des experts industriels dans la formation IA & SD ?",
    alt_questions: "enseignants industriels ESTIN | cadres entreprises qui enseignent | module scrum and ai cloud computing",
    answer: `L'alignement avec le marché est renforcé par l'intervention directe de **cadres du secteur socio-économique** :

- le **Dr. Hadjout Dalil (Sonelgaz)** enseigne le module **"Scrum and AI"**,
- le **Dr. Souadih Kamel (Sonatrach)** assure le cours de **"Cloud Computing"**.

Cette synergie permet une **transition fluide** entre la théorie académique et l'application industrielle.`,
    keywords: "experts industriels, cadres, sonelgaz, sonatrach, hadjout dalil, souadih kamel, scrum and ai, cloud computing, secteur socio-économique",
    category: "Programme IA & SD – Enseignants",
    priority: 8,
  },

  /* ── 4. EMPLOYABILITÉ ET ÉCOSYSTÈME DE PARTENARIATS ── */
  {
    question: "Quels sont les métiers cibles pour les diplômés du programme IA & SD ?",
    alt_questions: "métiers diplômés IA SD ESTIN | débouchés ingénieur IA data science | carrières data scientist data engineer",
    answer: `La formation ouvre les portes de carrières stratégiques telles que :

- **Data Scientist / Data Architect** : modélisation et analyse de données complexes.
- **Data Engineer / Data Designer** : conception et gestion d'infrastructures de données.
- **AI Engineer** : développement de solutions d'intelligence artificielle.
- **Analytics Consultant** : accompagnement de la stratégie basée sur la donnée.
- **Big Data Project Manager** : pilotage de projets technologiques d'envergure.`,
    keywords: "métiers, débouchés, data scientist, data architect, data engineer, data designer, ai engineer, analytics consultant, big data project manager",
    category: "Programme IA & SD – Employabilité",
    priority: 10,
  },
  {
    question: "Quels sont les domaines d'application visés par le programme IA & SD ?",
    alt_questions: "secteurs d'application IA SD | domaines d'activité diplômés | santé industrie e-gouvernance finance",
    answer: `Les diplômés interviennent dans des secteurs vitaux :

- **Santé** : Smart Healthcare et aide au diagnostic.
- **Industrie** : maintenance prédictive, systèmes SCADA et robotique.
- **E-Governance** : numérisation de l'administration et services aux citoyens.
- **Finance** : détection de fraude et évaluation des risques par IA.`,
    keywords: "domaines d'application, santé, smart healthcare, industrie, maintenance prédictive, scada, robotique, e-governance, finance, fraude, risques",
    category: "Programme IA & SD – Employabilité",
    priority: 9,
  },
  {
    question: "Comment l'école soutient-elle l'innovation et les stages dans le programme IA & SD ?",
    alt_questions: "stages et partenariats ESTIN IA | conventions sonatrach cevital algérie télécom | entrepreneurship hub startup numérique",
    answer: `En plus des conventions avec des géants comme **Sonatrach, Cevital, Algérie Télécom** et les banques (**BNA, CPA**), l'ESTIN intègre un **Entrepreneurship Hub**.

Ce dispositif accompagne les étudiants dans la **création de leurs propres startups numériques**, capitalisant sur le module **"Digital Startups"** dispensé au second semestre.`,
    keywords: "stages, partenariats, conventions, sonatrach, cevital, algérie télécom, bna, cpa, entrepreneurship hub, startups numériques, digital startups",
    category: "Programme IA & SD – Employabilité",
    priority: 8,
  },

  /* ── 5. RESSOURCES MATÉRIELLES ET ENVIRONNEMENT D'APPRENTISSAGE ── */
  {
    question: "Quelle est la capacité d'accueil et d'enseignement de l'ESTIN ?",
    alt_questions: "infrastructure ESTIN amphithéâtres salles | capacité d'accueil campus Amizour | salles TD TP ESTIN",
    answer: `Située sur le **campus d'Amizour**, l'infrastructure de l'ESTIN est conçue comme un laboratoire de haute technologie. L'école dispose :

- **10 amphithéâtres** : capacité totale (2x250, 2x400 et 6x300 places).
- **25 salles de TD** (40 places chacune) et **29 salles de TP/Laboratoires** (20 places chacune).
- Un **auditorium de 500 places** et une salle de conférence de **180 places**.`,
    keywords: "amphithéâtres, salles td, salles tp, laboratoires, auditorium, capacité, infrastructure, amizour, salle de conférence",
    category: "Programme IA & SD – Infrastructure",
    priority: 8,
  },
  {
    question: "Quelles sont les ressources technologiques disponibles à l'ESTIN ?",
    alt_questions: "centre de calcul ESTIN | salle EAD formation à distance | laboratoire LITAN UAM Béjaïa",
    answer: `Les ressources technologiques de l'ESTIN comprennent :

- **Centre de Calcul** : 15 salles de laboratoires informatiques dédiées.
- **Formation à distance** : une salle EAD équipée pour les interventions internationales.
- **Recherche** : support du laboratoire **LITAN** et collaboration avec l'**UAM de Béjaïa** pour l'informatique médicale.`,
    keywords: "centre de calcul, salles informatiques, formation à distance, ead, laboratoire litan, uam béjaïa, informatique médicale, recherche, technologies",
    category: "Programme IA & SD – Infrastructure",
    priority: 8,
  },
  {
    question: "Comment les étudiants de l'ESTIN accèdent-ils à la documentation ?",
    alt_questions: "bibliothèque ESTIN | ressources documentaires | accès bibliothèque université béjaïa",
    answer: `Le fonds documentaire de l'ESTIN est **hybride** :

- une **bibliothèque physique** de 200 ouvrages spécialisés,
- une **bibliothèque numérique** dynamique gérée par le corps enseignant,
- un **accès privilégié** aux ressources de la bibliothèque centrale de l'**Université de Béjaïa**.`,
    keywords: "documentation, bibliothèque, ouvrages, bibliothèque numérique, université de béjaïa, ressources documentaires",
    category: "Programme IA & SD – Infrastructure",
    priority: 7,
  },

  /* ── 6. MODALITÉS D'ÉVALUATION, PROGRESSION ET SUIVI DE QUALITÉ ── */
  {
    question: "Comment la progression des étudiants du programme IA & SD est-elle évaluée ?",
    alt_questions: "évaluation des étudiants ESTIN | notation examens contrôle continu | notation PFE projet fin d'études",
    answer: `Le système d'évaluation combine **examens semestriels (60%)** et **contrôle continu (40%)**.

Le **Projet de Fin d'Études (PFE)** fait l'objet d'une notation extrêmement précise selon les critères suivants :
- **Valeur scientifique (Jury)** : 6 points.
- **Rédaction de la thèse (Jury)** : 5 points.
- **Présentation et réponse aux questions (Jury)** : 5 points.
- **Évaluation de l'encadreur** : 4 points.`,
    keywords: "évaluation, examens semestriels, contrôle continu, pfe, notation, jury, encadreur, progression, 60 pourcent, 40 pourcent",
    category: "Programme IA & SD – Évaluation",
    priority: 9,
  },
  {
    question: "Quels sont les indicateurs de performance (KPI) suivis par le programme IA & SD ?",
    alt_questions: "indicateurs de performance ESTIN | KPI programme IA | taux d'employabilité sélectivité",
    answer: `Le comité académique surveille la qualité du programme via :

- **Indicateurs amont** : taux de sélectivité (Ratio Offre/Demande) et niveau académique des entrants.
- **Indicateurs de suivi** : taux de succès par module et satisfaction étudiante.
- **Indicateurs aval** : taux d'employabilité et rapidité d'insertion professionnelle.`,
    keywords: "kpi, indicateurs de performance, sélectivité, ratio offre demande, taux de succès, satisfaction, employabilité, insertion professionnelle",
    category: "Programme IA & SD – Évaluation",
    priority: 8,
  },
  {
    question: "Quelle est la structure de gouvernance du programme IA & SD ?",
    alt_questions: "gouvernance ESTIN comité de coordination | enseignant médiateur | amélioration continue programme",
    answer: `L'amélioration continue est pilotée par le **Comité de Coordination**, responsable du suivi de l'intégration des diplômés.

Pour garantir un environnement d'apprentissage sain, un **enseignant-médiateur** est nommé. Ce dernier, doté de fortes compétences interpersonnelles, agit comme **interface directe** entre les étudiants et l'administration pour résoudre les problématiques urgentes.`,
    keywords: "gouvernance, comité de coordination, enseignant médiateur, amélioration continue, interface, administration, intégration des diplômés",
    category: "Programme IA & SD – Évaluation",
    priority: 8,
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
          tag: "ia_sd_faq",
          question: e.question,
          alt_questions: e.alt_questions || "",
          answer: e.answer,
          category: e.category,
          keywords: e.keywords,
          priority: e.priority ?? 5,
          icon: "🎓",
          source: "Programme IA & SD – ESTIN",
          clientId: TARGET_CLIENT_ID,
        },
      });
      count++;
      console.log(`  ${count}. ${e.question.slice(0, 60)}`);
    }
    console.log(`\n✅ ${count} entrée(s) IA & SD FAQ insérées.`);
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await prisma.$disconnect();
  }
})();
