import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { saveFile } from "@/lib/storage";

const ALLOWED = ["png", "jpg", "jpeg", "webp", "gif"];
const MIME: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
};

export async function POST(req: NextRequest) {
  const user = getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const clientId = (formData.get("clientId") as string) || user.clientId;

  if (!file) return NextResponse.json({ error: "Fichier requis" }, { status: 400 });
  if (file.size > 2 * 1024 * 1024) {
    return NextResponse.json({ error: "Image trop volumineuse (max 2 Mo)" }, { status: 400 });
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  if (!ALLOWED.includes(ext)) {
    return NextResponse.json({ error: "Formats acceptés : PNG, JPG, WEBP, GIF" }, { status: 400 });
  }

  const client = await db.prisma.client.findUnique({ where: { id: clientId } });
  if (!client) return NextResponse.json({ error: "Client introuvable" }, { status: 404 });
  if (client.id !== user.clientId && user.role !== "admin") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const fileName = `product_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;

  let url = "";
  try {
    const saved = await saveFile(client.slug, "images", fileName, buffer);
    url = saved.url || "";
  } catch (err) {
    /* Vercel Blob non configuré (BLOB_READ_WRITE_TOKEN absent) → fallback base de données */
    console.error("saveFile échoué, fallback ProductImage :", err);
  }

  if (!url) {
    await db.prisma.productImage.create({
      data: {
        slug: client.slug,
        filename: fileName,
        mime: MIME[ext] || "image/png",
        data: buffer,
        size: buffer.length,
      },
    });
    const proto = req.headers.get("x-forwarded-proto") || "http";
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "localhost:3000";
    url = `${proto}://${host}/api/catalog-images/${client.slug}/${fileName}`;
  }

  return NextResponse.json({ url });
}
