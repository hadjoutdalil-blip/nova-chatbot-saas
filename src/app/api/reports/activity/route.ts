import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/api-auth";
import { generateReport, formatReportMarkdown, formatReportHTML } from "@/lib/report-generator";

function verifyImportKey(req: NextRequest): boolean {
  const key = req.headers.get("x-import-key");
  return key === process.env.IMPORT_API_KEY;
}

export async function GET(req: NextRequest) {
  const user = getAuthUser(req);
  const isImportAuth = verifyImportKey(req);

  if (!user && !isImportAuth) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const url = new URL(req.url);
  const clientId = url.searchParams.get("clientId") || user?.clientId;
  const periodType = (url.searchParams.get("type") || "week") as "week" | "month";
  const period = url.searchParams.get("period") || undefined;
  const format = url.searchParams.get("format") || "json";

  if (!clientId) {
    return NextResponse.json({ error: "clientId requis" }, { status: 400 });
  }

  if (user && user.role !== "admin" && clientId !== user.clientId) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  try {
    const report = await generateReport(clientId, periodType, period);

    if (format === "markdown") {
      return new NextResponse(formatReportMarkdown(report), {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    if (format === "html") {
      return new NextResponse(formatReportHTML(report), {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    return NextResponse.json(report);
  } catch (err: any) {
    console.error("[Report] Error:", err);
    return NextResponse.json({ error: err.message || "Erreur génération rapport" }, { status: 500 });
  }
}
