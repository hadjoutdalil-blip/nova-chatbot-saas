const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaNeon } = require("@prisma/adapter-neon");
require("dotenv").config();

const url = process.env.DATABASE_URL || "";
const adapter = url.includes("neon.tech")
  ? new PrismaNeon({ connectionString: url })
  : new PrismaPg({ connectionString: url });
const prisma = new PrismaClient({ adapter });

const TARGET_CLIENT_ID = "4e58898f-148a-4b64-9367-1e74cd74f9f0";

function norm(s) {
  return s.toLowerCase()
    .replace(/[éèêë]/g, "e").replace(/[àâä]/g, "a").replace(/[ùûü]/g, "u")
    .replace(/[ôö]/g, "o").replace(/[îï]/g, "i").replace(/ç/g, "c")
    .replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
}

function similarity(a, b) {
  const na = norm(a), nb = norm(b);
  if (na === nb) return 1;
  const wordsA = na.split(" ").filter(Boolean);
  const wordsB = nb.split(" ").filter(Boolean);
  const intersection = wordsA.filter(w => wordsB.includes(w)).length;
  const union = new Set([...wordsA, ...wordsB]).size;
  return intersection / union;
}

(async () => {
  try {
    const entries = await prisma.kBEntry.findMany({
      where: { clientId: TARGET_CLIENT_ID },
      orderBy: { createdAt: "asc" },
    });

    console.log(`Total entrées KB pour ce client : ${entries.length}\n`);

    const SIMILARITY_THRESHOLD = 0.65;
    let deletedCount = 0;
    const groups = [];

    const used = new Set();

    for (let i = 0; i < entries.length; i++) {
      if (used.has(i)) continue;
      const group = [i];
      used.add(i);
      for (let j = i + 1; j < entries.length; j++) {
        if (used.has(j)) continue;
        const sim = similarity(entries[i].question, entries[j].question);
        if (sim >= SIMILARITY_THRESHOLD) {
          group.push(j);
          used.add(j);
        }
      }
      if (group.length > 1) groups.push(group.map(idx => entries[idx]));
    }

    if (groups.length === 0) {
      console.log("✅ Aucun doublon détecté.");
      return;
    }

    for (const group of groups) {
      console.log(`\n=== Groupe de ${group.length} doublons ===`);
      // Keep the one with the longest answer (most complete), delete others
      group.sort((a, b) => b.answer.length - a.answer.length);
      const keep = group[0];
      console.log(`  GARDER : [${keep.id.slice(0, 8)}] ${keep.question.slice(0, 60)} (${keep.answer.length} chars)`);
      for (let i = 1; i < group.length; i++) {
        const del = group[i];
        console.log(`  SUPPRIMER : [${del.id.slice(0, 8)}] ${del.question.slice(0, 60)} (${del.answer.length} chars)`);
        await prisma.kBEntry.delete({ where: { id: del.id } });
        deletedCount++;
      }
    }

    console.log(`\n✅ ${deletedCount} doublons supprimés. ${entries.length - deletedCount} entrées restantes.`);
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await prisma.$disconnect();
  }
})();
