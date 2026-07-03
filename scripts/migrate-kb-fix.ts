import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { randomUUID } from "crypto";

const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const slug = process.argv[2] || "cetim";
  const client = await prisma.client.findUnique({ where: { slug } });
  if (!client) {
    console.error(`Client with slug '${slug}' not found.`);
    process.exit(1);
  }
  console.log(`Migrating KB for: ${client.name} (${client.id})`);

  /* 1. Créer l'entrée pdg_cetim si absente */
  const existingPdg = await prisma.kBEntry.findFirst({
    where: { clientId: client.id, tag: "pdg_cetim" },
  });
  if (!existingPdg) {
    await prisma.kBEntry.create({
      data: {
        id: randomUUID(),
        clientId: client.id,
        tag: "pdg_cetim",
        question: "c'est qui le pdg du cetim",
        alt_questions: "qui est le pdg du cetim || nom du président directeur général du cetim || nom du pdg du cetim || qui est le directeur général du cetim || qui dirige le cetim || direction générale cetim || contact direction cetim || pdg cetim",
        short_resp: "👤 PDG : M. Lyes MADI — lm.cetim@gmail.com",
        answer: "👤 **Président Directeur Général du CETIM Algérie**\n\n**M. Lyes MADI**\n📧 lm.cetim@gmail.com\n\n📍 CETIM, BP.93, Cité Ibn Khaldoun, Boumerdes 35000, Algérie",
        category: "Organisation",
        keywords: "pdg, lyes madi, lm.cetim, directeur général, direction générale, président directeur général",
        priority: 10,
        source: "",
        source_url: "",
        valid_until: "",
      },
    });
    console.log("  ✓ Created pdg_cetim entry");
  } else {
    console.log("  - pdg_cetim already exists, skipping");
  }

  /* 2. Mettre à jour organigramme_cetim : retirer pdg des keywords + alt_questions */
  const orgEntry = await prisma.kBEntry.findFirst({
    where: { clientId: client.id, tag: "organigramme_cetim" },
  });
  if (orgEntry) {
    const updatedKw = (orgEntry.keywords || "")
      .split(",").map(s => s.trim())
      .filter(k => !["pdg", "direction générale", "directeur général"].includes(k.toLowerCase()))
      .join(", ");

    const oldAlt = (orgEntry.alt_questions || "").split("||").map(s => s.trim());
    const removeAlt = [
      "c'est qui le pdg du cetim",
      "qui est le directeur général du cetim",
      "qui dirige le cetim",
      "direction générale cetim",
    ];
    const updatedAlt = oldAlt.filter(q => !removeAlt.includes(q.toLowerCase())).join(" || ");

    await prisma.kBEntry.update({
      where: { id: orgEntry.id },
      data: { keywords: updatedKw, alt_questions: updatedAlt },
    });
    console.log("  ✓ Updated organigramme_cetim (removed pdg keywords & alt_questions)");
  } else {
    console.warn("  ⚠ organigramme_cetim not found");
  }

  /* 3. Mettre à jour presentation : priority 5, retirer "CETIM" des keywords */
  const presEntry = await prisma.kBEntry.findFirst({
    where: { clientId: client.id, tag: "presentation" },
  });
  if (presEntry) {
    const updatedKw = (presEntry.keywords || "")
      .split(",").map(s => s.trim())
      .filter(k => k.toLowerCase() !== "cetim")
      .join(", ");

    await prisma.kBEntry.update({
      where: { id: presEntry.id },
      data: { keywords: updatedKw, priority: 5 },
    });
    console.log("  ✓ Updated presentation (priority=5, removed CETIM from keywords)");
  } else {
    console.warn("  ⚠ presentation not found");
  }

  await prisma.$disconnect();
  console.log("Done.");
}

main().catch((err) => { console.error(err); process.exit(1); });
