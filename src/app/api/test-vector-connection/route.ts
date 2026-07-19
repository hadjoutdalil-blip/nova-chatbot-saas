import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/api-auth";

async function testCohere(apiKey: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch("https://api.cohere.ai/v1/embed", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ texts: ["test"], model: "embed-english-light-v3.0", input_type: "search_document" }),
    });
    if (res.ok) return { ok: true };
    const text = await res.text().catch(() => "");
    return { ok: false, error: `HTTP ${res.status}: ${text.slice(0, 200)}` };
  } catch (err: any) {
    return { ok: false, error: err.message };
  }
}

async function testNomic(apiKey: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch("https://api-atlas.nomic.ai/v1/embedding/text", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "nomic-embed-text-v1.5", texts: ["test"] }),
    });
    if (res.ok) return { ok: true };
    const text = await res.text().catch(() => "");
    return { ok: false, error: `HTTP ${res.status}: ${text.slice(0, 200)}` };
  } catch (err: any) {
    return { ok: false, error: err.message };
  }
}

export async function POST(req: NextRequest) {
  const user = getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { hfApiKey } = await req.json();
  const results: Record<string, { ok: boolean; error?: string }> = {};

  if (hfApiKey) {
    results.cohere = await testCohere(hfApiKey);
    results.nomic = await testNomic(hfApiKey);
  }

  return NextResponse.json(results);
}
