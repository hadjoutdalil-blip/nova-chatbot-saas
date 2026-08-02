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
    .replace(/[ \t]+/g, " ")
    .replace(/ +\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Extrait le texte d'un PDF page par page.
 * Les pages vides sont ignorées.
 */
export async function extractPdfPages(
  data: Buffer | Uint8Array | ArrayBuffer,
): Promise<PdfPage[]> {
  const pdf = await getDocumentProxy(data);
  const { text } = await extractText(pdf, { mergePages: false });
  const pages = Array.isArray(text) ? text : [text as string];
  return pages
    .map((t, i) => ({ page: i + 1, text: cleanPdfText(t || "") }))
    .filter((p) => p.text.length > 0);
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
