import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/api-auth";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  const user = getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json();
  const configs = db.read<any>("widget_configs");

  const config = {
    id: randomUUID(),
    welcomeTitle: body.welcomeTitle || "Bienvenue !",
    welcomeSub: body.welcomeSub || "",
    showBrand: body.showBrand ?? true,
    position: body.position || "right",
    marginBottom: body.marginBottom ?? 20,
    marginRight: body.marginRight ?? 20,
    avatarIcon: body.avatarIcon || "robot",
    clientId: user.clientId,
  };

  configs.push(config);
  db.write("widget_configs", configs);
  return NextResponse.json(config, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const user = getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json();
  const configs = db.read<any>("widget_configs");
  const idx = configs.findIndex((w) => w.clientId === user.clientId);
  if (idx === -1) return NextResponse.json({ error: "Configuration introuvable" }, { status: 404 });

  configs[idx] = {
    ...configs[idx],
    welcomeTitle: body.welcomeTitle ?? configs[idx].welcomeTitle,
    welcomeSub: body.welcomeSub ?? configs[idx].welcomeSub,
    showBrand: body.showBrand ?? configs[idx].showBrand,
    position: body.position ?? configs[idx].position,
    marginBottom: body.marginBottom ?? configs[idx].marginBottom,
    marginRight: body.marginRight ?? configs[idx].marginRight,
    avatarIcon: body.avatarIcon ?? configs[idx].avatarIcon,
  };

  db.write("widget_configs", configs);
  return NextResponse.json(configs[idx]);
}
