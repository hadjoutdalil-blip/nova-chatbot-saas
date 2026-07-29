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
    question: "Qu'est-ce que la charte de sécurité informatique de l'ESTIN ?",
    answer: "La charte de sécurité informatique définit les conditions et modalités d'utilisation des ressources informatiques de l'ESTIN ainsi que les règles de sécurité que les utilisateurs doivent respecter. Elle s'applique à toute personne ayant accès, de manière permanente ou temporaire, aux ressources informatiques de l'école. Elle entre en vigueur dès sa signature par l'utilisateur ; tout refus de signature interdit l'accès aux ressources informatiques.",
  },
  {
    question: "À qui appartiennent les ressources informatiques et les données de l'ESTIN ?",
    answer: "Toutes les ressources informatiques mises à la disposition des utilisateurs sont la propriété exclusive de l'ESTIN. Toutes les données hébergées dans les équipements de l'ESTIN ou transitant dans ses réseaux sont également la propriété exclusive de l'ESTIN.",
  },
  {
    question: "Comment accéder aux ressources informatiques de l'ESTIN ?",
    answer: "Tout accès aux ressources et réseaux informatiques de l'ESTIN est soumis à une procédure d'authentification préalable. L'utilisateur est seul responsable de toute utilisation des moyens d'authentification mis à sa disposition.",
  },
  {
    question: "Comment protéger ses moyens d'authentification à l'ESTIN ?",
    answer: "L'utilisateur doit veiller à la protection de ses informations secrètes d'authentification, les changer périodiquement, et ne jamais les communiquer à des tiers.",
  },
  {
    question: "Quelles sont les règles d'utilisation des ressources informatiques de l'ESTIN ?",
    answer: "Les ressources informatiques ne peuvent être utilisées qu'à des fins professionnelles. L'utilisateur doit préserver les ressources mises à sa disposition. Il n'est pas autorisé à installer ou déployer des applications ou logiciels sur les moyens informatiques. En cas de défaillance, il doit informer immédiatement la structure chargée de la maintenance.",
  },
  {
    question: "Quelles sont les obligations de l'ESTIN envers les utilisateurs ?",
    answer: "L'ESTIN doit : mettre à disposition les ressources nécessaires, garantir le bon fonctionnement et la disponibilité, maintenir la qualité du service, informer des procédures applicables, assurer la confidentialité et l'intégrité des documents et échanges électroniques, informer que les activités font l'objet d'une surveillance automatisée, et sensibiliser aux risques liés à la sécurité informatique.",
  },
  {
    question: "Quelles sont les obligations de l'utilisateur en matière de sécurité ?",
    answer: "L'utilisateur doit respecter les lois et règlements, respecter la charte et les procédures de l'ESTIN, appliquer les mesures et directives de sécurité, ne pas utiliser les comptes d'autrui, et signaler sans délai tout fonctionnement suspect ou incident de sécurité.",
  },
  {
    question: "Quelles sont les consignes de sécurité pour le poste de travail ?",
    answer: "Verrouiller l'accès en cas d'absence même temporaire, alerter les services techniques en cas de découverte d'un nouvel équipement connecté, s'assurer que le poste dispose d'un antivirus et signaler toute alerte, ne jamais connecter des équipements personnels, scanner tous les supports amovibles avant utilisation, éteindre l'ordinateur en période d'inactivité prolongée (nuit, week-end, vacances), et ne pas intervenir physiquement sur le matériel.",
  },
  {
    question: "Quelles sont les règles d'utilisation de la messagerie électronique professionnelle ?",
    answer: "Il est strictement interdit d'ouvrir les pièces jointes ou liens hypertexte provenant d'adresses inconnues, d'ouvrir la boîte mail professionnelle depuis des cybercafés, et d'utiliser des adresses mail personnelles pour transmettre des documents professionnels. L'utilisateur doit vérifier l'adresse du destinataire, s'assurer qu'il est habilité à accéder au contenu, et vérifier les pièces jointes. L'école peut suspendre ou supprimer tout compte en cas d'usage incorrect.",
  },
  {
    question: "Quelles sont les règles d'utilisation d'internet à l'ESTIN ?",
    answer: "Ne pas utiliser ce service à des fins malveillantes, obscènes, frauduleuses, haineuses, diffamatoires, pornographiques ou illégales. Ne pas fournir d'informations liées à sa fonction, grade ou responsabilité sur les réseaux sociaux non-professionnels. Ne pas surcharger le réseau. Scanner les fichiers téléchargés avec un antivirus. L'école peut interdire l'accès au réseau en cas de mauvaise utilisation.",
  },
  {
    question: "Quelles sont les règles concernant les appareils mobiles et supports de stockage ?",
    answer: "Signaler immédiatement toute perte ou vol. Verrouiller les appareils mobiles lorsqu'ils ne sont pas utilisés. Désactiver Wi-Fi et Bluetooth quand ils ne sont pas nécessaires. Interdiction formelle pour toute personne étrangère à l'ESTIN de transférer des documents par support amovible (tout échange par courriel). Chiffrer les données confidentielles. Garder les appareils et supports sur soi lors des déplacements.",
  },
  {
    question: "Quelles sont les mesures de sécurité pour les déplacements à l'étranger ?",
    answer: "Ne pas utiliser de terminaux publics pour accéder à la messagerie professionnelle. Garder le terminal professionnel et les supports sur soi en permanence. Désactiver Wi-Fi et Bluetooth quand non nécessaires. Supprimer les données professionnelles sensibles non nécessaires à la mission avant le départ. Informer la hiérarchie et la représentation diplomatique en cas d'inspection ou saisie par des autorités étrangères. Ne pas utiliser d'équipements offerts à l'étranger à des fins professionnelles. Changer les mots de passe utilisés pendant la mission.",
  },
  {
    question: "Que se passe-t-il en fin de relation avec l'ESTIN (diplômé, démission, etc.) ?",
    answer: "L'utilisateur doit restituer toutes les ressources informatiques matérielles. L'ESTIN supprime l'ensemble des accès logiques, sauf l'accès à la boîte e-mail qui est maintenue pour les étudiants dans la limite des moyens disponibles et sous réserve de son utilisation au maintien des relations avec l'ESTIN.",
  },
  {
    question: "Que peut faire l'ESTIN en cas d'incident de sécurité ?",
    answer: "L'ESTIN peut déconnecter un utilisateur avec ou sans préavis selon la gravité, isoler ou neutraliser provisoirement toute donnée ou fichier en contradiction avec la charte ou mettant en péril la sécurité, et prévenir le responsable hiérarchique.",
  },
  {
    question: "Quelles sont les règles dans les salles TP (informatique) ?",
    answer: "Avant chaque séance, l'enseignant vérifie les logiciels. Pendant la séance : ne pas manger ni boire, ne pas brancher les téléphones portables sur le secteur ou l'unité centrale, ne pas échanger ou déplacer le matériel sans autorisation, ne pas débrancher de périphérique sans autorisation, signaler tout problème. En fin de séance : fermer les logiciels, éteindre correctement les ordinateurs (ne pas forcer l'extinction), ranger les claviers, écrans et fauteuils.",
  },
  {
    question: "Quelles sont les obligations de l'enseignant en fin de séance TP ?",
    answer: "Vérifier que toutes les unités centrales et tous les écrans sont éteints, que les chaises sont remises en place, et que tous les claviers et souris sont en place sans être débranchés. En cas de disparition ou dégradation : noter le numéro de l'ordinateur, le nom de l'étudiant présent sur le poste, et faire remonter l'information à l'administrateur et/ou la direction.",
  },
  {
    question: "Quelles sont les sanctions en cas de non-respect de la charte informatique ?",
    answer: "Le non-respect peut engager la responsabilité de l'utilisateur et entraîner des mesures disciplinaires proportionnelles. Les responsables sécurité peuvent : avertir l'utilisateur, limiter ou retirer provisoirement les accès, effacer ou isoler les données en contradiction avec la charte. Sans préjudice des sanctions disciplinaires, le contrevenant peut faire l'objet de poursuites judiciaires.",
  },
  {
    question: "Peut-on utiliser des équipements personnels avec le poste de travail de l'ESTIN ?",
    answer: "Non, il est strictement interdit de connecter des équipements personnels au poste de travail de l'ESTIN.",
  },
  {
    question: "Peut-on installer des logiciels sur les ordinateurs de l'ESTIN ?",
    answer: "Non, l'utilisateur n'est pas autorisé à installer ou déployer des applications ou logiciels sur les moyens ou ressources informatiques mis à sa disposition.",
  },
  {
    question: "Est-on obligé de signer la charte de sécurité informatique ?",
    answer: "Oui, la charte entre en vigueur dès sa signature par l'utilisateur. Tout refus de signature interdira l'accès de l'utilisateur aux ressources informatiques de l'ESTIN.",
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
          category: "Vie à l'ESTIN",
          keywords: "charte, sécurité informatique, authentification, messagerie, internet, TP, sanctions, déplacement, support amovible, mot de passe, article",
          priority: 8,
          clientId,
        },
      });
      count++;
      console.log(`  ${count}. ${e.question.slice(0, 60)}`);
    }
    console.log(`\n✅ ${count} entrées Charte Sécurité Informatique insérées.`);
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await prisma.$disconnect();
  }
})();
