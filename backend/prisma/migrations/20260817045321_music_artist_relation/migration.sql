-- AlterTable
ALTER TABLE "music_tracks" ADD COLUMN     "artistId" TEXT;

-- CreateIndex
CREATE INDEX "music_tracks_artistId_idx" ON "music_tracks"("artistId");

-- AddForeignKey
ALTER TABLE "music_tracks" ADD CONSTRAINT "music_tracks_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "authors"("id") ON DELETE SET NULL ON UPDATE CASCADE;
