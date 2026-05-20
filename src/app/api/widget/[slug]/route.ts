import { NextRequest, NextResponse } from "next/server";
import { findClientBySlug } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const client = findClientBySlug(slug);

  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  const widgetConfig = db.read<any>("widget_configs").find((w) => w.clientId === client.id) || null;
  const kbEntries = db.read<any>("kb_entries").filter((k) => k.clientId === client.id);

  return NextResponse.json({
    name: client.name,
    logo: client.logo,
    primaryColor: client.primaryColor,
    apiKey: client.apiKey,
    aiModel: client.aiModel,
    aiProvider: client.aiProvider,
    kbThreshold: client.kbThreshold,
    relanceActive: client.relanceActive,
    widgetConfig,
    kb: kbEntries.map((k: any) => ({ question: k.question, answer: k.answer, category: k.category, keywords: k.keywords })),
  });
}
