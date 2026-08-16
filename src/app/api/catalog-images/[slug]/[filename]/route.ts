import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const MIME: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
};

/* Sert les images de catalogue en environnement LOCAL (dossier data/images/<slug>).
   En production, les images sont stockées sur Vercel Blob (URL publique) — cette route
   n'est donc pas utilisée ; elle renvoie 404 pour éviter toute fuite d'un chemin local. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string; filename: string }> }) {
  if (process.env.VERCEL) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { slug, filename } = await params;
  if (!/^[\w.-]+$/.test(filename) || !/^[\w-]+$/.test(slug)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const ext = filename.split(".").pop()?.toLowerCase() || "";
  const mime = MIME[ext];
  if (!mime) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    const filePath = path.join(process.cwd(), "data", "images", slug, filename);
    const data = await fs.readFile(filePath);
    return new NextResponse(data, { headers: { "Content-Type": mime, "Cache-Control": "public, max-age=86400" } });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
