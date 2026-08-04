import { extractKeywords, keywordMatch } from "@/lib/chunk-utils";

export interface ChunkMeta {
  id: string;
  source: string;
  section: string;
  keywords: string[];
  content: string;
  score?: number;
  docId?: string;
  version?: number;
  source_url?: string;
  valid_until?: string;
  metadata?: Record<string, any>;
}

const acroPattern = (term: string): RegExp =>
  new RegExp(`(?<![a-zA-Z0-9])${term}(?![a-zA-Z0-9&-])`, "i");

const QUERY_EXPANSIONS: Array<{ pattern: RegExp; add: string }> = [
  { pattern: acroPattern("nlp"), add: " traitement automatique du langage naturel taln" },
  { pattern: acroPattern("taln"), add: " traitement automatique du langage naturel nlp" },
  { pattern: acroPattern("machine learning"), add: " apprentissage automatique" },
  { pattern: acroPattern("ml"), add: " machine learning apprentissage automatique" },
  { pattern: acroPattern("deep learning"), add: " apprentissage profond" },
  { pattern: acroPattern("dl"), add: " deep learning apprentissage profond" },
  { pattern: acroPattern("llm"), add: " grand modèle de langage large language model" },
  { pattern: acroPattern("rag"), add: " génération augmentée par récupération retrieval augmented generation" },
  { pattern: acroPattern("rnn"), add: " réseau de neurones récurrent réseaux récurrents" },
  { pattern: acroPattern("cnn"), add: " réseau de neurones convolutif réseaux convolutifs" },
  { pattern: acroPattern("transformer"), add: " transformers attention mécanisme d'attention" },
  { pattern: acroPattern("computer vision"), add: " vision par ordinateur" },
  { pattern: acroPattern("data science"), add: " science des données" },
  { pattern: acroPattern("cybersecurity"), add: " cybersécurité sécurité informatique" },
  { pattern: acroPattern("ia"), add: " intelligence artificielle artificial intelligence" },
  { pattern: acroPattern("ai"), add: " intelligence artificielle artificial intelligence" },
  { pattern: acroPattern("génération augmentée par récupération"), add: " retrieval augmented generation rag" },
];

export function expandSearchQuery(query: string): string {
  let out = " " + query.trim() + " ";
  for (const { pattern, add } of QUERY_EXPANSIONS) {
    if (!pattern.test(out)) continue;
    const addNorm = norm(add.trim());
    const outNorm = norm(out);
    if (!addNorm || addNorm.split(" ").some((w) => w.length > 3 && outNorm.includes(w))) continue;
    out = out.trimEnd() + add;
  }
  return out.trim();
}

export function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

function wordOverlap(a: string, b: string): number {
  const wa = a.split(" ").filter(w => w.length > 1);
  const wb = b.split(" ").filter(w => w.length > 1);
  if (wa.length === 0 || wb.length === 0) return 0;
  let hits = 0;
  for (const w of wa) {
    if (wb.some(bw => bw.includes(w) || w.includes(bw))) hits++;
  }
  return hits / Math.max(wa.length, wb.length);
}

function bigramOverlap(a: string, b: string): number {
  const getBigrams = (s: string) => { const w = s.split(" "); const bg: string[] = []; for (let i = 0; i < w.length - 1; i++) bg.push(w[i] + " " + w[i + 1]); return bg; };
  const ba = getBigrams(a).filter(x => x.length > 2);
  const bb = getBigrams(b).filter(x => x.length > 2);
  if (ba.length === 0 || bb.length === 0) return 0;
  let hits = 0;
  for (const bg of ba) {
    if (bb.some(b => b.includes(bg) || bg.includes(b))) hits++;
  }
  return hits / Math.max(ba.length, bb.length);
}

