import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/api-auth";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  const user = getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json();
  const clientId = body.clientId && user.role === "admin" ? body.clientId : user.clientId;
  const existing = await db.prisma.widgetConfig.findFirst({ where: { clientId } });

  if (existing) {
    const updated = await db.prisma.widgetConfig.update({
      where: { id: existing.id },
      data: {
        welcomeTitle: body.welcomeTitle ?? undefined,
        welcomeSub: body.welcomeSub ?? undefined,
        showBrand: body.showBrand ?? undefined,
        position: body.position ?? undefined,
        marginBottom: body.marginBottom ?? undefined,
        marginRight: body.marginRight ?? undefined,
        avatarIcon: body.avatarIcon ?? undefined,
        proactiveEnabled: body.proactiveEnabled === true,
        autoOpenDelay: body.autoOpenDelay ?? undefined,
        showNotification: body.showNotification ?? undefined,
        notificationText: body.notificationText ?? undefined,
        sendGreeting: body.sendGreeting ?? undefined,
        greetingMsg: body.greetingMsg ?? undefined,
        greetingMsg: body.greetingMsg ?? undefined,
        scrollTrigger: body.scrollTrigger ?? undefined,
        exitIntent: body.exitIntent ?? undefined,
        buttonAnimation: body.buttonAnimation ?? undefined,
        buttonLabel: body.buttonLabel ?? undefined,
        buttonLabelDuration: body.buttonLabelDuration ?? undefined,
        buttonIcon: body.buttonIcon ?? undefined,
        aiColor: body.aiColor ?? undefined,
      },
    });
    return NextResponse.json(updated);
  }

  const config = await db.prisma.widgetConfig.create({
    data: {
      id: randomUUID(),
      clientId,
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
      greetingMsg: body.greetingMsg || "",
      scrollTrigger: body.scrollTrigger ?? 0,
      exitIntent: body.exitIntent === true,
      buttonAnimation: body.buttonAnimation || "pulse",
      buttonLabel: body.buttonLabel || "",
      buttonLabelDuration: body.buttonLabelDuration ?? 8,
      buttonIcon: body.buttonIcon ?? "",
      aiColor: body.aiColor || "#7c3aed",
    },
  });
  return NextResponse.json(config, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const user = getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json();
  const clientId = body.clientId && user.role === "admin" ? body.clientId : user.clientId;
  const existing = await db.prisma.widgetConfig.findFirst({ where: { clientId } });

  if (!existing) {
    if (user.role !== "admin") return NextResponse.json({ error: "Configuration introuvable" }, { status: 404 });
    const config = await db.prisma.widgetConfig.create({
      data: {
        id: randomUUID(),
        clientId,
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
      greetingMsg: body.greetingMsg || "",
        scrollTrigger: body.scrollTrigger ?? 0,
        exitIntent: body.exitIntent === true,
        buttonAnimation: body.buttonAnimation || "pulse",
        buttonLabel: body.buttonLabel || "",
        buttonLabelDuration: body.buttonLabelDuration ?? 8,
        buttonIcon: body.buttonIcon ?? "",
        aiColor: body.aiColor || "#7c3aed",
      },
    });
    return NextResponse.json(config);
  }

  const updated = await db.prisma.widgetConfig.update({
    where: { id: existing.id },
    data: {
      welcomeTitle: body.welcomeTitle ?? undefined,
      welcomeSub: body.welcomeSub ?? undefined,
      showBrand: body.showBrand ?? undefined,
      position: body.position ?? undefined,
      marginBottom: body.marginBottom ?? undefined,
      marginRight: body.marginRight ?? undefined,
      avatarIcon: body.avatarIcon ?? undefined,
      proactiveEnabled: body.proactiveEnabled === true,
      autoOpenDelay: body.autoOpenDelay ?? undefined,
      showNotification: body.showNotification ?? undefined,
      notificationText: body.notificationText ?? undefined,
      sendGreeting: body.sendGreeting ?? undefined,
      scrollTrigger: body.scrollTrigger ?? undefined,
      exitIntent: body.exitIntent ?? undefined,
        buttonAnimation: body.buttonAnimation ?? undefined,
        buttonLabel: body.buttonLabel ?? undefined,
        buttonLabelDuration: body.buttonLabelDuration ?? undefined,
        buttonIcon: body.buttonIcon ?? undefined,
        aiColor: body.aiColor ?? undefined,
      },
    });
    return NextResponse.json(updated);
  }