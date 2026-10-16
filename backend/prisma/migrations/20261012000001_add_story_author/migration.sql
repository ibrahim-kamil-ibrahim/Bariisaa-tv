-- AlterTable
ALTER TABLE "stories" ADD COLUMN "authorId" TEXT;

-- CreateIndex
CREATE INDEX "stories_authorId_idx" ON "stories"("authorId");

-- AddForeignKey
ALTER TABLE "stories" ADD CONSTRAINT "stories_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "authors"("id") ON DELETE SET NULL ON UPDATE CASCADE;