function fuzzyScore(a: string, b: string): number {
  const wa = a.split(" ").filter(w => w.length > 3);
  const wb = b.split(" ").filter(w => w.length > 3);
  if (wa.length === 0 || wb.length === 0) return 0;
  let hits = 0;
  for (const waWord of wa) {
    for (const wbWord of wb) {
      if (Math.abs(waWord.length - wbWord.length) > 3) continue;
      const dist = levenshtein(waWord, wbWord);
      if (dist <= 2) { hits++; break; }
    }
  }
  return hits / Math.max(wa.length, wb.length);
}

export function calcSimilarity(a: string, b: string): number {
  const na = norm(a);
  const nb = norm(b);
  if (na === nb) return 1;
  const wa = na.split(" ").filter(w => w);
  const wb = nb.split(" ").filter(w => w);
  const shorter = wa.length <= wb.length ? wa : wb;
  const longer = wa.length <= wb.length ? wb : wa;
  const shorterF = shorter.filter(w => w.length > 3);
  const longerF = longer.filter(w => w.length > 3);
  if (shorterF.length >= 2 && shorterF.every(w => longerF.some(lw => lw.includes(w) || w.includes(lw)))) return 0.95;
  const wo = wordOverlap(na, nb);
  const bo = bigramOverlap(na, nb);
  const fs = fuzzyScore(na, nb);
  return Math.min(wo * 0.35 + bo * 0.35 + fs * 0.30 + 0.02, 1);
}

const PAGE_MARKER_RE = /^={2,}\s*PAGE\s*(\d+)\s*={2,}$/i;
const HEADING_RE = /^(#{1,3})\s+(.*)$/;

interface Block {
  text: string;
  section: string;
}

/* Découpe le texte en blocs sémantiques : pages (===== PAGE N =====), titres markdown, paragraphes */
function splitIntoBlocks(text: string): Block[] {
  const blocks: Block[] = [];
  const lines = text.split("\n");
  let buf: string[] = [];
  let section = "";

  const flush = () => {
    const t = buf.join("\n").trim();
    if (t) blocks.push({ text: t, section });
    buf = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      flush();
      continue;
    }
    const pm = line.match(PAGE_MARKER_RE);
    if (pm) {
      flush();
      section = `Page ${pm[1]}`;
      continue;
    }
    const hm = line.match(HEADING_RE);
    if (hm) {
      flush();
      section = hm[2].trim();
      buf.push(line);
      continue;
    }
    buf.push(line);
  }
  flush();
  return blocks;
}

/* Coupe au niveau d'un mot pour ne pas tronquer en plein milieu d'un mot */
function sliceAtWord(text: string, start: number, maxChars: number): string {
  let end = Math.min(start + maxChars, text.length);
  if (end < text.length) {
    const nextSpace = text.indexOf(" ", end);
    const prevSpace = text.lastIndexOf(" ", end);
    const after = nextSpace !== -1 ? nextSpace - end : Infinity;
    const before = prevSpace > start ? end - prevSpace : Infinity;
    if (after < before && after <= 20) end = nextSpace + 1;
    else if (before < after && before <= 40) end = prevSpace + 1;
  }
  return text.slice(start, end).trim();
}

function buildChunkMeta(
  idx: number,
  doc: any,
  content: string,
  section: string,
  keywords: string[],
  metadata: Record<string, any>,
): ChunkMeta {
  return {
    id: `chunk_${String(idx + 1).padStart(3, "0")}`,
    source: doc.originalName,
    section,
    keywords,
    content,
    docId: doc.id,
    version: doc.version ?? 1,
    source_url: doc.source_url || "",
    valid_until: doc.valid_until || null,
    metadata,
  };
}

