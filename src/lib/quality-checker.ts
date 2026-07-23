import { db } from "./db";
import { Pool } from "@neondatabase/serverless";
import { calcSimilarity } from "./rag-utils";
import { extractKeywords } from "./chunk-utils";
import { deleteDocChunks } from "./vector-store";

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });

export interface QualityAlert {
  id?: string;
  type: "duplicate" | "obsolete" | "contradiction" | "empty_answer" | "missing_keywords" | "orphan_vector";
  severity: "low" | "medium" | "high";
  description: string;
  entryIds: string[];
  autoFixed: boolean;
  fixedAt?: Date;
  fixedBy?: string;
}

export interface QualityReport {
  clientId: string;
  clientName: string;
  checkedAt: Date;
  summary: {
    total: number;
    duplicates: number;
    obsolete: number;
    contradictions: number;
    emptyAnswers: number;
    missingKeywords: number;
    orphanVectors: number;
    ok: number;
  };
  alerts: QualityAlert[];
  autoFixedCount: number;
  manualReviewCount: number;
}

function extractKeywordsFromQuestion(question: string): string[] {
  return extractKeywords(question, 5);
}

async function findDuplicates(kbEntries: { id: string; question: string; answer: string; keywords: string }[]): Promise<QualityAlert[]> {
  const alerts: QualityAlert[] = [];
  const checked = new Set<string>();

  for (let i = 0; i < kbEntries.length; i++) {
    for (let j = i + 1; j < kbEntries.length; j++) {
      const key = `${kbEntries[i].id}-${kbEntries[j].id}`;
      if (checked.has(key)) continue;
      checked.add(key);

      const sim = calcSimilarity(kbEntries[i].question, kbEntries[j].question);
      if (sim > 0.90) {
        alerts.push({
          type: "duplicate",
          severity: "medium",
          description: `Doublon potentiel: "${kbEntries[i].question.slice(0, 50)}..." et "${kbEntries[j].question.slice(0, 50)}..." (similarité ${Math.round(sim * 100)}%)`,
          entryIds: [kbEntries[i].id, kbEntries[j].id],
          autoFixed: false,
        });
      }
    }
  }

  return alerts;
}

async function findObsolete(kbEntries: { id: string; question: string; valid_until: string }[]): Promise<QualityAlert[]> {
  const alerts: QualityAlert[] = [];
  const now = new Date();

  for (const entry of kbEntries) {
    if (entry.valid_until) {
      const expiry = new Date(entry.valid_until);
      if (expiry < now) {
        alerts.push({
          type: "obsolete",
          severity: "high",
          description: `Entrée obsolète: "${entry.question.slice(0, 50)}..." (expirée le ${expiry.toLocaleDateString("fr-FR")})`,
          entryIds: [entry.id],
          autoFixed: false,
        });
      }
    }
  }

  return alerts;
}

async function findContradictions(kbEntries: { id: string; question: string; answer: string }[]): Promise<QualityAlert[]> {
  const alerts: QualityAlert[] = [];
  const checked = new Set<string>();

  for (let i = 0; i < kbEntries.length; i++) {
    for (let j = i + 1; j < kbEntries.length; j++) {
      const key = `${kbEntries[i].id}-${kbEntries[j].id}`;
      if (checked.has(key)) continue;
      checked.add(key);

      const questionSim = calcSimilarity(kbEntries[i].question, kbEntries[j].question);
      if (questionSim > 0.80) {
        const answerSim = calcSimilarity(kbEntries[i].answer, kbEntries[j].answer);
        if (answerSim < 0.50) {
          alerts.push({
            type: "contradiction",
            severity: "high",
            description: `Contradiction potentielle: même question "${kbEntries[i].question.slice(0, 50)}..." mais réponses différentes (similarité réponses: ${Math.round(answerSim * 100)}%)`,
            entryIds: [kbEntries[i].id, kbEntries[j].id],
            autoFixed: false,
          });
        }
      }
    }
  }

  return alerts;
}

