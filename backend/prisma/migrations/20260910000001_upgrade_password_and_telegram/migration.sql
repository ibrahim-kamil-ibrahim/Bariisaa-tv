-- AddEmail/Pending fields for upgrade flow and Telegram bot integration
-- 2026-09-10

-- Link OTP requests to Telegram conversations for bot delivery
ALTER TABLE "otp_codes" ADD COLUMN "telegramChatId" TEXT;
ALTER TABLE "otp_codes" ADD COLUMN "hashedCode" TEXT;
ALTER TABLE "otp_codes" ADD COLUMN "requestId" TEXT;

-- Index for looking up pending OTPs by requestId (used by Telegram bot /start handler)
CREATE INDEX "idx_otp_request_id" ON "otp_codes"("requestId") WHERE "usedAt" IS NULL AND "expiresAt" > NOW();

-- Index for faster idempotent upgrade password checks
CREATE INDEX IF NOT EXISTS "idx_users_password_hash" ON "users"("passwordHash") WHERE "passwordHash" IS NOT NULL;
