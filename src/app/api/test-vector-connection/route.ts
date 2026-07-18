import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/api-auth";

export async function POST(req: NextRequest) {
  const user = getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { hfApiKey } = await req.json();

  const results: Record<string, { ok: boolean; error?: string }> = {};

  if (hfApiKey) {
    try {
      const res = await fetch("https://api.cohere.ai/v1/embed", {
        method: "POST",
        headers: { Authorization: `Bearer ${hfApiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ texts: ["test"], model: "embed-english-light-v3.0", input_type: "search_document" }),
      });
      if (res.ok) {
        results.embedding = { ok: true };
      } else {
        const text = await res.text().catch(() => "");
        results.embedding = { ok: false, error: `HTTP ${res.status}: ${text.slice(0, 200)}` };
      }
    } catch (err: any) {
      results.embedding = { ok: false, error: err.message };
    }
  }

  return NextResponse.json(results);
}