async function findEmptyAnswers(kbEntries: { id: string; question: string; answer: string }[]): Promise<QualityAlert[]> {
  const alerts: QualityAlert[] = [];

  for (const entry of kbEntries) {
    if (!entry.answer || entry.answer.trim().length < 10) {
      alerts.push({
        type: "empty_answer",
        severity: "medium",
        description: `Réponse vide ou trop courte: "${entry.question.slice(0, 50)}..." (${entry.answer.length} caractères)`,
        entryIds: [entry.id],
        autoFixed: false,
      });
    }
  }

  return alerts;
}

async function findMissingKeywords(kbEntries: { id: string; question: string; keywords: string }[]): Promise<QualityAlert[]> {
  const alerts: QualityAlert[] = [];

  for (const entry of kbEntries) {
    if (!entry.keywords || entry.keywords.trim().length === 0) {
      const suggested = extractKeywordsFromQuestion(entry.question);
      alerts.push({
        type: "missing_keywords",
        severity: "low",
        description: `Mots-clés manquants: "${entry.question.slice(0, 50)}..." → suggérés: ${suggested.join(", ")}`,
        entryIds: [entry.id],
        autoFixed: false,
      });
    }
  }

  return alerts;
}

async function findOrphanVectors(clientId: string): Promise<QualityAlert[]> {
  const alerts: QualityAlert[] = [];

  try {
    const { rows: chunks } = await pool.query(
      'SELECT DISTINCT "docId" FROM document_chunks WHERE "clientId" = $1',
      [clientId],
    );

    const kbEntries = await db.prisma.kBEntry.findMany({
      where: { clientId },
      select: { id: true },
    });
    const kbIds = new Set(kbEntries.map((e) => e.id));

    const clientDocs = await db.prisma.clientDocument.findMany({
      where: { clientId },
      select: { id: true },
    });
    const docIds = new Set(clientDocs.map((d) => d.id));

    const localDocs = await db.prisma.clientLocalDoc.findMany({
      where: { clientId },
      select: { id: true },
    });
    const localDocIds = new Set(localDocs.map((d) => d.id));

    for (const row of chunks) {
      const docId = row.docId;
      if (!kbIds.has(docId) && !docIds.has(docId) && !localDocIds.has(docId)) {
        if (!docId.startsWith("kb-import-") && !docId.startsWith("local-")) {
          alerts.push({
            type: "orphan_vector",
            severity: "medium",
            description: `Vecteur orphelin: docId "${docId}" n'a pas de source correspondante`,
            entryIds: [docId],
            autoFixed: false,
          });
        }
      }
    }
  } catch {
    // table might not exist yet
  }

  return alerts;
}

async function autoFix(alerts: QualityAlert[], clientId: string): Promise<number> {
  let fixedCount = 0;

  for (const alert of alerts) {
    if (alert.autoFixed) continue;

    try {
      switch (alert.type) {
        case "duplicate": {
          if (alert.entryIds.length >= 2) {
            const entries = await db.prisma.kBEntry.findMany({
              where: { id: { in: alert.entryIds } },
              orderBy: { createdAt: "desc" },
            });
            if (entries.length >= 2) {
              const older = entries[entries.length - 1];
              await db.prisma.kBEntry.delete({ where: { id: older.id } });
              await deleteDocChunks(older.id);
              alert.autoFixed = true;
              alert.fixedAt = new Date();
              alert.fixedBy = "auto";
              fixedCount++;
            }
          }
          break;
        }

        case "obsolete": {
          for (const entryId of alert.entryIds) {
            await db.prisma.kBEntry.delete({ where: { id: entryId } });
            await deleteDocChunks(entryId);
          }
          alert.autoFixed = true;
          alert.fixedAt = new Date();
          alert.fixedBy = "auto";
          fixedCount++;
          break;
        }

        case "empty_answer": {
          for (const entryId of alert.entryIds) {
            await db.prisma.kBEntry.delete({ where: { id: entryId } });
            await deleteDocChunks(entryId);
          }
          alert.autoFixed = true;
          alert.fixedAt = new Date();
          alert.fixedBy = "auto";
          fixedCount++;
          break;
        }

        case "missing_keywords": {
          for (const entryId of alert.entryIds) {
            const entry = await db.prisma.kBEntry.findUnique({ where: { id: entryId } });
            if (entry) {
              const keywords = extractKeywordsFromQuestion(entry.question);
              await db.prisma.kBEntry.update({
                where: { id: entryId },
                data: { keywords: keywords.join(", ") },
              });
            }
          }
          alert.autoFixed = true;
          alert.fixedAt = new Date();
          alert.fixedBy = "auto";
          fixedCount++;
          break;
        }

        case "orphan_vector": {
          for (const docId of alert.entryIds) {
            await deleteDocChunks(docId);
          }
          alert.autoFixed = true;
          alert.fixedAt = new Date();
          alert.fixedBy = "auto";
          fixedCount++;
          break;
        }

        default:
          break;
      }
    } catch (err) {
      console.error(`[Quality] Auto-fix error for ${alert.type}:`, err);
    }
  }

  return fixedCount;
}

