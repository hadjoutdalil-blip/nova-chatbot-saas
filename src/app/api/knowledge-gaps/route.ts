import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/api-auth";
import { getPendingGaps, getPendingEntries, getGapStats, formatGapReportMarkdown } from "@/lib/knowledge-gap";

function verifyImportKey(req: NextRequest): boolean {
  const key = req.headers.get("x-import-key");
  return key === process.env.IMPORT_API_KEY;
}

function getTargetClientId(req: NextRequest, user: { userId: string; clientId: string; role: string }): string {
  const url = new URL(req.url);
  const param = url.searchParams.get("clientId");
  if (param && user.role === "admin") return param;
  return user.clientId;
}

export async function GET(req: NextRequest) {
  const user = getAuthUser(req);
  const isImportAuth = verifyImportKey(req);

  if (!user && !isImportAuth) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const url = new URL(req.url);
  const clientId = url.searchParams.get("clientId") || user?.clientId;
  const type = url.searchParams.get("type") || "gaps";
  const format = url.searchParams.get("format") || "json";

  if (!clientId) {
    return NextResponse.json({ error: "clientId requis" }, { status: 400 });
  }

  if (user && user.role !== "admin" && clientId !== user.clientId) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  try {
    if (type === "stats") {
      const stats = await getGapStats(clientId);

      if (format === "markdown") {
        const { db } = await import("@/lib/db");
        const client = await db.prisma.client.findUnique({ where: { id: clientId } });
        return new NextResponse(formatGapReportMarkdown(stats, client?.name || "Client"), {
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        });
      }

      return NextResponse.json(stats);
    }

    if (type === "entries") {
      const entries = await getPendingEntries(clientId);
      return NextResponse.json(entries);
    }

    const gaps = await getPendingGaps(clientId);
    return NextResponse.json(gaps);
  } catch (err: any) {
    console.error("[Knowledge Gaps] Error:", err);
    return NextResponse.json({ error: err.message || "Erreur" }, { status: 500 });
  }
}
