-- AlterTable
ALTER TABLE "VideoProvider" ADD COLUMN     "lastChecked" TIMESTAMP(3),
ADD COLUMN     "lastResponseTime" INTEGER,
ADD COLUMN     "lastStatus" TEXT;
