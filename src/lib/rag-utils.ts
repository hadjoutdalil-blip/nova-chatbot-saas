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
  const shorterF = shorter.filter(w => w.length > 2);
  const longerF = longer.filter(w => w.length > 2);
  if (shorterF.length > 0 && shorterF.every(w => longerF.some(lw => lw.includes(w) || w.includes(lw)))) return 0.95;
  const wo = wordOverlap(na, nb);
  const bo = bigramOverlap(na, nb);
  const fs = fuzzyScore(na, nb);
  return Math.min(wo * 0.35 + bo * 0.35 + fs * 0.30 + 0.02, 1);
}

export function chunkDocument(doc: any, maxChars = 600): ChunkMeta[] {
  const chunks: ChunkMeta[] = [];
  const text = doc.content;
  if (!text) return chunks;
  const overlap = Math.round(maxChars * 0.2);
  const sections = text.split(/\n{2,}|\n(?=#{1,3}\s)/);
  let idx = 0;
  for (const section of sections) {
    const trimmed = section.trim();
    if (!trimmed) continue;
    const sectionTitle = trimmed.startsWith("#")
      ? trimmed.split("\n")[0].replace(/^#+\s*/, "")
      : "";
    const keywords = extractKeywords(trimmed);
    if (trimmed.length <= maxChars) {
      chunks.push({ id: `chunk_${String(idx + 1).padStart(3, "0")}`, source: doc.originalName, section: sectionTitle, keywords, content: trimmed, docId: doc.id, version: doc.version ?? 1, source_url: doc.source_url || "", valid_until: doc.valid_until || null });
      idx++;
    } else {
      const step = maxChars - overlap;
      for (let i = 0; i < trimmed.length; i += step) {
        const content = trimmed.slice(i, i + maxChars).trim();
        if (content) {
          chunks.push({ id: `chunk_${String(idx + 1).padStart(3, "0")}`, source: doc.originalName, section: sectionTitle, keywords, content, docId: doc.id, version: doc.version ?? 1, source_url: doc.source_url || "", valid_until: doc.valid_until || null });
          idx++;
        }
      }
    }
  }
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
    score: calcSimilarity(question, c.content) * 0.6
      + calcSimilarity(question, c.section) * 0.2
      + keywordMatch(question, c.keywords) * 0.2,
  }));
  const sorted = scored.sort((a, b) => b.score - a.score);
  return sorted.filter(c => c.score * 100 >= threshold).slice(0, topN);
}
