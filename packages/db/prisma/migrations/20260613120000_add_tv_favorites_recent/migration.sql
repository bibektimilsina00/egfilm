-- EGTV (live TV) — favorites + recently-watched. Additive, zero downtime.

-- CreateTable
CREATE TABLE "TvFavorite" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logo" TEXT,
    "country" TEXT,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TvFavorite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TvRecent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logo" TEXT,
    "country" TEXT,
    "watchedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TvRecent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TvFavorite_userId_idx" ON "TvFavorite"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TvFavorite_userId_channelId_key" ON "TvFavorite"("userId", "channelId");

-- CreateIndex
CREATE INDEX "TvRecent_userId_idx" ON "TvRecent"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TvRecent_userId_channelId_key" ON "TvRecent"("userId", "channelId");

-- AddForeignKey
ALTER TABLE "TvFavorite" ADD CONSTRAINT "TvFavorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TvRecent" ADD CONSTRAINT "TvRecent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
