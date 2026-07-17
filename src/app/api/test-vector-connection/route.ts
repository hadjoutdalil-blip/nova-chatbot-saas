import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/api-auth";

export async function POST(req: NextRequest) {
  const user = getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { jinaApiKey, chromaUrl, chromaApiKey } = await req.json();

  const results: Record<string, { ok: boolean; error?: string }> = {};

  if (jinaApiKey) {
    try {
      const res = await fetch("https://api.jina.ai/v1/embeddings", {
        method: "POST",
        headers: { Authorization: `Bearer ${jinaApiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "jina-embeddings-v3", input: ["test"] }),
      });
      if (res.ok) {
        results.jina = { ok: true };
      } else {
        const text = await res.text().catch(() => "");
        results.jina = { ok: false, error: `HTTP ${res.status}: ${text.slice(0, 200)}` };
      }
    } catch (err: any) {
      results.jina = { ok: false, error: err.message };
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
