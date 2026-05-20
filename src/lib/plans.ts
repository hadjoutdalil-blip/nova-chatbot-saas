export interface Plan {
  id: string;
  name: string;
  price: number;
  description: string;
  features: string[];
  badge?: string;
}

export const PLANS: Plan[] = [
  {
    id: "ecommerce",
    name: "Chatbot E-commerce",
    price: 299,
    description: "Boostez vos ventes et automatisez le support client de votre boutique en ligne.",
    features: [
      "Questions sur les produits et le stock",
      "Suivi de commande et livraison",
      "Retours et remboursements",
      "Recommandations produits",
      "Catalogue jusqu'à 500 produits",
      "Disponible en 48h",
    ],
  },
  {
    id: "support",
    name: "Chatbot Support Client",
    price: 399,
    description: "Automatisez votre service client avec une base de connaissances intelligente.",
    features: [
      "FAQ et base de connaissances illimitée",
      "Création de tickets automatique",
      "Transfert vers un humain si nécessaire",
      "Horaires et disponibilité",
      "Processus et procédures",
      "Disponible en 72h",
    ],
  },
  {
    id: "realestate",
    name: "Chatbot Immobilier",
    price: 499,
    description: "Qualifiez vos leads et répondez aux questions de vos prospects 24h/24.",
    features: [
      "Recherche de biens par critères",
      "Visites et disponibilités",
      "Simulation de crédit",
      "Documents et procédures",
      "Qualification des leads",
      "Disponible en 72h",
    ],
  },
  {
    id: "custom",
    name: "Sur Mesure",
    price: 0,
    description: "Un chatbot adapté à votre secteur d'activité spécifique.",
    features: [
      "Analyse de vos besoins",
      "Base de connaissances personnalisée",
      "Workflows et scénarios avancés",
      "Formation de l'IA sur vos données",
      "Intégration API sur mesure",
      "Livraison sous 5 à 7 jours",
    ],
    badge: "Nous contacter",
  },
];

export const PLAN_KB_TEMPLATES: Record<string, { question: string; answer: string; category: string; keywords: string }[]> = {
  ecommerce: [
    { question: "Quels sont vos délais de livraison ?", answer: "Nos délais de livraison sont de 3 à 5 jours ouvrés en France métropolitaine et de 5 à 10 jours ouvrés pour l'international.", category: "Livraison", keywords: "délais, livraison, expédition" },
    { question: "Puis-je retourner un produit ?", answer: "Oui, vous disposez de 30 jours à compter de la réception pour retourner un produit. Il doit être dans son état d'origine et non utilisé.", category: "Retours", keywords: "retour, remboursement, rétractation" },
    { question: "Comment suivre ma commande ?", answer: "Vous recevrez un email avec un numéro de suivi dès l'expédition de votre commande. Vous pouvez également suivre votre commande depuis votre compte client.", category: "Suivi", keywords: "suivi, commande, tracking" },
    { question: "Quels moyens de paiement acceptez-vous ?", answer: "Nous acceptons les cartes bancaires (Visa, Mastercard, American Express), PayPal, et le paiement en 3x sans frais.", category: "Paiement", keywords: "paiement, cb, paypal, carte" },
    { question: "Comment contacter le service client ?", answer: "Vous pouvez nous contacter par email à support@exemple.com, par téléphone au 01 23 45 67 89 du lundi au vendredi de 9h à 18h, ou via ce chat.", category: "Contact", keywords: "contact, service client, téléphone" },
  ],
  support: [
    { question: "Quels sont vos horaires d'ouverture ?", answer: "Nous sommes ouverts du lundi au vendredi de 8h30 à 18h00 et le samedi de 9h00 à 12h00.", category: "Horaires", keywords: "horaires, ouverture, fermeture" },
    { question: "Comment créer un compte ?", answer: "Rendez-vous sur notre page d'inscription, renseignez votre email et créez un mot de passe. Vous recevrez un email de confirmation.", category: "Compte", keywords: "création, compte, inscription" },
    { question: "J'ai oublié mon mot de passe", answer: "Cliquez sur 'Mot de passe oublié' sur la page de connexion. Vous recevrez un email avec un lien pour réinitialiser votre mot de passe.", category: "Compte", keywords: "mot de passe, oubli, réinitialisation" },
    { question: "Comment résilier mon abonnement ?", answer: "Vous pouvez résilier depuis votre espace client > Abonnement > Résilier. Votre abonnement reste actif jusqu'à la fin de la période en cours.", category: "Abonnement", keywords: "résiliation, abonnement, annuler" },
    { question: "Puis-je changer de formule ?", answer: "Oui, vous pouvez changer de formule à tout moment depuis votre espace client. Le changement est effectif immédiatement.", category: "Abonnement", keywords: "formule, changement, upgrade" },
  ],
  realestate: [
    { question: "Quels sont les biens disponibles à la vente ?", answer: "Nous avons actuellement plus de 200 biens disponibles. Vous pouvez consulter notre catalogue en ligne et filtrer par ville, prix, type de bien et superficie.", category: "Biens", keywords: "vente, biens, catalogue, disponibilité" },
    { question: "Comment planifier une visite ?", answer: "Vous pouvez planifier une visite directement depuis la fiche du bien qui vous intéresse, ou nous contacter pour convenir d'un créneau.", category: "Visites", keywords: "visite, rendez-vous, planning" },
    { question: "Quels sont les frais d'agence ?", answer: "Nos frais d'agence sont de 5% du prix de vente TTC, inclus dans le prix affiché. Pour les locations, les frais sont d'un mois de loyer.", category: "Frais", keywords: "frais, agence, commission" },
    { question: "Quels documents sont nécessaires pour une offre ?", answer: "Pour faire une offre, vous aurez besoin d'une pièce d'identité, d'un justificatif de domicile, et d'une attestation de financement ou d'un apport.", category: "Documents", keywords: "documents, offre, dossier" },
    { question: "Comment estimer mon bien ?", answer: "Vous pouvez demander une estimation gratuite en ligne. Nous vous recontacterons sous 48h pour une visite d'estimation par l'un de nos experts.", category: "Estimation", keywords: "estimation, évaluation, prix" },
  ],
  custom: [],
};
