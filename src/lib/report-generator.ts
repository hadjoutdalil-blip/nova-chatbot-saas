import { db } from "./db";
import { Pool } from "@neondatabase/serverless";

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });

export interface ReportMetrics {
  period: string;
  clientId: string;
  clientName: string;
  kbEntriesAdded: number;
  docsImported: number;
  chunksIndexed: number;
  errorsCount: number;
  errorDetails: { type: string; message: string; count: number }[];
  resolutionRate: number;
  totalQuestions: number;
  answered: number;
  escalated: number;
  failed: number;
  periodStart: Date;
  periodEnd: Date;
}

function getWeekRange(date: Date): { start: Date; end: Date; period: string } {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const start = new Date(d.setDate(diff));
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  const year = start.getFullYear();
  const weekNum = Math.ceil(((start.getTime() - new Date(year, 0, 1).getTime()) / 86400000 + 1) / 7);
  const period = `${year}-W${String(weekNum).padStart(2, "0")}`;

  return { start, end, period };
}

function getLastWeekRange(): { start: Date; end: Date; period: string } {
  const lastWeek = new Date();
  lastWeek.setDate(lastWeek.getDate() - 7);
  return getWeekRange(lastWeek);
}

function getMonthRange(date: Date): { start: Date; end: Date; period: string } {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
  const period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  return { start, end, period };
}

export async function generateReport(
  clientId: string,
  periodType: "week" | "month" = "week",
  customPeriod?: string,
): Promise<ReportMetrics> {
  const client = await db.prisma.client.findUnique({ where: { id: clientId } });
  if (!client) throw new Error("Client not found");

  let range: { start: Date; end: Date; period: string };
  if (customPeriod) {
    if (periodType === "week") {
      const [year, week] = customPeriod.split("-W").map(Number);
      const jan1 = new Date(year, 0, 1);
      const start = new Date(jan1);
      start.setDate(start.getDate() + (week - 1) * 7 - jan1.getDay() + 1);
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      range = { start, end, period: customPeriod };
    } else {
      const [year, month] = customPeriod.split("-").map(Number);
      range = getMonthRange(new Date(year, month - 1, 1));
    }
  } else {
    range = periodType === "week" ? getLastWeekRange() : getMonthRange(new Date());
  }

  const { start: periodStart, end: periodEnd, period } = range;

  const kbEntriesAdded = await db.prisma.kBEntry.count({
    where: { clientId, createdAt: { gte: periodStart, lte: periodEnd } },
  });

  const docsImported = await db.prisma.clientDocument.count({
    where: { clientId, createdAt: { gte: periodStart, lte: periodEnd } },
  });

  const localDocsImported = await db.prisma.clientLocalDoc.count({
    where: { clientId, createdAt: { gte: periodStart, lte: periodEnd } },
  });

  let chunksIndexed = 0;
  try {
    const { rows } = await pool.query(
      `SELECT COUNT(*)::int as cnt FROM document_chunks
       WHERE "clientId" = $1`,
      [clientId],
    );
    chunksIndexed = rows[0]?.cnt || 0;
  } catch {
    chunksIndexed = 0;
  }

  const feedbacks = await db.prisma.messageFeedback.findMany({
    where: { clientId, createdAt: { gte: periodStart, lte: periodEnd } },
    select: { source: true },
  });

  const answered = feedbacks.filter((f) => f.source === "kb" || f.source === "qa" || f.source === "rag").length;
  const escalated = feedbacks.filter((f) => f.source === "escalade").length;
  const failed = feedbacks.filter((f) => f.source === "fallback").length;
  const totalQuestions = feedbacks.length;
  const resolutionRate = totalQuestions > 0 ? Math.round((answered / totalQuestions) * 100) : 0;

  const usageLogs = await db.prisma.aIUsageLog.findMany({
    where: { clientId, createdAt: { gte: periodStart, lte: periodEnd } },
    select: { provider: true, model: true, totalTokens: true },
  });

  const errors: { type: string; message: string; count: number }[] = [];
  const errorMap = new Map<string, { message: string; count: number }>();

  for (const log of usageLogs) {
    if (log.totalTokens === 0) {
      const key = `zero_tokens_${log.provider}`;
      const existing = errorMap.get(key);
      if (existing) {
        existing.count++;
      } else {
        errorMap.set(key, { message: `Appel ${log.provider} avec 0 tokens`, count: 1 });
      }
    }
  }

  const localImports = await db.prisma.localImportFile.findMany({
    where: { clientId },
  });
  for (const li of localImports) {
    if (li.chunkCount === 0 && li.kbCount === 0) {
      const key = `empty_import_${li.fileName}`;
      const existing = errorMap.get(key);
      if (existing) {
        existing.count++;
      } else {
        errorMap.set(key, { message: `Import vide: ${li.fileName}`, count: 1 });
      }
    }
  }

  for (const [type, data] of errorMap) {
    errors.push({ type, message: data.message, count: data.count });
  }

  const report = await db.prisma.activityReport.create({
    data: {
      clientId,
      period,
      kbEntriesAdded,
      docsImported: docsImported + localDocsImported,
      chunksIndexed,
      errorsCount: errors.reduce((sum, e) => sum + e.count, 0),
      errorDetails: JSON.stringify(errors),
      resolutionRate,
      totalQuestions,
      answered,
      escalated,
      failed,
      periodStart,
      periodEnd,
    },
  });

  return {
    period,
    clientId,
    clientName: client.name,
    kbEntriesAdded,
    docsImported: docsImported + localDocsImported,
    chunksIndexed,
    errorsCount: errors.reduce((sum, e) => sum + e.count, 0),
    errorDetails: errors,
    resolutionRate,
    totalQuestions,
    answered,
    escalated,
    failed,
    periodStart,
    periodEnd,
  };
}

