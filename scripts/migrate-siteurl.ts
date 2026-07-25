import { Pool } from "@neondatabase/serverless";

async function migrate() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL! });

  console.log("[migration] Ajout de la colonne siteUrl...");
  await pool.query(`ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "siteUrl" TEXT NOT NULL DEFAULT ''`);
  console.log("[migration] OK — siteUrl ajouté à la table Client");

  await pool.end();
  console.log("[migration] Terminé !");
}

migrate().catch((err) => {
  console.error("[migration] Erreur:", err);
  process.exit(1);
});
