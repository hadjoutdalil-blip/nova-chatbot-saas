export interface IntentPattern {
  regex: RegExp;
  lang?: "fr" | "ar" | "dz";
}

export const SMALL_TALK_PATTERNS: IntentPattern[] = [
  { regex: /^(bonjour|salut|salutation|cc|hello|hi|coucou|hey|salam|salam alykoum|bsms|bsm|slt)\b/i, lang: "fr" },
  { regex: /^(merci|thanks|thank you|thx|shukran|merci beaucoup|merci bien)\b/i, lang: "fr" },
  { regex: /^(au revoir|bye|a plus|a toute|ciao|adieu|bonne journ[eé]e|bonne soir[eé]e)\b/i, lang: "fr" },
  { regex: /^(ok|d'accord|dac|okay|compris|pig[eé]|pas de souci|pas de probl[èe]me)\b/i, lang: "fr" },
  { regex: /^(comment (ça va|vas-tu|allez-vous|tu vas|vous allez)|ça va(\s|[?]|$))/i, lang: "fr" },
  { regex: /^(quoi de neuf|quoi d'neuf|keske tu deviens|comment vas)\b/i, lang: "fr" },
  { regex: /^(tu es qui|qui es-tu|what are you|who are you|t'es quoi)\b/i, lang: "fr" },
  { regex: /^(tu fais quoi|que fais-tu|vous faites quoi)\b/i, lang: "fr" },
  { regex: /^(super|génial|genial|parfait|nickel|top|impeccable)\b/i, lang: "fr" },
  { regex: /^((oui|non)\s*(merci)?)$/i, lang: "fr" },
  { regex: /^(:\)|:-\)|:\(|:-\()$/ },
];

export const HORS_SUJET_PATTERNS: IntentPattern[] = [
  { regex: /(météo|temps qu'il fait|quel temps|pluie|soleil)\b/i, lang: "fr" },
  { regex: /(recette|cuisiner|cuisine|manger|repas|plat|gâteau|gateau)\b/i, lang: "fr" },
  { regex: /(football|foot|sport|match|ligue des champions|coupe du monde)\b/i, lang: "fr" },
  { regex: /(jeu vidéo|jeux vidéo|gaming|fortnite|call of duty|minecraft)\b/i, lang: "fr" },
  { regex: /(musique|chanson|artiste|album|concert|spotify)\b/i, lang: "fr" },
  { regex: /(film|série|netflix|disney|cinéma|cinema)\b/i, lang: "fr" },
  { regex: /(politique|élection|élections|président|gouvernement)\b/i, lang: "fr" },
  { regex: /(voiture|moto|automobile|conduire|permis)\b/i, lang: "fr" },
  { regex: /(blague|humour|drôle|drole|rire)\b/i, lang: "fr" },
  { regex: /(horoscope|astrologie|signe|zodiaque)\b/i, lang: "fr" },
];

export const AVIS_PATTERNS: IntentPattern[] = [
  { regex: /(j'adore|j aime|j'aime|jaim|j'adore|jadore)\s+(cetim|votre|ce site|le bot|le chatbot)\b/i, lang: "fr" },
  { regex: /(je n'aime pas|je n aime pas|je déteste|je deteste|j'ai horreur|j ai horreur)\s+(cetim|votre|ce site|le bot)\b/i, lang: "fr" },
  { regex: /cetim\s+(est|c'est|c est)\s+(nul|nulle|super|bien|génial|génial|top|mauvais|excellent|formidable)\b/i, lang: "fr" },
  { regex: /(c'est|c est|c'était|c etait)\s+(nul|nulle|super|bien|génial|genial|top|mauvais|horrible|incroyable)\s+(cetim|votre)\b/i, lang: "fr" },
];

export const SMALL_TALK_RESPONSES = [
  "Bonjour ! Je suis l'assistant virtuel de CETIM Algérie. Je suis là pour vous renseigner sur nos essais, normes et services techniques. Comment puis-je vous aider ?",
  "Bonjour et bienvenue ! Je suis l'assistant CETIM. Je peux vous informer sur nos prestations d'essais (béton, sol, eau, etc.), les normes algériennes et internationales, ainsi que nos services d'étalonnage. Que souhaitez-vous savoir ?",
  "Bonjour ! Je suis le conseiller virtuel du CETIM Algérie. N'hésitez pas à me poser vos questions concernant nos activités techniques, les normes ou nos laboratoires. Comment puis-je vous assister ?",
  "Salut ! Je suis l'assistant CETIM. Je suis à votre disposition pour toute question sur les essais, mesures, analyses et formations que nous proposons. En quoi puis-je être utile ?",
];

export const HORS_SUJET_RESPONSE =
  "Je suis l'assistant technique du CETIM Algérie. 🙋\n\n" +
  "Je suis spécialisé dans les domaines suivants :\n" +
  "• Essais en laboratoire (béton, sol, eau, granulats, etc.)\n" +
  "• Normes algériennes (NA), françaises (NF), européennes (EN), internationales (ISO)\n" +
  "• Étalonnage et métrologie\n" +
  "• Inspection et contrôle qualité\n" +
  "• Formation technique\n\n" +
  "Pouvez-vous reformuler votre question concernant nos activités ? Je serai ravi de vous renseigner.";
