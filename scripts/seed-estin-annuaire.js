const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaNeon } = require("@prisma/adapter-neon");
require("dotenv").config();

const url = process.env.DATABASE_URL || "";
const adapter = url.includes("neon.tech")
  ? new PrismaNeon({ connectionString: url })
  : new PrismaPg({ connectionString: url });
const prisma = new PrismaClient({ adapter });

const entries = [
  {
    question: "Quel est l'email d'Ahmed Nacer Mouhamed à l'ESTIN ?",
    answer: "ahmednacer@estin.dz",
  },
  {
    question: "Quel est l'email de AIT TALEB Samiha à l'ESTIN ?",
    answer: "aittaleb@estin.dz",
  },
  {
    question: "Quel est l'email de ALKAMA Lynda à l'ESTIN ?",
    answer: "alkama@estin.dz",
  },
  {
    question: "Quel est l'email de AMARA Karima à l'ESTIN ?",
    answer: "amara@estin.dz",
  },
  {
    question: "Quel est l'email de AMIOUR Fatima à l'ESTIN ?",
    answer: "amiour@estin.dz",
  },
  {
    question: "Quel est l'email de AMROUNI Samia à l'ESTIN ?",
    answer: "amrouni@estin.dz",
  },
  {
    question: "Quel est l'email de AZAZGA Imene à l'ESTIN ?",
    answer: "azazga@estin.dz",
  },
  {
    question: "Quel est l'email de AZOUAOU Faical à l'ESTIN ?",
    answer: "azouaou@estin.dz",
  },
  {
    question: "Quel est l'email de BEHLOUL Fatiha à l'ESTIN ?",
    answer: "behloul@estin.dz",
  },
  {
    question: "Quel est l'email de BELMAHDI Fatiha à l'ESTIN ?",
    answer: "belmahdi@estin.dz",
  },
  {
    question: "Quel est l'email de BENSLIMANE Salim à l'ESTIN ?",
    answer: "benslimane@estin.dz",
  },
  {
    question: "Quel est l'email de BENZENATI Rahima à l'ESTIN ?",
    answer: "benzenati@estin.dz",
  },
  {
    question: "Quel est l'email de BERBAGUE Chemseddine à l'ESTIN ?",
    answer: "berbague@estin.dz",
  },
  {
    question: "Quel est l'email de BOUACH Abderrahim à l'ESTIN ?",
    answer: "bouach@estin.dz",
  },
  {
    question: "Quel est l'email de BOUCHEFRA Djahida à l'ESTIN ?",
    answer: "bouchefra@estin.dz",
  },
  {
    question: "Quel est l'email de BOUCHOUCHA Lydia à l'ESTIN ?",
    answer: "bouchoucha@estin.dz",
  },
  {
    question: "Quel est l'email de BOUGLIMINA Ouahiba à l'ESTIN ?",
    answer: "bouglimina@estin.dz",
  },
  {
    question: "Quel est l'email de BOUREDJA Sara à l'ESTIN ?",
    answer: "bouredja@estin.dz",
  },
  {
    question: "Quel est l'email de BOUSLA Sid Ali à l'ESTIN ?",
    answer: "bousla@estin.dz",
  },
  {
    question: "Quel est l'email de BOUTERNIKH Salih à l'ESTIN ?",
    answer: "bouternikh@estin.dz",
  },
  {
    question: "Quel est l'email de CHEKLAT Lamia à l'ESTIN ?",
    answer: "cheklat@estin.dz",
  },
  {
    question: "Quel est l'email de CHELOUAH Leila à l'ESTIN ?",
    answer: "chelouah@estin.dz",
  },
  {
    question: "Quel est l'email de CHERFAOUI Saida à l'ESTIN ?",
    answer: "cherfaoui@estin.dz",
  },
  {
    question: "Quel est l'email de DAOUDI Meroua à l'ESTIN ?",
    answer: "daoudi@estin.dz",
  },
  {
    question: "Quel est l'email de DJABRI Yousra ?",
    answer: "yousra_djabri@yahoo.com",
  },
  {
    question: "Quel est l'email de DJAMAA Kenza à l'ESTIN ?",
    answer: "djamaa@estin.dz",
  },
  {
    question: "Quel est l'email de DJENADI Ali à l'ESTIN ?",
    answer: "djenadi@estin.dz",
  },
  {
    question: "Quel est l'email de ELMIR Youssef à l'ESTIN ?",
    answer: "elmir@estin.dz",
  },
  {
    question: "Quel est l'email de HAFHOUF Bellal à l'ESTIN ?",
    answer: "hafhouf@estin.dz",
  },
  {
    question: "Quel est l'email de HALICHE Noria à l'ESTIN ?",
    answer: "haliche@estin.dz",
  },
  {
    question: "Quel est l'email de HAMIDOUCHE Salima à l'ESTIN ?",
    answer: "hamidouche@estin.dz",
  },
  {
    question: "Quel est l'email de HAMMADOUCHE Taklit à l'ESTIN ?",
    answer: "hammadouche@estin.dz",
  },
  {
    question: "Quel est l'email de HARFOUCHE Lynda à l'ESTIN ?",
    answer: "harfouche@estin.dz",
  },
  {
    question: "Quel est l'email de IKEN Sofiane à l'ESTIN ?",
    answer: "iken@estin.dz",
  },
  {
    question: "Quel est l'email de ISSAADI Badredine à l'ESTIN ?",
    answer: "issaadi@estin.dz",
  },
  {
    question: "Quel est l'email de KACI Amina à l'ESTIN ?",
    answer: "kaci@estin.dz",
  },
  {
    question: "Quel est l'email de KHALFI Linda à l'ESTIN ?",
    answer: "khalfi@estin.dz",
  },
  {
    question: "Quel est l'email de KHALFOUNE Samia à l'ESTIN ?",
    answer: "khalfoune@estin.dz",
  },
  {
    question: "Quel est l'email de KHERBACHI Hamid à l'ESTIN ?",
    answer: "kherbachi@estin.dz",
  },
  {
    question: "Quel est l'email de KHTAOUI Lamia à l'ESTIN ?",
    answer: "khtaoui@estin.dz",
  },
  {
    question: "Quel est l'email de LEKEHALI Somia à l'ESTIN ?",
    answer: "lekehali@estin.dz",
  },
  {
    question: "Quel est l'email de LOUNACI Djmila à l'ESTIN ?",
    answer: "lounaci@estin.dz",
  },
  {
    question: "Quel est l'email de MEDJOUDJ Rafik à l'ESTIN ?",
    answer: "medjoudj@estin.dz",
  },
  {
    question: "Quel est l'email de OULEFKI Djohra à l'ESTIN ?",
    answer: "oulefki@estin.dz",
  },
  {
    question: "Quel est l'email de SABA Abdelaziz à l'ESTIN ?",
    answer: "sababdelaziz@estin.dz",
  },
  {
    question: "Quel est l'email de SABA Nabiha à l'ESTIN ?",
    answer: "saba@estin.dz",
  },
  {
    question: "Quel est l'email de SACI Oualid à l'ESTIN ?",
    answer: "saci@estin.dz",
  },
  {
    question: "Quel est l'email de SEBAA Abderrazak à l'ESTIN ?",
    answer: "sebaa@estin.dz",
  },
  {
    question: "Quel est l'email de TARI AbdelKamel à l'ESTIN ?",
    answer: "tari@estin.dz",
  },
  {
    question: "Quel est l'email de TOULOUM Soraya à l'ESTIN ?",
    answer: "touloum@estin.dz",
  },
  {
    question: "Quel est l'email de YAHIAOUI Mouna à l'ESTIN ?",
    answer: "yahiaoui@estin.dz",
  },
  {
    question: "Quel est l'email de ZAOUCHE Faïka à l'ESTIN ?",
    answer: "zaouche@estin.dz",
  },
  {
    question: "Quel est l'email de ZEDEK Razika à l'ESTIN ?",
    answer: "zedek@estin.dz",
  },
  {
    question: "Quel est l'email de ZENADJI Sylia à l'ESTIN ?",
    answer: "zenadji@estin.dz",
  },
  {
    question: "Quels sont les enseignants permanents à l'ESTIN ?",
    answer: "Les enseignants permanents de l'ESTIN sont : AIT TALEB Samiha, ALKAMA Lynda, AMARA Karima, AMIOUR Fatima, AMROUNI Samia, AZAZGA Imene, AZOUAOU Faical, BEHLOUL Fatiha, BELMAHDI Fatiha, BENSLIMANE Salim, BENZENATI Rahima, BERBAGUE Chemseddine, BOUACH Abderrahim, BOUCHEFRA Djahida, BOUCHOUCHA Lydia, BOUGLIMINA Ouahiba, BOUREDJA Sara, BOUSLA Sid Ali, BOUTERNIKH Salih, CHEKLAT Lamia, CHELOUAH Leila, CHERFAOUI Saida, DAOUDI Meroua, DJABRI Yousra, DJAMAA Kenza, DJENADI Ali, ELMIR Youssef, HAFHOUF Bellal, HALICHE Noria, HAMIDOUCHE Salima, HAMMADOUCHE Taklit, HARFOUCHE Lynda, IKEN Sofiane, ISSAADI Badredine, KACI Amina, KHALFI Linda, KHALFOUNE Samia, KHTAOUI Lamia, LEKEHALI Somia, LOUNACI Djmila, MEDJOUDJ Rafik, OULEFKI Djohra, SABA Abdelaziz, SABA Nabiha, SACI Oualid, SEBAA Abderrazak, TARI AbdelKamel, TOULOUM Soraya, YAHIAOUI Mouna, ZAOUCHE Faïka, ZEDEK Razika, ZENADJI Sylia.",
  },
  {
    question: "Quels sont les enseignants contractuels à l'ESTIN ?",
    answer: "Les enseignants contractuels à l'ESTIN sont : Ahmed Nacer Mouhamed et KHERBACHI Hamid.",
  },
  {
    question: "Combien d'enseignants y a-t-il à l'ESTIN ?",
    answer: "L'ESTIN compte 54 enseignants : 52 permanents et 2 contractuels.",
  },
  {
    question: "Qui est le chef de département ou responsable à l'ESTIN ?",
    answer: "Le personnel enseignant de l'ESTIN comprend notamment : AZOUAOU Faical, ALKAMA Lynda, BENSLIMANE Salim, BOUACH Abderrahim, BOUSLA Sid Ali, DJENADI Ali, IKEN Sofiane, MEDJOUDJ Rafik, SACI Oualid, SEBAA Abderrazak. Pour connaître les responsables spécifiques, veuillez consulter l'administration.",
  },
  {
    question: "Quels enseignants ont un email en @estin.dz ?",
    answer: "Tous les enseignants sauf DJABRI Yousra (yousra_djabri@yahoo.com) ont une adresse @estin.dz.",
  },
  {
    question: "Annuaires des emails des enseignants ESTIN",
    answer: "Liste complète des emails des enseignants de l'ESTIN : Ahmed Nacer Mouhamed (ahmednacer@estin.dz), AIT TALEB Samiha (aittaleb@estin.dz), ALKAMA Lynda (alkama@estin.dz), AMARA Karima (amara@estin.dz), AMIOUR Fatima (amiour@estin.dz), AMROUNI Samia (amrouni@estin.dz), AZAZGA Imene (azazga@estin.dz), AZOUAOU Faical (azouaou@estin.dz), BEHLOUL Fatiha (behloul@estin.dz), BELMAHDI Fatiha (belmahdi@estin.dz), BENSLIMANE Salim (benslimane@estin.dz), BENZENATI Rahima (benzenati@estin.dz), BERBAGUE Chemseddine (berbague@estin.dz), BOUACH Abderrahim (bouach@estin.dz), BOUCHEFRA Djahida (bouchefra@estin.dz), BOUCHOUCHA Lydia (bouchoucha@estin.dz), BOUGLIMINA Ouahiba (bouglimina@estin.dz), BOUREDJA Sara (bouredja@estin.dz), BOUSLA Sid Ali (bousla@estin.dz), BOUTERNIKH Salih (bouternikh@estin.dz), CHEKLAT Lamia (cheklat@estin.dz), CHELOUAH Leila (chelouah@estin.dz), CHERFAOUI Saida (cherfaoui@estin.dz), DAOUDI Meroua (daoudi@estin.dz), DJABRI Yousra (yousra_djabri@yahoo.com), DJAMAA Kenza (djamaa@estin.dz), DJENADI Ali (djenadi@estin.dz), ELMIR Youssef (elmir@estin.dz), HAFHOUF Bellal (hafhouf@estin.dz), HALICHE Noria (haliche@estin.dz), HAMIDOUCHE Salima (hamidouche@estin.dz), HAMMADOUCHE Taklit (hammadouche@estin.dz), HARFOUCHE Lynda (harfouche@estin.dz), IKEN Sofiane (iken@estin.dz), ISSAADI Badredine (issaadi@estin.dz), KACI Amina (kaci@estin.dz), KHALFI Linda (khalfi@estin.dz), KHALFOUNE Samia (khalfoune@estin.dz), KHERBACHI Hamid (kherbachi@estin.dz), KHTAOUI Lamia (khtaoui@estin.dz), LEKEHALI Somia (lekehali@estin.dz), LOUNACI Djmila (lounaci@estin.dz), MEDJOUDJ Rafik (medjoudj@estin.dz), OULEFKI Djohra (oulefki@estin.dz), SABA Abdelaziz (sababdelaziz@estin.dz), SABA Nabiha (saba@estin.dz), SACI Oualid (saci@estin.dz), SEBAA Abderrazak (sebaa@estin.dz), TARI AbdelKamel (tari@estin.dz), TOULOUM Soraya (touloum@estin.dz), YAHIAOUI Mouna (yahiaoui@estin.dz), ZAOUCHE Faïka (zaouche@estin.dz), ZEDEK Razika (zedek@estin.dz), ZENADJI Sylia (zenadji@estin.dz).",
  },
];

const TARGET_CLIENT_ID = "4e58898f-148a-4b64-9367-1e74cd74f9f0";

(async () => {
  try {
    const clientId = TARGET_CLIENT_ID;
    console.log(`Client ESTIN ID: ${clientId}`);

    let count = 0;
    for (const e of entries) {
      await prisma.kBEntry.create({
        data: {
          question: e.question,
          answer: e.answer,
          category: "Vie à l'ESTIN",
          keywords: "enseignant, email, permanent, contractuel, annuaire, contact, professeur",
          priority: 5,
          clientId,
        },
      });
      count++;
      console.log(`  ${count}. ${e.question.slice(0, 60)}`);
    }
    console.log(`\n✅ ${count} entrées Annuaire Enseignants insérées.`);
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await prisma.$disconnect();
  }
})();
