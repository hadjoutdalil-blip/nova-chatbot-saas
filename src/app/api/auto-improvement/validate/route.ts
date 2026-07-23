import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/api-auth";

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

  const body = await req.json();
  const { proposalId, action } = body;
  if (!proposalId || !["approve", "reject"].includes(action)) {
    return NextResponse.json({ error: "proposalId and action (approve|reject) required" }, { status: 400 });
  }

  const proposal = await db.prisma.pendingKBEntry.findUnique({ where: { id: proposalId } });
  if (!proposal) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (action === "approve") {
    await db.prisma.kBEntry.create({
      data: {
        id: `kb_auto_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        clientId: proposal.clientId,
        question: proposal.question,
        answer: proposal.answer,
        keywords: proposal.keywords,
        category: "auto_improved",
        source: "auto_improvement",
      },
    });
  }

  await db.prisma.pendingKBEntry.update({
    where: { id: proposalId },
    data: { status: action === "approve" ? "approved" : "rejected" },
  });

  return NextResponse.json({ ok: true, action });
}
