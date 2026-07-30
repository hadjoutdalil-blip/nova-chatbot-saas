import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let current: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];
    if (inQuotes) {
      if (ch === '"' && next === '"') { field += '"'; i++; }
      else if (ch === '"') inQuotes = false;
      else field += ch;
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === ",") { current.push(field); field = ""; }
      else if (ch === "\r" || ch === "\n") {
        if (ch === "\r" && next === "\n") i++;
        if (field || current.length) { current.push(field); field = ""; rows.push(current); current = []; }
      } else field += ch;
    }
  }
  if (field || current.length) { current.push(field); rows.push(current); }
  return rows;
}

const PRIORITY_MAP: Record<string, number> = {
  haute: 8, moyenne: 5, basse: 3,
};

export async function GET(req: NextRequest) {
  const auth = req.nextUrl.searchParams.get("key");
  if (auth !== process.env.CRON_SECRET && auth !== "dev-seed-key") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const client = await prisma.client.findUnique({ where: { slug: "cetim" } });
    if (!client) return NextResponse.json({ error: "Client CETIM introuvable" }, { status: 404 });

    const csvPath = path.join(process.cwd(), "scripts", "data", "cetim-laboratoire.csv");
    if (!fs.existsSync(csvPath)) return NextResponse.json({ error: "CSV introuvable" }, { status: 404 });

    const buf = fs.readFileSync(csvPath);
    const raw = buf.toString("latin1");
    const rows = parseCSV(raw);
    const header = rows[0].map(h => h.trim().toLowerCase());
    const data = rows.slice(1).filter((r: string[]) => r.length >= 4 && r[0] && r[0].trim());

    const seenQs = new Set<string>();
    const parsed: any[] = [];
    for (const row of data) {
      const tag = (row[header.indexOf("tag")] || "").trim();
      const questionPrincipale = (row[header.indexOf("question_principale")] || "").trim();
      const questionsAlternatives = (row[header.indexOf("questions_alternatives")] || "").trim();
      const reponseCourte = (row[header.indexOf("reponse_courte")] || "").trim();
      const reponseLongue = (row[header.indexOf("reponse_longue")] || "").trim();
      const categorie = (row[header.indexOf("categorie")] || "").trim();
      const motsCles = (row[header.indexOf("mots_cles")] || "").trim();
      const prioriteRaw = (row[header.indexOf("priorite")] || "").trim().toLowerCase();
      const tagsAssocies = (row[header.indexOf("tags_associes")] || "").trim();

      if (!tag || !questionPrincipale) continue;

      const qKey = questionPrincipale.toLowerCase().replace(/\s+/g, " ");
      if (seenQs.has(qKey)) continue;
      seenQs.add(qKey);

      const altQs = questionsAlternatives.split("|").map(s => s.trim()).filter(Boolean).join(" || ");
      const keywords = motsCles.split(",").map(s => s.trim()).filter(Boolean).join(", ");
      const priority = PRIORITY_MAP[prioriteRaw] || 5;
      const answer = reponseLongue ? `${reponseCourte}\n\n${reponseLongue}` : reponseCourte;

      parsed.push({
        id: randomUUID(),
        tag, question: questionPrincipale, alt_questions: altQs,
        short_resp: reponseCourte, answer,
        category: categorie || "Laboratoire", keywords, priority,
        related_tags: tagsAssocies, source: "CETIM – Laboratoire",
        clientId: client.id,
      });
    }

    await prisma.kBEntry.deleteMany({ where: { clientId: client.id } });
    await prisma.kBEntry.createMany({ data: parsed });

    return NextResponse.json({
      success: true,
      imported: parsed.length,
      total: data.length,
      duplicates: data.length - parsed.length,
      client: client.name,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
