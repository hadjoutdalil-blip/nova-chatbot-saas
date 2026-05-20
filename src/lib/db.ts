import { PrismaClient } from "@prisma/client";
import { PrismaNeonHttp } from "@prisma/adapter-neon";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL!;
  const adapter = new PrismaNeonHttp(connectionString, {});
  return new PrismaClient({ adapter });
}

const prisma = globalForPrisma.prisma ?? createPrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

function getDelegate(collection: string) {
  const map: Record<string, keyof typeof prisma> = {
    clients: "client",
    users: "user",
    widget_configs: "widgetConfig",
    kb_entries: "kBEntry",
    conversations: "conversation",
  };
  const key = map[collection];
  if (!key) throw new Error(`Unknown collection: ${collection}`);
  return (prisma as any)[key];
}

async function read<T>(collection: string): Promise<T[]> {
  const delegate = getDelegate(collection);
  return (await delegate.findMany()) as T[];
}

async function write<T extends { id: string }>(collection: string, data: T[]) {
  const delegate = getDelegate(collection);
  const existing = await delegate.findMany({ select: { id: true } }) as { id: string }[];
  const oldIds = new Set(existing.map((r) => r.id));
  const newIds = new Set(data.map((r) => r.id));

  const toDelete = [...oldIds].filter((id) => !newIds.has(id));
  if (toDelete.length > 0) {
    await delegate.deleteMany({ where: { id: { in: toDelete } } });
  }

  for (const row of data) {
    await delegate.upsert({
      where: { id: row.id },
      create: row,
      update: row,
    });
  }
}

export const db = {
  read,
  write,
  prisma,
};
