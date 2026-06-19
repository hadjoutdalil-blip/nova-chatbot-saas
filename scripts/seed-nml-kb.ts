import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { randomUUID } from "crypto";

const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter });

const RAW_DATA = [
  {
    category: "Général",
    icon: "🏠",
    questions: [
      { q: "Qu'est-ce que Nova MicroLearn ?", a: "Nova MicroLearn est une plateforme de micro-formation en ligne qui propose des cours courts et certifiants. Les apprenants peuvent suivre des formations, passer des quiz, obtenir des badges de réussite, et interagir via une communauté sociale." },
      { q: "Quels types de formations trouve-t-on sur la plateforme ?", a: "On trouve plusieurs catégories : Scolaire Algérie (primaire, CEM, lycée, université), Professionnel (IA, Vibe Coding, Développement moderne, Data & BI), et Enseignement & Pédagogie. Chaque formation est conçue comme un micro-cours de 15 à 30 minutes." },
      { q: "Les formations sont-elles gratuites ?", a: "La plupart des formations sont gratuites (qualité Bronze). Certaines formations de qualité Silver ou Gold nécessitent un compte Famille ou VIP." },
      { q: "Faut-il créer un compte pour suivre une formation ?", a: "Oui, il faut créer un compte et être connecté pour s'inscrire et suivre une formation. Après inscription, vous pouvez accéder à votre tableau de bord et suivre votre progression." },
    ],
  },
  {
    category: "Inscription",
    icon: "👤",
    questions: [
      { q: "Comment créer un compte ?", a: "Cliquez sur 'Connexion' en haut à droite, puis sur 'Créer un compte'. Remplissez les champs : nom, email et mot de passe. Validez pour envoyer votre demande." },
      { q: "Je ne peux pas me connecter après mon inscription", a: "Après inscription, votre compte est en attente d'activation par un administrateur. Vous recevrez un message 'Inscription réussie. En attente d'activation par un administrateur.' Veuillez patienter ou contacter l'administration." },
      { q: "J'ai oublié mon mot de passe", a: "Pour le moment, la réinitialisation de mot de passe n'est pas disponible en libre-service. Contactez l'administration pour obtenir de l'aide." },
      { q: "Mon compte a été suspendu", a: "Si vous voyez le message 'Compte suspendu. Contactez l'administration.', cela signifie que votre compte a été suspendu par un administrateur. Veuillez contacter l'équipe d'administration pour résoudre la situation." },
      { q: "Quelles informations sont demandées lors de l'inscription ?", a: "Les champs obligatoires sont : nom, email et mot de passe. Vous pouvez aussi renseigner votre groupe (scolaire, professionnel, général) et votre catégorie pour personnaliser votre expérience." },
    ],
  },
  {
    category: "Formations",
    icon: "📚",
    questions: [
      { q: "Comment trouver une formation ?", a: "Rendez-vous dans le Catalogue (📚 Formations) depuis la barre de navigation. Vous pouvez filtrer par groupe (Scolaire Algérie, Professionnel, Enseignement) et par catégorie. Une barre de recherche vous permet de chercher par titre ou description." },
      { q: "Comment s'inscrire à une formation ?", a: "Ouvrez la formation qui vous intéresse dans le catalogue. Si vous êtes connecté, cliquez sur 'S'inscrire'. Si vous n'êtes pas connecté, vous verrez un bouton 'Se connecter pour s'inscrire'." },
      { q: "Qu'est-ce que la qualité Bronze, Silver et Gold ?", a: "Bronze (🥉) : formations gratuites accessibles à tous les comptes. Silver (🥈) : accessible avec un compte Famille. Gold (🥇) : accessible avec un compte VIP uniquement." },
      { q: "Comment le contenu d'une formation est-il structuré ?", a: "Chaque formation est divisée en sections (data-section) avec des titres et du contenu HTML. Vous progressez en défilant et en lisant chaque section. Un tracker enregistre automatiquement votre progression." },
      { q: "Puis-je reprendre une formation là où je l'ai laissée ?", a: "Oui, votre progression est suivie automatiquement (sections lues, quiz passé). Vous pouvez revenir à tout moment sur 'Mes formations' pour continuer." },
      { q: "Y a-t-il des formations pour le scolaire algérien ?", a: "Oui, la plateforme propose des formations pour le système scolaire algérien : Primaire (années 1 à 5), CEM (AM1 à AM4), Lycée (AS1 à AS3 avec spécialités), Université et École d'ingénieurs." },
    ],
  },
  {
    category: "Quiz",
    icon: "❓",
    questions: [
      { q: "Comment fonctionnent les quiz ?", a: "Chaque formation contient un quiz avec plusieurs questions à choix multiples (QCM). Vous devez répondre à toutes les questions pour valider. Le score minimum pour réussir est de 70% (ou 75% pour certains anciens cours)." },
      { q: "Puis-je refaire un quiz si je le rate ?", a: "Oui, si vous échouez, un bouton 'Réessayer' apparaît pour refaire le quiz. Vous pouvez tenter votre chance à nouveau." },
      { q: "Que se passe-t-il quand je réussis un quiz ?", a: "Félicitations ! Vous recevez un badge de réussite 🏅. Un message de célébration s'affiche avec des confettis, des emojis flottants et un message d'encouragement personnalisé. Votre progression est marquée comme complétée." },
      { q: "Où puis-je voir mes résultats de quiz ?", a: "Vos résultats sont visibles dans votre Tableau de bord et dans 'Mes formations'. Vous pouvez aussi voir les badges obtenus dans la page 'Mes badges'." },
    ],
  },
  {
    category: "Badges",
    icon: "🏅",
    questions: [
      { q: "Comment obtenir un badge ?", a: "Vous obtenez un badge en réussissant le quiz d'une formation avec un score d'au moins 70%. Le badge est automatiquement créé et rattaché à votre compte." },
      { q: "Où voir mes badges ?", a: "Dans la page 'Mes badges' accessible depuis le menu Apprenant > Mes badges. Vous y trouverez la liste de tous vos badges avec le nom de la formation, la date d'obtention et un code de vérification." },
      { q: "Puis-je partager mon badge ?", a: "Oui, deux options : 1) Partager sur la communauté (un post est créé automatiquement dans le fil d'actualité). 2) Copier le lien de partage public pour l'envoyer à qui vous voulez. Le lien public montre une page avec votre nom, la formation et un code de vérification." },
      { q: "Puis-je télécharger mon badge en PDF ?", a: "Oui, depuis la page 'Mes badges', cliquez sur le bouton 'Télécharger PDF' pour générer et télécharger un certificat PDF de votre badge." },
      { q: "Mon badge est-il vérifiable ?", a: "Oui, chaque badge possède un code de vérification unique (token public). N'importe qui peut vérifier l'authenticité du badge en accédant à la page publique du badge avec ce code." },
    ],
  },
  {
    category: "Communauté",
    icon: "💬",
    questions: [
      { q: "Comment accéder à la communauté ?", a: "Connectez-vous et cliquez sur 'Communauté' dans le menu Apprenant (sidebar) ou dans la barre de navigation horizontale." },
      { q: "Que puis-je faire dans la communauté ?", a: "Vous pouvez : publier des posts, écrire des articles (blogs), partager des stories (disparition après 24h), aimer et commenter les publications des autres, et voir le fil d'actualité." },
      { q: "Comment créer un post ?", a: "Cliquez sur le champ 'Quoi de neuf ?' en haut de la page communautaire. Tapez votre message puis cliquez sur 'Publier'. Vous pouvez choisir entre un Post, une Story ou un Blog." },
      { q: "C'est quoi la différence entre Post, Blog et Story ?", a: "Post : message court (2000 caractères max) qui apparaît dans le fil. Blog : article long avec titre (5000 caractères max) affiché comme une carte avec un bouton 'Lire plus'. Story : contenu éphémère qui disparaît après 24 heures." },
      { q: "Comment supprimer une publication ?", a: "Vous pouvez supprimer vos propres publications en cliquant sur le bouton ✕ qui apparaît sur votre post. Seul l'auteur ou un administrateur peut supprimer une publication." },
      { q: "Puis-je commenter les publications ?", a: "Oui, cliquez sur le bouton 'Commenter' sous une publication pour afficher la section des commentaires. Tapez votre message et appuyez sur Entrée ou cliquez sur 'Envoyer'." },
    ],
  },
  {
    category: "Abonnements",
    icon: "⭐",
    questions: [
      { q: "Quels sont les types de comptes ?", a: "Trois types : Compte Normal (accès aux formations Bronze), Compte Famille (accès Bronze + Silver), et Compte VIP (accès Bronze + Silver + Gold)." },
      { q: "Comment passer à un compte Famille ou VIP ?", a: "Rendez-vous sur la page d'abonnement (Soutenir > Abonnements ou la page Subscribe). Vous y trouverez les offres disponibles pour passer à un compte supérieur." },
      { q: "Que faire si une formation m'affiche 'Compte Famille requis' ?", a: "Cela signifie que la formation est de qualité Silver, accessible uniquement avec un compte Famille ou VIP. Vous devez passer à un abonnement supérieur pour y accéder." },
    ],
  },
  {
    category: "Navigation",
    icon: "🧭",
    questions: [
      { q: "Comment accéder à mon tableau de bord ?", a: "Connectez-vous puis cliquez sur 🎓 Apprenant dans la barre du haut, ou sur 📊 Tableau de bord dans le menu latéral." },
      { q: "Quelles sont les sections du menu Apprenant ?", a: "Le menu Apprenant contient : Tableau de bord, Catalogue, Parcours, Mes formations, Mes badges, Communauté, et Mon profil." },
      { q: "Comment voir mes formations en cours ?", a: "Depuis le menu Apprenant, cliquez sur 'Mes formations'. Vous y verrez toutes les formations auxquelles vous êtes inscrit avec votre progression." },
    ],
  },
  {
    category: "Technique",
    icon: "⚙️",
    questions: [
      { q: "La plateforme fonctionne-t-elle sur mobile ?", a: "Oui, Nova MicroLearn est responsive et fonctionne sur tous les appareils : ordinateur, tablette et smartphone." },
      { q: "Puis-je suivre une formation sans connexion internet ?", a: "Non, la plateforme nécessite une connexion internet pour accéder aux contenus, passer les quiz et obtenir les badges." },
      { q: "Mes données sont-elles sécurisées ?", a: "Oui, les mots de passe sont chiffrés avec bcrypt, les tokens JWT sont utilisés pour l'authentification, et la connexion à la base de données se fait en SSL." },
      { q: "Comment est suivie ma progression dans une formation ?", a: "Un tracker intégré enregistre votre progression : les sections consultées (détection automatique par défilement), le temps passé, et bien sûr le résultat du quiz." },
    ],
  },
  {
    category: "Parcours",
    icon: "🎯",
    questions: [
      { q: "Qu'est-ce qu'un parcours ?", a: "Un parcours (program) est un ensemble de formations organisées en niveaux pour vous guider pas à pas vers un objectif d'apprentissage. Chaque niveau peut contenir plusieurs cours." },
      { q: "Comment suivre un parcours ?", a: "Rendez-vous sur la page Parcours (🎯 Parcours). Choisissez un parcours, puis suivez les niveaux dans l'ordre. Chaque formation du parcours doit être validée pour passer au niveau suivant." },
    ],
  },
  {
    category: "Événements",
    icon: "📅",
    questions: [
      { q: "Y a-t-il des événements organisés sur la plateforme ?", a: "Oui, la plateforme propose des événements (ateliers, webinaires, formations en direct). Vous pouvez les voir depuis la page d'accueil ou la page dédiée aux événements." },
      { q: "Comment m'inscrire à un événement ?", a: "Ouvrez la page de l'événement qui vous intéresse et cliquez sur le bouton d'inscription. Les places peuvent être limitées selon l'événement." },
    ],
  },
  {
    category: "Soutien",
    icon: "❤️",
    questions: [
      { q: "Puis-je soutenir la plateforme ?", a: "Oui, vous pouvez faire un don ou vous abonner depuis la page 'Soutenir'. Les dons et abonnements aident à maintenir et améliorer la plateforme." },
    ],
  },
];

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

async function main() {
  const client = await prisma.client.findUnique({ where: { slug: "NM" } });
  if (!client) {
    console.error("Client with slug 'NM' not found. Create it first via the dashboard.");
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

  // Add contact entry with explicit "contact" keyword for escalation
  await prisma.kBEntry.create({
    data: {
      id: randomUUID(),
      question: "Comment contacter l'administration de Nova MicroLearn ?",
      alt_questions: "Support Nova MicroLearn, Assistance, Nous contacter, Email administration",
      answer: "📞 **Contact Nova MicroLearn**\n\nPour toute question, problème ou demande d'information, vous pouvez contacter notre équipe :\n\n📧 **Email** : contact@nova.dz\n\nNotre équipe vous répondra sous 24h ouvrées.",
      category: "Contact",
      keywords: "contact, contacter, support, assistance, administration, email",
      icon: "📞",
      priority: 10,
      clientId: client.id,
    },
  });
  entryCount++;

  console.log(`Created ${entryCount} KB entries for ${client.name}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
