import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/api-auth";
import { hashPassword } from "@/lib/auth";
import { randomUUID } from "crypto";

export async function GET(req: NextRequest) {
  const user = getAuthUser(req);
  if (!user || user.role !== "admin") return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const [allUsers, allClients] = await Promise.all([
    db.prisma.user.findMany(),
    db.prisma.client.findMany(),
  ]);
  const clientMap = new Map(allClients.map((c) => [c.id, c.name]));

  const result = allUsers.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    clientId: u.clientId,
    clientName: clientMap.get(u.clientId) || "—",
  }));

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const authUser = getAuthUser(req);
  if (!authUser || authUser.role !== "admin") return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json();
  if (!body.email || !body.password || !body.name || !body.clientId) {
    return NextResponse.json({ error: "Email, mot de passe, nom et client requis" }, { status: 400 });
  }

  const existing = await db.prisma.user.findUnique({ where: { email: body.email } });
  if (existing) {
    return NextResponse.json({ error: "Cet email est déjà utilisé" }, { status: 409 });
  }

  const hashed = await hashPassword(body.password);
  const newUser = await db.prisma.user.create({
    data: {
      id: randomUUID(),
      email: body.email,
      password: hashed,
      name: body.name,
      role: body.role === "admin" ? "admin" : "client",
      clientId: body.clientId,
    },
  });

  const { password: _, ...safe } = newUser;
  return NextResponse.json(safe, { status: 201 });
}
