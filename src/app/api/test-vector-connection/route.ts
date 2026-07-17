import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/api-auth";

export async function POST(req: NextRequest) {
  const user = getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { hfApiKey, chromaUrl, chromaApiKey } = await req.json();

  const results: Record<string, { ok: boolean; error?: string }> = {};

  if (hfApiKey) {
    try {
      const res = await fetch("https://api-inference.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2", {
        method: "POST",
        headers: { Authorization: `Bearer ${hfApiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ inputs: ["test"] }),
      });
      if (res.ok) {
        results.huggingface = { ok: true };
      } else {
        const text = await res.text().catch(() => "");
        results.huggingface = { ok: false, error: `HTTP ${res.status}: ${text.slice(0, 200)}` };
      }
    } catch (err: any) {
      results.huggingface = { ok: false, error: err.message };
    }
  }

  if (chromaUrl && chromaApiKey) {
    try {
      const res = await fetch(`${chromaUrl}/api/v1/collections?name=nova_chunks`, {
        headers: { "X-Chroma-Token": chromaApiKey },
      });
      if (res.ok || res.status === 404) {
        results.chroma = { ok: true };
      } else {
        const text = await res.text().catch(() => "");
        results.chroma = { ok: false, error: `HTTP ${res.status}: ${text.slice(0, 200)}` };
      }
    } catch (err: any) {
      results.chroma = { ok: false, error: err.message };
    }
  }

  return NextResponse.json(results);
}
