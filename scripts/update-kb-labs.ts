import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

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

  console.log(`Updating KB for: ${client.name} (${client.id})`);

  const updates: { tag: string; addKeywords: string[]; addQuestions: string[] }[] = [
    {
      tag: "unites_techniques",
      addKeywords: ["labo", "labos"],
      addQuestions: ["quels sont les labos du cetim"],
    },
    {
      tag: "laboratoires_liste",
      addKeywords: ["labo", "labos"],
      addQuestions: ["quels sont les labos du cetim"],
    },
  ];

  for (const u of updates) {
    const entry = await prisma.kBEntry.findFirst({
      where: { clientId: client.id, tag: u.tag },
    });
    if (!entry) {
      console.warn(`  ⚠ Entry "${u.tag}" not found for this client.`);
      continue;
    }

    const currentKw = (entry.keywords || "").split(",").map(s => s.trim()).filter(Boolean);
    const newKw = [...new Set([...currentKw, ...u.addKeywords])].join(", ");

    const currentAlt = (entry.alt_questions || "").split("||").map(s => s.trim()).filter(Boolean);
    const newAlt = [...new Set([...currentAlt, ...u.addQuestions])].join(" || ");

    await prisma.kBEntry.update({
      where: { id: entry.id },
      data: { keywords: newKw, alt_questions: newAlt },
    });

    console.log(`  ✓ Updated "${u.tag}"`);
    if (u.addKeywords.some(k => !currentKw.includes(k))) console.log(`    keywords: +${u.addKeywords.filter(k => !currentKw.includes(k)).join(", ")}`);
    if (u.addQuestions.some(q => !currentAlt.includes(q))) console.log(`    alt_questions: +${u.addQuestions.filter(q => !currentAlt.includes(q)).join(", ")}`);
  }

  await prisma.$disconnect();
}

main().catch((err) => { console.error(err); process.exit(1); });
