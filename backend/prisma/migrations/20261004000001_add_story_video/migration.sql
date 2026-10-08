-- Attach an optional video (MediaFile, type='video') to a Story.
-- 2026-10-04

-- AlterTable: stories
ALTER TABLE "stories" ADD COLUMN "videoId" TEXT;

-- AlterTable: media_files (reverse link, used for the R2 object-key scope)
ALTER TABLE "media_files" ADD COLUMN "storyId" TEXT;

-- CreateIndex
CREATE INDEX "media_files_storyId_idx" ON "media_files"("storyId");
