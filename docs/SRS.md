# Software Requirements Specification (SRS)
# Audio Book & E-Book Platform
## Version 1.0

---

## TABLE OF CONTENTS

1. Introduction
2. Overall Description
3. System Features
4. External Interface Requirements
5. Non-Functional Requirements
6. Security Requirements
7. Data Requirements
8. Constraints and Assumptions
9. Acceptance Criteria

---

## 1. INTRODUCTION

### 1.1 Purpose

This document defines the complete software requirements for the Audio Book & E-Book Platform — a production-ready, enterprise-grade mobile application with a web-based admin panel. The platform enables users to access audio books and e-books through a secure subscription model, with full dynamic content management via an admin panel requiring no developer dependency for day-to-day operations.

### 1.2 Scope

The system comprises three components:
- **Mobile Application** (Flutter — Android & iOS)
- **Backend API** (Node.js + Express.js + PostgreSQL + Prisma)
- **Admin Panel** (Responsive Web Application)

### 1.3 Definitions, Acronyms, and Abbreviations

| Term | Definition |
|------|-----------|
| AES | Advanced Encryption Standard |
| DRM | Digital Rights Management |
| FCM | Firebase Cloud Messaging |
| HSTS | HTTP Strict Transport Security |
| JWT | JSON Web Token |
| OTP | One-Time Password |
| RBAC | Role-Based Access Control |
| S3 | Simple Storage Service (compatible object storage) |
| SSL/TLS | Secure Sockets Layer / Transport Layer Security |
| TOC | Table of Contents |

### 1.4 References

- IEEE 830-1998 Standard for Software Requirements Specifications
- OWASP Mobile Security Guidelines
- Google Play Store / Apple App Store submission guidelines

---

## 2. OVERALL DESCRIPTION

### 2.1 Product Perspective

The platform is a standalone system consisting of:
- A cross-platform mobile app (Android + iOS) built with Flutter
- A RESTful backend API serving all client applications
- A responsive web-based admin panel for content and business management

### 2.2 Product Functions (Summary)

- User authentication (email, phone, OTP, email verification)
- User profile management with avatar and device management
- Subscription-based access (monthly and annual plans)
- Payment processing (Telebirr, Stripe, Chapa) with coupon engine
- Audio book playback with professional-grade player
- E-book reading with customizable reader
- Offline access with encrypted downloads and DRM protection
- Content discovery (search, browse, filter, sort, recommendations)
- Push notifications (targeted and broadcast)
- Favorites, bookmarks, notes, highlights, reviews, ratings
- Full admin panel for content, user, subscription, and business management

### 2.3 User Classes and Characteristics

| User Class | Description | Access Level |
|-----------|-------------|-------------|
| Guest | Unauthenticated user | Browse limited content, view plans |
| Free User | Registered, no active subscription | Access free content only |
| Subscribed User | Active subscription | Full content access, offline downloads |
| Content Manager | Admin role | Manage books, categories, authors |
| Support Agent | Admin role | View users, handle support tickets |
| Super Admin | Admin role | Full system access including roles, billing, reports |

### 2.4 Operating Environment

**Mobile:**
- Android 8.0 (API 26) and above
- iOS 14.0 and above

**Backend:**
- Node.js 20+ LTS
- PostgreSQL 15+
- S3-compatible object storage
- Redis (optional, for caching/rate limiting)

**Admin Panel:**
- Modern browsers (Chrome, Firefox, Safari, Edge — latest 2 versions)
- Responsive design (desktop, tablet, mobile)

### 2.5 Design and Implementation Constraints

- All API endpoints must be versioned (`/api/v1/...`)
- JWT access tokens expire in 15 minutes; refresh tokens in 30 days
- Maximum 5 devices per user account
- Offline content expires when subscription lapses
- All file storage uses signed, time-limited URLs (no direct file exposure)
- AES-256 encryption for offline content
- All admin actions are audit-logged

---

## 3. SYSTEM FEATURES

### 3.1 Authentication System

#### 3.1.1 Sign Up
- **FR-AUTH-001:** System SHALL allow users to sign up with email address and password
- **FR-AUTH-002:** System SHALL allow users to sign up with phone number and password
- **FR-AUTH-003:** System SHALL send email verification link/token upon email signup
- **FR-AUTH-004:** System SHALL send OTP via SMS upon phone signup
- **FR-AUTH-005:** System SHALL validate password strength (min 8 chars, uppercase, lowercase, number, special char)
- **FR-AUTH-006:** System SHALL prevent duplicate email/phone registrations

