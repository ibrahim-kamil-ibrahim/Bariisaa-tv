-- CreateEnum: content access tier (FREE = open, PAID = subscription-gated)
CREATE TYPE "AccessTier" AS ENUM ('FREE', 'PAID');

-- AlterTable: books
ALTER TABLE "books" ADD COLUMN "accessTier" "AccessTier" NOT NULL DEFAULT 'FREE',
ADD COLUMN "requiredPlanId" TEXT;

-- AlterTable: stories
ALTER TABLE "stories" ADD COLUMN "accessTier" "AccessTier" NOT NULL DEFAULT 'FREE',
ADD COLUMN "requiredPlanId" TEXT;

-- AlterTable: music_tracks
ALTER TABLE "music_tracks" ADD COLUMN "accessTier" "AccessTier" NOT NULL DEFAULT 'FREE',
ADD COLUMN "requiredPlanId" TEXT;

-- Backfill: existing premium books become PAID; all other existing content stays FREE
UPDATE "books" SET "accessTier" = 'PAID' WHERE "isPremium" = true;

-- CreateIndex
CREATE INDEX "books_accessTier_idx" ON "books"("accessTier");

-- CreateIndex
CREATE INDEX "stories_accessTier_idx" ON "stories"("accessTier");

-- CreateIndex
CREATE INDEX "music_tracks_accessTier_idx" ON "music_tracks"("accessTier");

-- AddForeignKey
ALTER TABLE "books" ADD CONSTRAINT "books_requiredPlanId_fkey" FOREIGN KEY ("requiredPlanId") REFERENCES "subscription_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stories" ADD CONSTRAINT "stories_requiredPlanId_fkey" FOREIGN KEY ("requiredPlanId") REFERENCES "subscription_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "music_tracks" ADD CONSTRAINT "music_tracks_requiredPlanId_fkey" FOREIGN KEY ("requiredPlanId") REFERENCES "subscription_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;
