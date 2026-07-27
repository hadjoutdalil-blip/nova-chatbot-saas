import { NextRequest, NextResponse } from "next/server";
import { findClientBySlug } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const client = await findClientBySlug(slug);
  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  const [proposals, kbEntries] = await Promise.all([
    db.prisma.publicProposal.findMany({
      where: { clientId: client.id },
      orderBy: { createdAt: "desc" },
    }),
    db.prisma.kBEntry.findMany({
      where: { clientId: client.id },
      select: { category: true },
      distinct: ["category"],
    }),
  ]);

  const themes = [...new Set(kbEntries.map((k) => k.category).filter(Boolean))].sort();

  return NextResponse.json({
    client: { name: client.name, logo: client.logo, primaryColor: client.primaryColor },
    proposals,
    themes,
  });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const client = await findClientBySlug(slug);
  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  const { question, answer, theme, submitter } = await req.json();
  if (!question || typeof question !== "string" || question.trim().length === 0) {
    return NextResponse.json({ error: "Question requise" }, { status: 400 });
  }

  const proposal = await db.prisma.publicProposal.create({
    data: {
      clientId: client.id,
      question: question.trim(),
      answer: answer?.trim() || "",
      theme: theme?.trim() || "",
      submitter: submitter?.trim() || "",
      status: "pending",
    },
  });

  return NextResponse.json({ proposal }, { status: 201 });
}
