import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/api-auth";
import { list, del } from "@vercel/blob";

export async function DELETE(req: NextRequest) {
  const user = getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const targetClientId = req.nextUrl.searchParams.get("clientId") || user.clientId;
  if (user.role !== "admin" && targetClientId !== user.clientId) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  let deleted = false;
  const { blobs } = await list({ prefix: `widget-icons/${targetClientId}.` });
  for (const blob of blobs) {
    await del(blob.url);
    deleted = true;
  }

  return NextResponse.json({ deleted });
}
