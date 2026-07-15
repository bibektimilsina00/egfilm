-- CreateTable
CREATE TABLE "SportsProviderConfig" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "baseUrl" TEXT,
    "apiKey" TEXT,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "lastChecked" TIMESTAMP(3),
    "lastResponseTime" INTEGER,
    "lastStatus" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SportsProviderConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SportsProviderConfig_name_key" ON "SportsProviderConfig"("name");

-- CreateIndex
CREATE INDEX "SportsProviderConfig_isEnabled_sortOrder_idx" ON "SportsProviderConfig"("isEnabled", "sortOrder");

-- Seed default rows for existing hardcoded providers + new esportex + dlhd (disabled until key set)
INSERT INTO "SportsProviderConfig" ("id", "kind", "name", "baseUrl", "isEnabled", "sortOrder", "createdAt", "updatedAt") VALUES
    ('spc_sportsrc', 'sportsrc', 'sportsrc', 'https://api.sportsrc.org', true, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('spc_streamed_pk', 'streamed', 'streamed.pk', 'https://streamed.pk', true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('spc_streamed_st', 'streamed', 'streamed.st', 'https://streamed.st', true, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('spc_esportex', 'esportex', 'esportex', 'https://api.esportex.site', true, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('spc_dlhd', 'dlhd', 'dlhd', 'https://dlhd.st', false, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("name") DO NOTHING;
