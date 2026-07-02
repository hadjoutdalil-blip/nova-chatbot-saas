import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/api-auth";
import { randomUUID } from "crypto";
import { PLAN_KB_TEMPLATES } from "@/lib/plans";

export async function GET(req: NextRequest) {
  const user = getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const clients = await db.prisma.client.findMany();
  return NextResponse.json(clients);
}

export async function POST(req: NextRequest) {
  const user = getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json();
  if (!body.name || !body.slug) {
    return NextResponse.json({ error: "Nom et slug requis" }, { status: 400 });
  }

  const existing = await db.prisma.client.findUnique({ where: { slug: body.slug } });
  if (existing) {
    return NextResponse.json({ error: "Ce slug est déjà utilisé" }, { status: 409 });
  }

  const globalConfigs = await db.prisma.globalConfig.findMany();
  const def = (key: string, fallback: string) => {
    const row = globalConfigs.find((c) => c.key === key);
    return row?.value ?? fallback;
  };

  const plan = body.plan || "custom";

  const client = await db.prisma.client.create({
    data: {
      id: randomUUID(),
      name: body.name,
      slug: body.slug,
      plan,
      subdomain: body.subdomain || body.slug,
      logo: body.logo || "",
      primaryColor: body.primaryColor || "#7c3aed",
      apiKey: body.apiKey || "",
      aiModel: body.aiModel || def("defaultAiModel", "openai/gpt-oss-20b"),
      aiProvider: body.aiProvider || def("defaultAiProvider", "groq"),
      kbThreshold: body.kbThreshold ?? +def("defaultKbThreshold", "60"),
      relanceActive: body.relanceActive ?? def("defaultRelanceActive", "true") === "true",
      siteContext: body.siteContext || "",
      relanceText: body.relanceText || "",
    },
  });

  const templates = PLAN_KB_TEMPLATES[plan];
  if (templates && templates.length > 0) {
    await db.prisma.kBEntry.createMany({
      data: templates.map((t) => ({
        id: randomUUID(),
        question: t.question,
        answer: t.answer,
        category: t.category,
        keywords: t.keywords,
        clientId: client.id,
      })),
    });
  }

  return NextResponse.json(client, { status: 201 });
}
