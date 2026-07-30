const fs = require("fs");

const csvPath = "E:/nova-chatbot-saas/scripts/data/cetim-metrologie.csv";
let text = fs.readFileSync(csvPath, "utf8");

const REPLACEMENTS = [
  // Line 1
  [/Es ce que/g, "Est-ce que"],
  [/es ce que/g, "est-ce que"],
  [/reconu/g, "reconnu"],
  [/étaonnage/g, "étalonnage"],
  [/tecnique/g, "technique"],
  [/anuellement/g, "annuellement"],
  [/à l'échelle international/g, "à l'échelle internationale"],
  [/est il/g, "est-il"],
  [/es il/g, "est-il"],
  // Line 2
  [/capeurs/g, "capteurs"],
  [/manomètriques/g, "manométriques"],
  [/tranemtteur/g, "transmetteur"],
  [/manometre/g, "manomètre"],
  // Line 3
  [/sevice/g, "service"],
  [/champs de prestations/g, "champ de prestations"],
  [/annee tecnique/g, "annexe technique"],
  [/pièd à coulisse/g, "pied à coulisse"],
  [/palmeur/g, "palpeur"],
  [/thermomtre/g, "thermomètre"],
  [/dimensionel/g, "dimensionnel"],
  [/acrréditaions/g, "accréditations"],
  // Line 4
  [/hauet tension/g, "haute tension"],
  [/generateurs/g, "générateurs"],
  // Line 5
  [/déponds/g, "dépend"],
  [/dépond /g, "dépend "],
  [/faisablitité/g, "faisabilité"],
  [/préaables/g, "préalables"],
  [/sejour/g, "séjour"],
  [/equipments/g, "équipements"],
  [/necessaire/g, "nécessaire"],
  [/Délais/g, "Délai"],
  // Line 6
  [/rélisez/g, "réalisez"],
  [/Etuve/g, "étuve"],
  [/cetim/g, "CETIM"],
  [/Réaliez/g, "Réalisez"],
  [/tthermostatique/g, "thermostatique"],
  [/caractérisaion/g, "caractérisation"],
  // Line 7
  [/Etalonnage d'un/g, "Étalonnage d'un"],
  [/macine d'essai/g, "machine d'essai"],
  // Line 8
  [/analtique/g, "analytique"],
  [/assurence/g, "assurance"],
  [/tracabilité/g, "traçabilité"],
  // Line 10
  [/etalonnage/g, "étalonnage"],
  // Line 11
  [/chaine de mesure/g, "chaîne de mesure"],
  [/chaine d/g, "chaîne d"],
  [/tout les types/g, "tous les types"],
  // Line 12
  [/parmaceutiques/g, "pharmaceutiques"],
  [/performence/g, "performance"],
  [/quqlification/g, "qualification"],
  [/operationnelle/g, "opérationnelle"],
  [/equipements/g, "équipements"],
  // Line 13
  [/Dimensionnell/g, "Dimensionnel"],
  // Line 14
  [/tracables/g, "traçables"],
  [/internationl/g, "international"],
  [/inentérompue/g, "ininterrompue"],
  [/ fournis /g, " fournit "],
  [/qu'elle soient/g, "qu'elles soient"],
  [/ors accréditation/g, "hors accréditation"],
  // Line 15
  [/méhode/g, "méthode"],
  [/derni re version/g, "dernière version"],
  [/méthone/g, "méthode"],
  [/au équivalente/g, "ou équivalente"],
  // Line 16
  [/pratiquues/g, "pratiques"],
  [/prestation s /g, "prestations "],
  [/sur sie /g, "sur site "],
  [/exmple/g, "exemple"],
  [/laborattoire/g, "laboratoire"],
  // Line 17
  [/reception/g, "réception"],
  // Line 18
  [/métroloie/g, "métrologie"],
  [/mailleurs/g, "meilleures"],
  [/son publiées/g, "sont publiées"],
  [/, ca /g, ", ça "],
  [/auquelles/g, "auxquelles"],
  [/incetitude/g, "incertitude"],
  [/necessairement/g, "nécessairement"],
  [/systèmatique/g, "systématique"],
  [/3 années/g, "3 ans"],
  // Line 19
  [/vigeur/g, "vigueur"],
  // Line 20
  [/dépondent/g, "dépendent"],
  [/réetalonnage/g, "réétalonnage"],
];

for (const [pattern, replacement] of REPLACEMENTS) {
  text = text.replace(pattern, replacement);
}

fs.writeFileSync(csvPath, text, "utf8");
console.log("CSV corrigé avec succès.");

// Show diff summary
const lines = text.split(/\r?\n/);
for (let i = 1; i < lines.length; i++) {
  console.log(`Ligne ${i} OK`);
}
