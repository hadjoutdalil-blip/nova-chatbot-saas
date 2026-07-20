import { db } from "./db";

export async function getActiveEmbeddingKey(clientId: string): Promise<{ key: string; provider: string } | null> {
  const entry = await db.prisma.embeddingKey.findFirst({
    where: { clientId, isActive: true },
    orderBy: { createdAt: "desc" },
    select: { key: true, provider: true },
  });
  return entry ?? null;
}
