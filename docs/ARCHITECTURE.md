# System Architecture
# Audio Book & E-Book Platform
## Version 1.0

---

## 1. ARCHITECTURE OVERVIEW

The platform follows a **layered monolithic architecture** with clear separation of concerns across three client-facing applications and one shared backend API.

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENTS                                   │
├──────────────┬──────────────────┬───────────────────────────────┤
│  Flutter App │  Flutter App     │  Admin Panel                  │
│  (Android)   │  (iOS)           │  (React Web)                  │
└──────┬───────┴────────┬─────────┴──────────────┬────────────────┘
       │                │                         │
       ▼                ▼                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API GATEWAY / LOAD BALANCER                    │
│              (Nginx / AWS ALB / Cloudflare)                       │
│         SSL Termination | Rate Limiting | CORS                    │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND API (Node.js + Express)                │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    MIDDLEWARE LAYER                           │ │
│  │  Auth (JWT) | RBAC | Rate Limit | Validate | Audit Log       │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    ROUTE LAYER                                │ │
│  │  /api/v1/auth | /api/v1/books | /api/v1/subscriptions | ...  │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                   CONTROLLER LAYER                            │ │
│  │  Request handling | Input validation | Response formatting    │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    SERVICE LAYER                              │ │
│  │  Business logic | Orchestration | External integrations       │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                   REPOSITORY LAYER                            │ │
│  │  Prisma ORM | Database queries | Data access                  │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────┬───────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌──────────────────┐
│   PostgreSQL    │ │  S3-Compatible  │ │  External APIs   │
│   (Database)    │ │  Object Storage │ │                  │
│                 │ │                 │ │  - Telebirr      │
│  - Users        │ │  - Audio files  │ │  - Stripe        │
│  - Books        │ │  - PDF files    │ │  - Chapa         │
│  - Payments     │ │  - Images       │ │  - FCM (Push)    │
│  - Subs         │ │  - Thumbnails   │ │  - SMS Gateway   │
│  - History      │ │                 │ │  - Email Service │
│  - Audit Logs   │ │                 │ │                  │
└─────────────────┘ └─────────────────┘ └──────────────────┘
```

---

## 2. SYSTEM COMPONENTS

### 2.1 Mobile Application (Flutter)

**Architecture Pattern:** Feature-First Clean Architecture

```
mobile/lib/
├── core/
│   ├── constants/          # App-wide constants
│   ├── di/                 # Dependency injection (get_it / riverpod)
│   ├── network/            # Dio HTTP client, interceptors, token refresh
│   ├── storage/            # Secure storage, shared preferences, encrypted file storage
│   ├── security/           # Screenshot blocking, device ID, encryption utils
│   ├── theme/              # Material 3 theme, dark/light mode
│   ├── utils/              # Helpers, formatters, validators
│   └── widgets/            # Shared/reusable widgets
├── features/
│   ├── auth/
│   │   ├── data/           # Repository impl, API calls, models
│   │   ├── domain/         # Entities, repository interfaces, use cases
│   │   └── presentation/   # Screens, widgets, state management (BLoC/Riverpod)
│   ├── home/
│   ├── discovery/
│   ├── audio_player/
│   ├── ebook_reader/
│   ├── subscription/
│   ├── offline/
│   ├── profile/
│   ├── notifications/
│   ├── favorites/
│   ├── history/
│   ├── reviews/
│   └── author_profile/
└── main.dart
```

**State Management:** BLoC (Business Logic Component) pattern via `flutter_bloc`

**Key Libraries:**
- `dio` — HTTP client with interceptors
- `flutter_bloc` — State management
- `just_audio` + `audio_service` — Audio playback with background/lock screen controls
- `flutter_pdfview` or `syncfusion_flutter_pdfviewer` — PDF rendering
- `flutter_secure_storage` — Secure token storage
- `firebase_messaging` — Push notifications
- `encrypt` — AES-256 file encryption
- `device_info_plus` — Device ID for binding
- `flutter_screenutil` — Responsive sizing

### 2.2 Backend API (Node.js + Express)

**Architecture Pattern:** Layered Clean Architecture

```
backend/src/
├── config/
│   ├── database.ts         # Prisma client singleton
│   ├── environment.ts      # Env vars validation
│   ├── storage.ts          # S3 client config
│   ├── payment.ts          # Payment gateway configs
│   └── firebase.ts         # FCM admin SDK
├── middleware/
│   ├── authenticate.ts     # JWT verification
│   ├── authorize.ts        # RBAC permission check
│   ├── rateLimiter.ts      # Rate limiting
│   ├── validate.ts         # Request validation (zod)
│   ├── auditLog.ts         # Admin action logging
│   ├── errorHandler.ts     # Global error handler
│   └── upload.ts           # File upload (multer)
├── modules/
│   ├── auth/
│   │   ├── auth.routes.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.validation.ts
│   │   └── strategies/     # JWT strategy
│   ├── books/
│   ├── categories/
│   ├── authors/
│   ├── subscriptions/
│   ├── payments/
│   ├── bookmarks/
│   ├── notes/
│   ├── highlights/
│   ├── favorites/
│   ├── reviews/
│   ├── notifications/
│   ├── devices/
│   ├── reports/
│   ├── history/
│   └── recommendations/
├── utils/
│   ├── crypto.ts           # Encryption/decryption helpers
│   ├── signedUrl.ts        # S3 signed URL generation
│   ├── otp.ts              # OTP generation and verification
│   ├── email.ts            # Email sending
│   ├── sms.ts              # SMS sending
│   ├── push.ts             # FCM push notifications
│   └── response.ts         # Standard API response formatter
└── app.ts                  # Express app setup and route registration
```

**Each module follows:**
```
module/
├── module.routes.ts        # Route definitions
├── module.controller.ts    # Request/response handling
├── module.service.ts       # Business logic
├── module.validation.ts    # Zod schemas for input validation
└── module.types.ts         # TypeScript types
```

### 2.3 Admin Panel (React Web)

**Architecture Pattern:** Feature-based with shared components

```
admin/src/
├── components/             # Shared UI components
│   ├── Layout/             # Sidebar, header, breadcrumbs
│   ├── DataTable/          # Reusable data table with sort/filter/pagination
│   ├── Form/               # Reusable form components
│   ├── Charts/             # Chart components (recharts)
│   └── common/             # Buttons, modals, cards, etc.
├── pages/
│   ├── auth/               # Login
│   ├── dashboard/          # Analytics overview
│   ├── books/              # Book CRUD
│   ├── categories/         # Category management
│   ├── authors/            # Author management
│   ├── users/              # User management
│   ├── subscriptions/      # Plan management
│   ├── coupons/            # Coupon management
│   ├── payments/           # Payment records
│   ├── reports/            # Reports with export
│   ├── notifications/      # Notification composer + history
│   ├── roles/              # Role & permission management
│   └── audit/              # Audit log viewer
├── services/               # API client (axios), auth service
├── hooks/                  # Custom React hooks
├── store/                  # Global state (zustand or Redux)
├── utils/                  # Helpers, formatters
└── App.tsx
```

**Key Libraries:**
- React 18+ with TypeScript
- React Router v6 — Routing
- TanStack Query (React Query) — Server state management
- React Hook Form + Zod — Form handling and validation
- Recharts — Charts and analytics
- MUI (Material UI) or Ant Design — UI component library
- Axios — HTTP client

---

## 3. DATA FLOW DIAGRAMS

### 3.1 Authentication Flow

```
┌────────┐    POST /auth/signup     ┌─────────┐    INSERT user    ┌──────────┐
│ Client │ ──────────────────────▶  │  API    │ ───────────────▶  │PostgreSQL│
│        │                          │         │                    │          │
│        │    ◀── 201 + email sent  │         │  ◀── user created │          │
│        │                          │         │                    └──────────┘
│        │                          │         │
│        │  POST /auth/verify-email │         │    UPDATE verified
│        │ ──────────────────────▶  │         │ ───────────────▶  ┌──────────┐
│        │                          │         │                    │PostgreSQL│
│        │  ◀── 200 verified        │         │  ◀── updated      │          │
│        │                          │         │                    └──────────┘
│        │                          │         │
│        │  POST /auth/login        │         │    SELECT user
│        │ ──────────────────────▶  │         │ ───────────────▶  ┌──────────┐
│        │                          │         │                    │PostgreSQL│
│        │  ◀── 200 {access,refresh}│         │  ◀── user data    │          │
│        │                          │         │                    └──────────┘
│        │                          │         │
│        │  GET /api/v1/books       │         │
│        │  (Authorization: Bearer) │         │
│        │ ──────────────────────▶  │         │    SELECT books
│        │                          │         │ ───────────────▶  ┌──────────┐
│        │  ◀── 200 {books}         │         │  ◀── books        │PostgreSQL│
└────────┘                          └─────────┘                    └──────────┘
```

### 3.2 Audio Streaming Flow

```
┌────────┐  GET /books/:id/audio   ┌─────────┐  Check sub    ┌──────────┐
│ Client │ ─────────────────────▶  │  API    │ ────────────▶ │PostgreSQL│
│        │                         │         │                │          │
│        │                         │         │ ◀── active sub │          │
│        │                         │         │                └──────────┘
│        │                         │         │
│        │                         │         │  Generate signed URL
│        │                         │         │ ────────────▶  ┌──────────┐
│        │                         │         │                 │   S3     │
│        │  ◀── 302 redirect       │         │ ◀── signed URL │          │
│        │  (or JSON with URL)     │         │                 └──────────┘
│        │                         │         │
│        │  Stream audio directly from signed S3 URL
│        │ ────────────────────────────────────────────────▶  ┌──────────┐
│        │  ◀── audio stream (chunked)                       │   S3     │
└────────┘                                                   └──────────┘
```

### 3.3 Payment Flow

```
┌────────┐  POST /subscriptions/   ┌─────────┐  Validate coupon  ┌──────────┐
│ Client │  subscribe              │  API    │ ────────────────▶ │PostgreSQL│
│        │ ─────────────────────▶  │         │                    │          │
│        │                         │         │ ◀── coupon valid   │          │
│        │                         │         │                    └──────────┘
│        │                         │         │
│        │                         │         │  Create payment intent
│        │                         │         │ ────────────────▶  ┌──────────┐
│        │                         │         │                     │ Stripe/  │
│        │  ◀── {checkout_url}     │         │ ◀── payment URL    │Telebirr/ │
│        │                         │         │                     │Chapa     │
│        │  Complete payment       │         │                     └──────────┘
│        │ ────────────────────────────────────────────────────▶  ┌──────────┐
│        │                         │         │                     │ Gateway  │
│        │                         │         │                     └──────────┘
│        │                         │         │
│        │                         │  Webhook callback            ┌──────────┐
│        │                         │ ◀──────────────────────────  │ Gateway  │
│        │                         │                              └──────────┘
│        │                         │  Update subscription + payment
│        │                         │ ─────────────────────────▶  ┌──────────┐
│        │                         │                              │PostgreSQL│
│        │  ◀── push notification  │                              │          │
│        │  (payment success)      │                              └──────────┘
└────────┘                         └─────────┘
```

### 3.4 Offline Download Flow

```
┌────────┐  GET /books/:id/download  ┌─────────┐  Check sub + device  ┌──────────┐
│ Client │ ────────────────────────▶ │  API    │ ───────────────────▶ │PostgreSQL│
│        │                           │         │                       │          │
│        │                           │         │ ◀── authorized        │          │
│        │                           │         │                       └──────────┘
│        │                           │         │
│        │                           │         │  Generate signed URL
│        │                           │         │ ────────────────▶  ┌──────────┐
│        │  ◀── {signed_url,         │         │                     │   S3     │
│        │   encryption_key}         │         │ ◀── signed URL      │          │
│        │                           │         │                     └──────────┘
│        │                           │         │
│        │  Download file from S3
│        │ ─────────────────────────────────────────────────────▶  ┌──────────┐
│        │  ◀── encrypted file data                                │   S3     │
│        │                                                         └──────────┘
│        │
│        │  Encrypt with AES-256 + device key
│        │  Store locally (encrypted)
│        │
│        │  Play/Read from local encrypted storage
│        │  (decrypt in memory, never write plaintext)
└────────┘                           └─────────┘
```

---

## 4. SECURITY ARCHITECTURE

### 4.1 Defense in Depth

```
Layer 1: Network
  └── SSL/TLS termination at load balancer
  └── HSTS headers enforced
  └── DDoS protection (Cloudflare/AWS Shield)

