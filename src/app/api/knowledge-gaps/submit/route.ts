import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/api-auth";
import { submitExpertResponse } from "@/lib/knowledge-gap";

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
  const { gapId, expertResponse } = body;

  if (!gapId || !expertResponse) {
    return NextResponse.json({ error: "gapId et expertResponse requis" }, { status: 400 });
  }

  try {
    const result = await submitExpertResponse({
      gapId,
      expertResponse,
      reviewedBy: user?.userId || "api",
    });

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("[Knowledge Gap Submit] Error:", err);
    return NextResponse.json({ error: err.message || "Erreur soumission" }, { status: 500 });
  }
}
