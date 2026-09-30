-- AlterTable
ALTER TABLE "media_files" ADD COLUMN     "bookId" TEXT,
ADD COLUMN     "durationSeconds" INTEGER,
ADD COLUMN     "processingStatus" TEXT NOT NULL DEFAULT 'READY',
ADD COLUMN     "storageKey" TEXT,
ADD COLUMN     "storageProvider" TEXT NOT NULL DEFAULT 'LOCAL',
ADD COLUMN     "thumbnailKey" TEXT,
ADD COLUMN     "uploadStatus" TEXT NOT NULL DEFAULT 'COMPLETED',
ADD COLUMN     "uploadedAt" TIMESTAMP(3),
ADD COLUMN     "visibility" TEXT NOT NULL DEFAULT 'PUBLIC';

-- CreateIndex
CREATE INDEX "media_files_bookId_idx" ON "media_files"("bookId");

-- CreateIndex
CREATE INDEX "media_files_uploadStatus_idx" ON "media_files"("uploadStatus");
