import { NextRequest, NextResponse } from "next/server";
import { findClientBySlug } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const client = await findClientBySlug(slug);

  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  const widgetConfig = await db.prisma.widgetConfig.findFirst({ where: { clientId: client.id } });
  const kbEntries = await db.prisma.kBEntry.findMany({ where: { clientId: client.id } });

  return NextResponse.json({
    name: client.name,
    logo: client.logo,
    primaryColor: client.primaryColor,
    kbThreshold: client.kbThreshold,
    relanceActive: client.relanceActive,
    siteContext: client.siteContext,
    relanceText: client.relanceText,
    widgetConfig,
    kb: kbEntries.map((k: any) => ({ question: k.question, answer: k.answer, category: k.category, keywords: k.keywords })),
  });
}
