-- ============================================================================
-- Repair script: admin login HTTP 500 (Prisma P2022: users.username)
-- ============================================================================
-- Symptom:
--   POST /api/v1/auth/login -> 500 {"success":false,"message":"Internal server error"}
--   Backend log: PrismaClientKnownRequestError P2022
--   "The column `users.username` does not exist in the current database."
--
-- Cause:
--   `username` exists in prisma/schema.prisma but was never added by a
--   migration, so databases built with `prisma migrate deploy` are missing it.
--   Prisma selects every scalar column on `prisma.user.*` queries.
--
-- This script is idempotent and safe to run on production. It does not touch
-- data, and it works even when the `_prisma_migrations` table is in a failed
-- state (which would block `prisma migrate deploy`).
--
-- Run (from backend/):
--   npx prisma db execute --file prisma/repair_login_schema.sql --schema prisma/schema.prisma
--
-- Or with psql:
--   psql "$DATABASE_URL" -f prisma/repair_login_schema.sql
-- ============================================================================

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "username" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "users_username_key" ON "users"("username");

-- Unrelated but blocking: the 2026-09-10 migration used NOW() in an index
-- predicate, which PostgreSQL rejects (predicates must be IMMUTABLE). That
-- makes `prisma migrate deploy` fail before newer migrations can run.
CREATE INDEX IF NOT EXISTS "idx_otp_request_id"
  ON "otp_codes"("requestId")
  WHERE "usedAt" IS NULL;

-- Verification (expect one row: users.username | text)
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'username';
