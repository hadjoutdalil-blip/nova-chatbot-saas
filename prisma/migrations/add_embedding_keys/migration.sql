CREATE TABLE "EmbeddingKey" (
    id TEXT PRIMARY KEY,
    "clientId" TEXT NOT NULL REFERENCES "Client"(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    label TEXT NOT NULL DEFAULT '',
    key TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Copy existing hfApiKey values as active keys
INSERT INTO "EmbeddingKey" (id, "clientId", provider, label, key, "isActive")
SELECT gen_random_uuid()::text, id, COALESCE("embeddingProvider", 'cohere'), 'Clé principale', "hfApiKey", true
FROM "Client"
WHERE "hfApiKey" IS NOT NULL AND "hfApiKey" != '';
