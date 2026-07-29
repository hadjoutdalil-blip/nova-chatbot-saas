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
    question: "Qu'est-ce que le guide de la formation doctorale LMD ?",
    answer: "Le guide de la formation doctorale LMD résume les points essentiels des textes règlementaires régissant le fonctionnement de la formation doctorale LMD. Ses dispositions sont applicables aux étudiants candidats et doctorants inscrits à une formation de troisième cycle à compter de l'année universitaire 2021-2022.",
  },
  {
    question: "Qu'est-ce que le Comité de Formation Doctorale (CFD) ?",
    answer: "Le CFD est institué au sein de chaque établissement pour chaque formation de troisième cycle habilitée. Il est chargé de définir toute forme de formation par la recherche (cours, conférences, séminaires, ateliers), assurer le suivi de la formation des doctorants avec évaluation annuelle, et donner un avis sur la constitution du jury de soutenance de thèse.",
  },
  {
    question: "Quelle est la durée de la formation doctorale ?",
    answer: "La durée de la formation de troisième cycle est fixée à trois (03) années consécutives. Le chef d'établissement peut exceptionnellement accorder une dérogation d'une à deux années supplémentaires sur avis motivé du directeur de thèse et du CFD.",
  },
  {
    question: "Qu'est-ce que le carnet du doctorant ?",
    answer: "Le carnet du doctorant est un document accompagné d'une charte de thèse qui définit les obligations et droits des partenaires de la formation doctorale (doctorant, directeur de thèse, CFD, directeur du laboratoire). Il est remis après validation de l'inscription par le Conseil Scientifique et contient la liste des formations, publications, brevets et résultats des évaluations annuelles. Il doit être visé par le doctorant, son directeur de thèse, le président du CFD et le directeur du laboratoire.",
  },
  {
    question: "Comment se fait la cotutelle de thèse à l'ESTIN ?",
    answer: "La cotutelle permet à un doctorant d'effectuer sa recherche sous la responsabilité de deux directeurs : l'un en Algérie, l'autre à l'étranger. L'inscription doit se faire durant les trois premiers semestres. Une convention est conclue entre l'école et l'établissement étranger, soumise au Conseil Scientifique puis visée par le directeur de l'école avant approbation de la tutelle (arrêté n°704 du 16 juin 2016).",
  },
  {
    question: "Quels sont les cours obligatoires en première année de doctorat ?",
    answer: "Lors de la première année, le doctorant doit valider des cours de : (1) renforcement des connaissances dans la spécialité, (2) méthodologie de recherche, (3) technologies de l'information et de la communication (TIC), (4) langues étrangères, et (5) initiation à la didactique et à la pédagogie. En cas d'absences non justifiées, le doctorant est exclu de la formation.",
  },
  {
    question: "Comment se fait l'évaluation annuelle du doctorant ?",
    answer: "Le doctorant doit présenter annuellement l'état d'avancement de ses travaux de thèse devant le CFD. En cas d'insuffisance de résultats constatée après la deuxième année, le CFD peut proposer un recadrage du sujet de la thèse.",
  },
  {
    question: "Quand peut-on soutenir sa thèse de doctorat ?",
    answer: "La soutenance ne peut avoir lieu qu'au terme révolu de la troisième année d'inscription. Le doctorant n'ayant pas finalisé sa thèse doit demander une prolongation avec avis motivé du directeur de thèse. Sans dérogation accordée, il est systématiquement exclu.",
  },
  {
    question: "Combien de points faut-il pour soutenir une thèse de doctorat ?",
    answer: "Le doctorant doit obtenir au minimum 180 points répartis comme suit : thèse (100 points), formation (30 points), et travaux scientifiques (50 points minimum). La répartition détaillée est définie dans l'annexe n°2 - Grille d'évaluation - de l'arrêté n°28 du 09 janvier 2022.",
  },
  {
    question: "Comment sont répartis les 30 points de formation pour le doctorat ?",
    answer: "Les 30 points de formation se répartissent ainsi : cours de spécialité (12 points), cours de méthodologie de recherche et initiation à la didactique et pédagogie (6 points), cours de TIC (6 points), et compétences en anglais (6 points).",
  },
  {
    question: "Comment sont répartis les points des travaux scientifiques pour le doctorat ?",
    answer: "Les travaux scientifiques (minimum 50 points) se répartissent : publications internationales rang A (50 points), publications internationales rang B (40 points), brevet PCT OMPI (50 points, max 1), brevet INAPI (25 points, max 1), communications internationales (12,5 points, max 2), communications nationales (10 points, max 2).",
  },
  {
    question: "Combien de publications faut-il pour soutenir une thèse en S&T ?",
    answer: "Il est exigé une (01) publication dans une revue de catégorie B au minimum pour les domaines Sciences et Technologies. Le doctorant doit figurer en première position de la liste des auteurs, sauf pour les revues utilisant l'ordre alphabétique.",
  },
  {
    question: "Les articles dans des revues prédatrices sont-ils acceptés pour la soutenance ?",
    answer: "Non, les articles publiés dans des revues prédatrices ou chez des éditeurs prédateurs ne sont pas acceptés pour la soutenance. La liste est fixée annuellement par la Commission Scientifique Nationale de Validation des Revues Scientifiques.",
  },
  {
    question: "Quelle est l'affiliation qui doit figurer sur les publications du doctorant ?",
    answer: "Dans l'article publié par le doctorant doivent figurer les intitulés du laboratoire d'affiliation et de l'école. L'affiliation du doctorant est définie par le conseil scientifique comme étant celle de l'école.",
  },
  {
    question: "À qui appartiennent les travaux scientifiques du doctorant ?",
    answer: "Les travaux scientifiques élaborés par le doctorant dans le cadre de sa thèse appartiennent de droit à l'école, celle-ci pouvant en disposer librement, à moins qu'elle n'y renonce au profit du doctorant.",
  },
  {
    question: "Quelles sont les sanctions en cas de plagiat dans une thèse ?",
    answer: "Tout acte de plagiat, falsification ou fraude constaté pendant ou après la soutenance expose son auteur à l'annulation de la soutenance et au retrait du titre acquis, sans préjudice des sanctions prévues par la législation. Les doctorants doivent signer une déclaration sur l'honneur conforme à l'arrêté n°1082 du 27 décembre 2020.",
  },
  {
    question: "Quels sont les textes réglementaires de la formation doctorale ?",
    answer: "Les principaux textes sont : Décret 10-231 du 2 octobre 2010 (statut du doctorant), Arrêté n°153 du 14 mai 2012 (fichier central des thèses), Arrêté n°704 du 16 juin 2016 (cotutelle internationale), Circulaire n°03 du 7 juillet 2019 (conditions de soutenance), Arrêté n°1082 du 27 décembre 2020 (lutte contre le plagiat), Arrêté n°28 du 9 janvier 2022 (modalités d'accès et d'organisation du doctorat LMD), et Décret exécutif n°22-208 du 5 juin 2022 (régime des études).",
  },
  {
    question: "Quels sont les documents requis pour le dossier de soutenance de thèse ?",
    answer: "Le dossier comprend : un exemplaire de la thèse, le rapport du directeur de thèse attestant la soutenabilité, la ou les publications scientifiques, et le carnet du doctorant dûment renseigné et visé.",
  },
  {
    question: "Quelles sont les conditions de recevabilité du dossier de soutenance ?",
    answer: "Les conditions sont : un document attestant l'obtention de 180 points selon la grille d'évaluation, le rapport de soutenabilité du directeur de thèse, un document attestant l'inscription régulière en doctorat, et un document attestant l'avis favorable du CFD.",
  },
  {
    question: "Comment se fait la demande de prolongation de thèse ?",
    answer: "Le doctorant n'ayant pas finalisé sa thèse dans les 3 ans doit introduire une demande de prolongation accompagnée de l'avis motivé du directeur de thèse. La demande est étudiée annuellement par le CFD puis validée par l'organe scientifique habilité et le chef d'établissement. Sans dérogation, le doctorant est exclu.",
  },
  {
    question: "Le directeur de thèse doit-il figurer sur les publications du doctorant ?",
    answer: "Non, la publication peut ne pas porter le nom du directeur de thèse si ce dernier l'autorise par écrit.",
  },
  {
    question: "Qu'est-ce que l'arrêté n°28 du 09 janvier 2022 ?",
    answer: "L'arrêté n°28 du 09 janvier 2022 fixe les modalités d'accès et d'organisation du doctorat LMD et les conditions de préparation et de soutenance de la thèse de doctorat. Il contient deux annexes : Annexe n°1 (Carnet du Doctorant) et Annexe n°2 (Grille d'évaluation).",
  },
  {
    question: "Qu'est-ce que la circulaire n°03 du 07 juillet 2019 ?",
    answer: "La circulaire n°03 du 07 juillet 2019 fixe les conditions de soutenance d'une thèse de doctorat et ses modalités, notamment les conditions de recevabilité, le dossier de soutenance, et les conditions de soutenabilité en termes de publications.",
  },
  {
    question: "Comment accéder au programme de doctorat à l'ESTIN ?",
    answer: "L'accès au programme de doctorat est régi par l'arrêté n°28 du 09 janvier 2022 fixant les modalités d'accès et d'organisation du doctorat LMD. Pour les conditions spécifiques à l'ESTIN, contactez la sous-direction de la formation doctorale et de la recherche scientifique.",
  },
  {
    question: "Qu'est-ce que le fichier central des mémoires et thèses ?",
    answer: "Créé par l'arrêté n°153 du 14 mai 2012, le fichier central des mémoires et thèses est un registre national qui centralise les mémoires et thèses soutenus. L'arrêté fixe les modalités d'alimentation et d'utilisation de ce fichier.",
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
          category: "Scolarité",
          keywords: "doctorat, LMD, thèse, CFD, formation doctorale, carnet doctorant, cotutelle, soutenance, publication, plagiat, arrêté 28, 180 points, circulaire 03, troisième cycle",
          priority: 8,
          clientId,
        },
      });
      count++;
      console.log(`  ${count}. ${e.question.slice(0, 60)}`);
    }
    console.log(`\n✅ ${count} entrées Formation Doctorale insérées.`);
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await prisma.$disconnect();
  }
})();
