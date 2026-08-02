import { getDocumentProxy, extractText } from "unpdf";

export interface PdfPage {
  page: number;
  text: string;
}

export function isPdfMime(mimeType: string): boolean {
  return (
    mimeType.toLowerCase() === "application/pdf" ||
    mimeType.toLowerCase().includes("pdf")
  );
}

export function isPdfName(fileName: string): boolean {
  return fileName.toLowerCase().endsWith(".pdf");
}

function cleanPdfText(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    /* Supprime les octets nuls (0x00) et caractères de contrôle : PostgreSQL les refuse dans TEXT */
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/ +\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/* Détecte un texte réellement lisible vs du binaire/glifs non décodés (PDF scanné ou police cassée).
   Les PDF scannés donnent des suites de caractères bizarres sans mots ni espaces. */
export function isReadableText(text: string): boolean {
  if (!text.trim()) return false;
  let letters = 0;
  let whitespace = 0;
  let control = 0;
  const total = text.length;
  const letterRe = /[\p{L}\p{N}]/u;
  for (const ch of text) {
    if (letterRe.test(ch)) letters++;
    else if (/\s/.test(ch)) whitespace++;
    else if (/[\u0000-\u001F\u007F-\u009F]/.test(ch)) control++;
  }
  const letterRatio = letters / total;
  const controlRatio = control / total;
  const spaceRatio = whitespace / total;
  return letterRatio > 0.35 && spaceRatio > 0.01 && controlRatio < 0.03;
}

/**
 * Extrait le texte d'un PDF page par page.
 * Les pages vides ou illisibles (binaire/scanné) sont ignorées.
 */
export async function extractPdfPages(
  data: Buffer | Uint8Array | ArrayBuffer,
): Promise<PdfPage[]> {
  const pdf = await getDocumentProxy(data);
  const { text } = await extractText(pdf, { mergePages: false });
  const pages = Array.isArray(text) ? text : [text as string];
  return pages
    .map((t, i) => ({ page: i + 1, text: cleanPdfText(t || "") }))
    .filter((p) => p.text.length > 0 && isReadableText(p.text));
}

/**
 * Extrait le texte complet d'un PDF avec des marqueurs de page
 * (format lisible par le chunking et par le chat).
 */
export async function extractPdfText(
  data: Buffer | Uint8Array | ArrayBuffer,
): Promise<string> {
  const pages = await extractPdfPages(data);
  return pages
    .map((p) => `\n\n===== PAGE ${p.page} =====\n\n${p.text}`)
    .join("\n")
    .trim();
}

/**
 * Extrait le texte d'un fichier en fonction de son type.
 * Retourne null si le type n'est pas supporté.
 */
export async function extractTextFromFile(
  data: Buffer,
  mimeType: string,
  fileName: string,
): Promise<string | null> {
  if (isPdfMime(mimeType) || isPdfName(fileName)) {
    return extractPdfText(data);
  }
  return null;
}
