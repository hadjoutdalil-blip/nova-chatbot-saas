import { db } from "./db";

export function detectProvider(key: string): { id: string; label: string } {
  if (key.startsWith("gsk_")) return { id: "groq", label: "Groq" };
  if (key.startsWith("csk_")) return { id: "cerebras", label: "Cerebras" };
  if (key.startsWith("xai-")) return { id: "xai", label: "xAI Grok" };
  if (key.startsWith("AIza")) return { id: "gemini", label: "Gemini" };
  return { id: "groq", label: "Groq" };
}

export async function selectApiKey(clientId: string, provider: string): Promise<{ id: string; key: string } | null> {
  const keys = await db.prisma.apiKey.findMany({
    where: { clientId, provider, isActive: true },
    orderBy: { priority: "asc" },
  });

  if (keys.length === 0) {
    const client = await db.prisma.client.findUnique({ where: { id: clientId } });
    if (client?.apiKey && detectProvider(client.apiKey).id === provider) {
      return { id: "deprecated", key: client.apiKey };
    }
    return null;
  }

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  for (const key of keys) {
    const reset = new Date(key.lastResetAt);
    if (reset.getMonth() !== currentMonth || reset.getFullYear() !== currentYear) {
      await db.prisma.apiKey.update({
        where: { id: key.id },
        data: { usedTokens: 0, lastResetAt: now },
      });
      key.usedTokens = 0;
    }
    if (key.monthlyLimit > 0 && key.usedTokens >= key.monthlyLimit) continue;
    return { id: key.id, key: key.key };
  }

  return null;
}

export async function trackKeyUsage(keyId: string, tokens: number) {
  if (!keyId || keyId === "deprecated") return;
  await db.prisma.apiKey.update({
    where: { id: keyId },
    data: { usedTokens: { increment: tokens } },
  });
}
