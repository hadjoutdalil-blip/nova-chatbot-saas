import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { randomUUID } from "crypto";

const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter });

const RAW_DATA = [
  {
    category: "Présentation",
    icon: "🏢",
    questions: [
      {
        q: "Qu'est-ce que SIEP LITAN ?",
        a: "SIEP LITAN (Système d'Accès Intelligent et Encadré à la Plateforme) est une plateforme d'IA mutualisée développée par le Laboratoire d'Informatique et Technologies de l'Information et du Numérique (LITAN) de l'ESTIN Béjaïa. Elle met à disposition des chercheurs, enseignants, doctorants et étudiants en fin de cycle les ressources GPU, CPU et mémoire du laboratoire pour l'exécution de scripts et modèles d'intelligence artificielle.",
      },
      {
        q: "Qui a développé la plateforme SIEP LITAN ?",
        a: "La plateforme a été développée par le Laboratoire d'Informatique et Technologies de l'Information et du Numérique (LITAN) de l'ESTIN Béjaïa.",
      },
      {
        q: "À qui s'adresse la plateforme SIEP LITAN ?",
        a: "La plateforme s'adresse aux chercheurs, enseignants, doctorants et étudiants en fin de cycle de l'ESTIN Béjaïa qui ont besoin de ressources computationnelles pour l'intelligence artificielle.",
      },
    ],
  },
  {
    category: "Contexte & Objectifs",
    icon: "🎯",
    questions: [
      {
        q: "Pourquoi la plateforme SIEP LITAN a-t-elle été créée ?",
        a: "La recherche en intelligence artificielle exige des ressources computationnelles importantes — GPU pour l'entraînement de modèles, grande mémoire pour le traitement de données massives, environnements reproductibles pour la science ouverte. Ces ressources existent au sein du LITAN mais restaient sous-exploitées faute d'un accès structuré et sécurisé. SIEP répond à ce besoin en mutualisant les ressources du laboratoire au profit de l'ensemble de la communauté scientifique de l'ESTIN.",
      },
      {
        q: "Quels sont les avantages de la mutualisation des ressources ?",
        a: "La mutualisation permet d'utiliser les GPU et la RAM des machines du laboratoire sans achat de matériel supplémentaire, sans gestion locale complexe pour l'utilisateur. Les ressources sont partagées dynamiquement selon la charge réelle, sans ressource laissée inutilisée.",
      },
    ],
  },
  {
    category: "Fonctionnalités",
    icon: "⚡",
    questions: [
      {
        q: "Comment fonctionne la mutualisation des GPU et de la mémoire ?",
        a: "Les GPU et la RAM des machines du laboratoire sont partagés dynamiquement selon la charge réelle. Cela permet d'optimiser l'utilisation des ressources sans qu'aucune ressource ne reste inutilisée.",
      },
      {
        q: "Comment est assurée la sécurité sur la plateforme ?",
        a: "Chaque utilisateur travaille dans un environnement conteneurisé totalement isolé. Les données et scripts sont strictement privés et inaccessibles aux autres utilisateurs. L'infrastructure est 100% sécurisée et isolée.",
      },
      {
        q: "Comment est organisée l'infrastructure de la plateforme ?",
        a: "Les machines du laboratoire forment un cluster unifié et distribué. L'ajout d'une nouvelle machine est transparent pour l'utilisateur — il n'a rien à configurer.",
      },
      {
        q: "Quel environnement de travail est proposé ?",
        a: "La plateforme propose une interface JupyterHub familière, accessible depuis le navigateur sans installation locale. Python, R et les bibliothèques d'IA sont préconfigurés. L'utilisateur n'a besoin que d'un navigateur web.",
      },
      {
        q: "Comment accéder à la plateforme SIEP LITAN ?",
        a: "L'accès se fait via l'interface JupyterHub depuis un navigateur web. Aucune installation locale n'est nécessaire. L'authentification se fait via les identifiants institutionnels de l'ESTIN.",
      },
    ],
  },
  {
    category: "Accès & Profils",
    icon: "👤",
    questions: [
      {
        q: "Qui peut utiliser la plateforme SIEP LITAN ?",
        a: "Trois profils d'accès sont disponibles : 1) Chercheurs & enseignants (accès prioritaire, GPU exclusif, RAM jusqu'à 32 Go, sessions sans limite), 2) Doctorants (accès étendu, GPU partagé, RAM jusqu'à 16 Go, sessions 48h max), 3) Fin de cycle (accès encadré, CPU seul, RAM jusqu'à 4 Go, sessions 8h max).",
      },
      {
        q: "Quel est l'accès pour les chercheurs et enseignants ?",
        a: "Les chercheurs et enseignants bénéficient d'un accès prioritaire avec GPU exclusif, RAM jusqu'à 32 Go et sessions sans limite de durée.",
      },
      {
        q: "Quel est l'accès pour les doctorants ?",
        a: "Les doctorants bénéficient d'un accès étendu avec GPU partagé, RAM jusqu'à 16 Go et sessions limitées à 48h maximum.",
      },
      {
        q: "Quel est l'accès pour les étudiants en fin de cycle ?",
        a: "Les étudiants en fin de cycle bénéficient d'un accès encadré avec CPU seul (pas de GPU), RAM jusqu'à 4 Go et sessions limitées à 8h maximum.",
      },
      {
        q: "Comment se connecter à la plateforme SIEP LITAN ?",
        a: "L'authentification se fait via les identifiants institutionnels de l'ESTIN. Utilisez votre identifiant ESTIN habituel pour vous connecter.",
      },
    ],
  },
];

