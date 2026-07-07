import ExcelJS from "exceljs";
import { join } from "path";

const COLUMNS: { key: string; label: string; width: number; description: string; required?: boolean }[] = [
  { key: "tag", label: "tag", width: 22, description: "Identifiant unique, sans espaces ni accents (ex: presentation_cetim)", required: true },
  { key: "question", label: "question_principale", width: 40, description: "La question de référence posée par l'utilisateur", required: true },
  { key: "alt_questions", label: "questions_alternatives", width: 45, description: "Autres formulations, séparées par | (ex: c'est quoi le cetim|que fait le cetim)" },
  { key: "short_resp", label: "reponse_courte", width: 50, description: "Résumé en 1-2 phrases (affichage rapide)" },
  { key: "answer", label: "reponse_longue", width: 60, description: "Réponse complète. Accepte <br>, <b>, <a href='...'> pour la mise en forme", required: true },
  { key: "category", label: "categorie", width: 25, description: "Groupe thématique (ex: CETIM – Général, Laboratoires, Organisation)" },
  { key: "keywords", label: "mots_cles", width: 40, description: "Mots-clés pour le matching, séparés par | (ex: pdg|directeur général|président)" },
  { key: "priority", label: "priorite", width: 12, description: "Priorité 1-10. 10 = haute (spécifique), 5 = défaut (générique). Par défaut: 5" },
  { key: "related_tags", label: "tags_associes", width: 30, description: "Tags d'entrées connexes, séparés par |" },
  { key: "icon", label: "icone", width: 10, description: "Emoji ou classe CSS (ex: 🏢, 👤, 🔬)" },
  { key: "source", label: "source", width: 25, description: "Document source (ex: Rapport annuel 2024, Site web)" },
  { key: "source_url", label: "url_source", width: 40, description: "Lien vers le document source" },
  { key: "valid_until", label: "valide_jusqua", width: 16, description: "Date d'expiration (AAAA-MM-JJ). Vide = pas d'expiration." },
];

const EXAMPLES = [
  {
    tag: "presentation_cetim",
    question: "Qu'est-ce que le CETIM ?",
    alt_questions: "c'est quoi le cetim|que fait le cetim|centre technique matériaux construction",
    short_resp: "Le CETIM est un centre d'études technologiques spécialisé dans les matériaux de construction, filiale du Groupe GICA.",
    answer: `Le CETIM (Centre d'Études Technologiques des Matériaux de Construction) est une entreprise publique économique (EPE/SPA), filiale du Groupe GICA.<br><br>Créé en 1998, il a pour missions principales :<br>- La recherche appliquée dans le domaine des matériaux de construction<br>- Le contrôle qualité et les essais en laboratoire<br>- L'assistance technique et le conseil aux industriels<br>- La formation et le développement des compétences`,
    category: "CETIM – Général",
    keywords: "centre|études|technologiques|matériaux|construction|gica|EPE|SPA|1998",
    priority: 5,
    related_tags: "missions_cetim|activites_cetim|gica_groupe",
    icon: "🏢",
    source: "Site web CETIM",
    source_url: "https://cetim.dz",
    valid_until: "",
  },
  {
    tag: "pdg_cetim",
    question: "Qui est le PDG du CETIM ?",
    alt_questions: "nom du président cetim|directeur général cetim|qui dirige le cetim",
    short_resp: "Le Président Directeur Général du CETIM est Monsieur Hocine BENHARRATS.",
    answer: `Le Président Directeur Général du CETIM est Monsieur Hocine BENHARRATS.<br><br>Coordonnées :<br>- Téléphone : 023 123 456<br>- Email : h.benharrats@cetim.dz<br>- Adresse : CETIM, BP 123, Bordj El Kiffan, Alger`,
    category: "Organisation",
    keywords: "pdg|président|directeur général|benharrats|hocine",
    priority: 10,
    related_tags: "organigramme_cetim|direction_cetim",
    icon: "👤",
    source: "Organigramme CETIM 2024",
    source_url: "",
    valid_until: "",
  },
  {
    tag: "organigramme_cetim",
    question: "Quel est l'organigramme du CETIM ?",
    alt_questions: "structure organisationnelle cetim|organisation cetim|directions cetim",
    short_resp: "Le CETIM est structuré autour de la Direction Générale, avec plusieurs directions centrales et techniques.",
    answer: `Le CETIM est organisé autour de la Direction Générale avec les structures suivantes :<br><br>- Direction Générale<br>- Direction Technique<br>- Direction des Laboratoires<br>- Direction Commerciale<br>- Direction des Ressources Humaines<br>- Direction Financière et Comptable<br>- Direction Qualité<br>- Direction HSE`,
    category: "Organisation",
    keywords: "organigramme|structure|organisation|direction|services",
    priority: 5,
    related_tags: "pdg_cetim|direction_cetim",
    icon: "🏛️",
    source: "Organigramme CETIM 2024",
    source_url: "",
    valid_until: "",
  },
  {
    tag: "labo_essais",
    question: "Quels sont les laboratoires d'essais du CETIM ?",
    alt_questions: "laboratoires cetim|labos cetim|essais matériaux cetim|liste des labos",
    short_resp: "Le CETIM dispose de plusieurs laboratoires spécialisés : sols, granulats, ciments, bétons, aciers, eaux et environnement.",
    answer: `Le CETIM dispose des laboratoires suivants :<br><br>1. Laboratoire Sols et Fondations<br>2. Laboratoire Granulats et Roches<br>3. Laboratoire Ciments et Liants<br>4. Laboratoire Bétons et Mortiers<br>5. Laboratoire Aciers et Métaux<br>6. Laboratoire Eaux et Environnement<br>7. Laboratoire Route et Chaussées<br>8. Laboratoire Peintures et Revêtements<br><br>Chaque laboratoire est accrédité selon la norme ISO 17025.`,
    category: "Laboratoires",
    keywords: "laboratoire|labo|essai|analyse|contrôle|qualité|ISO 17025|accréditation",
    priority: 8,
    related_tags: "prestations_labos|tarifs_essais",
    icon: "🔬",
    source: "Prestations CETIM",
    source_url: "",
    valid_until: "",
  },
];

