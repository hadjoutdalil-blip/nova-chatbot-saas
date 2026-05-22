import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { randomUUID } from "crypto";

const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter });

const KB = [
  // ── BUSINESS ──
  {
    question: "Qu'est-ce que Nova Chatbot ?",
    alt_questions: "C'est quoi Nova Chatbot,Présentation Nova Chatbot,À propos de Nova Chatbot",
    answer: "Nova Chatbot est une solution SaaS qui permet d'ajouter un chatbot intelligent à votre site web. Il combine une base de connaissances personnalisée et une IA générative pour répondre automatiquement aux questions de vos visiteurs, 24h/24 et 7j/7. Vous gérez tout depuis votre tableau de bord : contenu, apparence, statistiques.",
    category: "Business",
    keywords: "nova chatbot, présentation, solution, chatbot ia, saas",
    priority: 10,
  },
  {
    question: "Quels sont les tarifs de Nova Chatbot ?",
    alt_questions: "Combien coûte Nova Chatbot,Prix Nova Chatbot,Formules et abonnements,Tarifs des packs",
    answer: "Nova Chatbot propose plusieurs formules : un pack E-commerce à 299$/mois, un pack Support Client à 399$/mois (le plus populaire), et un pack Immobilier à 499$/mois. Nous proposons également des solutions sur mesure selon vos besoins. Chaque pack inclut le widget, le tableau de bord et la base de connaissances. Contactez-nous à contact@nova.dz pour un devis personnalisé.",
    category: "Business",
    keywords: "tarifs, prix, abonnement, pack, formule, devis",
    priority: 9,
  },
  {
    question: "Quels sont les avantages de Nova Chatbot ?",
    alt_questions: "Pourquoi choisir Nova Chatbot,Bénéfices Nova Chatbot,Avantages du chatbot",
    answer: "Nova Chatbot vous offre : 1) Un widget élégant intégré en une ligne de code, 2) Une base de connaissances pré-remplie adaptée à votre métier, 3) Une IA générative qui prend le relais si nécessaire, 4) Un tableau de bord complet pour tout gérer, 5) Une personnalisation complète (couleurs, logo, messages), 6) Des statistiques sur les conversations, et 7) Un déploiement clé en main sous 48 à 72h.",
    category: "Business",
    keywords: "avantages, bénéfices, pourquoi, valeur ajoutée",
    priority: 8,
  },
  {
    question: "Comment contacter le support Nova Chatbot ?",
    alt_questions: "Support Nova Chatbot,Contact Nova Chatbot,Assistance,Nous contacter",
    answer: "Vous pouvez nous contacter par email à contact@nova.dz. Nous répondons sous 24h ouvrées. Pour les demandes de devis ou d'information, utilisez le même email avec l'objet de votre demande.",
    category: "Business",
    keywords: "contact, support, assistance, email, joindre",
    priority: 7,
  },
  {
    question: "Quels types d'entreprises peuvent utiliser Nova Chatbot ?",
    alt_questions: "Pour qui est fait Nova Chatbot,Entreprises compatibles,Secteurs d'activité",
    answer: "Nova Chatbot est conçu pour trois secteurs principaux : l'e-commerce (boutiques en ligne), le support client (entreprises avec beaucoup de questions fréquentes), et l'immobilier (agences immobilières). Nous proposons également des solutions sur mesure pour tout autre secteur d'activité. Contactez-nous pour étudier votre projet.",
    category: "Business",
    keywords: "secteurs, entreprises, types, e-commerce, immobilier, support",
    priority: 7,
  },

  // ── TECHNICAL ──
  {
    question: "Comment installer le widget Nova Chatbot sur mon site ?",
    alt_questions: "Installation widget Nova Chatbot,Intégration chatbot,Code d'intégration,Ajouter chatbot à mon site",
    answer: "C'est très simple : 1) Connectez-vous à votre tableau de bord, 2) Allez dans la section 'Mon widget', 3) Copiez le code d'intégration (une balise script), 4) Collez-le dans le <head> ou juste avant </body> de votre site. Le chatbot apparaît immédiatement. Aucune compétence technique n'est requise.",
    category: "Technique",
    keywords: "installation, intégration, widget, script, code, déploiement",
    priority: 10,
  },
  {
    question: "Comment configurer le widget Nova Chatbot ?",
    alt_questions: "Personnalisation widget,Configuration widget,Modifier l'apparence du widget,Paramètres widget",
    answer: "Dans votre tableau de bord, section 'Mon widget', vous pouvez personnaliser : le titre et sous-titre de bienvenue, la position (droite/gauche), les marges, l'icône d'avatar (6 choix disponibles), et l'affichage de la marque. Toutes les modifications sont appliquées en temps réel après enregistrement.",
    category: "Technique",
    keywords: "configuration, personnalisation, widget, apparence, paramètres",
    priority: 9,
  },
  {
    question: "Comment ajouter une clé API pour l'IA ?",
    alt_questions: "Configurer clé API IA,API key chatbot,Fournisseur IA Groq Cerebras",
    answer: "Allez dans 'Paramètres' depuis votre tableau de bord. Vous pouvez configurer : 1) Le fournisseur (Groq ou Cerebras), 2) Le modèle IA (comme llama-3.1-8b-instant), 3) Votre clé API. Utilisez le bouton 'Tester' pour vérifier que la clé fonctionne avant d'enregistrer. La clé API est stockée de manière sécurisée.",
    category: "Technique",
    keywords: "clé api, api key, ia, groq, cerebras, modèle, fournisseur",
    priority: 9,
  },
  {
    question: "Quels fournisseurs et modèles IA sont supportés ?",
    alt_questions: "Modèles IA supportés,Fournisseurs IA,Nova Chatbot modèles,Llama Mixtral Gemma",
    answer: "Nova Chatbot supporte actuellement deux fournisseurs : Groq (modèles : llama-3.1-8b-instant, llama-3.3-70b-versatile, mixtral-8x7b-32768, gemma2-9b-it) et Cerebras (modèles : llama3.1-8b, llama3.1-70b). Le modèle par défaut est llama-3.1-8b-instant qui offre un bon équilibre entre rapidité et qualité.",
    category: "Technique",
    keywords: "modèles, fournisseurs, groq, cerebras, llama, mixtral, gemma",
    priority: 8,
  },
  {
    question: "Comment fonctionne le mode IA vs le mode base de connaissances ?",
    alt_questions: "Différence mode IA et KB,Fonctionnement IA chatbot,Base de connaissances vs IA",
    answer: "Le chatbot utilise d'abord la base de connaissances (KB) pour répondre. Quand une question est posée, il calcule un score de similarité avec les entrées de la KB. Si le score dépasse le seuil de confiance (60% par défaut), il répond depuis la KB. Sinon, si le mode IA est activé et qu'une clé API est configurée, il interroge l'IA générative avec le contexte de votre entreprise pour fournir une réponse intelligente. Vous pouvez ajuster le seuil de confiance dans les paramètres.",
    category: "Technique",
    keywords: "mode ia, mode kb, base connaissances, ia générative, seuil confiance",
    priority: 8,
  },
  {
    question: "Comment exporter et importer ma base de connaissances ?",
    alt_questions: "Export KB Nova Chatbot,Import KB,JSON base connaissances,Sauvegarde KB",
    answer: "Depuis la section 'Base de connaissances', utilisez les boutons 'Exporter' (télécharge un fichier JSON) et 'Importer' (charge un fichier JSON). L'import vous propose de remplacer la base existante ou d'ajouter les nouvelles entrées. Le format d'export est compatible avec le format d'import pour une sauvegarde et restauration faciles.",
    category: "Technique",
    keywords: "export, import, json, sauvegarde, base connaissances",
    priority: 7,
  },
  {
    question: "Le widget fonctionne-t-il sur mobile ?",
    alt_questions: "Widget responsive mobile,Compatible smartphone,Adaptation mobile",
    answer: "Oui, le widget est entièrement responsive et s'adapte automatiquement à tous les écrans. Sur mobile, il prend tout l'écran en hauteur pour une expérience de chat optimale. Les animations sont également adaptées avec prefers-reduced-motion pour les utilisateurs qui préfèrent réduire les mouvements.",
    category: "Technique",
    keywords: "mobile, responsive, smartphone, tablette, adaptation",
    priority: 7,
  },

  // ── USER MANUAL ──
  {
    question: "Comment utiliser le tableau de bord Nova Chatbot ?",
    alt_questions: "Guide tableau de bord,Interface client Nova,Navigation dashboard",
    answer: "Le tableau de bord client est composé de 5 sections accessibles depuis le menu latéral : Dashboard (vue d'ensemble), Base de connaissances (gérer les questions/réponses), Mon widget (personnaliser et obtenir le code), Statistiques (suivre les performances), et Paramètres (configurer l'IA et l'API). Chaque section est conçue pour être simple et intuitive.",
    category: "Manuel Utilisation",
    keywords: "tableau de bord, navigation, interface, dashboard, guide",
    priority: 9,
  },
  {
    question: "Comment ajouter une entrée dans la base de connaissances ?",
    alt_questions: "Ajouter question réponse,Créer entrée KB,Nouvelle question chatbot",
    answer: "Cliquez sur 'Nouvelle entrée' dans la section Base de connaissances. Remplissez la question principale, la réponse, et optionnellement : des questions alternatives (variantes), une catégorie, des mots-clés, une priorité (1-10), et des tags associés. Vous pouvez aussi choisir une icône émoji. Cliquez sur 'Ajouter' pour enregistrer.",
    category: "Manuel Utilisation",
    keywords: "ajouter, entrée, question, réponse, kb, base connaissances, créer",
    priority: 9,
  },
  {
    question: "Comment modifier ou supprimer une entrée KB ?",
    alt_questions: "Modifier entrée KB,Supprimer question,Éditer base connaissances",
    answer: "Dans la liste des entrées de la base de connaissances, chaque entrée possède deux icônes d'action : 'Modifier' (crayon) pour éditer la question, la réponse et les autres champs, et 'Supprimer' (poubelle) pour supprimer définitivement l'entrée. Vous pouvez aussi utiliser la barre de recherche et le filtre par catégorie pour trouver rapidement une entrée.",
    category: "Manuel Utilisation",
    keywords: "modifier, supprimer, éditer, entrée, kb, action",
    priority: 8,
  },
  {
    question: "Comment voir les statistiques de mon chatbot ?",
    alt_questions: "Statistiques chatbot,Analytics Nova,Nombre conversations,taux réponse",
    answer: "La section 'Statistiques' affiche le nombre d'entrées dans votre base de connaissances, le nombre de conversations, et le taux de réponse de la KB. Ces indicateurs vous permettent de suivre l'activité de votre chatbot et d'identifier si vous devez enrichir votre base de connaissances.",
    category: "Manuel Utilisation",
    keywords: "statistiques, analytics, conversations, taux réponse, suivi",
    priority: 8,
  },
  {
    question: "Comment obtenir le code d'intégration de mon widget ?",
    alt_questions: "Code intégration widget,Récupérer script chatbot,Lien d'intégration",
    answer: "Dans la section 'Mon widget', le code d'intégration s'affiche automatiquement dans une boîte verte. Copiez la balise <script> et collez-la dans le <head> de votre site web ou juste avant la balise </body>. Le widget apparaîtra immédiatement sur votre site. Vous pouvez tester le rendu dans l'onglet 'Test'.",
    category: "Manuel Utilisation",
    keywords: "code intégration, script, widget, embed, copier",
    priority: 9,
  },
  {
    question: "Comment tester le widget avant de l'installer ?",
    alt_questions: "Tester chatbot,Aperçu widget,Test intégration",
    answer: "Dans la section 'Test' de votre tableau de bord (accessible depuis l'interface admin), vous pouvez voir un aperçu en direct du widget avec vos paramètres actuels. Cela vous permet de vérifier l'apparence, les réponses de la base de connaissances, et le comportement avant de déployer le code sur votre site.",
    category: "Manuel Utilisation",
    keywords: "test, aperçu, widget, preview, essai",
    priority: 7,
  },
  {
    question: "Comment réinitialiser la conversation du chatbot ?",
    alt_questions: "Reset conversation,Réinitialiser chat,Effacer historique",
    answer: "Dans le widget, cliquez sur le bouton de réinitialisation (icône de rotation) dans l'en-tête du chatbot. Une confirmation vous sera demandée avant d'effacer l'historique de la conversation et de revenir au message d'accueil.",
    category: "Manuel Utilisation",
    keywords: "réinitialiser, reset, conversation, historique, effacer",
    priority: 6,
  },
  {
    question: "Puis-je activer ou désactiver le mode IA ?",
    alt_questions: "Activer IA chatbot,Désactiver mode IA,Bouton IA widget",
    answer: "Oui, le mode IA se bascule depuis le bouton avec l'icône de cerveau (💡) dans l'en-tête du widget. Quand le mode IA est actif, l'avatar devient violet et une indication 'IA Active' apparaît dans la barre de statut. Le mode IA peut aussi être activé ou désactivé par défaut depuis les paramètres de votre tableau de bord.",
    category: "Manuel Utilisation",
    keywords: "ia, activer, désactiver, mode, cerveau, ia active",
    priority: 6,
  },
];

async function main() {
  const client = await prisma.client.findUnique({ where: { slug: "NC" } });
  if (!client) {
    console.error("Client with slug 'NC' not found. Create it first via the dashboard.");
    process.exit(1);
  }

  console.log(`Found client: ${client.name} (${client.id})`);

  const existing = await prisma.kBEntry.findMany({ where: { clientId: client.id } });
  if (existing.length > 0) {
    console.log(`Deleting ${existing.length} existing KB entries for this client...`);
    await prisma.kBEntry.deleteMany({ where: { clientId: client.id } });
  }

  const data = KB.map((entry) => ({
    id: randomUUID(),
    question: entry.question,
    alt_questions: entry.alt_questions,
    answer: entry.answer,
    category: entry.category,
    keywords: entry.keywords,
    priority: entry.priority,
    related_tags: "",
    icon: "",
    clientId: client.id,
  }));

  await prisma.kBEntry.createMany({ data });
  console.log(`Created ${data.length} KB entries for ${client.name}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