export async function runQualityCheck(clientId: string, autoFixEnabled = false): Promise<QualityReport> {
  const client = await db.prisma.client.findUnique({ where: { id: clientId } });
  if (!client) throw new Error("Client not found");

  const kbEntries = await db.prisma.kBEntry.findMany({ where: { clientId } });

  const allAlerts: QualityAlert[] = [];

  const duplicates = await findDuplicates(kbEntries);
  allAlerts.push(...duplicates);

  const obsolete = await findObsolete(kbEntries);
  allAlerts.push(...obsolete);

  const contradictions = await findContradictions(kbEntries);
  allAlerts.push(...contradictions);

  const emptyAnswers = await findEmptyAnswers(kbEntries);
  allAlerts.push(...emptyAnswers);

  const missingKeywords = await findMissingKeywords(kbEntries);
  allAlerts.push(...missingKeywords);

  const orphanVectors = await findOrphanVectors(clientId);
  allAlerts.push(...orphanVectors);

  let autoFixedCount = 0;
  if (autoFixEnabled) {
    autoFixedCount = await autoFix(allAlerts, clientId);
  }

  const manualReviewCount = allAlerts.filter((a) => !a.autoFixed).length;

  for (const alert of allAlerts) {
    try {
      await db.prisma.qualityAlert.create({
        data: {
          clientId,
          type: alert.type,
          severity: alert.severity,
          description: alert.description,
          entryIds: JSON.stringify(alert.entryIds),
          autoFixed: alert.autoFixed,
          fixedAt: alert.fixedAt || null,
          fixedBy: alert.fixedBy || null,
        },
      });
    } catch {
      // ignore save errors
    }
  }

  return {
    clientId,
    clientName: client.name,
    checkedAt: new Date(),
    summary: {
      total: kbEntries.length,
      duplicates: duplicates.length,
      obsolete: obsolete.length,
      contradictions: contradictions.length,
      emptyAnswers: emptyAnswers.length,
      missingKeywords: missingKeywords.length,
      orphanVectors: orphanVectors.length,
      ok: kbEntries.length - duplicates.length - emptyAnswers.length,
    },
    alerts: allAlerts,
    autoFixedCount,
    manualReviewCount,
  };
}

