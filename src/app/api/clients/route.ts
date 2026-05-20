import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/api-auth";
import { randomUUID } from "crypto";
import { PLAN_KB_TEMPLATES } from "@/lib/plans";

export async function GET(req: NextRequest) {
  const user = getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const clients = await db.read<any>("clients");
  return NextResponse.json(clients);
}

export async function POST(req: NextRequest) {
  const user = getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json();
  if (!body.name || !body.slug) {
    return NextResponse.json({ error: "Nom et slug requis" }, { status: 400 });
  }

  const clients = await db.read<any>("clients");
  if (clients.find((c) => c.slug === body.slug)) {
    return NextResponse.json({ error: "Ce slug est déjà utilisé" }, { status: 409 });
  }

  const plan = body.plan || "custom";

  const configs = await db.read<any>("global_configs");
  const def = (key: string, fallback: string) => {
    const row = configs.find((c: any) => c.key === key);
    return row?.value ?? fallback;
  };

  const client = {
    id: randomUUID(),
    name: body.name,
    slug: body.slug,
    plan,
    subdomain: body.subdomain || body.slug,
    logo: body.logo || "",
    primaryColor: body.primaryColor || "#7c3aed",
    apiKey: body.apiKey || "",
    aiModel: body.aiModel || def("defaultAiModel", "llama-3.1-8b-instant"),
    aiProvider: body.aiProvider || def("defaultAiProvider", "groq"),
    kbThreshold: body.kbThreshold ?? +def("defaultKbThreshold", "60"),
    relanceActive: body.relanceActive ?? def("defaultRelanceActive", "true") === "true",
    siteContext: body.siteContext || "",
    relanceText: body.relanceText || "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  clients.push(client);
  await db.write("clients", clients);

  const templates = PLAN_KB_TEMPLATES[plan];
  if (templates && templates.length > 0) {
    const entries = await db.read<any>("kb_entries");
    const newEntries = templates.map((t) => ({
      id: randomUUID(),
      question: t.question,
      answer: t.answer,
      category: t.category,
      keywords: t.keywords,
      clientId: client.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
    await db.write("kb_entries", [...entries, ...newEntries]);
  }

  return NextResponse.json(client, { status: 201 });
}
