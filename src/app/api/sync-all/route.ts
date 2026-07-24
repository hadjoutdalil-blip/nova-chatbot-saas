import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/api-auth";

function verifyImportKey(req: NextRequest): boolean {
  return req.headers.get("x-import-key") === process.env.IMPORT_API_KEY;
}

async function webImportForClient(clientId: string, url: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/web-import`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-import-key": process.env.IMPORT_API_KEY || "" },
    body: JSON.stringify({ clientId, url, scrapeDocs: true, mode: "upsert" }),
  });
  return res.json();
}

async function localImportForClient(clientId: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/local-import`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-import-key": process.env.IMPORT_API_KEY || "" },
    body: JSON.stringify({ clientId }),
  });
  return res.json();
}

export async function POST(req: NextRequest) {
  const user = getAuthUser(req);
  const isImportAuth = verifyImportKey(req);
  if (!user && !isImportAuth) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const targetClientId = body.clientId;

  const clients = await db.prisma.client.findMany({
    select: { id: true, name: true, slug: true, siteContext: true },
  });

  const results: any[] = [];

  for (const client of clients) {
    if (targetClientId && client.id !== targetClientId) continue;

    const clientResult: any = { clientId: client.id, name: client.name, slug: client.slug, web: null, local: null, errors: [] };

    if (client.siteContext) {
      try {
        clientResult.web = await webImportForClient(client.id, client.siteContext);
      } catch (err: any) {
        clientResult.errors.push(`web-import: ${err.message}`);
      }
    }

    try {
      clientResult.local = await localImportForClient(client.id);
    } catch (err: any) {
      clientResult.errors.push(`local-import: ${err.message}`);
    }

    results.push(clientResult);
  }

  return NextResponse.json({ ok: true, clients: results.length, results });
}
