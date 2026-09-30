// Add OTP code hashing and chat_id field support
-- The otp_codes.code column now stores SHA-256 hashes instead of plaintext.
-- The purpose field supports: login, phone_verification, email_verification,
--   password_reset, and custom request IDs used by the Telegram bot.

-- Add a chat_id column to OtpCode for Telegram bot linking
ALTER TABLE "otp_codes" ADD COLUMN "chatId" TEXT;
