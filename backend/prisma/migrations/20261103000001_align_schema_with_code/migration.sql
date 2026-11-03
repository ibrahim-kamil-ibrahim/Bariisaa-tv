-- Align database with schema.prisma.
-- These datamodel changes were made without a migration (schema drift),
-- discovered and applied manually on 2026-11-03. All statements are
-- idempotent so re-running (e.g. prisma migrate deploy) is safe.

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'SubscriptionStatus' AND e.enumlabel = 'PENDING'
  ) THEN
    ALTER TYPE "SubscriptionStatus" ADD VALUE 'PENDING';
  END IF;
END $$;

ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "iconEmoji" TEXT;
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "route" TEXT;
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "sortOrder" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "music_tracks" ADD COLUMN IF NOT EXISTS "pdfUrl" TEXT;
ALTER TABLE "music_tracks" ADD COLUMN IF NOT EXISTS "price" DOUBLE PRECISION NOT NULL DEFAULT 0;
