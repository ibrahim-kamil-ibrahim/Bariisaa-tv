# Bariisaa Tv Backend

Node.js / Express / TypeScript / Prisma / PostgreSQL API for the Bariisaa Tv
Audio Book & E-Book Platform. Serves the Flutter mobile app and the React admin
panel under a single `/api/v1` prefix.

## Tech Stack

- **Runtime:** Node.js 18+ (TypeScript, compiled to `dist/`)
- **Framework:** Express 4
- **ORM:** Prisma 5 (`@prisma/client`) over PostgreSQL
- **Validation:** Zod
- **Auth:** JWT (access + refresh rotation), Google ID-token (`google-auth-library`), OTP (email/SMS), PKCE OAuth2
- **Uploads:** multer → S3 (AWS SDK) with signed URLs + local fallback
- **Payments:** Stripe, Chapa, Telebirr
- **Push:** Firebase Admin (FCM)
- **Email/SMS:** nodemailer, Africa's Talking / Twilio
- **Docs:** Swagger (`swagger-jsdoc`)
- **Logging/security:** winston, helmet, cors, express-rate-limit, compression

## Prerequisites

- Node.js 18+
- PostgreSQL (database `naik_db`)
- npm

## Setup

```bash
cd backend
npm install
cp .env.example .env      # then fill in real values
npx prisma generate
npx prisma migrate dev     # create tables from schema
npm run prisma:seed        # optional: seed data
```

## Run

```bash
npm run dev                # watch mode (PowerShell dev script)
npm run build && npm start # compiled production mode
```

> **Compiled mode has no auto-reload.** After editing `src/`, run `npm run build`
> then restart the server for changes to take effect.

Health check: `GET /health` or `GET /api/v1/health` → `{ status: "ok" }`.

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Dev server with reload |
| `npm run build` | Compile TypeScript → `dist/` |
| `npm start` | Run compiled `dist/server.js` |
| `npm run prisma:generate` | Regenerate Prisma client |
| `npm run prisma:migrate` | Create/apply a dev migration |
| `npm run prisma:migrate:prod` | Apply migrations in production |
| `npm run prisma:seed` | Seed the database |
| `npm run prisma:studio` | Open Prisma Studio |
| `npm run lint` | ESLint on `src/` |
| `npm test` | Jest with coverage |
| `npm run swagger` | Generate Swagger spec |

## Environment Variables

See `.env.example`. Key groups:

| Group | Variables |
|-------|-----------|
| Server | `NODE_ENV`, `PORT` (3000), `API_PREFIX` (`/api/v1`) |
| Database | `DATABASE_URL` |
| JWT | `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `JWT_ACCESS_EXPIRES_IN` (15m), `JWT_REFRESH_EXPIRES_IN` (30d) |
| CORS | `CORS_ORIGIN` (comma-separated origins) |
| Storage | `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_SIGNED_URL_EXPIRY` |
| Push | `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` |
| Email | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` |
| SMS | `AT_API_KEY`, `AT_USERNAME`, `AT_FROM` |
| Payments | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `TELEBIRR_*`, `CHAPA_*` |
| Rate limit | `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX_REQUESTS`, `AUTH_RATE_LIMIT_MAX`, `MAX_LOGIN_ATTEMPTS`, `LOGIN_LOCKOUT_MINUTES` |
| Encryption | `ENCRYPTION_KEY`, `ENCRYPTION_IV_LENGTH` |
| Google OAuth | `GOOGLE_CLIENT_IDS` (comma-separated Web/Android/iOS client IDs) |

> `GOOGLE_CLIENT_IDS` must contain the **same client IDs** the mobile/admin apps
> request tokens with. A mismatch returns `Invalid Google ID token`.

## Authentication