#### 3.1.2 Login
- **FR-AUTH-007:** System SHALL allow login with email + password
- **FR-AUTH-008:** System SHALL allow login with phone + password
- **FR-AUTH-009:** System SHALL allow login with phone + OTP
- **FR-AUTH-010:** System SHALL issue JWT access token and refresh token upon successful login
- **FR-AUTH-011:** System SHALL block login for suspended/blocked accounts

#### 3.1.3 Token Management
- **FR-AUTH-012:** System SHALL implement refresh token rotation (new refresh token issued on each use)
- **FR-AUTH-013:** System SHALL detect refresh token reuse and revoke all tokens for that user (security measure)
- **FR-AUTH-014:** System SHALL support token revocation (logout, device removal)
- **FR-AUTH-015:** Access token TTL: 15 minutes; Refresh token TTL: 30 days

#### 3.1.4 Forgot Password
- **FR-AUTH-016:** System SHALL send password reset link via email
- **FR-AUTH-017:** System SHALL send password reset OTP via SMS
- **FR-AUTH-018:** Reset tokens SHALL expire after 15 minutes
- **FR-AUTH-019:** System SHALL invalidate all existing sessions after password reset

#### 3.1.5 OTP Verification
- **FR-AUTH-020:** System SHALL generate 6-digit OTP valid for 5 minutes
- **FR-AUTH-021:** System SHALL rate-limit OTP requests (max 3 per 15 minutes per phone)
- **FR-AUTH-022:** System SHALL lock OTP after 5 failed attempts for 30 minutes

### 3.2 User Profile

- **FR-PROF-001:** System SHALL allow users to view and edit their profile (name, avatar, contact info)
- **FR-PROF-002:** System SHALL allow avatar upload with crop functionality
- **FR-PROF-003:** System SHALL display current subscription status (active, expired, none)
- **FR-PROF-004:** System SHALL display list of linked/active devices
- **FR-PROF-005:** System SHALL allow users to remove/revoke individual devices
- **FR-PROF-006:** System SHALL enforce maximum avatar image size (5MB)

### 3.3 Subscription System

- **FR-SUB-001:** System SHALL offer Monthly subscription plan
- **FR-SUB-002:** System SHALL offer Annual subscription plan
- **FR-SUB-003:** System SHALL display plan details (price, duration, features)
- **FR-SUB-004:** System SHALL display payment history
- **FR-SUB-005:** System SHALL send renewal reminders via push notification and email (7 days, 3 days, 1 day before expiry)
- **FR-SUB-006:** System SHALL support coupon code redemption at checkout
- **FR-SUB-007:** System SHALL auto-renew subscriptions if payment method is saved (optional)
- **FR-SUB-008:** System SHALL lock premium content access when subscription expires

### 3.4 Payment System

- **FR-PAY-001:** System SHALL integrate Telebirr for local payments
- **FR-PAY-002:** System SHALL integrate Stripe for international payments
- **FR-PAY-003:** System SHALL integrate Chapa as local alternative gateway
- **FR-PAY-004:** System SHALL process webhook callbacks from all payment gateways
- **FR-PAY-005:** System SHALL handle payment success, failure, and pending states
- **FR-PAY-006:** System SHALL store payment records with full audit trail

#### Coupon Engine
- **FR-PAY-007:** System SHALL support percentage-based discounts (e.g., 20% off)
- **FR-PAY-008:** System SHALL support fixed-amount discounts (e.g., $5 off)
- **FR-PAY-009:** System SHALL enforce coupon expiry dates
- **FR-PAY-010:** System SHALL enforce per-user usage limits
- **FR-PAY-011:** System SHALL enforce global usage limits
- **FR-PAY-012:** System SHALL validate coupon applicability (plan-specific or universal)

### 3.5 Home Screen

