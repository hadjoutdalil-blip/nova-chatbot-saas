import { NextRequest, NextResponse } from "next/server";
import { findClientBySlug } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const client = await findClientBySlug(slug);

  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  const configs = await db.read<any>("widget_configs");
  const widgetConfig = configs.find((w) => w.clientId === client.id) || null;
  const allEntries = await db.read<any>("kb_entries");
  const kbEntries = allEntries.filter((k) => k.clientId === client.id);

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
