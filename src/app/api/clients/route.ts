import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/api-auth";
import { randomUUID } from "crypto";

export async function GET(req: NextRequest) {
  const user = getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const clients = db.read<any>("clients");
  return NextResponse.json(clients);
}

export async function POST(req: NextRequest) {
  const user = getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json();
  if (!body.name || !body.slug) {
    return NextResponse.json({ error: "Nom et slug requis" }, { status: 400 });
  }

  const clients = db.read<any>("clients");
  if (clients.find((c) => c.slug === body.slug)) {
    return NextResponse.json({ error: "Ce slug est déjà utilisé" }, { status: 409 });
  }

  const client = {
    id: randomUUID(),
    name: body.name,
    slug: body.slug,
    subdomain: body.subdomain || body.slug,
    logo: body.logo || "",
    primaryColor: body.primaryColor || "#7c3aed",
    apiKey: body.apiKey || "",
    aiModel: body.aiModel || "llama-3.1-8b-instant",
    aiProvider: body.aiProvider || "groq",
    kbThreshold: body.kbThreshold ?? 60,
    relanceActive: body.relanceActive ?? true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  clients.push(client);
  db.write("clients", clients);
  return NextResponse.json(client, { status: 201 });
}