async function main() {
  const client = await prisma.client.findUnique({ where: { slug: "LITAN" } });
  if (!client) {
    console.error("Client with slug 'LITAN' not found. Create it first via the dashboard.");
    process.exit(1);
  }

  console.log(`Found client: ${client.name} (${client.id})`);

  const existing = await prisma.kBEntry.findMany({ where: { clientId: client.id } });
  if (existing.length > 0) {
    console.log(`Deleting ${existing.length} existing KB entries for this client...`);
    await prisma.kBEntry.deleteMany({ where: { clientId: client.id } });
  }

  let entryCount = 0;
  for (const group of RAW_DATA) {
    for (const qa of group.questions) {
      await prisma.kBEntry.create({
        data: {
          id: randomUUID(),
          question: qa.q,
          answer: qa.a,
          category: group.category,
          keywords: extractKeywords(qa.q, qa.a),
          icon: group.icon,
          priority: 5,
          related_tags: "",
          source: "",
          source_url: "",
          valid_until: "",
          clientId: client.id,
        },
      });
      entryCount++;
    }
  }

  // Contact entry for escalation
  await prisma.kBEntry.create({
    data: {
      id: randomUUID(),
      question: "Comment contacter le laboratoire LITAN ?",
      alt_questions: "Support SIEP LITAN, Assistance plateforme, Contact administration, Email LITAN",
      answer: "📞 **Contact LITAN — ESTIN Béjaïa**\n\nPour toute question, problème technique ou demande d'information concernant la plateforme SIEP LITAN, veuillez contacter le Laboratoire LITAN.\n\n📍 **Adresse** : ESTIN Béjaïa, Laboratoire LITAN\n📧 **Email** : Contactez l'administration de l'ESTIN",
      category: "Contact",
      keywords: "contact, contacter, support, assistance, administration, email, litan, estin",
      icon: "📞",
      priority: 10,
      clientId: client.id,
    },
  });
  entryCount++;

  console.log(`Created ${entryCount} KB entries for ${client.name}`);
}

function extractKeywords(q: string, a: string): string {
  const stopWords = new Set([
    "c'est", "qu'est-ce", "qu'est", "que", "qui", "quoi", "comment", "pourquoi",
    "est-ce", "dans", "avec", "sur", "pour", "sans", "chez", "entre", "vers",
    "mon", "ma", "mes", "ton", "ta", "tes", "son", "sa", "ses", "votre", "nos",
    "notre", "leurs", "tous", "tout", "toute", "toutes", "une", "des", "du",
    "au", "aux", "ce", "cet", "cette", "ces", "je", "tu", "il", "elle", "on",
    "nous", "vous", "ils", "elles", "en", "y", "ai", "a", "ont", "sont", "été",
    "peut", "peux", "veut", "veux", "fait", "font", "voir", "vais", "va", "vas",
    "plus", "moins", "très", "bien", "aussi", "si", "là", "ici", "où", "non",
    "oui", "pas", "ne", "ni", "ou", "et", "mais", "donc", "car", "or", "si",
    "the", "is", "a", "an", "of", "to", "in", "it", "for", "on", "with",
  ]);
  const text = `${q} ${a}`.toLowerCase();
  const words = text
    .replace(/[^a-zéèêëàâäùûüôöîïç0-9\s-]/g, " ")
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopWords.has(w));
  const unique = [...new Set(words)];
  return unique.slice(0, 12).join(", ");
}

main().catch(console.error).finally(() => prisma.$disconnect());
