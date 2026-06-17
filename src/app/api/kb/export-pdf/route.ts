import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/api-auth";
import PDFDocument from "pdfkit";

export async function GET(req: NextRequest) {
  const user = getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const url = new URL(req.url);
  const clientId = url.searchParams.get("clientId") || user.clientId;

  const allEntries = await db.read<any>("kb_entries");
  const entries = allEntries.filter((k: any) => k.clientId === clientId);

  const doc = new PDFDocument({ margin: 50, info: { Title: "Base de connaissances" } });
  const buffers: Buffer[] = [];
  doc.on("data", (chunk: Buffer) => buffers.push(chunk));

  return new Promise<NextResponse>((resolve) => {
    doc.on("end", () => {
      const pdf = Buffer.concat(buffers);
      resolve(new NextResponse(pdf, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="kb-export-${clientId}.pdf"`,
        },
      }));
    });

    const grouped: Record<string, any[]> = {};
    for (const e of entries) {
      const cat = e.category || "Sans catégorie";
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(e);
    }
    const sortedCats = Object.keys(grouped).sort();

    const fs = 11;
    const titleColor = "#1a1a2e";
    const accentColor = "#7c3aed";
    const grayColor = "#64748b";
    const lightGray = "#f1f5f9";

    function header(text: string, y: number) {
      doc.rect(50, y, 495, 28).fill(accentColor);
      doc.fill("#ffffff").fontSize(fs + 2).font("Helvetica-Bold").text(text, 60, y + 7);
      doc.fill("#000000");
    }

    function entryBlock(e: any, startY: number): number {
      let y = startY;

      if (y > 720) {
        doc.addPage();
        y = 50;
      }

      const icon = e.icon || "💬";
      doc.fontSize(fs + 1).font("Helvetica-Bold").fill("#000000").text(`${icon} ${e.question}`, 50, y, { continued: false });

      y += 22;

      if (e.alt_questions) {
        const alts = e.alt_questions.split(" || ").join(", ");
        doc.fontSize(fs - 2).font("Helvetica-Oblique").fill(grayColor).text(`Variantes : ${alts}`, 55, y, { width: 490 });
        y += 16;
      }

      doc.fontSize(fs).font("Helvetica").fill("#1e293b").text(e.answer || "", 55, y, { width: 490, align: "left" });
      const answerHeight = doc.heightOfString(e.answer || "", { width: 490 });
      y += answerHeight + 10;

      const meta: string[] = [];
      if (e.category) meta.push(`Catégorie : ${e.category}`);
      if (e.keywords) meta.push(`Mots-clés : ${e.keywords}`);
      if (e.source) meta.push(`Source : ${e.source}`);
      meta.push(`Priorité : ${e.priority ?? 5}`);

      doc.fontSize(fs - 3).font("Helvetica").fill(grayColor).text(meta.join("  |  "), 55, y, { width: 490 });
      y += 16;

      doc.moveTo(55, y - 4).lineTo(545, y - 4).strokeColor("#e2e8f0").stroke();
      y += 12;

      return y;
    }

    doc.fontSize(24).font("Helvetica-Bold").fill(titleColor).text("Base de connaissances", 50, 120, { align: "center" });
    doc.fontSize(14).font("Helvetica").fill(grayColor).text(`Généré le ${new Date().toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" })}`, { align: "center" });
    doc.fontSize(12).fill(grayColor).text(`${entries.length} entrées • ${sortedCats.length} catégories`, { align: "center" });

    doc.moveTo(150, 190).lineTo(445, 190).strokeColor(accentColor).stroke();

    doc.fontSize(14).font("Helvetica-Bold").fill(titleColor).text("Catégories", 50, 215);
    let yPos = 240;
    for (const cat of sortedCats) {
      doc.fontSize(fs).font("Helvetica").fill("#334155").text(`  •  ${cat} (${grouped[cat].length})`, 50, yPos);
      yPos += 18;
    }

    for (const cat of sortedCats) {
      doc.addPage();
      header(cat, 25);
      let y = 70;
      for (const entry of grouped[cat]) {
        y = entryBlock(entry, y);
      }
    }

    doc.end();
  });
}
