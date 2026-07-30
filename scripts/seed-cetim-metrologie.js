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
  let current = [], field = "", inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i], next = text[i + 1];
    if (inQuotes) {
      if (ch === '"' && next === '"') { field += '"'; i++; }
      else if (ch === '"') inQuotes = false;
      else field += ch;
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === ",") { current.push(field); field = ""; }
      else if (ch === "\r" || ch === "\n") {
        if (ch === "\r" && next === "\n") i++;
        if (field || current.length) { current.push(field); field = ""; rows.push(current); current = []; }
      } else field += ch;
    }
  }
  if (field || current.length) { current.push(field); rows.push(current); }
  return rows;
}

const PRIORITY_MAP = { haute: 8, moyenne: 5, basse: 3 };

(async () => {
  try {
    const client = await prisma.client.findUnique({ where: { slug: "cetim" } });
    if (!client) { console.error("Client CETIM introuvable."); process.exit(1); }
    const clientId = client.id;
    console.log(`Client CETIM : ${client.name} (${clientId})`);

    const csvPath = path.join(__dirname, "data", "cetim-metrologie.csv");
    const buf = fs.readFileSync(csvPath);
    const rows = parseCSV(buf.toString("utf8"));
    const header = rows[0].map(h => h.trim().toLowerCase().replace(/\*$/, ""));
    const data = rows.slice(1).filter(r => r.length >= 4 && r[0] && r[0].trim());

    console.log(`Lues ${data.length} lignes.`);

    const existingTags = new Set(
      (await prisma.kBEntry.findMany({ where: { clientId }, select: { tag: true } })).map(e => e.tag)
    );

    const toCreate = [];
    const seenQs = new Set();
    for (const row of data) {
      const tag = (row[header.indexOf("tag")] || "").trim();
      const q = (row[header.indexOf("question_principale")] || "").trim();
      const altRaw = (row[header.indexOf("questions_alternatives")] || "").trim();
      const shortResp = (row[header.indexOf("reponse_courte")] || "").trim();
      const longResp = (row[header.indexOf("reponse_longue")] || "").trim();
      const cat = (row[header.indexOf("categorie")] || "").trim();
      const kwRaw = (row[header.indexOf("mots_cles")] || "").trim();
      const prioRaw = (row[header.indexOf("priorite")] || "").trim().toLowerCase();
      const relatedRaw = (row[header.indexOf("tags_associes")] || "").trim();
      const icon = (row[header.indexOf("icone")] || "").trim();
      const source = (row[header.indexOf("source")] || "").trim();
      const sourceUrl = (row[header.indexOf("url_source")] || "").trim();
      const validUntil = (row[header.indexOf("valide_jusqua")] || "").trim();

      if (!tag || !q) continue;

      const qKey = q.toLowerCase().replace(/\s+/g, " ");
      if (seenQs.has(qKey)) continue;
      seenQs.add(qKey);
      if (existingTags.has(tag) && !tag.includes("labo_metrologie")) continue;

      const altQs = altRaw.split("|").map(s => s.trim()).filter(Boolean).join(" || ");
      const keywords = kwRaw.split(",").map(s => s.trim()).filter(Boolean).join(", ");
      const priority = parseInt(prioRaw) || PRIORITY_MAP[prioRaw] || 5;
      const answer = longResp || shortResp;
      const related_tags = relatedRaw.split(",").map(s => s.trim()).filter(Boolean).join(", ");

      toCreate.push({
        id: randomUUID(), tag, question: q, alt_questions: altQs,
        short_resp: shortResp, answer, category: cat || "Métrologie",
        keywords, priority, related_tags, icon: icon || "📏",
        source: source || "CETIM – Métrologie", source_url: sourceUrl, valid_until: validUntil,
        clientId,
      });
    }

    if (toCreate.length > 0) {
      await prisma.kBEntry.createMany({ data: toCreate });
      console.log(`Importé : ${toCreate.length} entrée(s) métrologie.`);
    } else {
      console.log("Tout déjà existant, rien à importer.");
    }
  } catch (err) {
    console.error("Erreur :", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
