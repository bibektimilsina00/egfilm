-- Sports (eglive) — additive columns + indexes only. Zero downtime.

ALTER TABLE "WatchlistItem"
  ADD COLUMN "sport" TEXT,
  ADD COLUMN "league" TEXT,
  ADD COLUMN "matchExternalId" TEXT,
  ADD COLUMN "kickoffAt" TIMESTAMP(3);

CREATE INDEX "WatchlistItem_sport_idx" ON "WatchlistItem"("sport");

ALTER TABLE "ContinueWatching"
  ADD COLUMN "sport" TEXT,
  ADD COLUMN "league" TEXT,
  ADD COLUMN "matchExternalId" TEXT,
  ADD COLUMN "kickoffAt" TIMESTAMP(3);

CREATE INDEX "ContinueWatching_sport_idx" ON "ContinueWatching"("sport");

ALTER TABLE "WatchRoom"
  ADD COLUMN "sport" TEXT,
  ADD COLUMN "league" TEXT,
  ADD COLUMN "matchExternalId" TEXT,
  ADD COLUMN "kickoffAt" TIMESTAMP(3);

CREATE INDEX "WatchRoom_sport_idx" ON "WatchRoom"("sport");

ALTER TABLE "Notification"
  ADD COLUMN "sport" TEXT,
  ADD COLUMN "matchExternalId" TEXT;
