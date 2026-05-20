import { NextRequest, NextResponse } from "next/server";

const PROVIDERS: Record<string, string> = {
  groq: "https://api.groq.com/openai/v1/chat/completions",
  cerebras: "https://api.cerebras.ai/v1/chat/completions",
};

export async function POST(req: NextRequest) {
  const { apiKey, provider } = await req.json();
  if (!apiKey) {
    return NextResponse.json({ valid: false, error: "Clé API requise" }, { status: 400 });
  }

  const prov = provider === "cerebras" ? "cerebras" : "groq";
  const endpoint = PROVIDERS[prov];

  try {
    const resp = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: prov === "cerebras" ? "llama3.1-8b" : "llama-3.1-8b-instant",
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
