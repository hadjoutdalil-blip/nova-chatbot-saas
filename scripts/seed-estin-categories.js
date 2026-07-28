const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaNeon } = require("@prisma/adapter-neon");
require("dotenv").config();

const url = process.env.DATABASE_URL || "";
const adapter = url.includes("neon.tech")
  ? new PrismaNeon({ connectionString: url })
  : new PrismaPg({ connectionString: url });
const prisma = new PrismaClient({ adapter });

const CLIENT_ID = "4e58898f-148a-4b64-9367-1e74cd74f9f0";

const categories = [
  { name: "Nouveau bachelier", contact: "equipe_formation@estin.dz" },
  { name: "Réinscription / congé académiques / Réintégration", contact: "service_enseignements_stages_evaluation@estin.dz" },
  { name: "Demande de documents (classement / bonne conduite / autres)", contact: "service_enseignements_stages_evaluation@estin.dz" },
  { name: "Études en classes préparatoires", contact: "Département Classes préparatoires <departementcp@estin.dz>" },
  { name: "Concours d'accès au second cycle", contact: "Département Classes préparatoires <departementcp@estin.dz>, sebaa@estin.dz" },
  { name: "Information des spécialités", contact: "equipe_formation@estin.dz" },
  { name: "Études en spécialités", contact: "Département Spécialités <departementsp@estin.dz>" },
  { name: "Projets de fin d'études", contact: "Département Spécialités <departementsp@estin.dz>, sebaa@estin.dz" },
  { name: "Diplômes & authentification", contact: "Assia TAS <service_des_diplomes@estin.dz>" },
  { name: "Conseil de discipline", contact: "departementcp@estin.dz" },
  { name: "Stages des étudiants hors fin de cycle", contact: "Service Stage <s_stage@estin.dz>" },
  { name: "Relations internationales et conventions avec les universités étrangères", contact: "relex@estin.dz" },
  { name: "Collaboration & conventions avec les entreprises", contact: "relex@estin.dz" },
  { name: "Recherche & étude en 3ème cycle", contact: "issaadi@estin.dz" },
  { name: "Laboratoire", contact: "Ali DJENADI <djenadi@estin.dz>" },
  { name: "CDE", contact: "Meroua Daoudi <daoudi@estin.dz>" },
  { name: "Incubateur", contact: "Incubator Estin <incubator@estin.dz>" },
  { name: "Centre de calcul et data center", contact: "ing_chekroune@estin.dz" },
  { name: "Plateforme Proges & Talent", contact: "ing_aitikhlef@estin.dz" },
  { name: "Marché & consultations", contact: "servicedesmarches@estin.dz" },
  { name: "Club", contact: "clubs <clubs@estin.dz>" },
  { name: "Santé", contact: "medecin@estin.dz" },
  { name: "Filiale", contact: "estinovatech@estin.dz" },
  { name: "Autre", contact: "sg@estin.dz" },
];

(async () => {
  try {
    let count = 0;
    for (const c of categories) {
      await prisma.kBEntry.create({
        data: {
          question: c.name,
          answer: `Contact : ${c.contact}`,
          category: c.name,
          keywords: c.name.toLowerCase().replace(/[^a-z0-9éèêëàâùûüôöîïç\s]/g, " ").trim().split(/\s+/).slice(0, 8).join(", "),
          priority: 5,
          clientId: CLIENT_ID,
        },
      });
      count++;
      console.log(`  ${count}. ${c.name}`);
    }
    console.log(`\n${count} entrées insérées pour ESTIN.`);
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await prisma.$disconnect();
  }
})();