export function formatReportMarkdown(report: ReportMetrics): string {
  const startStr = report.periodStart.toLocaleDateString("fr-FR");
  const endStr = report.periodEnd.toLocaleDateString("fr-FR");

  let md = `📊 Rapport d'activité — ${report.clientName}\n`;
  md += `Période : ${startStr} au ${endStr}\n\n`;

  md += `✅ Ajouts\n`;
  md += `• ${report.kbEntriesAdded} nouvelles entrées KB\n`;
  md += `• ${report.docsImported} documents importés\n`;
  md += `• ${report.chunksIndexed} chunks indexés\n\n`;

  if (report.errorsCount > 0) {
    md += `⚠️ Problèmes (${report.errorsCount})\n`;
    for (const err of report.errorDetails) {
      md += `• ${err.message} (×${err.count})\n`;
    }
    md += "\n";
  }

  md += `📈 Performance\n`;
  md += `• Taux de résolution : ${report.resolutionRate}%\n`;
  md += `• Questions répondues : ${report.answered}/${report.totalQuestions}\n`;
  md += `• Escalades : ${report.escalated}\n`;
  md += `• Échecs : ${report.failed}\n`;

  return md;
}

export function formatReportHTML(report: ReportMetrics): string {
  const startStr = report.periodStart.toLocaleDateString("fr-FR");
  const endStr = report.periodEnd.toLocaleDateString("fr-FR");

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #059669;">📊 Rapport d'activité — ${report.clientName}</h1>
  <p style="color: #666;">Période : ${startStr} au ${endStr}</p>

  <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; margin: 15px 0;">
    <h2 style="color: #059669; margin-top: 0;">✅ Ajouts</h2>
    <ul>
      <li><strong>${report.kbEntriesAdded}</strong> nouvelles entrées KB</li>
      <li><strong>${report.docsImported}</strong> documents importés</li>
      <li><strong>${report.chunksIndexed}</strong> chunks indexés</li>
    </ul>
  </div>

  ${report.errorsCount > 0 ? `
  <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 15px 0;">
    <h2 style="color: #d97706; margin-top: 0;">⚠️ Problèmes (${report.errorsCount})</h2>
    <ul>
      ${report.errorDetails.map((err) => `<li>${err.message} (×${err.count})</li>`).join("\n")}
    </ul>
  </div>
  ` : ""}

  <div style="background: #eff6ff; padding: 15px; border-radius: 8px; margin: 15px 0;">
    <h2 style="color: #2563eb; margin-top: 0;">📈 Performance</h2>
    <ul>
      <li>Taux de résolution : <strong>${report.resolutionRate}%</strong></li>
      <li>Questions répondues : <strong>${report.answered}/${report.totalQuestions}</strong></li>
      <li>Escalades : <strong>${report.escalated}</strong></li>
      <li>Échecs : <strong>${report.failed}</strong></li>
    </ul>
  </div>

  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
  <p style="color: #9ca3af; font-size: 12px;">
    Généré automatiquement par Nova Chatbot — ${new Date().toLocaleString("fr-FR")}
  </p>
</body>
</html>`;
}
