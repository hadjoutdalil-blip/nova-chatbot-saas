import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/api-auth";
import { validatePendingEntry } from "@/lib/knowledge-gap";

function verifyImportKey(req: NextRequest): boolean {
  const key = req.headers.get("x-import-key");
  return key === process.env.IMPORT_API_KEY;
}

export async function POST(req: NextRequest) {
  const user = getAuthUser(req);
  const isImportAuth = verifyImportKey(req);

  if (!user && !isImportAuth) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const body = await req.json();
  const { pendingId, action } = body;

  if (!pendingId || !action) {
    return NextResponse.json({ error: "pendingId et action requis" }, { status: 400 });
  }

  if (action !== "approve" && action !== "reject") {
    return NextResponse.json({ error: "action doit être 'approve' ou 'reject'" }, { status: 400 });
  }

  try {
    const result = await validatePendingEntry({
      pendingId,
      action,
      reviewedBy: user?.userId || "api",
    });

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("[Knowledge Gap Validate] Error:", err);
    return NextResponse.json({ error: err.message || "Erreur validation" }, { status: 500 });
  }
}
