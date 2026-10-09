-- CreateTable: upgrade_tokens (matches Prisma model UpgradeToken)
-- Guarded with IF NOT EXISTS: the table already exists on databases that were
-- synced with `prisma db push` before a migration was recorded for it.
CREATE TABLE IF NOT EXISTS "upgrade_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "chatId" TEXT,
    "hashedCode" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "upgrade_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "upgrade_tokens_requestId_key" ON "upgrade_tokens"("requestId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "upgrade_tokens_userId_idx" ON "upgrade_tokens"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "upgrade_tokens_requestId_idx" ON "upgrade_tokens"("requestId");

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'upgrade_tokens_userId_fkey'
  ) THEN
    ALTER TABLE "upgrade_tokens" ADD CONSTRAINT "upgrade_tokens_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
