const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaNeon } = require("@prisma/adapter-neon");
require("dotenv").config();

const url = process.env.DATABASE_URL || "";
const adapter = url.includes("neon.tech")
  ? new PrismaNeon({ connectionString: url })
  : new PrismaPg({ connectionString: url });
const prisma = new PrismaClient({ adapter });

(async () => {
  try {
    console.log("\n=== WidgetConfig columns ===");
    const cols = await prisma.$queryRawUnsafe(
      `SELECT column_name::text, data_type::text, column_default::text FROM information_schema.columns WHERE table_name = 'WidgetConfig' ORDER BY ordinal_position`
    );
    for (const c of cols) console.log(`  ${c.column_name} (${c.data_type}) default: ${c.column_default || "N/A"}`);

    console.log("\n=== PublicProposal table ===");
    const exists = await prisma.$queryRawUnsafe(
      `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'PublicProposal') AS ok`
    );
    console.log(`  ${exists[0].ok ? "EXISTS" : "MISSING"}`);

    if (exists[0].ok) {
      console.log("\n=== PublicProposal indexes ===");
      const idx = await prisma.$queryRawUnsafe(
        `SELECT indexname::text FROM pg_indexes WHERE tablename = 'PublicProposal'`
      );
      for (const i of idx) console.log(`  ${i.indexname}`);
    }
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await prisma.$disconnect();
  }
})();
