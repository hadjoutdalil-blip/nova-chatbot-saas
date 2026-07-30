const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaNeon } = require("@prisma/adapter-neon");
const { randomUUID } = require("crypto");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const url = process.env.DATABASE_URL || "";
const adapter = url.includes("neon.tech")
  ? new PrismaNeon({ connectionString: url })
  : new PrismaPg({ connectionString: url });
const prisma = new PrismaClient({ adapter });

function parseCSV(text) {
  const rows = [];
  let current = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];
    if (inQuotes) {
      if (ch === '"' && next === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        current.push(field);
        field = "";
      } else if (ch === "\r" || ch === "\n") {
        if (ch === "\r" && next === "\n") i++;
        if (field.length > 0 || current.length > 0) {
          current.push(field);
          field = "";
          rows.push(current);
          current = [];
        }
      } else {
        field += ch;
      }
    }
  }
  if (field.length > 0 || current.length > 0) {
    current.push(field);
    rows.push(current);
  }
  return rows;
}

const PRIORITY_MAP = {
  "haute": 8,
  "moyenne": 5,
  "basse": 3,
};

(async () => {
  try {
    const client = await prisma.client.findUnique({
      where: { slug: "cetim" },
    });
    if (!client) {
      console.error("Client CETIM introuvable. Exécutez d'abord le seed principal.");
      process.exit(1);
    }
    const clientId = client.id;
    console.log(`Client CETIM trouvé : ${client.name} (${clientId})`);

    const csvPath = path.join(__dirname, "data", "cetim-laboratoire.csv");
    if (!fs.existsSync(csvPath)) {
      console.error(`Fichier CSV introuvable : ${csvPath}`);
      process.exit(1);
    }
    const raw = fs.readFileSync(csvPath, "utf-8");
    const rows = parseCSV(raw);
    const header = rows[0].map(h => h.trim().toLowerCase());
    const data = rows.slice(1).filter(r => r.length >= 4 && r[0] && r[0].trim());

    console.log(`Lues ${data.length} lignes dans le CSV.`);

    let created = 0;
    let skipped = 0;

    for (const row of data) {
      const tag = (row[header.indexOf("tag")] || "").trim();
      const questionPrincipale = (row[header.indexOf("question_principale")] || "").trim();
      const questionsAlternatives = (row[header.indexOf("questions_alternatives")] || "").trim();
      const reponseCourte = (row[header.indexOf("reponse_courte")] || "").trim();
      const reponseLongue = (row[header.indexOf("reponse_longue")] || "").trim();
      const categorie = (row[header.indexOf("categorie")] || "").trim();
      const motsCles = (row[header.indexOf("mots_cles")] || "").trim();
      const prioriteRaw = (row[header.indexOf("priorite")] || "").trim().toLowerCase();
      const tagsAssocies = (row[header.indexOf("tags_associes")] || "").trim();

      if (!tag || !questionPrincipale) {
        console.warn(`  ⚠ Ligne ignorée (tag ou question vide) : ${tag || "(vide)"}`);
        continue;
      }

      const existing = await prisma.kBEntry.findFirst({
        where: { tag, clientId },
      });
      if (existing) {
        skipped++;
        continue;
      }

      const altQs = questionsAlternatives
        .split("|")
        .map(s => s.trim())
        .filter(Boolean)
        .join(" || ");

      const keywords = motsCles
        .split(",")
        .map(s => s.trim())
        .filter(Boolean)
        .join(", ");

      const priority = PRIORITY_MAP[prioriteRaw] || 5;

      const answer = reponseLongue
        ? `${reponseCourte}\n\n${reponseLongue}`
        : reponseCourte;

      await prisma.kBEntry.create({
        data: {
          id: randomUUID(),
          tag,
          question: questionPrincipale,
          alt_questions: altQs,
          short_resp: reponseCourte,
          answer,
          category: categorie || "Laboratoire",
          keywords,
          priority,
          related_tags: tagsAssocies,
          source: "CETIM – Laboratoire",
          clientId,
        },
      });
      created++;
    }

    console.log(`\nTerminé : ${created} créée(s), ${skipped} déjà existante(s) ignorée(s).`);
  } catch (err) {
    console.error("Erreur :", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
