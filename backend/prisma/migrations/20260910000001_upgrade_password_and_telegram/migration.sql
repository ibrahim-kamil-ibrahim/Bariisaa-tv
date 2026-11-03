-- AddEmail/Pending fields for upgrade flow and Telegram bot integration
-- 2026-09-10

-- Link OTP requests to Telegram conversations for bot delivery
ALTER TABLE "otp_codes" ADD COLUMN IF NOT EXISTS "telegramChatId" TEXT;
ALTER TABLE "otp_codes" ADD COLUMN IF NOT EXISTS "hashedCode" TEXT;
ALTER TABLE "otp_codes" ADD COLUMN IF NOT EXISTS "requestId" TEXT;

-- Index for looking up pending OTPs by requestId (used by Telegram bot /start handler).
-- NOTE: the original predicate used NOW(), which PostgreSQL rejects because
-- index predicates must be IMMUTABLE. "usedAt" IS NULL is immutable and keeps
-- the index small; expiry is still checked by the query itself.
CREATE INDEX IF NOT EXISTS "idx_otp_request_id" ON "otp_codes"("requestId") WHERE "usedAt" IS NULL;

-- Index for faster idempotent upgrade password checks
CREATE INDEX IF NOT EXISTS "idx_users_password_hash" ON "users"("passwordHash") WHERE "passwordHash" IS NOT NULL;
