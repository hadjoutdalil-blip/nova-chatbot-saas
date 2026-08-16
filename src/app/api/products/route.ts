import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/api-auth";
import { randomUUID } from "crypto";
import { autoIndexProduct } from "@/lib/vector-store";

function getTargetClientId(req: NextRequest, user: { userId: string; clientId: string; role: string }): string {
  const url = new URL(req.url);
  const param = url.searchParams.get("clientId");
  if (param && user.role === "admin") return param;
  return user.clientId;
}

export async function GET(req: NextRequest) {
  const user = getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const clientId = getTargetClientId(req, user);
  const products = await db.prisma.product.findMany({
    where: { clientId },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });
  return NextResponse.json(products);
}

export async function POST(req: NextRequest) {
  const user = getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json();
  if (!body.name?.trim()) {
    return NextResponse.json({ error: "Nom du produit requis" }, { status: 400 });
  }

  const clientId = body.clientId && user.role === "admin" ? body.clientId : user.clientId;

  const product = await db.prisma.product.create({
    data: {
      id: randomUUID(),
      clientId,
      name: body.name.trim(),
      description: body.description || "",
      price: body.price || "",
      category: body.category || "",
      keywords: body.keywords || "",
      imageUrl: body.imageUrl || "",
      badge: body.badge || "",
      active: body.active !== false,
      sortOrder: body.sortOrder ?? 0,
    },
  });

  /* Indexation vectorielle automatique pour le RAG (fire-and-forget) */
  autoIndexProduct(clientId, product).catch(() => {});

  return NextResponse.json(product, { status: 201 });
}
