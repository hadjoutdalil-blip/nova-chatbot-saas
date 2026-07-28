import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/api-auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const client = await db.prisma.client.findUnique({ where: { id } });
  if (!client) return NextResponse.json({ error: "Client introuvable" }, { status: 404 });

  const proposals = await db.prisma.publicProposal.findMany({
    where: { clientId: id },
    orderBy: { createdAt: "desc" },
  });

  const total = proposals.length;
  const answered = proposals.filter((p: any) => p.answer).length;
  const pending = proposals.filter((p: any) => p.status === "pending").length;
  const approved = proposals.filter((p: any) => p.status === "approved").length;
  const themeCounts: Record<string, number> = {};
  proposals.forEach((p: any) => { const t = p.theme || "Sans thème"; themeCounts[t] = (themeCounts[t] || 0) + 1; });

  const kbCategories = await db.prisma.kBEntry.findMany({
    where: { clientId: id },
    select: { category: true },
    distinct: ["category"],
  });
  const themes = [...new Set(kbCategories.map((k: any) => k.category).filter(Boolean))].sort();

  return NextResponse.json({
    proposals,
    stats: { total, answered, pending, approved, themeCounts },
    themes,
  });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const client = await db.prisma.client.findUnique({ where: { id } });
  if (!client) return NextResponse.json({ error: "Client introuvable" }, { status: 404 });

  const { action, proposalId, status, answer, confidence, question, theme, submitter } = await req.json();

  if (action === "update" && proposalId) {
    const data: any = {};
    if (status !== undefined) data.status = status;
    if (answer !== undefined) data.answer = answer;
    if (confidence !== undefined) data.confidence = confidence;
    if (question !== undefined) data.question = question;
    if (theme !== undefined) data.theme = theme;
    if (submitter !== undefined) data.submitter = submitter;
    const updated = await db.prisma.publicProposal.update({ where: { id: proposalId }, data });
    return NextResponse.json({ proposal: updated });
  }

  if (action === "convert-to-kb" && proposalId) {
    const proposal = await db.prisma.publicProposal.findUnique({ where: { id: proposalId } });
    if (!proposal) return NextResponse.json({ error: "Proposition introuvable" }, { status: 404 });
    if (!proposal.answer) return NextResponse.json({ error: "Cette proposition n'a pas de réponse" }, { status: 400 });

    const kbEntry = await db.prisma.kBEntry.create({
      data: {
        question: proposal.question,
        answer: proposal.answer,
        category: proposal.theme || "",
        keywords: "",
        clientId: id,
        priority: Math.round(proposal.confidence) || 5,
      },
    });

    await db.prisma.publicProposal.update({ where: { id: proposalId }, data: { status: "approved" } });

    return NextResponse.json({ kbEntry });
  }

  if (action === "delete" && proposalId) {
    await db.prisma.publicProposal.delete({ where: { id: proposalId } });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Action invalide" }, { status: 400 });
}
