import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/api-auth";

const DEFAULTS: Record<string, string> = {
  defaultAiProvider: "groq",
  defaultAiModel: "openai/gpt-oss-20b",
  defaultKbThreshold: "60",
  defaultRelanceActive: "true",
};

export async function GET() {
  const rows = await db.read<any>("global_configs");
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

  const existing = await db.read<any>("global_configs");
  const updated = [...existing];

  for (const key of allowed) {
    if (body[key] === undefined) continue;
    const idx = updated.findIndex((r: any) => r.key === key);
    if (idx >= 0) {
      updated[idx] = { ...updated[idx], value: String(body[key]) };
    } else {
      const { randomUUID } = await import("crypto");
      updated.push({ id: randomUUID(), key, value: String(body[key]) });
    }
  }

  await db.write("global_configs", updated);
  const result: Record<string, string> = { ...DEFAULTS };
  for (const row of updated) {
    result[row.key] = row.value;
  }
  return NextResponse.json(result);
}
