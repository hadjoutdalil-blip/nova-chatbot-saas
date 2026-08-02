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
  const hits = keywords.filter(kw => {
    const nkw = kw.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return new RegExp("\\b" + nkw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b", "i").test(nq);
  }).length;
  return hits / Math.max(keywords.length, 1);
}
