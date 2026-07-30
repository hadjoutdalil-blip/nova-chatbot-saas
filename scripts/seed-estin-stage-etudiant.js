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

const entries = [
  {
    question: "Comment faire un stage en tant qu'étudiant à l'ESTIN ?",
    alt_questions: [
      "faire un stage étudiant ESTIN",
      "stage 1cs",
      "stage 2cs",
      "stage 3cs",
      "comment trouver un stage à l'estin",
      "procédure stage étudiant estin",
      "demande de stage estin",
      "stage académique estin",
      "stage professionnel estin",
      "stage pendant les études estin",
      "convention de stage estin",
      "stage pratique étudiant estin",
      "où faire un stage quand on est étudiant à estin",
      "étudiant en 1cs cherche stage",
      "stage première année cycle supérieur estin",
      "stage pour étudiant estin",
    ],
    answer: `Pour effectuer un stage en tant qu'étudiant à l'ESTIN, voici la procédure :

1. **Télécharge les documents nécessaires** :
   - Convention de stage : https://estin.dz/wp-content/uploads/2025/11/internship-agreement.pdf
   - Demande de stage : https://estin.dz/wp-content/uploads/2025/11/request-for-internship.pdf

2. **Contacte le Service Stage** à l'adresse : s_stage@estin.dz pour toute information complémentaire sur les modalités et les délais.

3. **Démarche** : remplis la demande de stage, fais-la signer par l'organisme d'accueil, puis dépose-la au service concerné.

Le Service Stage t'accompagne dans les démarches administratives liées à la convention de stage.`,
    keywords: "stage, stages, étudiant, étudiants, 1cs, 2cs, 3cs, cycle, académique, professionnel, convention, demande, stagiaire, pratique, terrain, entreprise, laboratoire",
    category: "Stages & Étudiants",
    priority: 8,
    source: "Service Stage ESTIN",
    source_url: "",
    valid_until: "",
  },
];

(async () => {
  try {
    let count = 0;
    for (const e of entries) {
      const existing = await prisma.kBEntry.findFirst({
        where: { question: e.question, clientId: CLIENT_ID },
      });
      if (existing) {
        console.log(`  ↺ Déjà existant : ${e.question}`);
        continue;
      }
      await prisma.kBEntry.create({
        data: {
          question: e.question,
          alt_questions: e.alt_questions.join("|"),
          answer: e.answer,
          keywords: e.keywords,
          category: e.category,
          priority: e.priority,
          source: e.source,
          source_url: e.source_url,
          valid_until: e.valid_until,
          clientId: CLIENT_ID,
        },
      });
      count++;
      console.log(`  ✓ ${e.question}`);
    }
    console.log(`\n${count} entrée(s) insérée(s) pour ESTIN.`);
  } catch (err) {
    console.error("Erreur :", err);
  } finally {
    await prisma.$disconnect();
  }
})();
