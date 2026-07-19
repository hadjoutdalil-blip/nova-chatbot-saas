import { NextResponse } from "next/server";

export async function GET() {
  const apiKey = process.env.NOMIC_API_KEY || process.env.hfApiKey || "";
  if (!apiKey) return NextResponse.json({ warmed: false, reason: "no Nomic key" });

  try {
    const res = await fetch("https://api-atlas.nomic.ai/v1/embedding/text", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "nomic-embed-text-v1.5", texts: ["warmup"] }),
    });
    return NextResponse.json({ warmed: res.ok, status: res.status });
  } catch (err: any) {
    return NextResponse.json({ warmed: false, error: err.message });
  }
}
