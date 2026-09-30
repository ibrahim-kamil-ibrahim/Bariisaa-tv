-- AddEmail: stash the email/phone pending verification so the verify step
-- knows which address the OTP was sent to.
ALTER TABLE "users" ADD COLUMN "pendingEmail" TEXT;
ALTER TABLE "users" ADD COLUMN "pendingPhone" TEXT;
