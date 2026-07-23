import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/api-auth";
import { scanLocalImport } from "@/lib/file-watcher";
import { db } from "@/lib/db";

function verifyImportKey(req: NextRequest): boolean {
  const key = req.headers.get("x-import-key");
  return key === process.env.IMPORT_API_KEY;
}

export async function GET(req: NextRequest) {
  const user = getAuthUser(req);
  const isImportAuth = verifyImportKey(req);

  if (!user && !isImportAuth) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const url = new URL(req.url);
  const clientId = url.searchParams.get("clientId") || user?.clientId;
  if (!clientId) return NextResponse.json({ error: "clientId requis" }, { status: 400 });

  if (user && user.role !== "admin" && clientId !== user.clientId) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const client = await db.prisma.client.findUnique({ where: { id: clientId } });
  if (!client) return NextResponse.json({ error: "Client introuvable" }, { status: 404 });

  const result = await scanLocalImport(clientId, client.slug);
  return NextResponse.json(result);
}
