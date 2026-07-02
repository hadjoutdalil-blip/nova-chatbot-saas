import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const doc = await db.prisma.clientDocument.findUnique({ where: { id } });
  if (!doc || doc.status === "archived") {
    return NextResponse.json({ error: "Document introuvable" }, { status: 404 });
  }

  const filename = doc.originalName || "document.txt";
  const contentType = doc.mimeType || "text/plain";

  return new NextResponse(doc.content, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": String(doc.content?.length || 0),
    },
  });
}
