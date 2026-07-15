-- CreateTable
CREATE TABLE "SportsSourceReport" (
    "id" TEXT NOT NULL,
    "matchKey" TEXT NOT NULL,
    "sourceKey" TEXT NOT NULL,
    "providerName" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "country" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SportsSourceReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SportsSourceReport_matchKey_createdAt_idx" ON "SportsSourceReport"("matchKey", "createdAt");

-- CreateIndex
CREATE INDEX "SportsSourceReport_sourceKey_idx" ON "SportsSourceReport"("sourceKey");

-- CreateIndex
CREATE INDEX "SportsSourceReport_createdAt_idx" ON "SportsSourceReport"("createdAt");