Native JWT auth — no browser redirects. All endpoints are under `/api/v1/auth`
unless noted.

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/auth/signup/email` | Email signup (legacy single-step) |
| `POST` | `/auth/signup/phone` | Phone signup |
| `POST` | `/auth/signup/send-otp` | **Step 1** — send signup OTP |
| `POST` | `/auth/signup/verify-otp` | **Step 2** — verify OTP → signup token |
| `POST` | `/auth/signup/complete` | **Step 3** — create account → tokens |
| `POST` | `/auth/login` | Email/password login |
| `POST` | `/auth/login/send-otp` | Send login OTP |
| `POST` | `/auth/login/otp` | OTP login |
| `POST` | `/auth/google` | Exchange Google `idToken` → tokens |
| `POST` | `/auth/refresh-token` | `{refreshToken}` → new `{accessToken, refreshToken}` |
| `POST` | `/auth/logout` | Revoke refresh token |
| `GET` | `/auth/verify-email` | Email verification link |
| `POST` | `/auth/forgot-password` | Request password reset |
| `POST` | `/auth/reset-password` | Reset password |
| `POST` | `/auth/resend-email-verification` | Resend (auth required) |

Current-user profile lives at `GET /api/v1/users/profile` (bearer token).

The **mobile 3-step signup** flow is: `signup/send-otp` → `signup/verify-otp`
(returns a signup token) → `signup/complete` (password + name + dynamic profile
fields → access/refresh tokens).

## API Modules

All under `/api/v1/…`. Grouped:

- **Auth & identity** — `auth`, `users`, `oauth`, `roles`, `permissions`, `devices`
- **Content** — `books`, `categories`, `authors`, `storytelling`, `music`, `my-doctor`, `my-captain`, `habits`
- **Reader engagement** — `bookmarks`, `notes`, `highlights`, `favorites`, `reviews`, `history`, `recommendations`
- **Monetization** — `subscriptions`, `payments`, `coupons`, `invoices`
- **Notifications** — `notifications`
- **Admin / ops** — `cms`, `media`, `themes`, `screen-themes`, `signup-fields`, `settings`, `security`, `system-logs`, `audit-logs`, `backups`, `reports`, `report-builder`, `global-search` (`search`), `saved-filters` (`filters`), `bulk-actions` (`bulk`), `activity-timeline` (`activity`), `user-detail`, `ai`, `live-monitoring` (`live`), `messaging` (`messages`)

## Data Models

~75 Prisma models in `prisma/schema.prisma`. Core: `User`, `Role`, `Permission`,
`RefreshToken`, `OtpCode`, `Book`, `Author`, `Category`, `AudioFile`,
`AudioChapter`, `PdfFile`, `Story`, `MusicTrack`, `SubscriptionPlan`,
`Subscription`, `Payment`, `Coupon`, `Habit`, `ScreenTheme`, `SignupField`,
`OAuthClient`, `Conversation`, `Message`, and more.

## Project Structure

```
backend/
├── src/
│   ├── app.ts               # Express app, middleware, route mounting
│   ├── server.ts            # Entry point
│   ├── config/              # env validation (Zod), logging
│   ├── middleware/          # auth, rate limiter, validate, error handler
│   ├── utils/               # uploads, signed URLs, encryption
│   └── modules/<name>/      # one folder per feature
│       ├── <name>.routes.ts
│       ├── <name>.controller.ts
│       ├── <name>.service.ts
│       ├── <name>.validation.ts
│       └── types.ts
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
└── uploads/                 # local upload fallback (gitignored)
```

## Verification

```bash
npx tsc --noEmit    # type-check, 0 errors
npm test            # Jest
curl http://localhost:3000/api/v1/health
```

## Development Notes

- The compiled server (`npm start`) does **not** auto-reload — rebuild and restart after code changes.
- Gmail SMTP on this Windows dev host may fail TLS verification ("Connection
  closed unexpectedly"); the dev-only workaround is `tls: { rejectUnauthorized: false }`
  in the email transport. Do **not** carry this into production.
