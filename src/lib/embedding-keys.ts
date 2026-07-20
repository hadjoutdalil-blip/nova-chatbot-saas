import { db } from "./db";

export async function getActiveEmbeddingKey(clientId: string): Promise<{ id: string; key: string; provider: string } | null> {
  const entry = await db.prisma.embeddingKey.findFirst({
    where: { clientId, isActive: true },
    orderBy: { createdAt: "desc" },
    select: { id: true, key: true, provider: true },
  });
  return entry ?? null;
}

export async function trackEmbeddingUsage(keyId: string) {
  await db.prisma.embeddingKey.update({
    where: { id: keyId },
    data: { usageCount: { increment: 1 }, lastUsedAt: new Date() },
  }).catch(() => {});
}
