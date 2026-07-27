require("dotenv/config");
const { PrismaClient } = require("@prisma/client");
const { PrismaNeon } = require("@prisma/adapter-neon");
const conn = process.env.DATABASE_URL;
const adapter = new PrismaNeon({ connectionString: conn });
const p = new PrismaClient({ adapter });
p.client.findUnique({ where: { slug: "LITAN" } }).then(c => {
  console.log(c.id);
  p.$disconnect();
}).catch(e => { console.error(e.message); p.$disconnect(); });
