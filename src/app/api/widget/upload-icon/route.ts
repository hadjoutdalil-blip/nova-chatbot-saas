import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/api-auth";
import { writeFile, unlink, mkdir } from "fs/promises";
import { join } from "path";

export async function POST(req: NextRequest) {
  const user = getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const targetClientId = req.nextUrl.searchParams.get("clientId") || user.clientId;
  if (user.role !== "admin" && targetClientId !== user.clientId) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "Fichier requis" }, { status: 400 });

  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext !== "png" && ext !== "gif") {
    return NextResponse.json({ error: "Seuls les fichiers PNG et GIF sont acceptés" }, { status: 400 });
  }
  if (file.size > 2 * 1024 * 1024) {
    return NextResponse.json({ error: "Fichier trop volumineux (max 2 Mo)" }, { status: 400 });
  }

  const uploadDir = join(process.cwd(), "public", "uploads", "widget-icons");
  await mkdir(uploadDir, { recursive: true });

  const oldPaths = ["png", "gif"].map((e) => join(uploadDir, `${targetClientId}.${e}`));
  for (const p of oldPaths) {
    try { await unlink(p); } catch {}
  }

  const fileName = `${targetClientId}.${ext}`;
  const filePath = join(uploadDir, fileName);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, buffer);

  const url = `/uploads/widget-icons/${fileName}`;
  return NextResponse.json({ url });
}