Layer 2: API Gateway
  └── Rate limiting (per-IP and per-user)
  └── Request size limits
  └── CORS whitelist

Layer 3: Application
  └── JWT authentication on every request
  └── RBAC authorization on admin routes
  └── Input validation and sanitization (Zod)
  └── SQL injection prevention (Prisma parameterized queries)
  └── XSS prevention (output encoding)

Layer 4: Data
  └── Password hashing (bcrypt, cost 12)
  └── AES-256 encryption for offline content
  └── Signed URLs for file access (no direct exposure)
  └── Device binding for downloaded content

Layer 5: Mobile
  └── Screenshot blocking (FLAG_SECURE on Android, detection on iOS)
  └── Screen recording detection
  └── Encrypted local storage
  └── Secure token storage (Keychain/Keystore)
```

### 4.2 Token Lifecycle

```
1. Login → Issue access_token (15min) + refresh_token (30d)
2. API call → Validate access_token
3. Access expired → Client sends refresh_token
4. Server validates refresh_token:
   a. Valid → Issue NEW access_token + NEW refresh_token (rotation)
   b. Already used (reuse detected) → REVOKE ALL tokens for user (security breach)
5. Logout → Revoke current refresh_token
6. Password reset → Revoke ALL refresh_tokens for user
7. Device removal → Revoke tokens for that device
```

---

## 5. DEPLOYMENT ARCHITECTURE

```
┌──────────────────────────────────────────────────────────┐
│                    PRODUCTION                              │
│                                                           │
│  ┌─────────────┐     ┌─────────────────────────────┐     │
│  │ Cloudflare  │     │  Backend (2+ instances)      │     │
│  │ / ALB       │────▶│  Node.js + Express           │     │
│  │ (SSL + CDN) │     │  Behind load balancer        │     │
│  └─────────────┘     └──────────┬──────────────────┘     │
│                                 │                         │
│                    ┌────────────┼────────────┐            │
│                    ▼            ▼            ▼            │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐     │
│  │ PostgreSQL   │ │    Redis     │ │  S3 Storage  │     │
│  │ (Primary +   │ │  (Cache +    │ │  (Files)     │     │
│  │  Read Replica)│ │   Rate Limit)│ │              │     │
│  └──────────────┘ └──────────────┘ └──────────────┘     │
│                                                           │
│  ┌──────────────────────────────────────────────┐        │
│  │  Admin Panel (Static hosting / Vercel / etc.) │        │
│  └──────────────────────────────────────────────┘        │
│                                                           │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│                    MOBILE DISTRIBUTION                     │
│                                                           │
│  ┌──────────────────┐    ┌──────────────────┐            │
│  │ Google Play Store│    │ Apple App Store  │            │
│  │ (Android AAB)    │    │ (iOS IPA)        │            │
│  └──────────────────┘    └──────────────────┘            │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

---

## 6. TECHNOLOGY STACK JUSTIFICATION

| Component | Technology | Justification |
|-----------|-----------|---------------|
| Mobile | Flutter | Single codebase for Android + iOS, excellent performance, rich widget library |
| Backend | Node.js + Express | High concurrency for I/O-bound operations, large ecosystem, TypeScript support |
| ORM | Prisma | Type-safe queries, excellent migration system, auto-generated types |
| Database | PostgreSQL | ACID compliance, JSON support, full-text search, proven at scale |
| Storage | S3-compatible | Scalable, CDN integration, signed URLs, cost-effective |
| Admin | React + TypeScript | Component reusability, large ecosystem, excellent data visualization libraries |
| Auth | JWT + Refresh Rotation | Stateless scaling, secure token lifecycle, reuse detection |
| Push | FCM | Cross-platform, reliable delivery, topic-based targeting |
| Validation | Zod | TypeScript-first, runtime type checking, composable schemas |

---

*End of Architecture Document*