export function formatQualityReportMarkdown(report: QualityReport): string {
  let md = `🔍 Rapport de qualité — ${report.clientName}\n`;
  md += `Vérifié le : ${report.checkedAt.toLocaleDateString("fr-FR")}\n\n`;

  md += `📊 Résumé\n`;
  md += `• Total entrées : ${report.summary.total}\n`;
  md += `• ✅ OK : ${report.summary.ok}\n`;
  md += `• ⚠️ Doublons : ${report.summary.duplicates}\n`;
  md += `• ❌ Obsolètes : ${report.summary.obsolete}\n`;
  md += `• 🔄 Contradictions : ${report.summary.contradictions}\n`;
  md += `• 📝 Réponses vides : ${report.summary.emptyAnswers}\n`;
  md += `• 🔑 Mots-clés manquants : ${report.summary.missingKeywords}\n`;
  md += `• 🗑️ Vecteurs orphelins : ${report.summary.orphanVectors}\n\n`;

  if (report.autoFixedCount > 0) {
    md += `✅ Auto-corrigés : ${report.autoFixedCount}\n`;
  }
  if (report.manualReviewCount > 0) {
    md += `⚠️ À vérifier manuellement : ${report.manualReviewCount}\n`;
  }

  if (report.alerts.length > 0) {
    md += `\n📋 Détails\n`;
    for (const alert of report.alerts) {
      const icon = alert.autoFixed ? "✅" : alert.severity === "high" ? "❌" : "⚠️";
      md += `${icon} [${alert.type}] ${alert.description}\n`;
    }
  }

  return md;
}

export function formatQualityReportHTML(report: QualityReport): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #059669;">🔍 Rapport de qualité — ${report.clientName}</h1>
  <p style="color: #666;">Vérifié le : ${report.checkedAt.toLocaleDateString("fr-FR")}</p>

  <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; margin: 15px 0;">
    <h2 style="color: #059669; margin-top: 0;">📊 Résumé</h2>
    <ul>
      <li>Total entrées : <strong>${report.summary.total}</strong></li>
      <li>✅ OK : <strong>${report.summary.ok}</strong></li>
      <li>⚠️ Doublons : <strong>${report.summary.duplicates}</strong></li>
      <li>❌ Obsolètes : <strong>${report.summary.obsolete}</strong></li>
      <li>🔄 Contradictions : <strong>${report.summary.contradictions}</strong></li>
      <li>📝 Réponses vides : <strong>${report.summary.emptyAnswers}</strong></li>
      <li>🔑 Mots-clés manquants : <strong>${report.summary.missingKeywords}</strong></li>
      <li>🗑️ Vecteurs orphelins : <strong>${report.summary.orphanVectors}</strong></li>
    </ul>
  </div>

  ${report.autoFixedCount > 0 ? `
  <div style="background: #dcfce7; padding: 15px; border-radius: 8px; margin: 15px 0;">
    <h2 style="color: #16a34a; margin-top: 0;">✅ Auto-corrigés : ${report.autoFixedCount}</h2>
  </div>
  ` : ""}

  ${report.manualReviewCount > 0 ? `
  <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 15px 0;">
    <h2 style="color: #d97706; margin-top: 0;">⚠️ À vérifier manuellement : ${report.manualReviewCount}</h2>
  </div>
  ` : ""}

  ${report.alerts.length > 0 ? `
  <div style="background: #eff6ff; padding: 15px; border-radius: 8px; margin: 15px 0;">
    <h2 style="color: #2563eb; margin-top: 0;">📋 Détails</h2>
    <table style="width: 100%; border-collapse: collapse;">
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <th style="text-align: left; padding: 8px;">Type</th>
        <th style="text-align: left; padding: 8px;">Description</th>
        <th style="text-align: left; padding: 8px;">Statut</th>
      </tr>
      ${report.alerts.map((alert) => `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 8px;">${alert.type}</td>
        <td style="padding: 8px;">${alert.description.slice(0, 80)}...</td>
        <td style="padding: 8px;">${alert.autoFixed ? "✅ Corrigé" : alert.severity === "high" ? "❌ Critique" : "⚠️ À vérifier"}</td>
      </tr>
      `).join("")}
    </table>
  </div>
  ` : ""}

  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
  <p style="color: #9ca3af; font-size: 12px;">
    Généré automatiquement par Nova Chatbot — ${new Date().toLocaleString("fr-FR")}
  </p>
</body>
</html>`;
}
