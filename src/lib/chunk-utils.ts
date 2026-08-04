const FRENCH_STOPWORDS = new Set([
  "dans", "avec", "pour", "sur", "entre", "dont", "sans", "selon", "chez", "vers",
  "depuis", "pendant", "durant", "malgré", "après", "avant", "devant", "derrière",
  "cette", "cet", "tout", "tous", "toute", "toutes", "chaque", "quelque", "plusieurs",
  "leur", "leurs", "elles", "être", "avoir", "faire", "nous", "vous", "elles", "ils",
  "aussi", "très", "plus", "moins", "assez", "peu", "ainsi", "enfin", "alors",
  "donc", "car", "mais", "ou", "et", "ni", "que", "qui", "quoi", "dont", "où",
  "comment", "pourquoi", "quand", "combien", "est", "sont", "était",
]);

export function extractKeywords(text: string, maxKeywords = 8): string[] {
  const words = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .split(/\W+/)
    .filter(w => w.length > 3 && !FRENCH_STOPWORDS.has(w));
  const freq = new Map<string, number>();
  for (const w of words) freq.set(w, (freq.get(w) || 0) + 1);
  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxKeywords)
    .map(([w]) => w);
}

export function keywordMatch(question: string, keywords: string[]): number {
  if (!keywords || keywords.length === 0) return 0;
  const nq = question
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  /* Singularisation française légère : "chapitres"→"chapitre", "donnees"→"donnee", "universites"→"universite"
     pour rapprocher les mots-clés (indexés au singulier) des pluriels présents dans la question. */
  const singularize = (w: string) => {
    if (w.length > 5 && w.endsWith("es") && !w.endsWith("sses") && !w.endsWith("ges") && !w.endsWith("ces") && !w.endsWith("des") && !w.endsWith("tes") && !w.endsWith("res") && !w.endsWith("ses")) return w.slice(0, -2) + "e";
    if (w.length > 4 && w.endsWith("s") && !w.endsWith("ss")) return w.slice(0, -1);
    return w;
  };
  const qWords = new Set(nq.split(" ").map(singularize));
  const hits = keywords.filter(kw => {
    const nkw = singularize(kw.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""));
    return qWords.has(nkw);
  }).length;
  return hits / Math.max(keywords.length, 1);
}
