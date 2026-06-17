import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/api-auth";
import { unlink } from "fs/promises";
import { join } from "path";

export async function DELETE(req: NextRequest) {
  const user = getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const uploadDir = join(process.cwd(), "public", "uploads", "widget-icons");
  let deleted = false;
  for (const ext of ["png", "gif"]) {
    const p = join(uploadDir, `${user.clientId}.${ext}`);
    try { await unlink(p); deleted = true; } catch {}
  }

  return NextResponse.json({ deleted });
}
