-- Add User.username, which exists in prisma/schema.prisma but was never
-- created by a migration. Every `prisma.user.*` query selects this column,
-- so on a database built with `prisma migrate deploy` the admin login failed
-- with Prisma P2022 ("column users.username does not exist") -> HTTP 500.
--
-- Idempotent so it is safe on databases that were previously synced with
-- `prisma db push` and therefore already have the column.

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "username" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "users_username_key" ON "users"("username");