async function main() {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Nova Chatbot";
  wb.created = new Date();

  /* ────── Sheet 1 : Instructions ────── */
  const instrSheet = wb.addWorksheet("Instructions");
  const instrCols = [
    { key: "a", width: 6 },
    { key: "b", width: 30 },
    { key: "c", width: 80 },
  ];
  instrSheet.columns = instrCols;

  const titleStyle: Partial<ExcelJS.Style> = { font: { bold: true, size: 16, color: { argb: "FF1F4E79" } } };
  const headerStyle: Partial<ExcelJS.Style> = { font: { bold: true, size: 12, color: { argb: "FFFFFFFF" } }, fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FF1F4E79" } } };
  const sectionStyle: Partial<ExcelJS.Style> = { font: { bold: true, size: 11, color: { argb: "FF1F4E79" } } };
  const bodyStyle: Partial<ExcelJS.Style> = { font: { size: 10 } };
  const wrapStyle: Partial<ExcelJS.Style> = { font: { size: 10 }, alignment: { wrapText: true } };

  instrSheet.mergeCells("A1:C1");
  const titleCell = instrSheet.getCell("A1");
  titleCell.value = "Canevas de collecte – Entrées KB";
  titleCell.style = titleStyle;
  instrSheet.getRow(1).height = 30;

  instrSheet.mergeCells("A3:C3");
  instrSheet.getCell("A3").value = "Colonnes du fichier";
  instrSheet.getCell("A3").style = sectionStyle;

  const headerRow = instrSheet.addRow(["#", "Colonne", "Description"]);
  headerRow.eachCell((cell) => { cell.style = headerStyle; });

  COLUMNS.forEach((col, i) => {
    const req = col.required ? " (obligatoire)" : "";
    const row = instrSheet.addRow([i + 1, col.label, col.description + req]);
    row.eachCell((cell, colIdx) => {
      cell.style = colIdx === 3 ? wrapStyle : bodyStyle;
    });
  });

  let rowNum = instrSheet.rowCount + 2;

  instrSheet.mergeCells(`A${rowNum}:C${rowNum}`);
  instrSheet.getCell(`A${rowNum}`).value = "Règles de validation";
  instrSheet.getCell(`A${rowNum}`).style = sectionStyle;
  rowNum++;

  const rules = [
    ["tag", "Sans espaces, sans accents, max 50 caractères. Unique par client."],
    ["question_principale", "Max 500 caractères. Rédigée en français."],
    ["questions_alternatives", "Séparateur | entre chaque variante. Ex: qu'est-ce que le cetim|que fait le cetim"],
    ["reponse_longue", "Max 10 000 caractères. Accepte HTML simple : <br>, <b>, <i>, <a href='...'>"],
    ["mots_cles", "Séparateur | entre chaque mot-clé. Plus il y en a, meilleur est le matching."],
    ["priorite", "1-10. Mettre 10 pour les entrées très spécifiques (PDG, coordonnées). 5 par défaut pour le contenu général."],
    ["tags_associes", "Séparateur | entre chaque tag. Doit correspondre au tag d'une autre entrée KB existante."],
    ["valide_jusqua", "Format AAAA-MM-JJ. Laisser vide si l'information ne périme pas."],
  ];

  const rulesHeader = instrSheet.addRow(["Champ", "Règle"]);
  rulesHeader.eachCell((cell) => { cell.style = headerStyle; });
  rules.forEach(([field, rule]) => {
    const row = instrSheet.addRow([field, rule]);
    row.eachCell((cell, ci) => { cell.style = ci === 2 ? wrapStyle : bodyStyle; });
  });

  rowNum = instrSheet.rowCount + 2;
  instrSheet.mergeCells(`A${rowNum}:C${rowNum}`);
  instrSheet.getCell(`A${rowNum}`).value = "Conseils";
  instrSheet.getCell(`A${rowNum}`).style = sectionStyle;
  rowNum++;

  const tips = [
    "• Remplir une ligne par question/réponse",
    "• Une même réponse peut avoir jusqu'à 20 questions alternatives",
    "• Plus il y a de questions alternatives et de mots-clés, meilleure est la couverture",
    "• Objectif : 90% des questions utilisateurs doivent trouver une réponse dans la KB",
    "• Tester les entrées via la page de test après import",
  ];
  tips.forEach((tip) => {
    instrSheet.mergeCells(`A${rowNum}:C${rowNum}`);
    instrSheet.getCell(`A${rowNum}`).value = tip;
    instrSheet.getCell(`A${rowNum}`).style = bodyStyle;
    rowNum++;
  });

  /* ────── Sheet 2 : Entrées KB ────── */
  const dataSheet = wb.addWorksheet("Entrées KB");

  const headerKeys = COLUMNS.map((c) => c.key);
  const headerLabels = COLUMNS.map((c) => c.label);

  dataSheet.columns = COLUMNS.map((c) => ({ key: c.key, width: c.width }));

  // Header row
  const headRow = dataSheet.addRow(headerLabels);
  headRow.eachCell((cell) => {
    cell.style = headerStyle;
    cell.alignment = { wrapText: true, vertical: "top" };
  });
  headRow.height = 30;

  // Freeze header
  dataSheet.views = [{ state: "frozen", ySplit: 1 }];

  // Example rows
  EXAMPLES.forEach((ex) => {
    const values = headerKeys.map((k) => (ex as any)[k]?.toString() ?? "");
    const row = dataSheet.addRow(values);
    row.eachCell((cell) => {
      cell.style = { ...bodyStyle, alignment: { wrapText: true, vertical: "top" } };
    });
  });

  // Highlight example rows with a subtle fill
  for (let r = 2; r <= EXAMPLES.length + 1; r++) {
    const row = dataSheet.getRow(r);
    row.eachCell((cell) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF2F7FB" } };
    });
  }

  // Add empty rows for user data (30 empty rows after examples)
  for (let i = 0; i < 30; i++) {
    const row = dataSheet.addRow([]);
    row.eachCell((cell) => {
      cell.style = { alignment: { wrapText: true, vertical: "top" } };
    });
  }

  // Data validation for priority column (1-10)
  const priorityCol = COLUMNS.findIndex((c) => c.key === "priority") + 1;
  if (priorityCol > 0) {
    for (let r = 2; r <= dataSheet.rowCount; r++) {
      dataSheet.getCell(r, priorityCol).dataValidation = {
        type: "whole",
        operator: "between",
        formulae: [1, 10],
        showErrorMessage: true,
        errorTitle: "Priorité invalide",
        error: "La priorité doit être un nombre entre 1 et 10.",
      };
    }
  }

  // Data validation for tag (unique-ish constraint hint)
  const tagCol = COLUMNS.findIndex((c) => c.key === "tag") + 1;
  if (tagCol > 0) {
    for (let r = 2; r <= dataSheet.rowCount; r++) {
      dataSheet.getCell(r, tagCol).dataValidation = {
        type: "textLength",
        operator: "lessThanOrEqual",
        formulae: [50],
        showErrorMessage: true,
        errorTitle: "Tag trop long",
        error: "Le tag ne doit pas dépasser 50 caractères.",
      };
    }
  }

  const outPath = join(__dirname, "..", "canevas-collecte-KB.xlsx");
  await wb.xlsx.writeFile(outPath);
  console.log(`Fichier généré : ${outPath}`);
}

main().catch(console.error);
