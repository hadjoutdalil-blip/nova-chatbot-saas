import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/api-auth";
import { hashPassword } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authUser = getAuthUser(req);
  if (!authUser || authUser.role !== "admin") return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const allUsers = await db.read<any>("users");
  const idx = allUsers.findIndex((u: any) => u.id === id);
  if (idx === -1) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });

  const body = await req.json();

  if (body.email && body.email !== allUsers[idx].email) {
    if (allUsers.find((u: any) => u.email === body.email)) {
      return NextResponse.json({ error: "Cet email est déjà utilisé" }, { status: 409 });
    }
    allUsers[idx].email = body.email;
  }
  if (body.name) allUsers[idx].name = body.name;
  if (body.role) allUsers[idx].role = body.role === "admin" ? "admin" : "client";
  if (body.clientId) allUsers[idx].clientId = body.clientId;
  if (body.password) allUsers[idx].password = await hashPassword(body.password);

  await db.write("users", allUsers);

  const { password: _, ...safe } = allUsers[idx];
  return NextResponse.json(safe);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authUser = getAuthUser(req);
  if (!authUser || authUser.role !== "admin") return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  let allUsers = await db.read<any>("users");
  const exists = allUsers.find((u: any) => u.id === id);
  if (!exists) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });

  allUsers = allUsers.filter((u: any) => u.id !== id);
  await db.write("users", allUsers);
  return NextResponse.json({ message: "Utilisateur supprimé" });
}
