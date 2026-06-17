import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/api-auth";
import { randomUUID } from "crypto";

function getTargetClientId(req: NextRequest, user: { userId: string; clientId: string; role: string }): string {
  const url = new URL(req.url);
  const param = url.searchParams.get("clientId");
  if (param && user.role === "admin") return param;
  return user.clientId;
}

export async function POST(req: NextRequest) {
  const user = getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json();
  const clientId = body.clientId && user.role === "admin" ? body.clientId : user.clientId;
  const configs = await db.read<any>("widget_configs");
  const existing = configs.find((w: any) => w.clientId === clientId);

  if (existing) {
    Object.assign(existing, {
      welcomeTitle: body.welcomeTitle || "Bienvenue !",
      welcomeSub: body.welcomeSub || "",
      showBrand: body.showBrand ?? true,
      position: body.position || "right",
      marginBottom: body.marginBottom ?? 20,
      marginRight: body.marginRight ?? 20,
      avatarIcon: body.avatarIcon || "robot",
      proactiveEnabled: body.proactiveEnabled === true,
      autoOpenDelay: body.autoOpenDelay ?? 5,
      showNotification: body.showNotification !== false,
      notificationText: body.notificationText || "",
      sendGreeting: body.sendGreeting === true,
      scrollTrigger: body.scrollTrigger ?? 0,
      exitIntent: body.exitIntent === true,
      buttonAnimation: body.buttonAnimation || "pulse",
      buttonLabel: body.buttonLabel || "",
      buttonLabelDuration: body.buttonLabelDuration ?? 8,
      buttonIcon: body.buttonIcon ?? "",
    });
    await db.write("widget_configs", configs);
    return NextResponse.json(existing);
  }

  const config = {
    id: randomUUID(),
    welcomeTitle: body.welcomeTitle || "Bienvenue !",
    welcomeSub: body.welcomeSub || "",
    showBrand: body.showBrand ?? true,
    position: body.position || "right",
    marginBottom: body.marginBottom ?? 20,
    marginRight: body.marginRight ?? 20,
    avatarIcon: body.avatarIcon || "robot",
    proactiveEnabled: body.proactiveEnabled === true,
    autoOpenDelay: body.autoOpenDelay ?? 5,
    showNotification: body.showNotification !== false,
    notificationText: body.notificationText || "",
    sendGreeting: body.sendGreeting === true,
    scrollTrigger: body.scrollTrigger ?? 0,
    exitIntent: body.exitIntent === true,
    buttonAnimation: body.buttonAnimation || "pulse",
    buttonLabel: body.buttonLabel || "",
    buttonLabelDuration: body.buttonLabelDuration ?? 8,
    buttonIcon: body.buttonIcon ?? "",
    clientId,
  };

  configs.push(config);
  await db.write("widget_configs", configs);
  return NextResponse.json(config, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const user = getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json();
  const clientId = body.clientId && user.role === "admin" ? body.clientId : user.clientId;
  const configs = await db.read<any>("widget_configs");
  const idx = configs.findIndex((w) => w.clientId === clientId);

  if (idx === -1) {
    if (user.role !== "admin") return NextResponse.json({ error: "Configuration introuvable" }, { status: 404 });
    const config = {
      id: randomUUID(),
      welcomeTitle: body.welcomeTitle || "Bienvenue !",
      welcomeSub: body.welcomeSub || "",
      showBrand: body.showBrand ?? true,
      position: body.position || "right",
      marginBottom: body.marginBottom ?? 20,
      marginRight: body.marginRight ?? 20,
      avatarIcon: body.avatarIcon || "robot",
      proactiveEnabled: body.proactiveEnabled === true,
      autoOpenDelay: body.autoOpenDelay ?? 5,
      showNotification: body.showNotification !== false,
      notificationText: body.notificationText || "",
      sendGreeting: body.sendGreeting === true,
      scrollTrigger: body.scrollTrigger ?? 0,
      exitIntent: body.exitIntent === true,
      buttonAnimation: body.buttonAnimation || "pulse",
      buttonLabel: body.buttonLabel || "",
      buttonLabelDuration: body.buttonLabelDuration ?? 8,
      buttonIcon: body.buttonIcon ?? "",
      clientId,
    };
    configs.push(config);
    return NextResponse.json(config);
  }

  configs[idx] = {
    ...configs[idx],
    welcomeTitle: body.welcomeTitle ?? configs[idx].welcomeTitle,
    welcomeSub: body.welcomeSub ?? configs[idx].welcomeSub,
    showBrand: body.showBrand ?? configs[idx].showBrand,
    position: body.position ?? configs[idx].position,
    marginBottom: body.marginBottom ?? configs[idx].marginBottom,
    marginRight: body.marginRight ?? configs[idx].marginRight,
    avatarIcon: body.avatarIcon ?? configs[idx].avatarIcon,
    proactiveEnabled: body.proactiveEnabled === true,
    autoOpenDelay: body.autoOpenDelay ?? configs[idx].autoOpenDelay ?? 5,
    showNotification: body.showNotification !== false,
    notificationText: body.notificationText ?? configs[idx].notificationText ?? "",
    sendGreeting: body.sendGreeting === true,
    scrollTrigger: body.scrollTrigger ?? configs[idx].scrollTrigger ?? 0,
    exitIntent: body.exitIntent === true,
    buttonAnimation: body.buttonAnimation ?? configs[idx].buttonAnimation ?? "pulse",
    buttonLabel: body.buttonLabel ?? configs[idx].buttonLabel ?? "",
    buttonLabelDuration: body.buttonLabelDuration ?? configs[idx].buttonLabelDuration ?? 8,
    buttonIcon: body.buttonIcon ?? configs[idx].buttonIcon ?? "",
  };

  await db.write("widget_configs", configs);
  return NextResponse.json(configs[idx]);
}