- **FR-HOME-001:** System SHALL display Featured Books section (admin-curated)
- **FR-HOME-002:** System SHALL display Trending Books section (based on recent popularity)
- **FR-HOME-003:** System SHALL display New Releases section
- **FR-HOME-004:** System SHALL display Continue Reading section (user's in-progress e-books)
- **FR-HOME-005:** System SHALL display Continue Listening section (user's in-progress audiobooks)
- **FR-HOME-006:** System SHALL display Recommended section (personalized based on history, ratings, category affinity)
- **FR-HOME-007:** All sections SHALL support horizontal scroll with "See All" option

### 3.6 Book Discovery

- **FR-DISC-001:** System SHALL allow browsing by Category
- **FR-DISC-002:** System SHALL allow browsing by Author
- **FR-DISC-003:** System SHALL allow browsing by Language
- **FR-DISC-004:** System SHALL provide Popular / New / Free / Premium filter tabs
- **FR-DISC-005:** System SHALL provide smart search with autosuggest
- **FR-DISC-006:** System SHALL provide advanced filters (category, language, price range, format)
- **FR-DISC-007:** System SHALL provide sort options (newest, popularity, rating, alphabetical)
- **FR-DISC-008:** Search SHALL index title, author name, description, and tags

### 3.7 Audio Book Player

- **FR-AUD-001:** Player SHALL support Play / Pause
- **FR-AUD-002:** Player SHALL support Forward / Backward with configurable skip interval (10s, 15s, 30s, 60s)
- **FR-AUD-003:** Player SHALL support playback speed control (0.5x to 3.0x in 0.25x increments)
- **FR-AUD-004:** Player SHALL support sleep timer (5, 10, 15, 30, 45, 60 minutes + end of chapter)
- **FR-AUD-005:** Sleep timer SHALL include fade-out effect (last 30 seconds gradually reduce volume)
- **FR-AUD-006:** Player SHALL support timestamped bookmarking
- **FR-AUD-007:** Player SHALL resume from last position (cross-device sync)
- **FR-AUD-008:** Player SHALL support background playback
- **FR-AUD-009:** Player SHALL display lock screen media controls (Android notification + iOS control center)
- **FR-AUD-010:** Player SHALL display persistent mini player across app navigation
- **FR-AUD-011:** Player SHALL support chapter/segment navigation for multi-chapter audiobooks
- **FR-AUD-012:** Player SHALL display current chapter name, progress bar, and time remaining
- **FR-AUD-013:** Player SHALL stream audio via signed, time-limited URLs

### 3.8 E-Book Reader

- **FR-EBOOK-001:** Reader SHALL support Dark Mode, Light Mode, and Sepia theme
- **FR-EBOOK-002:** Reader SHALL support font size adjustment (8pt to 32pt)
- **FR-EBOOK-003:** Reader SHALL support font family selection (minimum 5 fonts)
- **FR-EBOOK-004:** Reader SHALL support line height adjustment
- **FR-EBOOK-005:** Reader SHALL support margin adjustment
- **FR-EBOOK-006:** Reader SHALL support page/section bookmarking
- **FR-EBOOK-007:** Reader SHALL support user-created notes tied to a location in the book
- **FR-EBOOK-008:** Reader SHALL support color-coded highlights tied to text selection
- **FR-EBOOK-009:** Reader SHALL sync last reading position across devices
- **FR-EBOOK-010:** Reader SHALL display table of contents navigation
- **FR-EBOOK-011:** Reader SHALL render PDF content with reflow capability where possible

### 3.9 Offline Mode

- **FR-OFF-001:** System SHALL allow subscribed users to download audiobooks for offline listening
- **FR-OFF-002:** System SHALL allow subscribed users to download e-books for offline reading
- **FR-OFF-003:** Downloaded files SHALL be AES-256 encrypted on local storage
- **FR-OFF-004:** System SHALL implement DRM-style protection to prevent file extraction/sharing
- **FR-OFF-005:** Downloaded content SHALL be device-locked (tied to device ID)
- **FR-OFF-006:** System SHALL check subscription expiration and lock offline content if lapsed
- **FR-OFF-007:** System SHALL provide download manager UI with:
  - Download queue
  - Pause / Resume capability
  - Storage usage display
  - Delete downloaded content
- **FR-OFF-008:** System SHALL display download progress and status indicators
- **FR-OFF-009:** System SHALL prevent downloading the same content twice on the same device

### 3.10 Notifications

- **FR-NOTIF-001:** System SHALL send push notifications for new book releases
- **FR-NOTIF-002:** System SHALL send push notifications for promotions and offers
- **FR-NOTIF-003:** System SHALL send push notifications for subscription reminders (renewal, expiry)
- **FR-NOTIF-004:** System SHALL send push notifications for new audio content
- **FR-NOTIF-005:** System SHALL send push notifications for new e-book content
- **FR-NOTIF-006:** System SHALL send push notifications for app announcements
- **FR-NOTIF-007:** System SHALL support targeted notifications (specific user segments)
- **FR-NOTIF-008:** System SHALL support broadcast notifications (all users)
- **FR-NOTIF-009:** System SHALL provide in-app notification center (list, mark read, delete)
- **FR-NOTIF-010:** System SHALL send email notifications for subscription events

### 3.11 Favorites

- **FR-FAV-001:** System SHALL allow users to add books to favorites
- **FR-FAV-002:** System SHALL allow users to remove books from favorites
- **FR-FAV-003:** System SHALL display favorites list with sort/filter options

### 3.12 Reviews and Ratings

- **FR-REV-001:** System SHALL allow subscribed users to rate books (1-5 stars)
- **FR-REV-002:** System SHALL allow subscribed users to write text reviews
- **FR-REV-003:** System SHALL allow users to edit their own reviews
- **FR-REV-004:** System SHALL display average rating and review count on book detail
- **FR-REV-005:** System SHALL display reviews list with pagination
- **FR-REV-006:** System SHALL prevent multiple reviews from the same user for the same book

### 3.13 Reading & Listening History

- **FR-HIST-001:** System SHALL track reading history (book, last position, last accessed time)
- **FR-HIST-002:** System SHALL track listening history (book, last timestamp, last accessed time)
- **FR-HIST-003:** System SHALL display reading history list with ability to remove entries
- **FR-HIST-004:** System SHALL display listening history list with ability to remove entries
- **FR-HIST-005:** History SHALL sync across devices

### 3.14 Share Book

- **FR-SHARE-001:** System SHALL allow users to share a book via deep link
- **FR-SHARE-002:** Deep links SHALL open the book detail page in the app (or app store if not installed)

### 3.15 Author Profiles

- **FR-AUTH-001:** System SHALL display author profile pages with bio and photo
- **FR-AUTH-002:** System SHALL display all books by a given author
- **FR-AUTH-003:** Author profiles SHALL be manageable from admin panel

### 3.16 Recommendation Engine

- **FR-REC-001:** System SHALL generate personalized book recommendations
- **FR-REC-002:** Recommendations SHALL be based on reading/listening history
- **FR-REC-003:** Recommendations SHALL factor in user ratings
- **FR-REC-004:** Recommendations SHALL factor in category affinity
- **FR-REC-005:** System SHALL provide fallback recommendations (trending/popular) for new users

---

## 4. EXTERNAL INTERFACE REQUIREMENTS

### 4.1 User Interfaces (Mobile App)

All screens shall follow Material 3 design language with:
- Dark Mode and Light Mode support
- Responsive layouts (phones and tablets)
- Purposeful animations
- Shimmer/skeleton loading states
- Empty states with illustrations
- Error states with retry actions
- Accessibility compliance (screen reader labels, contrast ratios, tap target sizing)

**Complete Screen List:**

1. Splash Screen
2. Onboarding (optional, first launch)
3. Sign Up (email)
4. Sign Up (phone)
5. Login
6. OTP Verification
7. Email Verification
8. Forgot Password
9. Reset Password
10. Home
11. Search / Discovery
12. Search Results
13. Book Detail
14. Audio Player (full screen)
15. Audio Player (mini player)
16. E-Book Reader
17. Reader Settings
18. Subscription Plans
19. Payment / Checkout
20. Payment Success
21. Payment Failure
22. Payment History
23. Profile
24. Edit Profile
25. My Devices
26. Favorites
27. Reading History
28. Listening History
29. Downloads / Download Manager
30. Notifications
31. Settings
32. Reviews (book detail tab)
33. Write Review
34. Author Profile
35. Category Browse
36. Coupon Code Entry

### 4.2 Admin Panel Interfaces

1. Login
2. Dashboard (analytics overview)
3. Book Management (list, create, edit, detail)
4. Audio Upload
5. PDF Upload
6. Cover/Thumbnail Upload
7. Category Management
8. Author Management
9. User Management (list, detail)
10. Subscription Plans Management
11. Coupon Management (list, create, edit)
12. Payment Records
13. Reports (with date range, export)
14. Notification Composer
15. Notification History
16. Role Management
17. Permission Matrix Editor
18. Audit Log Viewer
19. Settings

### 4.3 Hardware Interfaces

- **Camera:** Used for avatar photo capture
- **Storage:** Local encrypted storage for offline content
- **Network:** Wi-Fi and cellular data for API communication and streaming

### 4.4 Software Interfaces

- **Firebase Cloud Messaging (FCM):** Push notification delivery
- **Telebirr API:** Payment processing (Ethiopian mobile money)
- **Stripe API:** International payment processing
- **Chapa API:** Ethiopian payment gateway alternative
- **SMS Gateway:** OTP delivery (Twilio or local provider)
- **Email Service:** Transactional emails (SendGrid, AWS SES, or similar)
- **S3-compatible Storage:** File storage for audio, PDF, and images

### 4.5 Communication Interfaces

- **REST API:** All client-server communication via versioned REST endpoints over HTTPS
- **WebSocket (optional):** Real-time notifications (future enhancement)
- **SSL/TLS:** All communication encrypted in transit

---

## 5. NON-FUNCTIONAL REQUIREMENTS

### 5.1 Performance

- **NFR-PERF-001:** API response time SHALL be under 200ms for 95th percentile
- **NFR-PERF-002:** Audio streaming SHALL start within 2 seconds on 4G connection
- **NFR-PERF-003:** App cold start SHALL be under 3 seconds
- **NFR-PERF-004:** System SHALL support 10,000 concurrent users
- **NFR-PERF-005:** Search results SHALL return within 500ms

### 5.2 Scalability

- **NFR-SCALE-001:** Backend SHALL be horizontally scalable (stateless API servers)
- **NFR-SCALE-002:** Database SHALL support read replicas for query scaling
- **NFR-SCALE-003:** File storage SHALL use CDN for global content delivery
- **NFR-SCALE-004:** System SHALL support 1 million+ registered users

### 5.3 Availability

- **NFR-AVAIL-001:** System SHALL target 99.9% uptime (8.76 hours downtime/year max)
- **NFR-AVAIL-002:** System SHALL implement graceful degradation (offline mode for cached content)
- **NFR-AVAIL-003:** System SHALL implement health check endpoints

### 5.4 Maintainability

- **NFR-MAINT-001:** Code SHALL follow clean architecture principles
- **NFR-MAINT-002:** API SHALL be versioned for backward compatibility
- **NFR-MAINT-003:** Database migrations SHALL be reversible
- **NFR-MAINT-004:** System SHALL include comprehensive logging

### 5.5 Usability

- **NFR-USE-001:** UI SHALL be intuitive with maximum 3 taps to reach any content
- **NFR-USE-002:** App SHALL support both portrait and landscape orientations
- **NFR-USE-003:** Admin panel SHALL be fully functional on desktop and tablet browsers

### 5.6 Portability

- **NFR-PORT-001:** Mobile app SHALL run on Android 8.0+ and iOS 14.0+
- **NFR-PORT-002:** Admin panel SHALL work on Chrome, Firefox, Safari, Edge (latest 2 versions)

---

## 6. SECURITY REQUIREMENTS

### 6.1 Authentication & Authorization

- **SEC-001:** All API endpoints (except auth) SHALL require valid JWT access token
- **SEC-002:** Admin endpoints SHALL require appropriate role/permission
- **SEC-003:** System SHALL implement RBAC with minimum 4 roles
- **SEC-004:** Passwords SHALL be hashed with bcrypt (cost factor 12+)

### 6.2 Data Protection

- **SEC-005:** All data in transit SHALL be encrypted with TLS 1.2+
- **SEC-006:** All offline content SHALL be encrypted with AES-256
- **SEC-007:** Sensitive data (tokens, passwords) SHALL never be logged
- **SEC-008:** Database SHALL use parameterized queries (Prisma handles this)

### 6.3 Content Protection (DRM)

- **SEC-009:** Audio and PDF files SHALL NOT be directly accessible (signed URLs only)
- **SEC-010:** Signed URLs SHALL expire within 1 hour
- **SEC-011:** Downloaded content SHALL be encrypted and device-locked
- **SEC-012:** System SHALL block screenshots on mobile app
- **SEC-013:** System SHALL detect and block screen recording

### 6.4 Device Security

- **SEC-014:** System SHALL enforce maximum 5 devices per account
- **SEC-015:** System SHALL bind downloaded content to device ID
- **SEC-016:** Users SHALL be able to view and revoke devices from profile

### 6.5 API Security

- **SEC-017:** System SHALL implement rate limiting (per-IP: 100 req/min general, 5 req/min auth endpoints)
- **SEC-018:** System SHALL validate and sanitize all API inputs
- **SEC-019:** System SHALL implement CORS with whitelist
- **SEC-020:** System SHALL set security headers (HSTS, X-Frame-Options, CSP, etc.)
- **SEC-021:** System SHALL implement request size limits

### 6.6 Audit & Monitoring

- **SEC-022:** All admin actions SHALL be audit-logged with actor, action, timestamp, and IP
- **SEC-023:** Failed login attempts SHALL be logged
- **SEC-024:** System SHALL implement health monitoring and alerting

---

## 7. DATA REQUIREMENTS

### 7.1 Database Entities

The system SHALL maintain the following entities (minimum):

1. **Users** — id, email, phone, password_hash, name, avatar_url, email_verified, phone_verified, status, created_at, updated_at
2. **Roles** — id, name, description, created_at
3. **Permissions** — id, name, resource, action, description
4. **RolePermissions** — role_id, permission_id
5. **UserRoles** — user_id, role_id
6. **Devices** — id, user_id, device_id, device_name, platform, fcm_token, last_active_at, created_at
7. **Books** — id, title, description, cover_url, language, is_featured, is_premium, is_free, publish_date, status, created_at, updated_at
8. **Authors** — id, name, bio, photo_url, created_at
9. **BookAuthors** — book_id, author_id
10. **Categories** — id, name, description, parent_id, created_at
11. **BookCategories** — book_id, category_id
12. **AudioFiles** — id, book_id, file_url, duration_seconds, file_size_bytes, created_at
13. **AudioChapters** — id, audio_file_id, title, start_time, end_time, order
14. **PdfFiles** — id, book_id, file_url, page_count, file_size_bytes, created_at
15. **Bookmarks** — id, user_id, book_id, type (audio/pdf), position, label, created_at
16. **Notes** — id, user_id, book_id, content, position, created_at, updated_at
17. **Highlights** — id, user_id, book_id, text, color, position, created_at
18. **Favorites** — id, user_id, book_id, created_at
19. **ReadingHistory** — id, user_id, book_id, last_position, last_accessed_at, progress_percent
20. **ListeningHistory** — id, user_id, book_id, last_timestamp, last_accessed_at, progress_percent
21. **SubscriptionPlans** — id, name, duration_months, price, currency, is_active, created_at
22. **Subscriptions** — id, user_id, plan_id, start_date, end_date, status, payment_id, created_at
23. **Payments** — id, user_id, amount, currency, gateway, gateway_transaction_id, status, coupon_id, created_at
24. **Coupons** — id, code, discount_type, discount_value, max_uses, used_count, expires_at, applicable_plans, is_active, created_at
25. **CouponUsage** — id, coupon_id, user_id, used_at
26. **Notifications** — id, title, body, type, target_type, target_ids, sent_at, created_by
27. **UserNotifications** — id, notification_id, user_id, is_read, read_at
28. **Reviews** — id, user_id, book_id, rating, content, created_at, updated_at
29. **AuditLogs** — id, user_id, action, resource, resource_id, details, ip_address, created_at

### 7.2 Data Retention

- User data: retained while account active, soft-deleted on account deletion, hard-deleted after 90 days
- Payment records: retained for 7 years (financial compliance)
- Audit logs: retained for 2 years
- Reading/listening history: retained while account active

### 7.3 Data Backup

- Database: daily automated backups with 30-day retention
- File storage: versioning enabled on S3 bucket

---

## 8. CONSTRAINTS AND ASSUMPTIONS

### 8.1 Constraints

- Mobile app must comply with Google Play Store and Apple App Store guidelines
- Payment integrations require merchant accounts and API keys
- SMS OTP requires a configured SMS gateway provider
- Push notifications require Firebase project configuration
- SSL certificate required for production deployment

### 8.2 Assumptions

- Users have stable internet connection for initial content access
- S3-compatible storage is provisioned and accessible
- At least one payment gateway is operational at any time
- Admin users are trusted and trained on the admin panel

---

## 9. ACCEPTANCE CRITERIA

### 9.1 General

- All functional requirements (FR-*) are implemented and tested
- All security requirements (SEC-*) are implemented and verified
- All non-functional requirements (NFR-*) are met under load testing
- API documentation is complete and accurate
- All admin panel features are functional
- Mobile app passes App Store and Play Store review requirements

### 9.2 Critical Path

1. User can sign up, verify, and log in successfully
2. User can browse, search, and discover books
3. User can subscribe and pay via at least one gateway
4. User can play an audiobook with all player features
5. User can read an e-book with all reader features
6. User can download content for offline access
7. Offline content is encrypted and device-locked
8. Admin can upload and manage books
9. Admin can manage users and subscriptions
10. Admin can send notifications
11. Admin can generate and export reports

---

*End of SRS Document*