export function chunkDocument(doc: any, maxChars = 600): ChunkMeta[] {
  const chunks: ChunkMeta[] = [];
  const text = doc.content;
  if (!text) return chunks;

  const overlap = Math.round(maxChars * 0.15);
  const step = Math.max(1, maxChars - overlap);

  const blocks = splitIntoBlocks(text);

  let idx = 0;
  let buf: string[] = [];
  let bufLen = 0;
  let curSection = "";

  const flush = () => {
    if (buf.length === 0) return;
    const content = buf.join("\n\n").trim();
    const metadata: Record<string, any> = { docType: "document" };
    const pageMatch = curSection.match(/^Page\s+(\d+)$/i);
    if (pageMatch) metadata.page = parseInt(pageMatch[1], 10);
    chunks.push(buildChunkMeta(idx++, doc, content, curSection, extractKeywords(content), metadata));
    buf = [];
    bufLen = 0;
  };

  for (const block of blocks) {
    if (block.text.length > maxChars) {
      flush();
      const metadata: Record<string, any> = { docType: "document" };
      const pageMatch = block.section.match(/^Page\s+(\d+)$/i);
      if (pageMatch) metadata.page = parseInt(pageMatch[1], 10);
      const keywords = extractKeywords(block.text);
      for (let i = 0; i < block.text.length; i += step) {
        const content = sliceAtWord(block.text, i, maxChars);
        if (content) {
          chunks.push(buildChunkMeta(idx++, doc, content, block.section, keywords, metadata));
        }
      }
      continue;
    }
    if (buf.length > 0 && bufLen + block.text.length > maxChars) {
      flush();
    }
    if (block.section) curSection = block.section;
    buf.push(block.text);
    bufLen += block.text.length + 2;
  }
  flush();
  return chunks;
}

export function parseChunks(siteContext: string): ChunkMeta[] {
  if (!siteContext) return [];
  const chunks: ChunkMeta[] = [];
  const regex = /\[CHUNK:([^\]]+)\]([\s\S]*?)(?=\[CHUNK:|$)/g;
  let match;
  while ((match = regex.exec(siteContext)) !== null) {
    const raw = match[2].trim();
    if (!raw) continue;
    let content = raw;
    let section = "";
    let keywords: string[] = [];
    const nl = raw.indexOf("\n");
    if (nl > 0) {
      try {
        const meta = JSON.parse(raw.slice(0, nl));
        if (meta.section) section = meta.section;
        if (meta.keywords) keywords = meta.keywords;
        content = raw.slice(nl + 1).trim();
      } catch {
        const lines = raw.split("\n");
        section = lines[0].startsWith("#")
          ? lines[0].replace(/^#+\s*/, "")
          : "";
        keywords = extractKeywords(raw);
      }
    } else {
      keywords = extractKeywords(raw);
    }
    chunks.push({
      id: `chunk_${String(chunks.length + 1).padStart(3, "0")}`,
      source: match[1],
      section,
      keywords,
      content: content || raw,
    });
  }
  if (chunks.length === 0 && siteContext.trim()) {
    const trimmed = siteContext.trim();
    chunks.push({
      id: "chunk_001",
      source: "contexte.txt",
      section: "",
      keywords: extractKeywords(trimmed),
      content: trimmed,
    });
  }
  return chunks;
}

export function findBestChunks(question: string, chunks: ChunkMeta[], topN: number, threshold: number) {
  const scored = chunks.map(c => ({
    ...c,
    score: calcSimilarity(question, c.content) * 0.5
      + calcSimilarity(question, c.section) * 0.2
      + keywordMatch(question, c.keywords) * 0.3,
  }));
  let sorted = scored.sort((a, b) => b.score - a.score);
  let results = sorted.filter(c => c.score * 100 >= threshold).slice(0, topN);

  /* Fallback mot-clé : si pas assez de chunks, chercher par mots de la question */
  if (results.length < Math.max(1, topN / 2)) {
    const qWords = norm(question).split(" ").filter(w => w.length > 2);
    const keywordHits = chunks.map(c => {
      const nc = norm(c.content);
      const hits = qWords.filter(w => new RegExp("\\b" + w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b", "i").test(nc)).length;
      return { ...c, score: hits / Math.max(qWords.length, 1) };
    }).filter(c => c.score > 0).sort((a, b) => b.score - a.score).slice(0, topN);
    if (keywordHits.length > results.length) {
      results = keywordHits;
    }
  }

  return results;
}
