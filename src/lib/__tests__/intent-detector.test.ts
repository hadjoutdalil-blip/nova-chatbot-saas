import { strict as assert } from "assert";
import { detectIntent } from "../intent-detector";

function assertIntent(
  label: string,
  input: string,
  expected: "SMALL_TALK" | "HORS_SUJET" | "REQUETE_METIER"
) {
  const result = detectIntent(input);
  const ok = result.intent === expected;
  console.log(
    `${ok ? "✓" : "✗"} ${label}: "${input}" → ${result.intent}${ok ? "" : ` (expected ${expected})`}`
  );
  assert.equal(result.intent, expected, `${label}: "${input}" should be ${expected} but got ${result.intent}`);
}

/* ── Salutations / Small talk ── */
assertIntent("bonjour", "Bonjour", "SMALL_TALK");
assertIntent("salut", "Salut", "SMALL_TALK");
assertIntent("hello", "hello", "SMALL_TALK");
assertIntent("salam", "Salam", "SMALL_TALK");
assertIntent("cc", "Cc", "SMALL_TALK");
assertIntent("comment ça va", "Comment ça va ?", "SMALL_TALK");
assertIntent("ça va", "ça va", "SMALL_TALK");
assertIntent("comment tu vas", "Comment tu vas ?", "SMALL_TALK");
assertIntent("qui es-tu", "Qui es-tu ?", "SMALL_TALK");
assertIntent("tu es qui", "Tu es qui ?", "SMALL_TALK");

/* ── Remerciements ── */
assertIntent("merci", "Merci", "SMALL_TALK");
assertIntent("merci beaucoup", "Merci beaucoup !", "SMALL_TALK");
assertIntent("shukran", "Shukran", "SMALL_TALK");
assertIntent("thanks", "Thanks", "SMALL_TALK");

/* ── Au revoir ── */
assertIntent("au revoir", "Au revoir", "SMALL_TALK");
assertIntent("bye", "Bye", "SMALL_TALK");
assertIntent("bonne journée", "Bonne journée !", "SMALL_TALK");

/* ── Acquiescement ── */
assertIntent("ok", "Ok", "SMALL_TALK");
assertIntent("d'accord", "D'accord", "SMALL_TALK");
assertIntent("compris", "Compris", "SMALL_TALK");

/* ── Hors-sujet ── */
assertIntent("météo", "Quel temps fait-il ?", "HORS_SUJET");
assertIntent("recette", "Donne-moi une recette de gâteau", "HORS_SUJET");
assertIntent("football", "Qui a gagné le match de foot ?", "HORS_SUJET");
assertIntent("musique", "Quelle musique écouter ?", "HORS_SUJET");
assertIntent("film", "Tu as vu le dernier film ?", "HORS_SUJET");
assertIntent("politique", "Qui a gagné les élections ?", "HORS_SUJET");

/* ── Requêtes métier (doivent passer vers le RAG) ── */
assertIntent("normes béton", "Quelles sont les normes pour le béton ?", "REQUETE_METIER");
assertIntent("essai sol", "Je veux un essai de sol", "REQUETE_METIER");
assertIntent("étalonnage", "Prix étalonnage balance", "REQUETE_METIER");
assertIntent("formation CETIM", "Prochaine formation CETIM ?", "REQUETE_METIER");
assertIntent("contact technique", "Numéro contact technique CETIM", "REQUETE_METIER");
assertIntent("prix analyse eau", "Combien coûte une analyse d'eau ?", "REQUETE_METIER");
assertIntent("certificat conformité", "Comment obtenir un certificat ?", "REQUETE_METIER");

/* ── Cas limites ── */
assertIntent("chaîne vide", "", "SMALL_TALK");
assertIntent("comment sava", "comment sava", "REQUETE_METIER");
assertIntent("comment fonctionne le mode ia", "Comment fonctionne le mode IA ?", "REQUETE_METIER");
assertIntent("ce seul", "ce", "REQUETE_METIER");

console.log("\n✅ Tous les tests passés !");
