import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { analyzeConversations, generateProposals, getStats } from "@/lib/auto-improvement";
import { getAuthUser } from "@/lib/api-auth";

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

  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get("clientId");
  if (!clientId) return NextResponse.json({ error: "clientId required" }, { status: 400 });

  const stats = await getStats(clientId);
  const proposals = await db.prisma.pendingKBEntry.findMany({
    where: { clientId, source: "auto_improvement" },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ stats, proposals });
}

export async function POST(req: NextRequest) {
  const user = getAuthUser(req);
  const isImportAuth = verifyImportKey(req);

  if (!user && !isImportAuth) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const body = await req.json();
  const { clientId, days = 30, minOccurrences = 3 } = body;
  if (!clientId) return NextResponse.json({ error: "clientId required" }, { status: 400 });

  const patterns = await analyzeConversations(clientId, { days, minOccurrences });
  const proposals = await generateProposals(clientId, patterns);

  return NextResponse.json({
    analyzed: patterns.length,
    proposals: proposals.length,
    patterns,
    newProposals: proposals,
  });
}
