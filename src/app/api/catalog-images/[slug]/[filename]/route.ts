import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { db } from "@/lib/db";

const MIME: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
};

/* Sert les images de catalogue.
   - Fallback base de données (ProductImage) : fonctionne partout (local, Vercel, VM)
     sans dépendance à Vercel Blob.
   - Fallback fichiers (data/images/<slug>) : environnement local / VM uniquement
     (legacy). Sur Vercel le filesystem n'est pas persistant → seule la base compte. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string; filename: string }> }) {
  const { slug, filename } = await params;
  if (!/^[\w.-]+$/.test(filename) || !/^[\w-]+$/.test(slug)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const ext = filename.split(".").pop()?.toLowerCase() || "";
  const mime = MIME[ext];
  if (!mime) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const image = await db.prisma.productImage.findFirst({ where: { slug, filename } });
  if (image) {
    return new NextResponse(Buffer.from(image.data), {
      headers: { "Content-Type": image.mime || mime, "Cache-Control": "public, max-age=86400" },
    });
  }

  if (!process.env.VERCEL) {
    try {
      const filePath = path.join(process.cwd(), "data", "images", slug, filename);
      const data = await fs.readFile(filePath);
      return new NextResponse(data, { headers: { "Content-Type": mime, "Cache-Control": "public, max-age=86400" } });
    } catch {
      /* fichier local absent → 404 ci-dessous */
    }
  }

  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
