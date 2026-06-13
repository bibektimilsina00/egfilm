-- AlterTable
ALTER TABLE "BlogPost" ADD COLUMN     "articleType" TEXT NOT NULL DEFAULT 'BlogPosting',
ADD COLUMN     "canonicalUrl" TEXT,
ADD COLUMN     "customCss" TEXT,
ADD COLUMN     "customJs" TEXT,
ADD COLUMN     "isSponsored" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "priority" TEXT NOT NULL DEFAULT 'normal',
ADD COLUMN     "robotsMeta" TEXT NOT NULL DEFAULT 'index,follow',
ADD COLUMN     "schemaMarkup" TEXT,
ADD COLUMN     "socialMediaPreview" JSONB,
ADD COLUMN     "sponsorInfo" TEXT,
ADD COLUMN     "twitterCardType" TEXT NOT NULL DEFAULT 'summary_large_image';

-- CreateTable
CREATE TABLE "VideoProvider" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "baseUrl" TEXT NOT NULL,
    "quality" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "movieTemplate" TEXT NOT NULL,
    "tvTemplate" TEXT NOT NULL,
    "supportsImdb" BOOLEAN NOT NULL DEFAULT false,
    "supportsTmdb" BOOLEAN NOT NULL DEFAULT true,
    "hasMultiQuality" BOOLEAN NOT NULL DEFAULT true,
    "hasSubtitles" BOOLEAN NOT NULL DEFAULT true,
    "hasAutoplay" BOOLEAN NOT NULL DEFAULT false,
    "requiresAuth" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "logoUrl" TEXT,
    "homepage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VideoProvider_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VideoProvider_name_key" ON "VideoProvider"("name");

-- CreateIndex
CREATE UNIQUE INDEX "VideoProvider_slug_key" ON "VideoProvider"("slug");

-- CreateIndex
CREATE INDEX "VideoProvider_isEnabled_sortOrder_idx" ON "VideoProvider"("isEnabled", "sortOrder");

-- CreateIndex
CREATE INDEX "VideoProvider_isDefault_idx" ON "VideoProvider"("isDefault");
