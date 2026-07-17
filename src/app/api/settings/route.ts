import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/api-auth";
import { randomUUID } from "crypto";

const DEFAULTS: Record<string, string> = {
  defaultAiProvider: "groq",
  defaultAiModel: "openai/gpt-oss-20b",
  defaultKbThreshold: "60",
  defaultRelanceActive: "true",
  hfApiKey: "",
  chromaUrl: "",
  chromaApiKey: "",
};

export async function GET() {
  const rows = await db.prisma.globalConfig.findMany();
  const config: Record<string, string> = { ...DEFAULTS };
  for (const row of rows) {
    config[row.key] = row.value;
  }
  return NextResponse.json(config);
}

export async function PUT(req: NextRequest) {
  const user = getAuthUser(req);
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const body = await req.json();
  const allowed = Object.keys(DEFAULTS);

  for (const key of allowed) {
    if (body[key] === undefined) continue;
    const existing = await db.prisma.globalConfig.findUnique({ where: { key } });
    await db.prisma.globalConfig.upsert({
      where: { key },
      create: { id: randomUUID(), key, value: String(body[key]) },
      update: { value: String(body[key]) },
    });
  }

  const config: Record<string, string> = { ...DEFAULTS };
  const rows = await db.prisma.globalConfig.findMany();
  for (const row of rows) {
    config[row.key] = row.value;
  }
  return NextResponse.json(config);
}
