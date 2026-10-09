<div align="center">

# Bariisaa Tv

### Audio Book & E-Book Platform

A full-stack children's audio book and e-book platform with a **Flutter** mobile app, **Node.js/Express** backend API, and **React** admin panel. Designed for kids with a playful, colorful UI and parental controls. Auth-free mobile experience — users jump straight into content.

![Flutter](https://img.shields.io/badge/Flutter-3.47-02569B?logo=flutter)
![Dart](https://img.shields.io/badge/Dart-3.13-0175C2?logo=dart)
![Node.js](https://img.shields.io/badge/Node.js-22.x-339933?logo=node.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?logo=typescript)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql)
![Prisma](https://img.shields.io/badge/Prisma-5.x-2D3748?logo=prisma)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)

</div>

---

## Screenshots

<div align="center">

| App Main Screen | Book Discovery | Audio Player |
|:---:|:---:|:---:|
| ![App Main](final.png) | ![Discovery](screen.png) | ![Audio Player](screen2.png) |

| App Running | Splash & Menu | Book Detail |
|:---:|:---:|:---:|
| ![Running](vrun.png) | ![Menu](screen_ok.png) | ![Detail](screen_final.png) |

</div>

---

### Cover Image Size Notice

**Action Required (Admin):** Book and content cover images currently uploaded are **too large** (some exceeding 2-5 MB each). This causes slow load times on the hero carousel and shelf cards, high bandwidth usage on mobile networks, and poor user experience on low-end devices.

**Recommended sizes for cover images:**

| Image Type | Recommended Size | Max File Size |
|------------|-----------------|---------------|
| Hero carousel cover | 800 x 600 px | 200 KB |
| Shelf card cover | 300 x 400 px | 150 KB |
| Thumbnail | 200 x 200 px | 50 KB |

**Admin must re-upload all cover images** at the correct sizes through the Admin Panel (`/books/:id/edit`). Use WebP format for best compression. Target **under 200 KB** per cover image.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Mobile App](#mobile-app)
- [Backend API](#backend-api)
- [Admin Panel](#admin-panel)
- [Project Structure](#project-structure)
- [Commands Reference](#commands-reference)
- [Environment Variables](#environment-variables)
- [Default Credentials](#default-credentials)
- [License](#license)

---

## Architecture Overview

```
+-----------------------------------------------------------+
|                    FLUTTER MOBILE APP                      |
|  +-----------+  +------------+  +----------+  +---------+ |
|  |  BLoC /   |  |  GoRouter  |  |   Dio    |  | get_it  | |
|  |  Cubit    |  |  Routing   |  |  HTTP    |  |   DI    | |
|  +-----+-----+  +------------+  +----+-----+  +---------+ |
|        |            |              |                       |
|  +-----+-----+  +--+---+  +------+----+  +---------+     |
|  |  media_   |  |Deep  |  |  secure   |  |  cache  |     |
|  |  kit      |  |Link  |  | storage   |  |  image  |     |
|  +------------+  |(app_ |  | (dev-mode |  +---------+     |
|                  |links)|  |  flag)    |                  |
|                  +------+  +-----------+                  |
+-------------------------+--------------------------------+
                          | HTTPS / REST API (no auth required)
                          | Public content endpoints
+---------------------------+-------------------------------+
|                  NODE.JS / EXPRESS BACKEND                 |
|  +----------+  +----------+  +----------+  +----------+   |
|  |  Helmet  |  |  Rate    |  |  Zod     |  |  multer  |   |
|  | Security |  | Limiter  |  | Validate |  |  Upload  |   |
|  +----------+  +----------+  +----------+  +----------+   |
|  +----------------------------------------------------+   |
|  |     23 Route Modules (44 groups) + OAuth PKCE      |   |
|  |  auth|users|books|categories|authors|reviews|...   |   |
|  +------------------------+---------------------------+   |
|                           |                                 |
|  +----------+  +----------+--------+  +----------------+   |
|  | Prisma   |  |   PostgreSQL      |  |   S3 / MinIO   |   |
|  |   ORM    |  |   Database        |  |   File Storage |   |
|  | 50+ tbls |  |                   |  |                |   |
|  +----------+  +-------------------+  +----------------+   |
+---------------------------+--------------------------------+
                            |
+---------------------------+--------------------------------+
|                     REACT ADMIN PANEL                      |
|  +----------+  +----------+  +----------+  +----------+   |
|  | React 18 |  |  MUI 6   |  | Zustand  |  |TanStack |   |
|  | + TS     |  |  UI Kit  |  |  State   |  | Query   |   |
|  +----------+  +----------+  +----------+  +----------+   |
|  +----------------------------------------------------+   |
|  |   22 Pages: Dashboard|Books|Users|SignupFields|Reports|...      |   |
|  +----------------------------------------------------+   |
+------------------------------------------------------------+
                            |
             +--------------+--------------+
             |       External Services     |
             |  +--------+  +-----------+  |
             |  | Stripe |  | Telebirr  |  |
             |  | Chapa  |  | Africa's  |  |
             |  |        |  | Talking   |  |
             |  +--------+  +-----------+  |
             |  +--------+  +-----------+  |
             |  |Firebase|  | Nodemailer|  |
             |  |  FCM   |  |  SMTP     |  |
             |  +--------+  +-----------+  |
             +------------------------------+
```

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
|| **Mobile App** | Flutter 3.24, Dart 3.11 | Cross-platform mobile UI |
| **State Management** | BLoC / Cubit | Predictable state management |
| **Routing** | GoRouter 14.x | Declarative routing |
| **HTTP Client** | Dio 5.x | REST API communication |
| **DI** | get_it 8.x | Service locator pattern |
| **Audio** | media_kit + media_kit_libs_windows_audio | Cross-platform audio playback |
| **Storage** | flutter_secure_storage | Encrypted dev-mode flag |
| **Deep Links** | app_links 6.x | URL handling |
| **Auth UI** | No auth screens | Auth-free — direct to content |
|| **Backend Runtime** | Node.js 22.x + Express 4.x | REST API server |
|| **Language** | TypeScript 5.6 | Type-safe backend code |
| **ORM** | Prisma 5.x | Database access & migrations |
|| **Database** | PostgreSQL 18 | Relational data storage |
| **Validation** | Zod 3.x | Request validation schemas |
| **Auth** | JWT (access + refresh) | Stateless auth for admin panel only |
| **OAuth** | Authorization Code + PKCE (retained) | OAuth 2.0 endpoints for future SSO / integrations |
| **File Storage** | S3-compatible (MinIO) | Audio, PDF, image storage |
| **Admin Panel** | React 18 + TypeScript + Vite 5 | Admin dashboard |
| **Admin UI** | MUI 6 (Material UI) | Component library |
| **Admin State** | Zustand 5 + TanStack Query 5 | Client + server state |
| **Payments** | Stripe, Chapa, Telebirr | Subscription payments |
| **SMS** | Africa's Talking | OTP & notifications |
| **Email** | Nodemailer (SMTP) | Verification & reset emails |
| **Push Notifications** | Firebase Cloud Messaging | Mobile push notifications |

---

## Quick Start

### Prerequisites

- [Flutter SDK](https://docs.flutter.dev/get-started/install) (3.x)
- [Node.js](https://nodejs.org/) (20.x)
- [PostgreSQL](https://www.postgresql.org/) (16)
- [Android Studio](https://developer.android.com/studio) (with emulator)
- [Git](https://git-scm.com/)

### 1. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your database URL, JWT secrets, API keys
npx prisma migrate deploy   # NOT migrate dev (known Prisma index drift; see docs/SETUP_GUIDE.md)
npx prisma db seed
npm run dev
```

Backend runs at `http://localhost:3000`. Health check: `GET /health` → `{"status":"ok"}`. API docs (Swagger UI) at `http://localhost:3000/api/v1/docs` (`npm run swagger` prints the spec).

### 2. Mobile App Setup

```bash
cd mobile
flutter pub get
flutter run
# Or build APK
flutter build apk --debug
```

### 3. Admin Panel Setup

```bash
cd admin
npm install
npm run dev
```

Admin panel runs at `http://localhost:5173`.
---

## Mobile App

### Overview

The **Bariisaa Tv** mobile app is a cross-platform Flutter application (Android + iOS) for children's audio books and e-books. It is designed for young kids with a playful, colorful, high-contrast UI, parental controls, and **no authentication required** — users jump straight into content.

| Property | Value |
|----------|-------|
| Package name | `naik_mobile` |
| Version | `1.0.0+1` |
| Dart SDK | `^3.11.5` |
| Entry point | `lib/main.dart` (`BariisaaTvApp`) |
| State management | BLoC / Cubit |
| Routing | GoRouter (declarative) |
| HTTP | Dio with token-refresh interceptors |
| DI | get_it (service locator) |
| Audio | media_kit (cross-platform) |
| Secure storage | flutter_secure_storage (dev-mode flag only) |
| PDF reader | pdfrx (Android/iOS), url_launcher (desktop fallback) |

### Dependencies (`pubspec.yaml`)

| Category | Package | Version | Purpose |
|----------|---------|---------|---------|
| State | `flutter_bloc` / `bloc` | ^8.1.6 / ^8.1.4 | BLoC/Cubit state management |
| State | `equatable` | ^2.0.7 | State equality |
| HTTP | `dio` | ^5.7.0 | REST API client |
| DI | `get_it` | ^8.0.3 | Service locator |
| Routing | `go_router` | ^14.6.0 | Declarative routing |
| Audio | `media_kit` | ^1.1.11 | Cross-platform audio playback |
| Audio | `media_kit_libs_windows_audio` | ^1.0.9 | Windows audio native libs |
| Storage | `flutter_secure_storage` | ^9.2.4 | Encrypted dev-mode flag |
| Storage | `path_provider` | ^2.1.5 | Local file paths (downloads) |
| Push | `firebase_core` | ^3.12.1 | Firebase (FCM push) |
| Device | `device_info_plus` | ^11.4.0 | Device info |
| Images | `cached_network_image` | ^3.4.1 | Cached image loading |
| UI | `shimmer` | ^3.0.0 | Loading placeholders |
| Media | `image_picker` / `image_cropper` | ^1.1.2 / ^8.1.0 | Avatar pick/crop |
| Media | `video_player` | ^2.9.2 | Video playback (media player) |
| i18n | `intl` / `timeago` | ^0.20.2 / ^3.7.0 | Formatting, relative time |
| PDF | `pdfrx` | ^1.0.27 | PDF reader (Android/iOS) |
| PDF | `url_launcher` | ^6.3.1 | Open PDFs externally (desktop fallback) |
| Dev | `flutter_lints`, `bloc_test`, `mocktail` | — | Lint + testing |

### Fonts (`pubspec.yaml`)

| Font | Use |
|------|-----|
| `Baloo2` | Headings / titles (kid-friendly) |
| `Nunito` | Body text |
| `NotoSansEthiopic` | Ethiopic script (Oromo / Amharic) |
| `NotoColorEmoji` | Emoji |
| `Roboto` | Fallback |

---

### Project Structure

```
mobile/lib/
├── main.dart                       # Entry point, Firebase + fonts init
├── firebase_options.dart           # Firebase platform config
├── core/                           # Shared infrastructure
│   ├── constants/app_constants.dart# API URLs, keys, limits, constants
│   ├── di/injection.dart           # get_it registration + providers
│   ├── navigation/app_router.dart  # GoRouter routes
│   ├── network/api_client.dart     # Dio + interceptors
│   ├── security/security_service.dart # Root/jailbreak detection
│   ├── storage/secure_storage.dart # flutter_secure_storage wrapper (dev-mode flag)
│   └── theme/app_theme.dart        # 3 themes + design tokens
├── features/                       # Feature modules
│   └── <feature>/
│       ├── data/                   # Repository
│       ├── domain/                 # State classes
│       └── presentation/           # Cubit + Screen(s)
└── shared/
    ├── models/models.dart          # Data models
    ├── styles.dart                 # Shared text styles
    └── widgets/                    # Reusable widgets
        ├── shared_widgets.dart     # Kids widgets + aliases
        └── menu_all_screen.dart    # Central menu hub
```

---

### Core Infrastructure

#### 1. Entry Point (`main.dart`)

- `WidgetsFlutterBinding.ensureInitialized()`
- `setupDependencies()` registers all repos/cubits in get_it
- Firebase initialized (skipped on unsupported platforms, non-fatal)
- `NotoSansEthiopic` font loaded explicitly (with timeout fallback)
- `MultiBlocProvider` wraps `MaterialApp.router` with 17 providers
- `themeMode: ThemeMode.system` (light/dark auto)

#### 2. Dependency Injection (`core/di/injection.dart`)

All repositories and Cubits are registered as lazy singletons in get_it. `createProviders()` returns the `BlocProvider`s used app-wide:

`DiscoveryCubit`, `FavoritesCubit`, `HistoryCubit`, `ProfileCubit`, `NotificationsCubit`, `SubscriptionCubit`, `OfflineCubit`, `ReviewsCubit`, `AudioPlayerCubit`, `AuthorProfileCubit`, `StorytellingCubit`, `MusicCubit`, `MusicPlayerCubit`, `MyDoctorCubit`, `MyCaptainCubit`, `HabitsCubit`, `MessagingCubit`.

#### 3. Navigation (`core/navigation/app_router.dart`)

GoRouter routes — no auth redirect needed since the app has no authentication:

| Route | Path | Notes |
|-------|------|-------|
| Splash | `/` | Animated logo, auto-redirect to discovery |
| Discovery | `/discovery`, `/books` | Main browse |
| Book Detail | `/book/:id` | Book page |
| Search | `/search` | `?q=` query |
| Category | `/category/:id` | Browse by category |
| Author | `/author/:id` | Author profile |
| Reviews | `/reviews/:bookId` | Reviews list |
| Write Review | `/write-review/:bookId` | 5-star review |
| Audio Player | `/audio-player` | Full-screen player (book via `extra`) |
| E-book Reader | `/ebook-reader` | PDF reader (book via `extra`) |
| Storytelling | `/storytelling` | Stories |
| Music | `/music` | Music tracks list |
| Music Player | `/music-player` | Dedicated music player (track via `extra`) |
| My Doctor | `/my-doctor` | Health tips + doctors |
| My Captain | `/my-captain` | Achievements + leaderboard |
| Habits | `/habits` | Habit tracking |
| Favorites | `/favorites` | Saved books |
| History | `/history` | `?tab=reading\|listening` |
| Profile | `/profile` | User profile |
| Edit Profile | `/edit-profile` | Name + language |
| Devices | `/devices` | Registered devices |
| Notifications | `/notifications` | Notifications |
| Plans | `/plans` | Subscription plans |
| Payment Success | `/payment-success` | Celebration screen |
| Payment Failure | `/payment-failure` | Error + retry |
| Payment History | `/payment-history` | Payment list |
| Downloads | `/downloads` | Download manager |
| Menu | `/menu-all` | Central menu hub |
| Conversations | `/conversations` | Messaging list |
| Chat | `/chat/:conversationId` | Chat room (`otherUser` via `extra`) |

#### 4. Networking (`core/network/api_client.dart`)

Dio instance with two interceptors:

1. **Auth interceptor** (`onRequest`) — reads the access token from secure storage and attaches `Authorization: Bearer <token>`.
2. **Refresh interceptor** (`onError`) — on `401`:
   - If no refresh token → clear all storage, reject.
   - If already refreshing → enqueue a `Completer` in `_refreshQueue` and await it (prevents concurrent refresh).
   - Otherwise → set `_isRefreshing`, call `OAuthClient.refreshTokens()`, retry the original request, then complete/resolve the queue.
   - On refresh failure → clear storage and reject.

#### 5. Secure Storage (`core/storage/secure_storage.dart`)

`SecureStorageService` wraps `flutter_secure_storage`. Stores:

| Key | Purpose |
|-----|---------|
| `access_token` | JWT access token |
| `refresh_token` | JWT refresh token |
| `user_id` | Current user id |
| `device_id` | Device identifier |
| `dev_mode` | Dev-mode flag |
| `pkce_code_verifier` | PKCE code verifier (during login) |
| `pkce_state` | PKCE state (during login, CSRF) |

#### 6. Security (`core/security/security_service.dart`)

`SecurityService` exposes `isDeviceCompromised()` via a `MethodChannel('com.naik.naik_mobile/security')` — for root/jailbreak detection (returns `false` if the plugin is missing).

#### 7. Constants (`core/constants/app_constants.dart`)

| Constant | Value |
|----------|-------|
| API base (prod) | `https://api.bariisaa.com/api/v1` |
| API base (dev android) | `http://10.0.2.2:3000/api/v1` |
| API base (dev desktop) | `http://localhost:3000/api/v1` |
| Web-auth base (legacy, unused) | `https://auth.bariisaa.com` / `http://10.0.2.2:5173` / `http://localhost:5173` |
| OAuth client id (legacy) | `bariisaa-mobile` |
| Redirect URI (legacy) | `com.bariisaa.app://callback` |
| Max devices | `5` |
| Page size | `20` |
| Connect / receive timeout | `30s` |
| Audio skip forward / backward | `30s` / `10s` |
| Playback speeds | `0.5, 0.75, 1.0 … 3.0` (11 steps of 0.25) |
| Sleep timer minutes | `5, 10, 15, 30, 45, 60` |
| E-book font size range | `8.0 – 32.0` (step 2.0) |
| E-book font families | `Nunito, Inter, Georgia, Palatino` |

---

### Authentication — Mobile App (Auth-Free by Default)

The mobile app is **auth-free by default** — users open the app and are taken directly to the Discovery screen without any login or signup flow. No authentication is required to browse books, music, stories, or any public content.

**Auth feature code is retained** in `lib/features/auth/` for potential future use (guest signup, account upgrade flow, Telegram bot integration). The auth screens, cubit, and repository are present but not wired into the main navigation flow.

**What the backend provides:**
- Public content endpoints (books, music, storytelling, recommendations) return data without requiring a JWT token
- Admin panel uses JWT auth (`naik` / `naik123`) for management functions
- OAuth 2.0 PKCE endpoints are retained for future SSO / third-party integrations

**What remains in the mobile app:**
- `flutter_secure_storage` — stores a `dev_mode` flag for development
- `SecureStorageService` — simplified to dev-mode check only
- Backend auth endpoints — still active for admin panel login and future mobile auth
- Auth feature code — present but not activated in the navigation flow

---

### Screen Themes

- **Screen themes** (`ScreenTheme`, admin *Screen Appearance*): per-screen background image + avatar managed by the admin and served to the mobile app (`ScreenThemeCubit`). Mobile renders network image → bundled fallback → pastel gradient (never blank).

---

### Feature Modules

Each feature follows `data/` (repository), `domain/` (state), `presentation/` (cubit + screens).

| # | Feature | Screens | Description |
|---|---------|---------|-------------|
| 1 | `splash` | SplashScreen | Animated logo, direct to discovery |
| 2 | `discovery` | DiscoveryScreen, BookDetailScreen, SearchResultsScreen, CategoryBrowseScreen | Browsing, search, categories, book detail, **Netflix-style hero carousel** (280px full-bleed image, gradient overlay, Play CTA, auto-scroll), shelf sections (Books, Audio, Music, Stories, Explore) with 60%-width horizontal cards |
| 3 | `audio_player` | AudioPlayerScreen, MiniPlayerWidget | Full-screen player + persistent mini player |
| 4 | `ebook_reader` | EbookReaderScreen | PDF reader with themes, font size, bookmarks |
| 5 | `favorites` | FavoritesScreen | Saved books, toggle favorite |
| 6 | `history` | HistoryScreen | Reading + listening history (tabbed) |
| 7 | `profile` | ProfileScreen, EditProfileScreen, DevicesScreen | Profile, edit, device management |
| 8 | `notifications` | NotificationsScreen | Notifications with unread indicator |
| 9 | `subscription` | PlansScreen, PaymentSuccessScreen, PaymentFailureScreen, PaymentHistoryScreen | Plans, payments, coupons, history |
| 10 | `offline` | DownloadManagerScreen | Downloads with progress, pause/resume |
| 11 | `reviews` | ReviewsScreen, WriteReviewScreen | Reviews list + write review |
| 12 | `author_profile` | AuthorProfileScreen | Author page + books |
| 13 | `storytelling` | StorytellingScreen | Kids' stories |
| 14 | `music` | MusicScreen, MusicPlayerScreen | Music tracks + **dedicated player** with play/pause, next/prev, seek, speed, sleep timer, PDF viewer |
| 15 | `my_doctor` | MyDoctorScreen | Health tips + doctor profiles |
| 16 | `my_captain` | MyCaptainScreen | Achievements + leaderboard |
| 17 | `habits` | HabitsScreen | Habit tracking |
| 18 | `messaging` | ConversationsListScreen, ChatRoomScreen | Conversations + chat |

### Audio Player Features

| Feature | Details |
|---------|---------|
| Play/pause | Large yellow toggle button |
| Chapter navigation | Previous / next chapter by index |
| Skip | +30s forward, −10s backward |
| Playback speed | 0.5x – 3.0x in 0.25 steps (11 options) |
| Sleep timer | 5, 10, 15, 30, 45, 60 minutes |
| Bookmarks | Add/delete at current position (auth required) |
| Progress sync | Saves position to server every 30 seconds |
| Resume | Restores last position from history |
| Background audio | OS media controls via `audio_service` |
| Mini player | Persistent bottom bar (`KidsMiniPlayer`) |

### E-Book Reader Features

| Feature | Details |
|---------|---------|
| PDF rendering | `flutter_pdfview` |
| Themes | Light / sepia / dark |
| Font size | 8.0 – 32.0 (step 2.0) |
| Font family | Nunito, Inter, Georgia, Palatino |
| Bookmarks | Add/remove |
| Completion | Celebration on finish |
| Progress sync | Every 15 seconds |

### Offline Downloads

| Feature | Details |
|---------|---------|
| Download | Audio + PDF files to local storage |
| Progress | Per-item progress bars |
| Pause/resume | Cancel-token based |
| Delete | Individual or clear all |
| Storage tracking | MB usage display |
| Manifest | JSON file tracks download states |
| Auto-detect | Skips re-download if file exists |
| Offline playback | Player uses local file paths |

---

### Shared Widgets (`shared/widgets/shared_widgets.dart`)

| Widget | Description |
|--------|-------------|
| `ShimmerLoading` | Animated shimmer placeholder |
| `ShimmerBookCard` / `ShimmerListTile` | Shimmer skeletons |
| `MascotBubble` | Emoji mascot with preset states: `cheering` 🎉, `waving` 👋, `thinking` 🤔, `sleeping` 😴, `listening` 🎧, `reading` 📖, `oops` 😅, `empty` 📭, `loading` ⏳ |
| `BigTapButton` | Large animated button with scale-down press animation |
| `KidsBookCard` | Book card: cover, title, author, star rating, audio badge, progress bar |
| `CategoryBlob` | Circular gradient blob with emoji/icon + label |
| `FunSectionHeader` | Section header with icon + "All" link |
| `FunEmptyState` | Empty state with emoji + message + action |
| `FunErrorState` | Error state with emoji + retry button |
| `LoadingMascot` | Bouncing emoji with loading message |
| `ProgressBadge` | Circular progress indicator with % or ⭐ |
| `ParentGate` | Parental control: math question gate (uses `parentTheme`) |
| `ShelfRow` | Horizontal scrollable shelf |
| `KidsMiniPlayer` | Persistent mini audio player bar |
| `BookCard`, `SectionHeader`, `EmptyStateWidget`, `ErrorStateWidget` | Backward-compatible aliases |

### Auth Guard (`shared/widgets/auth_guard.dart`)

`AuthGuard` — static helpers: `isAuthenticated`, `isGuest`, `requireAuth`. `requireAuth` runs a callback if authenticated, otherwise shows a "Create Your Free Account" sign-in bottom sheet.

### Central Menu (`shared/widgets/menu_all_screen.dart`)

`MenuAllScreen` — central navigation hub with 3 sections (18 items):

- **Content** — Books, Storytelling, Music, My Doctor, My Captain, Habits
- **History** — Reading History, Listening History, Payment History
- **Account** — Profile, Edit Profile, Favorites, Downloads, Notifications, Messages, Plans, Devices, Search

---

### Data Models (`shared/models/models.dart`)

18 models:

| Model | Key fields |
|-------|-----------|
| `UserModel` | id, email, phone, name, avatarUrl, emailVerified, phoneVerified, status, preferredLanguage |
| `BookModel` | id, title, description, coverUrl, thumbnailUrl, language, isFeatured, isPremium, isFree, status, avgRating, ratingCount, viewCount, authors, categories, tags, audioFile, pdfFile |
| `AuthorModel` | id, name, bio, photoUrl |
| `CategoryModel` | id, name, description, slug |
| `AudioFileModel` | id, fileUrl, durationSeconds, fileSizeBytes, format, chapters |
| `AudioChapterModel` | id, title, startSeconds, endSeconds, trackOrder |
| `PdfFileModel` | id, fileUrl, pageCount, fileSizeBytes |
| `SubscriptionPlanModel` | id, name, durationMonths, price, currency, features, isActive |
| `SubscriptionModel` | id, plan, startDate, endDate, status, autoRenew (has `isActive`, `daysRemaining`) |
| `PaymentModel` | id, amount, currency, gateway, status, createdAt |
| `NotificationModel` | id, title, body, type, isRead, readAt, createdAt |
| `DeviceModel` | id, deviceUid, deviceName, platform, osVersion, lastActiveAt |
| `ReviewModel` | id, user, rating, content, createdAt |
| `BookmarkModel` | id, bookId, type, position, label, timestampSeconds, createdAt |
| `DownloadItemModel` | bookId, title, coverUrl, type, totalBytes, downloadedBytes, status, localPath (has `progress`, `isDownloading`, `isCompleted`, `isPaused`, `isFailed`, `isPending`) |
| `GuestProfile` | id, nickname, age, style, avatar, createdAt, isVerified, profileData (JSON — admin-managed sign-up field answers) |
| `ConversationModel` | id, otherUser, lastMessage, unreadCount, updatedAt |
| `LastMessageModel` | content, senderId, createdAt |
| `MessageModel` | id, conversationId, senderId, receiverId, content, isRead, readAt, createdAt, sender |

---

### Theme System (`core/theme/app_theme.dart`)

Three themes:

| Theme | Background | Primary | Text | Use case |
|-------|-----------|---------|------|----------|
| **Light (Kids)** | Primary Purple `#402083` | Gold `#FFD75A` | Cream `#F5F3E8` | Daytime |
| **Dark (Kids' Night)** | Deep Purple `#3D2081` | Gold `#FFD75A` | Cream `#F5F3E8` | Nighttime |
| **Parent Zone** | Gray `#F5F5F5` | Blue-Gray `#607D8B` | Dark `#444444` | Parental controls |

**Brand palette (Bariisaa — purple + gold):**

| Color | Hex | Role |
|-------|-----|------|
| Primary Purple | `#402083` | Main background |
| Deep Purple | `#3D2081` | Dark background |
| Card Purple | `#69539E` | Lesson cards |
| Light Purple | `#6F5AA3` | Card highlights |
| Accent Purple | `#4A2694` | Navigation / bottom area |
| Gold | `#FFD75A` | Active text & highlights |
| Cream | `#F5F3E8` | Main text |
| Soft White | `#EDEBED` | Secondary text / icons |

Semantic accents: playful red `#E8342E` (error), fresh green `#4CAF50` (success), pink `#F06292` (heart).

**Design tokens:**

| Token | Value |
|-------|-------|
| Card radius | `28.0` |
| Button radius | `999.0` (pill) |
| Chip radius | `999.0` (pill) |
| Blob radius | `28.0` |
| Min tap target | `56.0` |
| Display / headline / title / body / caption size | `36 / 30 / 24 / 18 / 14` |

**Text styles:** headings use `Baloo2` (w700), body uses `Nunito` (w600–w800), with `NotoSansEthiopic` + `NotoColorEmoji` fallbacks.

**Font sizes are deliberately large (6-year-old friendly)** and tap targets are a minimum of 56px.

---

### State Management (Cubits)

| Cubit | Purpose |
|-------|---------|
| `DiscoveryCubit` | Book browsing, search, categories, book detail, **featured hero carousel** (mixed music + books + stories with Netflix-style UI) |
| `AudioPlayerCubit` | Audio playback, speed, sleep timer, bookmarks |
| `EbookReaderCubit` | PDF reading, themes, font size, bookmarks |
| `FavoritesCubit` | Favorites management |
| `HistoryCubit` | Reading / listening history |
| `ProfileCubit` | User profile, avatar, devices |
| `NotificationsCubit` | Notifications |
| `SubscriptionCubit` | Plans, payments, coupons |
| `OfflineCubit` | Download management |
| `ReviewsCubit` | Book reviews |
| `AuthorProfileCubit` | Author pages |
| `StorytellingCubit` | Stories feature |
| `MusicCubit` | Music feature (list + categories) |
| `MusicPlayerCubit` | Dedicated music player (play/pause, seek, speed, sleep timer) |
| `MyDoctorCubit` | Health tips |
| `MyCaptainCubit` | Achievements, leaderboard |
| `HabitsCubit` | Habit tracking |
| `MessagingCubit` | Conversations / chat |

---

## Backend API

### Backend Architecture

- **Runtime:** Node.js 20.x + tsx/ts-node
- **Framework:** Express 4.x with modular routing (22 route modules, 42 route groups)
- **Database:** PostgreSQL 16 via Prisma ORM (50+ models, 3 migrations)
- **Validation:** Zod schemas on all inputs
- **Auth:** JWT access tokens (15m) + refresh tokens (30d) with rotation
- **Middleware:** Helmet, CORS, compression, rate limiting, audit logging
- **File Storage:** S3-compatible (MinIO) with local filesystem fallback
- **Logging:** Winston (console + file), uncaught-exception handler logs and exits
- **Process:** graceful shutdown on SIGTERM/SIGINT (server close + Prisma disconnect, 10s force)
- **Health:** `GET /health` and `GET /api/v1/health` → `{"status":"ok"}`
- **Docs:** Swagger UI at `/api/v1/docs` (`npm run swagger` to dump spec JSON)

### Authentication & Security

| Feature | Implementation |
|---------|---------------|
| Password Hashing | bcrypt with 12 rounds |
| JWT Access Token | 15-minute expiry with unique `jti` claim |
| JWT Refresh Token | 30-day expiry with rotation |
| Token Family Tracking | Detects token reuse (revokes family) |
| OAuth 2.0 PKCE | Authorization Code flow with PKCE (retained for SSO / third-party integrations) |
| Rate Limiting | 100 req/min general, stricter for auth endpoints |
| CORS | Configurable origins, wildcard blocked in production |
| Helmet | Full CSP, HSTS, frameguard, noSniff, XSS filter |
| HTTPS | Enforced in production |
| Bot Protection | Blocks scanner user-agents (sqlmap, nikto, nmap) |
| Request Validation | Zod schemas on all inputs |
| File Upload | Multer (memory storage, 10MB limit) |

### RBAC Model

**Role-Based Access Control** with granular permissions:

- **Roles (seeded):** `super_admin`, `admin`, `editor`, `moderator` (legacy `content_manager` / `support_agent` removed by migration `20261009000001_cleanup_legacy_roles`)
- **Permissions:** `resource:action` format (e.g., `books:create`, `users:read`)
- **Resources (20):** users, roles, books, categories, authors, subscriptions, payments, coupons, notifications, reports, audit, settings, media, storytelling, music, my-doctor, my-captain, habits, cms, filters
- **Actions:** create, read, update, delete (88 permissions for `super_admin`; admin 80, editor 44, moderator 15)
- `super_admin` bypasses all permission checks
- **Role assignment:** `PUT /api/v1/users/:id/roles` body `{"roleIds":["..."]}` (guards: no self-demotion, no removing the last super-admin; audited)
- Login responses include `user.roles: string[]`; `GET /api/v1/users` items include resolved roles for the admin panel

### Database Models (50+ Tables)

#### Identity & Access

| Model | Key Fields |
|-------|-----------|
| **User** | id, email, phone, passwordHash, name, avatarUrl, authProvider, status, fcmToken, preferredLanguage |
| **Role** | id, name, description |
| **Permission** | id, name, resource, action |
| **UserRole** | userId + roleId (many-to-many) |
| **RolePermission** | roleId + permissionId (many-to-many) |
| **RefreshToken** | id, userId, token, familyId, expiresAt, revokedAt |
| **OtpCode** | id, userId, code, purpose, attempts, expiresAt |
| **PasswordReset** | id, userId, token, expiresAt |
| **EmailVerification** | id, userId, token, expiresAt |
| **Device** | id, userId, deviceUid, deviceName, platform, osVersion, fcmToken |
| **OAuthClient** | id, clientId, clientSecret, name, redirectUris, grantTypes, scopes, isActive |
| **AuthorizationCode** | id, code, clientId, userId, redirectUri, codeChallenge, codeChallengeMethod, scopes, expiresAt, usedAt |
| **OAuthToken** | id, userId, clientId, accessToken, refreshToken, accessTokenExpiresAt, refreshTokenExpiresAt, scopes, revokedAt |

#### Content

| Model | Key Fields |
|-------|-----------|
| **Book** | id, title, description, coverUrl, thumbnailUrl, language, isbn, isFeatured, isPremium, isFree, status, viewCount, avgRating, ratingCount |
| **Author** | id, name, bio, photoUrl |
| **Category** | id, name, description, slug, parentId (self-referential) |
| **Tag** | id, name |
| **AudioFile** | id, bookId, fileUrl, durationSeconds, fileSizeBytes, format |
| **AudioChapter** | id, audioFileId, title, startSeconds, endSeconds, trackOrder |
| **PdfFile** | id, bookId, fileUrl, pageCount, fileSizeBytes |

#### User Engagement

| Model | Key Fields |
|-------|-----------|
| **Bookmark** | id, userId, bookId, type (AUDIO/PDF), position, timestampSeconds |
| **Note** | id, userId, bookId, content, position, pageNumber |
| **Highlight** | id, userId, bookId, selectedText, color, position |
| **Favorite** | id, userId, bookId (unique pair) |
| **Review** | id, userId, bookId, rating (1-5), content |
| **ReadingHistory** | id, userId, bookId, lastPosition, progressPercent |
| **ListeningHistory** | id, userId, bookId, lastTimestampSec, progressPercent |

#### Subscriptions & Payments

| Model | Key Fields |
|-------|-----------|
| **SubscriptionPlan** | id, name, durationMonths, price, currency, features (JSON), isActive |
| **Subscription** | id, userId, planId, startDate, endDate, status, autoRenew |
| **Payment** | id, userId, amount, currency, gateway, status, couponId, metadata |
| **Coupon** | id, code, discountType (percentage/fixed), discountValue, maxUses, expiresAt |

#### Other

| Model | Key Fields |
|-------|-----------|
| **Notification** | id, title, body, type, targetType, isRead |
| **Storytelling** | id, title, description, category, audioUrl, coverUrl, status |
| **Music** | id, title, artist, genre, audioUrl, coverUrl, status, duration |
| **HealthTip** | id, title, content, emoji, category, displayOrder |
| **DoctorProfile** | id, name, specialty, bio, photoUrl, isAvailable |
| **Achievement** | id, title, description, emoji, points, isHidden |
| **LeaderboardEntry** | id, playerName, score, rank |
| **Habit** | id, title, description, emoji, category |
| **Setting** | id, key, value, group, type |
| **AuditLog** | id, userId, action, resource, resourceId, ipAddress |

### API Endpoints (All 22 Route Modules)

#### Auth (`/api/v1/auth`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/signup/guest` | Rate-limited | Guest signup (name + profileData, no email/phone/password) |
| POST | `/login` | Rate-limited | Email/phone + password |
| POST | `/login/send-otp` | Rate-limited | Send OTP for phone |
| POST | `/login/otp` | Rate-limited | Verify OTP + login |
| POST | `/google` | Rate-limited | Google OAuth login |
| GET | `/verify-email` | Public | Verify email via token |
| POST | `/verify-phone` | Auth | Verify phone via OTP |
| POST | `/profile/email/send-otp` | Auth | Send OTP to verify email (post-signup) |
| POST | `/profile/email/verify` | Auth | Verify email OTP code |
| POST | `/profile/phone/send-otp` | Auth | Send OTP to verify phone (post-signup) |
| POST | `/profile/phone/verify` | Auth | Verify phone OTP code |
| POST | `/forgot-password` | Rate-limited | Request password reset |
| POST | `/reset-password` | Rate-limited | Reset with token |
| POST | `/refresh-token` | Public | Refresh access token |
| POST | `/logout` | Public | Revoke refresh token |
| POST | `/resend-email-verification` | Auth | Resend verification |
| POST | `/resend-phone-otp` | Auth | Resend phone OTP |

#### OAuth 2.0 (`/api/v1/oauth`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/authorize` | Bearer JWT | Get authorization URL with auth code (PKCE) |
| POST | `/token` | Public | Exchange code for tokens / Refresh tokens / Revoke |
| POST | `/revoke` | Public | Revoke access or refresh token |
| GET | `/userinfo` | Bearer OAuth | Get authenticated user info |
| GET | `/.well-known/openid-configuration` | Public | OpenID Connect discovery |

#### Users (`/api/v1/users`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/profile` | Auth | Get own profile |
| PUT | `/profile` | Auth | Update profile |
| PUT | `/avatar` | Auth | Upload avatar |
| GET | `/devices` | Auth | List devices |
| DELETE | `/devices/:id` | Auth | Remove device |
| GET | `/` | Admin | List all users (includes resolved `roles`) |
| GET | `/:id` | Admin | Get user by ID |
| PATCH | `/:id/status` | Admin | Update user status |
| PUT | `/:id/roles` | Admin | Assign roles `{roleIds: string[]}` (RBAC guards + audit) |
| POST | `/:id/reset-password` | Admin | Admin reset password |

#### Books (`/api/v1/books`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | Optional | List/search books (paginated, filterable) |
| GET | `/featured` | Public | Featured books |
| GET | `/trending` | Public | Trending (30-day views) |
| GET | `/new-releases` | Public | Newest published |
| GET | `/free` | Public | Free books |
| GET | `/:id` | Optional | Book detail with progress |
| POST | `/` | Admin | Create book (multipart) |
| PUT | `/:id` | Admin | Update book |
| DELETE | `/:id` | Admin | Archive (soft-delete) |
| PUT | `/:id/cover` | Admin | Upload cover |
| PUT | `/:id/thumbnail` | Admin | Upload thumbnail |
| POST | `/:id/audio` | Admin | Upload audio + chapters |
| DELETE | `/:id/audio/:audioId` | Admin | Delete audio file |
| POST | `/:id/pdf` | Admin | Upload PDF |
| DELETE | `/:id/pdf/:pdfId` | Admin | Delete PDF |

#### Categories (`/api/v1/categories`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | Public | List categories (tree) |
| GET | `/:id` | Public | Category with parent/children |
| POST | `/` | Admin | Create category |
| PUT | `/:id` | Admin | Update category |
| DELETE | `/:id` | Admin | Delete (only if no books) |

#### Authors (`/api/v1/authors`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | Public | List authors (paginated) |
| GET | `/:id` | Public | Author + books |
| POST | `/` | Admin | Create author |
| PUT | `/:id` | Admin | Update author |
| PUT | `/:id/photo` | Admin | Upload photo |
| DELETE | `/:id` | Admin | Delete (only if no books) |

#### Subscriptions (`/api/v1/subscriptions`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/plans` | Public | List active plans |
| GET | `/plans/:id` | Public | Get plan |
| POST | `/plans` | Admin | Create plan |
| PUT | `/plans/:id` | Admin | Update plan |
| POST | `/subscribe` | Auth | Subscribe to plan |
| POST | `/cancel` | Auth | Cancel subscription |
| GET | `/current` | Auth | Current subscription |
| GET | `/history` | Auth | Subscription history |

#### Payments (`/api/v1/payments`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/validate-coupon` | Auth | Validate coupon |
| POST | `/webhooks/stripe` | Public | Stripe webhook |
| POST | `/webhooks/chapa` | Public | Chapa webhook |
| POST | `/webhooks/telebirr` | Public | Telebirr callback |
| GET | `/` | Auth | Own payment history |
| GET | `/:id` | Auth | Payment by ID |
| GET | `/admin/all` | Admin | All payments |

#### Favorites (`/api/v1/favorites`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | Auth | Paginated favorites |
| POST | `/toggle` | Auth | Toggle favorite |
| GET | `/check/:bookId` | Auth | Check if favorited |

#### Reviews (`/api/v1/reviews`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/book/:bookId` | Public | Paginated reviews |
| GET | `/book/:bookId/rating` | Public | Rating + distribution |
| POST | `/` | Auth | Create review (requires subscription) |
| PUT | `/:id` | Auth | Update own review |
| DELETE | `/:id` | Auth | Delete own review |

#### Bookmarks (`/api/v1/bookmarks`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | Auth | Paginated bookmarks |
| GET | `/book/:bookId` | Auth | Bookmarks for a book |
| POST | `/` | Auth | Create bookmark |
| DELETE | `/:id` | Auth | Delete bookmark |

#### History (`/api/v1/history`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| PUT | `/reading/progress` | Auth | Update reading progress |
| PUT | `/listening/progress` | Auth | Update listening progress |
| GET | `/reading/continue` | Auth | Continue reading books |
| GET | `/listening/continue` | Auth | Continue listening books |
| GET | `/reading` | Auth | Reading history |
| GET | `/listening` | Auth | Listening history |
| DELETE | `/reading/all` | Auth | Clear reading history |
| DELETE | `/listening/all` | Auth | Clear listening history |
| DELETE | `/reading/:id` | Auth | Delete reading entry |
| DELETE | `/listening/:id` | Auth | Delete listening entry |

#### Notifications (`/api/v1/notifications`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | Auth | Paginated notifications |
| GET | `/unread-count` | Auth | Unread count |
| PUT | `/read-all` | Auth | Mark all read |
| PUT | `/:id/read` | Auth | Mark one read |
| DELETE | `/:id` | Auth | Delete notification |
| POST | `/send` | Admin | Send push + DB notification |

#### Storytelling (`/api/v1/storytelling`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | Public | List stories (paginated) |
| GET | `/categories/:category` | Public | By category |
| GET | `/:id` | Public | Story detail |
| POST | `/` | Admin | Create story |
| PUT | `/:id` | Admin | Update story |
| DELETE | `/:id` | Admin | Delete story |

#### Music (`/api/v1/music`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | Public | List tracks (paginated) |
| GET | `/categories/:category` | Public | By genre |
| GET | `/:id` | Public | Track detail |
| POST | `/` | Admin | Create track |
| PUT | `/:id` | Admin | Update track |
| DELETE | `/:id` | Admin | Delete track |

#### My Doctor (`/api/v1/my-doctor`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/tips` | Public | Health tips |
| GET | `/tips/:id` | Public | Tip detail |
| GET | `/profiles` | Public | Doctor profiles |
| GET | `/profiles/:id` | Public | Doctor detail |
| POST | `/tips` | Admin | Create tip |
| PUT | `/tips/:id` | Admin | Update tip |
| DELETE | `/tips/:id` | Admin | Delete tip |
| POST | `/profiles` | Admin | Create doctor |
| PUT | `/profiles/:id` | Admin | Update doctor |
| DELETE | `/profiles/:id` | Admin | Delete doctor |

#### My Captain (`/api/v1/my-captain`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/achievements` | Public | List achievements |
| GET | `/achievements/:id` | Public | Achievement detail |
| GET | `/leaderboard` | Public | Leaderboard |
| POST | `/achievements` | Admin | Create achievement |
| PUT | `/achievements/:id` | Admin | Update achievement |
| DELETE | `/achievements/:id` | Admin | Delete achievement |

#### Reports (`/api/v1/reports`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/dashboard` | Admin | Total users, books, subs, revenue |
| GET | `/revenue` | Admin | Revenue by day/gateway/plan |
| GET | `/users` | Admin | Signups, active, churn |
| GET | `/subscriptions` | Admin | New, renewals, cancellations |
| GET | `/engagement` | Admin | Books read, listening time |
| GET | `/export/revenue` | Admin | Export CSV/PDF/JSON |
| GET | `/export/users` | Admin | Export CSV/PDF/JSON |

#### Other Modules

| Module | Endpoint Prefix | Endpoints |
|--------|----------------|-----------|
| **Roles** | `/api/v1/roles` | List, get, create, update, delete + permissions list |
| **Coupons** | `/api/v1/coupons` | List, get, create, update, delete |
| **Devices** | `/api/v1/devices` | Register, list, delete, update FCM token |
| **Notes** | `/api/v1/notes` | List, get by book, create, update, delete |
| **Highlights** | `/api/v1/highlights` | List, get by book, create, delete |
| **Recommendations** | `/api/v1/recommendations` | Personalized + fallback (public, no auth required) |
| **Audit Logs** | `/api/v1/audit-logs` | Filterable paginated list |
| **Settings** | `/api/v1/settings` | Get all, bulk update, update single |

### Payment Integration

| Gateway | Webhook Endpoint | Currency |
|---------|-----------------|----------|
| **Stripe** | `/api/v1/payments/webhooks/stripe` | USD, EUR, GBP |
| **Chapa** | `/api/v1/payments/webhooks/chapa` | ETB |
| **Telebirr** | `/api/v1/payments/webhooks/telebirr` | ETB |

---

## Admin Panel

### Architecture

- **Framework:** React 18 + TypeScript
- **Build Tool:** Vite 5
- **UI Library:** MUI 6 (Material UI)
- **State:** Zustand 5 (auth, UI, notifications) + TanStack React Query 5 (server state)
- **Routing:** react-router-dom v6 with PrivateRoute guard
- **HTTP:** Axios with Bearer token + 401 refresh interceptor
- **Charts:** Recharts

**Authentication:** login-only. The admin panel exposes a single `/login` route (username + password → dashboard). Sign-up, forgot-password, OTP, Google, and OAuth routes have been removed from `App.tsx`.

**Role gating:** `PrivateRoute` checks the logged-in user's `roles[]` (returned by the API) and renders an "Unauthorized" screen for disallowed routes; `Layout` hides nav items the current role cannot access (`hasRole()`); root paths are mounted at both `/` and `/admin` (SPA fallback via `admin/public/_redirects`).

### Pages (16 Routes)

| Page | Route | Description |
|------|-------|-------------|
| **Login** | `/login` | Admin authentication |
| **Dashboard** | `/` | 4 stat cards, revenue line chart, signups bar chart, recent payments |
| **Books** | `/books` | DataTable with tabs (All/Draft/Published/Archived), CRUD |
| **Book Form** | `/books/new`, `/books/:id/edit` | Full book editor with file uploads (cover, audio, PDF) |
| **Book Detail** | `/books/:id` | Cover, metadata, audio/PDF files |
| **Categories** | `/categories` | CRUD with image upload |
| **Authors** | `/authors` | CRUD with photo upload |
| **Users** | `/users` | Status tabs (server-side filter), search, role chips, bulk status actions, **Assign Roles dialog** |
| **Admins** | `/admins` | Admin user management: create, **assign roles** (super_admin/admin/editor/moderator), status |
| **Media** | `/media` | Media manager (uploaded files browser) |
| **Roles** | `/roles` | Permission matrix (18 resources x 4 actions) |
| **Plans** | `/subscriptions` | Subscription plan management |
| **Coupons** | `/coupons` | Discount coupon CRUD |
| **Payments** | `/payments` | Payment history, refund support |
| **Storytelling** | `/storytelling` | Story CRUD |
| **Music** | `/music` | Track CRUD (cover, audio, PDF upload) |
| **My Doctor** | `/my-doctor` | Health tips + doctor profiles |
| **My Captain** | `/my-captain` | Achievements + leaderboard |
| **Notifications** | `/notifications` | Compose + send push notifications |
| **Reports** | `/reports` | Revenue, users, subscriptions, engagement charts |

### Shared Components

| Component | Description |
|-----------|-------------|
| `Layout` | Collapsible sidebar (260px/76px), top bar, health check |
| `DataTable` | Generic table with search, sort, pagination, skeleton loading |
| `PageHeader` | Title + subtitle + optional action button |
| `StatCard` | Animated counting card with trend indicator |
| `StatusChip` | Color-coded status badge |
| `ConfirmDialog` | Destructive action confirmation |
| `FileUpload` | Drag-and-drop with progress, reorder, preview |
| `EmptyState` | No-data placeholder |
| `FadeIn` | CSS fade-in-up animation wrapper |
| `SlideInCard` | Slide-in animation for list items (used in Signup Fields) |

---

## Project Structure

```
naik/
├── .github/workflows/          # CI/CD pipelines
│   ├── ci.yml                  # Lint, type-check, test
│   ├── deploy-android.yml      # Build AAB + deploy to Play Store
│   └── deploy-backend.yml      # Deploy backend via SSH + PM2
│
├── docs/                       # Documentation
│   ├── API_DOCS.md
│   ├── ARCHITECTURE.md
│   ├── DEPLOYMENT_GUIDE.md
│   ├── ERD.md
│   ├── MOBILE.md               # Mobile app documentation
│   ├── SECURITY_CHECKLIST.md
│   ├── SETUP_GUIDE.md
│   ├── SRS.md
│   ├── STORE_SUBMISSION.md
│   └── TESTING_GUIDE.md
│
├── backend/                    # Node.js/Express API
│   ├── src/
│   │   ├── config/             # Database, env, Firebase, payment, storage
│   │   ├── middleware/         # Auth, authorize, validate, rateLimiter, upload, auditLog
│   │   ├── modules/           # 23 route modules
│   │   │   ├── auth/          # Email/phone login, OTP, password reset (admin only)
│   │   │   ├── oauth/         # OAuth 2.0 Authorization Code + PKCE (retained)
│   │   │   │   ├── pkce.ts           # PKCE utilities
│   │   │   │   ├── oauth.routes.ts   # /oauth/authorize, /token, /revoke, /userinfo
│   │   │   │   ├── oauth.controller.ts
│   │   │   │   ├── oauth.service.ts
│   │   │   │   └── oauth.validation.ts
│   │   │   └── <module>/
│   │   │       ├── <module>.routes.ts
│   │   │       ├── <module>.controller.ts
│   │   │       ├── <module>.service.ts
│   │   │       └── <module>.validation.ts
│   │   ├── types/             # TypeScript types
│   │   ├── utils/             # crypto, email, otp, push, sms, signedUrl
│   │   ├── app.ts             # Express app setup (44 route groups)
│   │   └── server.ts          # Entry point
│   ├── prisma/
│   │   ├── schema.prisma      # 50+ models (incl. OAuthClient, AuthorizationCode, OAuthToken)
│   │   ├── seed.ts            # Default data + bariisaa-mobile OAuth client
│   │   └── migrations/
│   ├── .well-known/           # App Links / Universal Links verification
│   │   ├── assetlinks.json
│   │   └── apple-app-site-association
│   ├── test/
│   └── package.json
│
├── mobile/                     # Flutter mobile app
│   ├── lib/
│   │   ├── core/
│   │   │   ├── constants/     # App constants
│   │   │   ├── di/            # Dependency injection (get_it)
│   │   │   ├── navigation/    # GoRouter setup
│   │   │   ├── network/       # Dio API client
│   │   │   ├── security/      # Security service
│   │   │   ├── storage/       # Secure storage (dev-mode flag)
│   │   │   └── theme/         # Light/Dark/Parent themes
│   │   ├── features/          # Feature modules
│   │   │   └── <feature>/
│   │   │       ├── data/      # Repository
│   │   │       ├── domain/    # State classes
│   │   │       └── presentation/  # Cubit + Screen
│   │   ├── shared/
│   │   │   ├── models/        # All data models
│   │   │   ├── styles.dart       # Shared text styles (AppStyles)
│   │   │   └── widgets/       # shared_widgets, menu_all_screen
│   │   ├── firebase_options.dart
│   │   └── main.dart
│   ├── assets/
│   │   ├── images/            # Logo, screenshots
│   │   ├── videos/            # Splash animation (declared in pubspec.yaml)
│   │   ├── fonts/             # NotoSansEthiopic, Roboto, NotoColorEmoji, Baloo2, Nunito
│   │   └── icons/
│   ├── android/
│   ├── ios/
│   ├── web/
│   └── pubspec.yaml
│
├── admin/                      # React admin panel (login-only)
│   ├── src/
│   │   ├── auth/              # Login page
│   │   ├── pages/             # 16+ admin page components
│   │   ├── components/        # Layout, DataTable, FileUpload, etc.
│   │   ├── services/          # Axios API client
│   │   ├── store/             # Zustand (auth, UI, notifications)
│   │   ├── types/             # TypeScript interfaces
│   │   └── theme/             # MUI theme
│   ├── public/
│   └── package.json
│
├── final.png                   # Screenshots
├── screen.png
├── screen2.png
├── screen_ok.png
├── screen_final.png
├── vrun.png
├── last.png
├── final2.png
├── s.png
└── README.md
```

---

## Commands Reference

### Mobile

```bash
cd mobile
flutter pub get              # Install dependencies
flutter run                  # Run on emulator (interactive)
flutter run -d <device-id>   # Run on specific device
flutter build apk --debug    # Build debug APK
flutter build apk --release  # Build release APK
flutter build appbundle      # Build AAB for Play Store
flutter analyze              # Run Dart analyzer
flutter test                 # Run unit tests
flutter clean                # Clear build cache
flutter pub outdated         # Check outdated packages
```

### Backend

```bash
cd backend
npm install                  # Install dependencies
npm run dev                  # Start dev server (ts-node-dev)
npm run build                # Compile TypeScript
npm start                    # Production server
npm test                     # Jest with coverage
npm run lint                 # ESLint
npm run prisma:studio        # Prisma GUI
npm run swagger              # Print/dump OpenAPI spec
npx prisma migrate deploy    # Apply migrations (use this, not migrate dev)
npx prisma db seed           # Seed default data
```

### Admin Panel

```bash
cd admin
npm install                  # Install dependencies
npm run dev                  # Vite dev server (port 5173)
npm run build                # Production build
npm run preview              # Preview production build
```

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default: 3000) |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_ACCESS_SECRET` | Yes | Access token signing secret |
| `JWT_REFRESH_SECRET` | Yes | Refresh token signing secret |
| `JWT_ACCESS_EXPIRY` | No | Access token expiry (default: 15m) |
| `JWT_REFRESH_EXPIRY` | No | Refresh token expiry (default: 30d) |
| `CORS_ORIGIN` | No | Allowed origins (comma-separated) |
| `STRIPE_SECRET_KEY` | No | Stripe payment gateway key |
| `STRIPE_WEBHOOK_SECRET` | No | Stripe webhook signing secret |
| `CHAPA_SECRET_KEY` | No | Chapa payment gateway key |
| `CHAPA_WEBHOOK_SECRET` | No | Chapa webhook secret |
| `TELEBIRR_APP_ID` | No | Telebirr app ID |
| `TELEBIRR_APP_KEY` | No | Telebirr app key |
| `AFRICASTALKING_API_KEY` | No | Africa's Talking API key |
| `AFRICASTALKING_USERNAME` | No | Africa's Talking username |
| `SMTP_HOST` | No | Email SMTP host |
| `SMTP_PORT` | No | Email SMTP port |
| `SMTP_USER` | No | Email SMTP username |
| `SMTP_PASS` | No | Email SMTP password |
| `SMTP_FROM` | No | Email sender address |
| `AWS_S3_BUCKET` | No | S3 bucket name |
| `AWS_S3_REGION` | No | S3 region |
| `AWS_ACCESS_KEY_ID` | No | S3 access key |
| `AWS_SECRET_ACCESS_KEY` | No | S3 secret key |
| `FIREBASE_PROJECT_ID` | No | Firebase project ID |
| `FIREBASE_PRIVATE_KEY` | No | Firebase private key |
| `FIREBASE_CLIENT_EMAIL` | No | Firebase client email |
| `UPLOAD_DIR` | No | Local upload directory (default: ./uploads) |
| `MAX_FILE_SIZE` | No | Max upload size in bytes (default: 10485760) |
| `S3_ENDPOINT` / `S3_REGION` / `S3_BUCKET` / `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY` | No | S3-compatible object storage (MinIO/S3) for files |
| `R2_ACCOUNT_ID` / `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` / `R2_BUCKET_NAME` / `R2_ENDPOINT` | No | Cloudflare R2 for large media (direct-to-R2 presigned uploads) |
| `SEED_ADMIN_PASSWORD` | Prod | Required in production; seed aborts if unset |
| `TELEGRAM_BOT_TOKEN` | No | Telegram bot integration |
| `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_FROM_NUMBER` | No | Twilio SMS/OTP |

---

## Default Credentials

After running `npx prisma db seed`:

| Field | Value |
|-------|-------|
| **Admin Login** | `naik` |
| **Admin Password** | `naik123` (dev default) — **production requires `SEED_ADMIN_PASSWORD` env, seed aborts without it** |
| **Admin Role** | `super_admin` |

**Testing the admin login:** credentials `naik` / `naik123` work in the admin panel at `http://localhost:5173`.

**Seed also creates:**
- `super_admin`, `admin`, `editor`, `moderator` roles (legacy roles removed)
- Permission catalog: 20 resources x up to 4 actions (88 for super_admin)
- Default plans: Monthly ($4.99), Annual ($39.99)
- Default app settings
- `bariisaa-mobile` OAuth client (for PKCE authentication)

---

## License

Proprietary and confidential.

---

### Build Environment Notes

The Android toolchain has been upgraded (verified — debug + release APKs build and run):

| Component | Version | Notes |
|-----------|---------|-------|
| Gradle | 9.1.0 | `gradle-wrapper.properties` |
| Android Gradle Plugin (AGP) | 9.0.1 | `settings.gradle` (`android.builtInKotlin=false`, `android.newDsl=false`) |
| Kotlin | 2.3.20 | Built-in Kotlin plugin mode |
| JDK | 21 | Required by AGP 9; CI uses `java-version: 21` |

Release signing reads `mobile/android/key.properties` (git-ignored; falls back to debug signing when absent — see `mobile/android/app/build.gradle.kts`). ProGuard/R8 rules in `mobile/android/app/proguard-rules.pro` (incl. Play Core `-dontwarn` fix).

---

### Codebase Audit: Bugs, Anti-Patterns & Crashes

> Generated from a thorough static + structural analysis of `mobile/lib/`. Prioritizes **CRASHES** and **DATA LOSS** first.

### Summary Table

| # | Severity | Category | File | Issue |
|---|----------|----------|------|-------|
| 1 | **CRITICAL** | Audio | `audio_player/data/audio_handler.dart` | `BariisaaTvAudioHandler` has its own `AudioPlayer` instance, completely disconnected from `AudioPlayerCubit`'s `_player`. Background audio controls (OS media keys, lock screen) control a silent player while the UI player plays on a separate instance. |
| 2 | **CRITICAL** | Audio | `audio_player/presentation/audio_player_cubit.dart` | `play()`, `pause()`, `togglePlayPause()`, `seek()`, `skipForward()`, `skipBackward()`, `seekToChapter()`, `setPlaybackSpeed()` — all call `_player` methods without checking `_closed`. After `close()`, these throw `StateError`. |
| 3 | **CRITICAL** | Audio | `audio_player/presentation/audio_player_cubit.dart` | `loadBook()` emits `AudioPlayerLoading()` → `AudioPlayerLoaded()` without `if (isClosed)` guard. If the widget is disposed during async `setAudioSource()`, the second `emit()` throws `StateError`. |
| 4 | **CRITICAL** | Audio | `audio_player/presentation/audio_player_cubit.dart` | `setSleepTimer()`, `cancelSleepTimer()` call `emit()` without `isClosed` check. Called after `close()`, they throw. |
| 5 | **CRITICAL** | Audio | `audio_player/presentation/audio_player_cubit.dart` | `_startProgressSync()` creates `Timer.periodic(30s)` that captures `bookId`. If `loadBook()` is called with a different book, the old timer still fires `saveProgress` for the stale bookId until `_startProgressSync` cancels it (which it does, but only when `loadBook` is called again). |
| 6 | **CRITICAL** | Auth | `auth/presentation/auth_cubit.dart` | `_deepLinkHandler` is instantiated as `final DeepLinkHandler _deepLinkHandler = DeepLinkHandler()` (field initializer). This runs **before** `setupDependencies()` registers `getIt`, so `DeepLinkHandler._oauthClient._secureStorage` getter (which calls `getIt<SecureStorageService>()`) will throw if `_exchangeCode` is called before `setupDependencies`. |
| 7 | **CRITICAL** | Auth | `auth/presentation/auth_cubit.dart` | `_onAuthCallback()` is an async void function that calls `emit()` without `isClosed` guard. If `AuthCubit.close()` is called while the callback is mid-flight, `emit(AuthAuthenticated(...))` throws. |
| 8 | **CRITICAL** | Auth | `auth/presentation/auth_cubit.dart` | `login()`, `loginWithGoogle()`, `completeGuestSignup()` are `async void` (not `Future<void>`). Any uncaught exception is silently swallowed by Flutter's zone — no error is visible to the user. |
| 9 | **CRITICAL** | Auth | `auth/presentation/auth_cubit.dart` | `startLogin()` (PKCE OAuth) does **not** clear `code_verifier` on failure. If the user cancels or the flow fails, the `pkce_code_verifier` remains in secure storage indefinitely. `handleCallback` checks for it but never cleans up on error. |
| 10 | **CRITICAL** | Auth | `auth/presentation/auth_cubit.dart` | `handleCallback()` and `DeepLinkHandler._handleLink()` both independently exchange the OAuth code. Race condition: if both paths trigger, two `POST /oauth/token` requests fire simultaneously, potentially double-issuing tokens or causing a 409 conflict. |
| 11 | **CRITICAL** | Network | `core/network/api_client.dart` | `_refreshTokenInterceptor` checks `error.response?.statusCode == 401`. If `error.response` is null (network error, timeout), the condition fails and `handler.reject(error)` is called — **correct**. But if `refreshAccessToken()` itself throws a non-401 error (e.g., `Exception('No refresh token')`), it's caught in the outer catch, `_secureStorage.deleteAll()` is called, `onSessionExpired?.call()` fires — **this logs the user out even though the original request was not a 401**. |
| 12 | **CRITICAL** | Network | `core/network/api_client.dart` | `_authInterceptor` calls `await _secureStorage.read(key: AppConstants.accessTokenKey)` on **every single HTTP request**. Secure storage reads are expensive (platform channel IPC). This adds ~10-50ms latency to every API call. Should cache the token in memory and refresh from storage on token change. |
| 13 | **CRITICAL** | Navigation | `core/navigation/app_router.dart` | `AudioPlayerScreen` route builder does `state.extra as BookModel?` — if `extra` is not a `BookModel`, it throws a `CastError`. `MiniPlayerWidget` pushes with `extra: book`, but if any other code pushes to `/audio-player` without `extra`, it crashes with "No book provided". |
| 14 | **CRITICAL** | Navigation | `core/navigation/app_router.dart` | Same cast issue for `EbookReaderScreen`: `final book = state.extra as BookModel?` — any route to `/ebook-reader` without `extra: book` crashes. |
| 15 | **CRITICAL** | Widget | `features/ebook_reader/presentation/ebook_reader_screen.dart` | `BlocProvider(create: (_) => EbookReaderCubit(...))` is inside the `build` method of a `StatelessWidget`. Every parent rebuild creates a **new cubit**, leaking the previous one (and its `StreamSubscription`s from pdfrx). Should be at the route level or use `BlocProvider.value`. |
| 16 | **CRITICAL** | Widget | `features/ebook_reader/presentation/ebook_reader_screen.dart` | `PdfViewer.file()` / `PdfViewer.uri()` creates a new `PdfController` on every `build()`. The old controller is never disposed. `dispose()` only cancels `_scrollController` and `_fadeController` — **not the PDF controller**. |
| 17 | **CRITICAL** | Audio | `audio_player/presentation/audio_player_cubit.dart` | `_positionSub`, `_durationSub`, `_playerStateSub` are `StreamSubscription`s on `AudioPlayer` instance fields. In `close()`, `_player.dispose()` is called **before** `_positionSub?.cancel()`. `AudioPlayer.dispose()` may close the streams synchronously, making the cancellation a no-op. |
| 18 | **HIGH** | Audio | `audio_player/presentation/audio_player_cubit.dart` | `AudioPlayerCubit._closed` boolean is set to `true` in `close()`, but `AudioPlayer` methods (`play()`, `pause()`, etc.) are called without checking `_closed`. The `_closed` flag is checked in stream listeners but **not** in public methods. |
| 19 | **HIGH** | Audio | `audio_player/data/audio_handler.dart` | `BariisaaTvAudioHandler` is defined but **never registered** in `injection.dart` and **never initialized** in `main.dart`. `audio_service` package is a dependency but completely unused. Background audio, lock screen controls, and Bluetooth headset controls are non-functional. |
| 20 | **HIGH** | Audio | `audio_player/presentation/audio_player_cubit.dart` | `skipForward()` uses `current.inSeconds + AppConstants.audioSkipForward.toInt()`. If `AppConstants.audioSkipForward` is a `Duration` with non-zero milliseconds, `toInt()` truncates. Also, `seek()` with a `Duration` beyond the audio duration is not clamped. |
| 21 | **HIGH** | Auth | `auth/presentation/auth_cubit.dart` | `checkAuthStatus()` calls `await _repository.tryRefreshAccessToken()` without checking `isClosed`. If the cubit is closed during the refresh, `emit(AuthAuthenticated(...))` throws. |
| 22 | **HIGH** | Auth | `auth/presentation/auth_cubit.dart` | `continueAsGuest()` and `logout()` are `async void`. If `_repository.logout()` throws, the error is swallowed and `emit(AuthLoggedOut())` is never reached. |
| 23 | **HIGH** | Offline | `offline/data/offline_repository.dart` | `startDownload()` uses `final fileName = '${book.id}_${type}_$rawName'` — if two different books share the same ID (possible with soft-deleted books), files collide. The `pauseDownload` method uses `_cancelTokens['${bookId}_$type']` which may not match the key stored during `startDownload`. |
| 24 | **HIGH** | Offline | `offline/data/offline_repository.dart` | `clearAllDownloads()` calls `downloadDir.delete(recursive: true)` but `_cancelTokens` may have stale entries from completed downloads that were already removed from the manifest. `pauseDownload` is called for all tokens but some may have been removed by the `finally` block in `startDownload`. |
| 25 | **HIGH** | Offline | `offline/data/offline_repository.dart` | `resumeDownload()` re-fetches the book from the API (`GET /books/${item.bookId}`) instead of using the `DownloadItemModel` data already available. This wastes a network call and fails if the book was deleted. |
| 26 | **HIGH** | Offline | `offline/presentation/offline_cubit.dart` | `startDownload()` emits optimistic state update but `_repository.startDownload()` runs in the background. If `isClosed` is checked after the emit but before the download completes, the state update references stale data. |
| 27 | **HIGH** | Network | `core/network/api_client.dart` | If `refreshAccessToken()` succeeds but `_secureStorage.read(key: AppConstants.accessTokenKey)` returns null (storage race condition), the code falls into `throw Exception('Access token null after refresh')`. The catch block calls `_secureStorage.deleteAll()` and `onSessionExpired?.call()` — **logging out the user on a race condition**. |
| 28 | **HIGH** | Widget | `features/splash/presentation/splash_screen.dart` | `_timeoutTimer` calls `context.read<AuthCubit>()` after 5 seconds. If the `AuthCubit` was closed (e.g., app backgrounded), this throws `Bad state: Cannot read from a closed provider`. No `mounted` check before `context.read`. |
| 29 | **HIGH** | Widget | `features/splash/presentation/splash_screen.dart` | `_checkStatus()` is called without `await`. If the splash screen is disposed before `_checkStatus` completes, `context.read<OnboardingCubit>().enterGuestMode()` and `context.read<AuthCubit>().continueAsGuest()` execute on potentially stale contexts. |
| 30 | **HIGH** | Widget | `features/splash/presentation/splash_screen.dart` | `_timeoutTimer` fires and checks `state is AuthInitial || state is AuthLoading` — but `_checkStatus()` might still be running and emitting `AuthLoading`. Race condition between the timer and the async check. |
| 31 | **HIGH** | E-Book | `features/ebook_reader/presentation/ebook_reader_screen.dart` | `saveProgress()` is called every 15 seconds via `Timer.periodic` in `AudioPlayerCubit._startProgressSync`. No debounce. If the user is actively reading, this makes an API call every 15 seconds indefinitely. |
| 32 | **MEDIUM** | Audio | `audio_player/presentation/audio_player_screen.dart` | `AudioPlayerScreen.build` creates `BlocProvider.value(value: context.read<AudioPlayerCubit>()..loadBook(book))`. `loadBook(book)` is called every time the widget rebuilds (e.g., on rotation), restarting audio playback. |
| 33 | **MEDIUM** | Audio | `audio_player/presentation/audio_player_screen.dart` | `context.read<AudioPlayerCubit>().seek(...)` in `Slider.onChanged` — called on every finger drag. Creates excessive state emissions. Should debounce. |
| 34 | **MEDIUM** | Audio | `audio_player/presentation/mini_player_widget.dart` | `MiniPlayerWidget` pushes `AppRoutes.audioPlayer` with `extra: book` AND `AudioPlayerScreen` receives it and calls `loadBook(book)` again. The audio player resets on every tap. |
| 35 | **MEDIUM** | Widget | `features/ebook_reader/presentation/ebook_reader_screen.dart` | `_onScroll` listener in `initState` captures `widget.book`. If the book changes (e.g., deep link to a different book), the scroll listener still references the old `BookModel`. |
| 36 | **MEDIUM** | Widget | `shared/widgets/shared_widgets.dart` | `AnimatedLogo` widget extends `StatefulWidget` with `SingleTickerProviderStateMixin`. Its `_controller` is created with `duration: 1600ms` but never set to repeat by default (`loop` defaults to `false`). The animation plays once and stops. |
| 37 | **MEDIUM** | Widget | `features/auth/presentation/signup_screen.dart` | `BariiSignupScreen` uses `_answers` map (`Map<String, dynamic>`) without type safety. `_answers['age']` could be `null`, `int`, or `String`. `int.tryParse(_answers['age']?.toString() ?? '')` is fragile. |
| 38 | **MEDIUM** | Widget | `features/auth/presentation/signup_screen.dart` | `_nameController.addListener(() { setState(() {}); })` causes a rebuild on every keystroke just to check `_showNameError`. Should use `debounce` or only `setState` when `_showNameError` actually changes. |
| 39 | **MEDIUM** | Widget | `features/discovery/presentation/discovery_screen.dart` | `PageView.builder` with `onPageChanged: (i) => setState(() => _forYouPageIndex = i)` — if `books` list changes, `_forYouPageIndex` could go out of bounds. |
| 40 | **MEDIUM** | Network | `core/network/api_client.dart` | `refreshAccessToken()` does not check if the refresh token is expired before sending. If the refresh token is also expired, the server returns 401, which triggers the refresh interceptor again — **infinite loop** (the `_isRefreshing` flag prevents concurrent calls, but if the refresh itself fails, `handler.reject(error)` is called after `onSessionExpired`). |
| 41 | **LOW** | Security | `core/storage/secure_storage.dart` | `clearAll()` saves `has_used_guest` after `deleteAll()`. If the app crashes between `deleteAll()` and `setHasUsedGuest()`, the guest flag is lost. Should use atomic write. |
| 42 | **LOW** | Security | `core/storage/secure_storage.dart` | `isDevMode()` has a race condition: `_devModeChecked` is set to `true` after the first call, but the value is cached in `_devModeCache`. If `setDevMode()` is called later, `isDevMode()` returns stale data. |
| 43 | **LOW** | Network | `core/auth/oauth_client.dart` | `exchangeCode()` and `refreshTokens()` both create a new `Dio` instance each time. No connection pooling. Should reuse a single `Dio` instance. |
| 44 | **LOW** | Widget | `features/music/presentation/music_screen.dart` | `_openPlayer()` calls `context.read<MusicCubit>().resolvePlayUrl(id)` which calls `emit(state.copyWithResolvedUrl(...))`. If `state` is not `MusicLoaded`, the emit is skipped (guarded by `if (state is MusicLoaded)`), but `resolvePlayUrl` still returns the URL from the repository. The `BookModel` is constructed with `fileUrl: resolvedUrl ?? _s(track['audioUrl']) ?? ''` — if both are null, empty string, which causes `AudioPlayer.setAudioSource(AudioSource.uri(Uri.parse('')))` to fail. |
| 45 | **LOW** | Dependency | `mobile/pubspec.yaml` | `video_player: ^2.9.2` declared but `assets/videos/` was missing from `flutter.assets`. Fixed by adding `- assets/videos/` to `pubspec.yaml`. |
| 46 | **LOW** | Dependency | `mobile/pubspec.yaml` | `audio_service: ^0.18.17` declared but `audio_handler.dart` is never registered or used. Dead dependency. |
| 47 | **LOW** | UI | `features/ebook_reader/presentation/ebook_reader_screen.dart` | No `WillPopScope`/`PopScope` on the reader. Back button returns to the previous route, but `_fadeController` and `_scrollController` are disposed in `dispose()` — if the user pops and then navigates back, the controller is disposed and accessing it throws. |
| 48 | **LOW** | UI | `features/discovery/presentation/discovery_screen.dart` | `CachedNetworkImage` used without `cacheManager` configuration. Default cache has no size limit — could fill device storage over time. |

---

### Detailed Findings

#### Issue 1 — Audio Handler Disconnected (CRITICAL — Audio Broken)

**File:** `audio_player/data/audio_handler.dart`

The `BariisaaTvAudioHandler` extends `BaseAudioHandler` and creates its own `AudioPlayer()`. Meanwhile, `AudioPlayerCubit` creates a **separate** `AudioPlayer()`. These two players are never connected. So when the user taps play in the UI, `AudioPlayerCubit._player.play()` fires, but `BariisaaTvAudioHandler._player` remains silent. OS media controls, Bluetooth headset buttons, and lock screen controls all operate on the handler's silent player.

**Fix:** Register `BariisaaTvAudioHandler` as the audio handler for `audio_service`, and have `AudioPlayerCubit` use the handler's player instead of creating its own. Remove the separate `_player` from `AudioPlayerCubit`.

#### Issue 2–4 — Missing `isClosed` Guards (CRITICAL — Crashes on Navigate-Away)

**File:** `audio_player/presentation/audio_player_cubit.dart`

Every public method (`play`, `pause`, `seek`, `skipForward`, `skipBackward`, `setPlaybackSpeed`, `setSleepTimer`, `cancelSleepTimer`) calls `_player` methods and/or `emit()` without checking `if (isClosed)`. When the user navigates away from the audio player screen, `close()` runs and sets `_closed = true`. Any subsequent call (e.g., from a timer callback, from the mini-player, or from a `setState`-triggered rebuild) throws `StateError`.

**Fix:** Add `if (isClosed) return;` at the start of every public method. Use `if (!isClosed && state is AudioPlayerLoaded)` before every `emit()` call.

#### Issue 6 — DeepLinkHandler Instantiation Order (CRITICAL — Crash on Fresh Launch)

**File:** `auth/presentation/auth_cubit.dart` line 21

```dart
final DeepLinkHandler _deepLinkHandler = DeepLinkHandler();
```

`DeepLinkHandler` internally creates `OAuthClient`, which lazily calls `getIt<SecureStorageService>()`. If `DeepLinkHandler._exchangeCode()` is called before `setupDependencies()` registers `getIt`, this throws `GetItError: Unable to find instance`.

**Fix:** Move `_deepLinkHandler` initialization to `setupDependencies()` or use a nullable late initialization in `AuthCubit`:
```dart
late final DeepLinkHandler _deepLinkHandler;
// In constructor:
_deepLinkHandler = DeepLinkHandler();
```

#### Issue 15 — EbookReaderScreen Cubit Leaked on Rebuild (CRITICAL — Memory Leak)

**File:** `features/ebook_reader/presentation/ebook_reader_screen.dart`

`BlocProvider(create: (_) => EbookReaderCubit(...))` inside a `StatelessWidget.build()` creates a new cubit on every parent rebuild (e.g., theme change, rotation). Each cubit subscribes to pdfrx stream controllers that are never cancelled.

**Fix:** Move `BlocProvider` to the route level in `app_router.dart`, or use `BlocProvider.value` with a cached cubit from `get_it`.

#### Issue 16 — PDF Controller Never Disposed (CRITICAL — Memory Leak)

**File:** `features/ebook_reader/presentation/ebook_reader_screen.dart`

`PdfViewer.file()` / `PdfViewer.uri()` creates a `PdfController` internally. `_EbookReaderContentState.dispose()` cancels `_scrollController` and `_fadeController` but **never disposes the PDF controller**. On navigation away, the PDF controller's resources (rendered pages, native pdfium) leak.

**Fix:** Store the `PdfController` as a field and dispose it in `dispose()`.

#### Issue 30 — Refresh Token Infinite Loop (HIGH — Logout Storm)

**File:** `core/network/api_client.dart`

When `refreshAccessToken()` fails (e.g., refresh token expired), the catch block calls `_secureStorage.deleteAll()` and `onSessionExpired?.call()`. But `handler.reject(error)` is **not** called in the catch block — it falls through to the `finally` and then `handler.reject(error)` is NOT called. Wait, actually looking again: the `catch` block does NOT call `handler.reject(error)`. This means the original failing request is **never retried** and the `Completer`s in `_refreshQueue` are completed with error. The requests in the queue will fail with the error but the original request that triggered the 401 is left hanging.

**Fix:** Add `handler.reject(error)` at the end of the catch block, or restructure so the original request is properly rejected.

---

### pubspec.yaml Dependency Notes

| Package | Status | Notes |
|---------|--------|-------|
| `video_player: ^2.9.2` | ✅ Fixed | Added `assets/videos/` to `flutter.assets` |
| `audio_service: ^0.18.17` | ⚠️ Dead | `audio_handler.dart` exists but is never registered |
| `just_audio: ^0.9.42` | ✅ Active | Used by `AudioPlayerCubit` |
| `just_audio_media_kit: ^2.1.0` | ✅ Active | `JustAudioMediaKit.ensureInitialized()` in `main.dart` |
| `go_router: ^14.6.0` | ✅ Active | Auth guards work correctly |
| `dio: ^5.7.0` | ✅ Active | Token refresh interceptor has edge cases |
| `flutter_secure_storage: ^9.2.4` | ✅ Active | Used throughout, but read-on-every-request is slow |

### Commands to Verify

```bash
cd mobile
flutter analyze --no-pub          # Should show only pre-existing issues
flutter pub get
flutter clean
flutter run --debug
```

### Recommended Fixes Priority

1. **Fix `AudioPlayerCubit`** — Add `isClosed` guards to all public methods and all `emit()` calls. This prevents the majority of crashes on navigate-away.
2. **Register `audio_service`** — Wire `BariisaaTvAudioHandler` properly so background audio works. This is a user-facing feature that's currently completely broken.
3. **Fix `EbookReaderScreen`** — Move `BlocProvider` to route level and dispose `PdfController`. Prevents memory leaks on navigation.
4. **Fix `DeepLinkHandler`** — Move instantiation to `setupDependencies()`. Prevents crash on fresh launch if OAuth callback arrives early.
5. **Fix `ApiClient` refresh logic** — Add `handler.reject(error)` in catch block. Prevents hanging requests.
6. **Fix `SplashScreen`** — Add `mounted` checks and `await` for `_checkStatus()`. Prevents stale context access.

