import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/api-auth";
import { runQualityCheck, formatQualityReportMarkdown, formatQualityReportHTML } from "@/lib/quality-checker";

function verifyImportKey(req: NextRequest): boolean {
  const key = req.headers.get("x-import-key");
  return key === process.env.IMPORT_API_KEY;
}

export async function POST(req: NextRequest) {
  const user = getAuthUser(req);
  const isImportAuth = verifyImportKey(req);

  if (!user && !isImportAuth) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const clientId = body.clientId || user?.clientId;
  const autoFix = body.autoFix === true;

  if (!clientId) {
    return NextResponse.json({ error: "clientId requis" }, { status: 400 });
  }

  if (user && user.role !== "admin" && clientId !== user.clientId) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  try {
    const report = await runQualityCheck(clientId, autoFix);
    return NextResponse.json(report);
  } catch (err: any) {
    console.error("[Quality Check] Error:", err);
    return NextResponse.json({ error: err.message || "Erreur contrôle qualité" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const user = getAuthUser(req);
  const isImportAuth = verifyImportKey(req);

  if (!user && !isImportAuth) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const url = new URL(req.url);
  const clientId = url.searchParams.get("clientId") || user?.clientId;
  const autoFix = url.searchParams.get("autoFix") === "true";
  const format = url.searchParams.get("format") || "json";

  if (!clientId) {
    return NextResponse.json({ error: "clientId requis" }, { status: 400 });
  }

  if (user && user.role !== "admin" && clientId !== user.clientId) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  try {
    const report = await runQualityCheck(clientId, autoFix);

    if (format === "markdown") {
      return new NextResponse(formatQualityReportMarkdown(report), {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    if (format === "html") {
      return new NextResponse(formatQualityReportHTML(report), {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    return NextResponse.json(report);
  } catch (err: any) {
    console.error("[Quality Check] Error:", err);
    return NextResponse.json({ error: err.message || "Erreur contrôle qualité" }, { status: 500 });
  }
}
