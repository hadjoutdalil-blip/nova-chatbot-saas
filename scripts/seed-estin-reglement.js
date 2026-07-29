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
  // ─── I. PRÉSENTATION ───
  {
    question: "Quand a été créée l'ESTIN et où se trouve-t-elle ?",
    answer: "L'ESTIN a été créée en Août 2020. Elle est située au campus d'Amizour, à 17 km de Béjaïa et à 2 km de la ville d'Amizour.",
  },
  {
    question: "Quelles sont les infrastructures de l'ESTIN ?",
    answer: "L'ESTIN dispose de :\n• 6 amphithéâtres de capacités différentes\n• Un centre de calcul moderne de 24 salles\n• Un bloc d'enseignements de 13 salles\n• Une bibliothèque centrale\n• Une salle de soutenance de 140 places\n• Un auditorium de 600 places\n• Un bloc administratif\n• Un bloc de bureaux pour enseignants avec centre d'impression et centre médical",
  },

  // ─── II. ACCÈS, RÉINSCRIPTION, TRANSFERT ───
  {
    question: "Comment se fait l'accès à la classe préparatoire de l'ESTIN ?",
    answer: "L'accès à la classe préparatoire est régi par le système national d'orientation, conformément à la circulaire relative à la préinscription et à l'orientation des titulaires du baccalauréat.",
  },
  {
    question: "Comment se fait l'accès au second cycle de l'ESTIN ?",
    answer: "L'accès au second cycle est conditionné par un concours national d'accès organisé par l'ESTIN. Les modalités sont fixées par la circulaire relative à l'accès aux écoles nationales supérieures.",
  },
  {
    question: "Quand faut-il se réinscrire à l'ESTIN ?",
    answer: "L'étudiant est tenu de se réinscrire en début de chaque année universitaire selon le calendrier établi par la structure chargée de la pédagogie. L'inscription n'est effective que pour une seule année d'études.",
  },
  {
    question: "Peut-on retirer l'original de l'attestation provisoire du bac à l'ESTIN ?",
    answer: "L'original de l'attestation provisoire du baccalauréat n'est restitué qu'en cas de réussite ou d'abandon, sur demande de l'étudiant et contre une décharge. En cas d'exclusion, le retrait n'est possible qu'après levée ou expiration de la sanction.",
  },
  {
    question: "Comment obtenir un duplicata de la carte d'étudiant ESTIN ?",
    answer: "En cas de perte, une déclaration de perte établie au commissariat ou à la gendarmerie est nécessaire pour obtenir un duplicata. Le certificat de scolarité et la carte d'étudiant sont actualisés chaque année.",
  },
  {
    question: "Quelles sont les conditions pour un congé académique à l'ESTIN ?",
    answer: "Un étudiant peut suspendre son inscription pour : maladie chronique ou longue durée, maternité, service national, accident, obligations familiales. La demande doit être déposée une semaine avant les premiers examens. La durée max est d'un an, renouvelable une fois.",
  },
  {
    question: "Quelle est la durée maximale d'un congé académique ESTIN ?",
    answer: "La durée maximale est d'une année, renouvelable une seule fois au cours du parcours, sauf force majeure (hospitalisation longue durée, situation sociale exceptionnelle). La demande de prolongation doit être faite avant l'expiration du congé initial.",
  },

  // ─── III. RÈGLEMENT DES ÉTUDES ───
  {
    question: "Comment sont organisées les études à l'ESTIN ?",
    answer: "Chaque année universitaire est composée de deux semestres. Les enseignements sont organisés en matières semestrielles réparties en Unités d'Enseignement (UE) : fondamentales, méthodologiques, de découverte et transversales. Chaque UE a des crédits et des coefficients.",
  },
  {
    question: "Quels sont les types d'enseignements à l'ESTIN ?",
    answer: "Cours (présentation théorique), Travaux Dirigés TD (exercices d'application pour approfondir), Travaux Pratiques TP (manipulation d'outils et techniques).",
  },

  // ─── III.2 ÉVALUATIONS ───
  {
    question: "Quelles sont les règles pendant les examens à l'ESTIN ?",
    answer: "- Arriver avant 30 min de retard (sinon non autorisé)\n- Ne pas quitter avant 30 min\n- Remettre sa copie même vierge\n- Interdiction de sortir momentanément\n- Téléphone et matériels programmables interdits\n- Utiliser uniquement les feuilles d'examen fournies\n- Composer dans la salle attribuée\n- Carte d'étudiant obligatoire",
  },
  {
    question: "Que faire en cas d'absence à un examen ESTIN ?",
    answer: "Toute absence est sanctionnée par un zéro. En cas de raison majeure (maladie, problème familial grave), l'étudiant doit déposer un justificatif dans les 48h auprès de la structure pédagogique. Un examen de remplacement peut être accordé si la raison est valable.",
  },
  {
    question: "Comment se déroule la consultation des copies à l'ESTIN ?",
    answer: "L'enseignant organise une séance de consultation des copies où l'étudiant prend connaissance du corrigé et du barème. Aucune consultation en dehors de cette séance. Les notes sont communiquées au plus tard 3 semaines après l'épreuve.",
  },
  {
    question: "Comment faire une demande de contre-correction à l'ESTIN ?",
    answer: "L'étudiant peut demander une contre-correction dans les 75h suivant la consultation. La demande se dépose au secrétariat de la direction des études. Résultats : écart ≤ 3 pts → moyenne des deux notes ; 2e correcteur > 3 pts → meilleure note ; 2e correcteur < 3 pts → zéro.",
  },
  {
    question: "Combien de contre-corrections peut-on demander à l'ESTIN ?",
    answer: "Un étudiant a droit à une contre-correction par épreuve. Après deux contre-corrections injustifiées, l'étudiant perd ce droit pour toute sa scolarité.",
  },

  // ─── III.4 PROGRESSION ───
  {
    question: "Comment est calculée la moyenne d'une matière à l'ESTIN ?",
    answer: "La moyenne se calcule semestriellement :\n- Classes préparatoires : (EMD × 2 + Contrôle Continu) / 3\n- Second cycle : (EMD × 0,6 + Contrôle Continu × 0,4)\nLe contrôle continu inclut TD/TP, assiduité et participation.",
  },
  {
    question: "Comment est-on admis en année supérieure à l'ESTIN ?",
    answer: "Sont déclarés admis les étudiants avec une moyenne générale ≥ 10 ET aucune note < 5/20 dans une matière. Les moyennes semestrielles sont compensables entre elles.",
  },
  {
    question: "Peut-on redoubler à l'ESTIN ?",
    answer: "Classe préparatoire : droit à un seul redoublement (sauf abandon ou sanction disciplinaire). Second cycle : droit à un seul doublement (mêmes conditions). En cas de 2e échec, abandon ou sanction, l'étudiant est réorienté.",
  },
  {
    question: "Comment contester les résultats de délibération à l'ESTIN ?",
    answer: "Après affichage des résultats, les étudiants disposent de 48h ouvrables pour formuler un recours. Le même jury étudie les recours et ses décisions sont définitives et irrévocables.",
  },
  {
    question: "Quelles sont les conditions pour le concours d'accès au cycle supérieur ESTIN ?",
    answer: "L'étudiant doit valider sa deuxième année pour s'inscrire au concours d'accès au cycle supérieur. En cas d'échec, il est réorienté mais peut repasser le concours une seule fois l'année suivante.",
  },

  // ─── III.5 ASSIDUITÉ ───
  {
    question: "Quelles sont les règles d'assiduité à l'ESTIN ?",
    answer: "L'assiduité est obligatoire à toutes les activités pédagogiques. Les absences pour maladie, accident ou force majeure doivent être justifiées dans les 48h ouvrables. Les relevés d'absences sont effectués par l'enseignant.",
  },
  {
    question: "Quelles absences sont considérées comme justifiées à l'ESTIN ?",
    answer: "Cas justifiés : décès d'ascendant/descendant/collatéral (3j), mariage (3j), paternité/maternité (3j), hospitalisation, maladie (certificat médical médecin assermenté, 3j max), réquisitions officielles.",
  },
  {
    question: "Quand un étudiant ESTIN est-il considéré en abandon ?",
    answer: "Un étudiant est considéré en abandon après 15 jours consécutifs d'absence sans justificatif. Une notification est envoyée par recommandé. Sans réponse sous 1 mois, l'étudiant est radié.",
  },
  {
    question: "Quelles sont les conséquences des absences aux TD/TP à l'ESTIN ?",
    answer: "5 absences (justifiées ou non) aux séances de TD ou TP dans un semestre entraînent l'exclusion de la matière concernée.",
  },
  {
    question: "À partir de combien d'absences peut-on redoubler ou être radié à l'ESTIN ?",
    answer: "3 semaines d'absence cumulées → risque de redoublement. 5 semaines d'absence cumulées → risque de radiation.",
  },

  // ─── IV. MOYENS INFORMATIQUES ───
  {
    question: "Quelles sont les règles d'utilisation des moyens informatiques à l'ESTIN ?",
    answer: "L'étudiant s'engage à respecter le règlement intérieur régissant l'utilisation des moyens informatiques et à veiller à la bonne utilisation de tous les équipements informatiques de l'école.",
  },

  // ─── V. REPRÉSENTATION ÉTUDIANTE ───
  {
    question: "Comment sont représentés les étudiants à l'ESTIN ?",
    answer: "Les étudiants sont représentés par des délégués élus : un délégué et un suppléant par groupe, un à deux délégués de section, et un comité élu (2 délégués par année). Un étudiant sanctionné disciplinairement ne peut être délégué.",
    keywordsExtra: "représentant, délégué, suppléant, comité, élection, groupe, section",
  },

  // ─── VI. DISCIPLINE ───
  {
    question: "Quelles sont les règles de conduite à l'ESTIN ?",
    answer: "Respect des règles de civilité, tenue, courtoisie, tolérance. Signes ostentatoires politiques ou sectaires interdits. Activité politique interdite. Interdiction de fumer dans les salles et lieux publics. Téléphone interdit en cours, TD, TP, examens, conférences, soutenances.",
  },
  {
    question: "Quand les étudiants peuvent-ils accéder à l'administration de l'ESTIN ?",
    answer: "L'accès aux services de l'administration est autorisé aux étudiants uniquement les lundis et jeudis.",
  },
  {
    question: "Quelles sont les règles concernant l'alcool, les stupéfiants et la sécurité à l'ESTIN ?",
    answer: "L'introduction et la consommation de boissons alcoolisées, stupéfiants ou produits prohibés sont formellement interdites. Il est interdit d'utiliser les appareils incendie sauf nécessité, d'accéder aux locaux dangereux, de faire entrer des étrangers sans autorisation, ou de dégrader les biens.",
  },
  {
    question: "Comment est composé le conseil de discipline de l'ESTIN ?",
    answer: "Le conseil de discipline est composé de 5 enseignants, 1 représentant d'étudiants, et présidé par le directeur de l'école ou son représentant.",
  },
  {
    question: "Quelle est la procédure disciplinaire à l'ESTIN ?",
    answer: "L'infraction fait l'objet d'un rapport. Le conseil est convoqué dans les 10 jours max. Le contrevenant est convoqué par recommandé. Il doit comparaître pour présenter sa version. En cas d'absence, le conseil statue et aucun recours n'est recevable.",
  },
  {
    question: "Peut-on faire appel d'une sanction disciplinaire à l'ESTIN ?",
    answer: "Oui, l'étudiant peut introduire une demande de recours auprès du directeur de l'école, qui peut convoquer à nouveau le même conseil de discipline pour examiner le recours.",
  },
  {
    question: "Quelles sont les sanctions disciplinaires applicables à l'ESTIN ?",
    answer: "Les sanctions sont fixées par l'arrêté N° 371 du 11 juin 2014 : infractions du 1er degré (Art. 14) et du 2ème degré (Art. 15). Les décisions sont prises à la majorité absolue (voix du président double en cas d'égalité).",
  },

  // ─── VII. AFFICHAGES ───
  {
    question: "Comment se fait l'affichage à l'ESTIN ?",
    answer: "L'affichage se fait par voie numérique via la plateforme de l'école. Tout affichage des étudiants doit être autorisé par la direction. Les réponses irrespectueuses aux emails peuvent entraîner la perte d'accès aux services numériques.",
  },

  // ─── VIII. ENGAGEMENT ───
  {
    question: "Comment s'engage un étudiant à respecter le règlement intérieur ESTIN ?",
    answer: "L'étudiant doit signer une fiche d'engagement individuelle, versée à son dossier, avec la mention « lu et approuvé », attestant qu'il a pris connaissance du règlement et s'engage à le respecter.",
  },
  {
    question: "Où trouver le règlement intérieur complet de l'ESTIN ?",
    answer: "Le règlement intérieur est remis à l'étudiant dès son admission à l'ESTIN. Il couvre : présentation de l'école, conditions d'accès et réinscription, organisation des études, évaluations, recours, progression, assiduité, discipline, affichages.",
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
          category: "Règlement Intérieur ESTIN",
          keywords: e.keywordsExtra || "règlement intérieur, discipline, examen, assiduité, absence, sanction, conseil discipline, réinscription, congé académique, évaluation, progression, redoublement",
          priority: 8,
          clientId,
        },
      });
      count++;
      console.log(`  ${count}. ${e.question.slice(0, 60)}`);
    }
    console.log(`\n✅ ${count} entrées Règlement Intérieur ESTIN insérées.`);
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await prisma.$disconnect();
  }
})();
