import { NextRequest, NextResponse } from "next/server";

const PROVIDERS: Record<string, { endpoint: string; model: string }> = {
  groq: { endpoint: "https://api.groq.com/openai/v1/chat/completions", model: "llama-3.1-8b-instant" },
  cerebras: { endpoint: "https://api.cerebras.ai/v1/chat/completions", model: "llama3.1-8b" },
  xai: { endpoint: "https://api.x.ai/v1/chat/completions", model: "grok-2-latest" },
};

function detectProvider(key: string): string {
  if (key.startsWith("csk_")) return "cerebras";
  if (key.startsWith("xai-")) return "xai";
  return "groq";
}

export async function POST(req: NextRequest) {
  const { apiKey } = await req.json();
  if (!apiKey) {
    return NextResponse.json({ valid: false, error: "Clé API requise" }, { status: 400 });
  }

  const prov = detectProvider(apiKey);
  const config = PROVIDERS[prov];
  if (!config) {
    return NextResponse.json({ valid: false, error: "Fournisseur non reconnu" });
  }

  try {
    const resp = await fetch(config.endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: config.model,
        messages: [{ role: "user", content: "Réponds OK" }],
        max_tokens: 10,
      }),
    });

    if (resp.ok) {
      return NextResponse.json({ valid: true, provider: prov });
    }

    const data = await resp.json();
    return NextResponse.json({
      valid: false,
      error: data.error?.message || `Erreur ${resp.status}`,
    });
  } catch (err: any) {
    return NextResponse.json({ valid: false, error: err.message });
  }
}
