<div align="center">

# Bariisaa Tv - Mobile App

### Flutter Mobile Application Documentation

Complete documentation for the Bariisaa Tv Flutter mobile app — features, architecture, screens, widgets, state management, and more.

![Flutter](https://img.shields.io/badge/Flutter-3.x-02569B?logo=flutter)
![Dart](https://img.shields.io/badge/Dart-3.x-0175C2?logo=dart)
![BLoC](https://img.shields.io/badge/State-BLoC%2FCubit-649AD8)

</div>

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Entry Point & Initialization](#entry-point--initialization)
- [Core Architecture](#core-architecture)
  - [Dependency Injection](#dependency-injection)
  - [API Client](#api-client)
  - [Secure Storage](#secure-storage)
  - [Navigation (GoRouter)](#navigation-gorouter)
  - [Theme System](#theme-system)
  - [Constants](#constants)
- [Features & Screens](#features--screens)
  - [Splash Screen](#1-splash-screen)
  - [Authentication](#2-authentication-oauth-20--pkce)
  - [Book Discovery](#3-book-discovery-4-screens)
  - [Audio Player](#4-audio-player-2-screens)
  - [E-Book Reader](#5-e-book-reader-1-screen)
  - [Storytelling](#6-storytelling-1-screen)
  - [Music](#7-music-1-screen)
  - [My Doctor](#8-my-doctor-1-screen)
  - [My Captain](#9-my-captain-1-screen)
  - [Habits](#10-habits-1-screen)
  - [Favorites](#11-favorites-1-screen)
  - [History](#12-history-1-screen)
  - [Notifications](#13-notifications-1-screen)
  - [Profile](#14-profile-3-screens)
  - [Subscription](#15-subscription-4-screens)
  - [Reviews](#16-reviews-2-screens)
  - [Author Profile](#17-author-profile-1-screen)
  - [Download Manager](#18-download-manager-1-screen)
  - [Menu All Screens](#19-menu-all-screens-1-screen)
- [State Management (BLoC/Cubit)](#state-management-bloccubit)
- [Data Models](#data-models)
- [Custom Widgets](#custom-widgets)
- [Authentication Flow](#authentication-flow)
- [Audio Player Deep Dive](#audio-player-deep-dive)
- [Offline Downloads](#offline-downloads)
- [Firebase Configuration](#firebase-configuration)
- [Assets](#assets)
- [Commands](#commands)
- [Screen Flow & Navigation](#screen-flow--navigation)

---

## Overview

Bariisaa Tv is a children's audio book and e-book platform. The mobile app is built with Flutter, targeting Android and iOS. It features a playful, colorful UI designed for kids with large tap targets, emoji mascots, and parental controls.

**Key Features:**
- **OAuth 2.0 PKCE Authentication** — Secure browser-based login via web-auth React app
- Browse and discover books (audio + PDF)
- Full-featured audio player with chapters, speed control, sleep timer, background playback
- PDF e-book reader with themes and bookmarks
- **Kids-first yellow/blue design system** — warm yellow (`#FFC53D`) scaffolds, sky blue (`#2196F3`) accents, emoji mascots, big touch targets, Baloo2 + Nunito fonts for early readers
- Subscription management with multiple payment gateways (Stripe, Chapa, Telebirr)
- Offline downloads for audio and PDF
- Storytelling, Music, Health Tips, and Achievements sections
- Guest mode with full browsing
- Parental gate for child content
- Deep linking support for OAuth callbacks
- Amharic/Oromo/English language support

**Architecture Highlights:**
- Browser-based OAuth flow with PKCE for enhanced security
- Flutter app opens system browser for authentication (no embedded WebView)
- Deep link callback handling (`com.bariisaa.app://callback`)
- Automatic token refresh with request queuing
- Secure token storage using FlutterSecureStorage

---

## Tech Stack

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| Framework | Flutter | 3.x | Cross-platform UI |
| Language | Dart | 3.x | Application logic |
| State Management | BLoC / Cubit | 8.1.6 | Predictable state |
| Routing | GoRouter | 14.6.0 | Declarative routing |
| HTTP Client | Dio | 5.7.0 | API communication |
| DI | get_it | 8.0.3 | Service locator |
| Audio | just_audio | 0.9.42 | Audio playback |
| Background Audio | audio_service | 0.18.17 | OS media controls |
| Audio Session | audio_session | 0.1.25 | Session management |
| Token Storage | flutter_secure_storage | 9.2.4 | Encrypted storage (tokens + PKCE) |
| File Paths | path_provider | 2.1.5 | File system paths |
| Firebase Core | firebase_core | 3.12.1 | Firebase init (FCM) |
| Device Info | device_info_plus | 11.4.0 | Device identification |
| Crypto | crypto | 3.0.6 | PKCE code challenge hashing |
| Deep Links | app_links | 6.3.0 | OAuth callback deep links |
| Browser Auth | url_launcher | 6.3.1 | Open system browser for OAuth |
| Image Cache | cached_network_image | 3.4.1 | Network images |
| Shimmer | shimmer | 3.0.0 | Loading effects |
| Image Picker | image_picker | 1.1.2 | Camera/gallery |
| Image Cropper | image_cropper | 8.1.0 | Image editing |
| i18n | intl | 0.20.2 | Date/number formatting |
| Time Ago | timeago | 3.7.0 | Relative time |
| PDF Viewer | flutter_pdfview | 1.3.3 | PDF rendering |

---

## Project Structure

```
mobile/
├── lib/
│   ├── main.dart                          # Entry point
│   ├── firebase_options.dart              # Firebase config (FCM only)
│   │
│   ├── core/
│   │   ├── auth/                          # OAuth PKCE client
│   │   │   ├── pkce_service.dart          # PKCE generation (verifier, challenge, state)
│   │   │   ├── oauth_client.dart          # Token exchange, refresh, revoke
│   │   │   └── deep_link_handler.dart     # Handles com.bariisaa.app://callback
│   │   ├── constants/
│   │   │   └── app_constants.dart         # API URLs (prod/dev), timeouts, etc.
│   │   ├── di/
│   │   │   └── injection.dart             # get_it setup (25 singletons)
│   │   ├── navigation/
│   │   │   └── app_router.dart            # GoRouter (35+ routes)
│   │   ├── network/
│   │   │   └── api_client.dart            # Dio with refresh lock/queue interceptor
│   │   ├── security/
│   │   │   └── security_service.dart      # Device security
│   │   ├── storage/
│   │   │   └── secure_storage.dart        # Token + PKCE data storage
│   │   └── theme/
│   │       └── app_theme.dart             # Light/Dark/Parent themes
│   │
│   ├── features/
│   │   ├── splash/
│   │   │   └── presentation/
│   │   │       └── splash_screen.dart
│   │   ├── auth/
│   │   │   ├── data/
│   │   │   │   └── auth_repository.dart   # OAuth-based auth (userinfo, refresh, revoke)
│   │   │   ├── domain/
│   │   │   │   └── auth_state.dart        # 10 states (BrowserLaunching, CallbackReceived, etc.)
│   │   │   └── presentation/
│   │   │       ├── auth_cubit.dart         # OAuth methods (startLogin, handleCallback, etc.)
│   │   │       └── _login_browser_screen.dart  # Opens system browser for OAuth
│   │   ├── discovery/
│   │   │   ├── data/
│   │   │   │   └── discovery_repository.dart
│   │   │   ├── domain/
│   │   │   │   └── discovery_state.dart
│   │   │   └── presentation/
│   │   │       ├── discovery_cubit.dart
│   │   │       ├── discovery_screen.dart
│   │   │       ├── book_detail_screen.dart
│   │   │       ├── search_results_screen.dart
│   │   │       └── category_browse_screen.dart
│   │   ├── audio_player/
│   │   │   ├── data/
│   │   │   │   ├── audio_player_repository.dart
│   │   │   │   └── audio_handler.dart
│   │   │   ├── domain/
│   │   │   │   └── audio_player_state.dart
│   │   │   └── presentation/
│   │   │       ├── audio_player_cubit.dart
│   │   │       ├── audio_player_screen.dart
│   │   │       └── mini_player_widget.dart
│   │   ├── ebook_reader/
│   │   │   ├── data/
│   │   │   │   └── ebook_reader_repository.dart
│   │   │   ├── domain/
│   │   │   │   └── ebook_reader_state.dart
│   │   │   └── presentation/
│   │   │       ├── ebook_reader_cubit.dart
│   │   │       └── ebook_reader_screen.dart
│   │   ├── favorites/
│   │   ├── history/
│   │   ├── profile/
│   │   ├── notifications/
│   │   ├── subscription/
│   │   ├── offline/
│   │   ├── reviews/
│   │   ├── author_profile/
│   │   ├── storytelling/
│   │   ├── music/
│   │   ├── my_doctor/
│   │   ├── my_captain/
│   │   └── habits/
│   │
│   └── shared/
│       ├── models/
│       │   └── models.dart                # All data models
│       ├── styles/
│       │   └── styles.dart                # Shared styles
│       └── widgets/
│           ├── shared_widgets.dart        # Reusable widgets
│           ├── auth_guard.dart            # Auth utility
│           └── menu_all_screen.dart       # Navigation hub
│
├── assets/
│   ├── images/
│   │   └── logo.png
│   ├── fonts/
│   │   ├── NotoSansEthiopic.ttf
│   │   ├── Roboto.woff2
│   │   ├── Roboto-Bold.woff2
│   │   ├── NotoColorEmoji.woff2
│   │   ├── Baloo2.woff2
│   │   └── Nunito.woff2
│   └── icons/
│
├── android/
│   └── app/src/main/
│       ├── AndroidManifest.xml            # Deep link intent-filter + AudioService
│       └── res/xml/
│           └── network_security_config.xml
├── ios/
│   └── Runner/
│       ├── Info.plist                      # URL scheme for deep links
│       └── Runner.entitlements             # Universal Links
├── web/
├── test/
└── pubspec.yaml
```
---

## Entry Point & Initialization

### `main.dart`

```dart
void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await setupDependencies();     // Register all singletons via get_it
  runApp(const BariisaaTvApp());
  _initializeFirebase();         // Async, after app renders (prevents ANR)
  _loadFonts();                  // Custom fonts with 500ms timeout
}
```

**Initialization Order:**
1. `WidgetsFlutterBinding.ensureInitialized()` — Required for platform channels
2. `setupDependencies()` — Registers 25 singletons (repositories, cubits, services)
3. `runApp()` — App renders immediately (splash screen shown)
4. `_initializeFirebase()` — Firebase init deferred to after first frame
5. `_loadFonts()` — Custom fonts (NotoSansEthiopic) with timeout fallback

### `firebase_options.dart`

Firebase configuration for project `bariisaa-tv`:
- **Android:** App ID `1:446551709086:android:eed81952bb49d64dc8728f`
- **iOS:** Bundle ID `com.naik.naikMobile`
- **Web:** App ID `1:446551709086:web:feb2c7cdee5cc4cec8728f`

---

## Core Architecture

### Dependency Injection

**File:** `core/di/injection.dart`

All 25 singletons registered via `get_it`:

```dart
final getIt = GetIt.instance;

void setupDependencies() {
  // Core services
  getIt.registerLazySingleton<ApiClient>(() => ApiClient());
  getIt.registerLazySingleton<SecureStorageService>(() => SecureStorageService());

  // Repositories
  getIt.registerLazySingleton<AuthRepository>(() => AuthRepository(getIt(), getIt()));
  getIt.registerLazySingleton<DiscoveryRepository>(() => DiscoveryRepository());
  getIt.registerLazySingleton<AudioPlayerRepository>(() => AudioPlayerRepository(getIt(), getIt()));
  getIt.registerLazySingleton<EbookReaderRepository>(() => EbookReaderRepository(getIt(), getIt()));
  // ... 14 more repositories

  // Cubits (16 global providers)
  getIt.registerLazySingleton<AuthCubit>(() => AuthCubit(getIt()));
  getIt.registerLazySingleton<DiscoveryCubit>(() => DiscoveryCubit(getIt()));
  // ... 14 more cubits
}
```

| Singleton | Type | Dependencies |
|-----------|------|-------------|
| `ApiClient` | Singleton | None |
| `SecureStorageService` | Singleton | None |
| `AuthRepository` | Singleton | ApiClient, SecureStorageService |
| `DiscoveryRepository` | Singleton | ApiClient |
| `AudioPlayerRepository` | Singleton | ApiClient, SecureStorageService |
| `EbookReaderRepository` | Singleton | ApiClient, SecureStorageService |
| `FavoritesRepository` | Singleton | getIt |
| `HistoryRepository` | Singleton | getIt |
| `ProfileRepository` | Singleton | getIt |
| `NotificationsRepository` | Singleton | getIt |
| `SubscriptionRepository` | Singleton | getIt |
| `OfflineRepository` | Singleton | getIt |
| `ReviewsRepository` | Singleton | getIt |
| `AuthorProfileRepository` | Singleton | getIt |
| `StorytellingRepository` | Singleton | ApiClient |
| `MusicRepository` | Singleton | ApiClient |
| `MyDoctorRepository` | Singleton | ApiClient |
| `MyCaptainRepository` | Singleton | ApiClient |
| `HabitsRepository` | Singleton | ApiClient |
| 16 Cubits | Singleton | One per feature |

### API Client

**File:** `core/network/api_client.dart`

```dart
class ApiClient {
  late final Dio _dio;
  bool _isRefreshing = false;
  List<Completer<void>> _refreshQueue = [];

  ApiClient() {
    _dio = Dio(BaseOptions(
      baseUrl: AppConstants.apiBaseUrl,
      connectTimeout: Duration(seconds: 30),
      receiveTimeout: Duration(seconds: 30),
      headers: {'Content-Type': 'application/json'},
    ));

    _dio.interceptors.addAll([
      AuthInterceptor(),    // Adds Bearer token from secure storage
      RefreshInterceptor(), // Catches 401, refreshes token, retries (with lock/queue)
      LogInterceptor(),     // Logs requests in debug mode
    ]);
  }
}
```

**Interceptors:**
- `AuthInterceptor` — Reads access token from `FlutterSecureStorage`, adds `Authorization: Bearer <token>` header
- `RefreshInterceptor` — On 401 response, acquires refresh lock, calls `/oauth/token` (refresh grant) with refresh token, updates stored tokens, retries original request. Queues concurrent requests during refresh.
- `LogInterceptor` — Logs request/response in debug mode

### Secure Storage

**File:** `core/storage/secure_storage.dart`

Wrapper around `flutter_secure_storage` for encrypted token + PKCE data storage:

| Key | Value |
|-----|-------|
| `access_token` | JWT access token (15 min expiry) |
| `refresh_token` | JWT refresh token (30 day expiry) |
| `user_data` | Serialized UserModel JSON |
| `pkce_code_verifier` | PKCE code verifier (session only) |
| `pkce_state` | PKCE state parameter (session only) |

### Navigation (GoRouter)

**File:** `core/navigation/app_router.dart`

35+ routes with auth redirect guard:

| Route | Screen | Auth Required |
|-------|--------|---------------|
| `/` | SplashScreen | No |
| `/oauth-callback` | OAuth Callback Handler | No |
| `/discovery` | DiscoveryScreen | No |
| `/books` | DiscoveryScreen | No |
| `/book/:id` | BookDetailScreen | No |
| `/search` | SearchResultsScreen | No |
| `/category/:id` | CategoryBrowseScreen | No |
| `/audio-player` | AudioPlayerScreen | No |
| `/ebook-reader` | EbookReaderScreen | No |
| `/storytelling` | StorytellingScreen | No |
| `/music` | MusicScreen | No |
| `/my-doctor` | MyDoctorScreen | No |
| `/my-captain` | MyCaptainScreen | No |
| `/habits` | HabitsScreen | No |
| `/favorites` | FavoritesScreen | No |
| `/history` | HistoryScreen | No |
| `/notifications` | NotificationsScreen | No |
| `/profile` | ProfileScreen | No |
| `/edit-profile` | EditProfileScreen | No |
| `/devices` | DevicesScreen | No |
| `/plans` | PlansScreen | No |
| `/payment-success` | PaymentSuccessScreen | No |
| `/payment-failure` | PaymentFailureScreen | No |
| `/payment-history` | PaymentHistoryScreen | No |
| `/downloads` | DownloadManagerScreen | No |
| `/reviews/:bookId` | ReviewsScreen | No |
| `/write-review/:bookId` | WriteReviewScreen | No |
| `/author/:id` | AuthorProfileScreen | No |
| `/menu-all` | MenuAllScreen | No |

**Redirect Logic:**
- Authenticated user on splash → `/menu-all`
- Guest on splash → `/menu-all` (guest mode)
- OAuth callback → `/oauth-callback` → processes tokens → `/menu-all`
- Auth state change → GoRouter refreshes via `_AuthNotifier`

**Deep Link Routes:**
- `com.bariisaa.app://callback` → Handled by deep link handler → Exchanges auth code → Navigates to `/menu-all`

### Theme System

**File:** `core/theme/app_theme.dart`

Three themes with kid-friendly design:

#### Light Theme (Kids)
- **Scaffold:** Sunny Yellow `#FFC53D`
- **Cards:** Off-White `#FFFDF5`
- **Primary CTA:** Sunny Yellow `#FFC53D` (pill buttons, full-width)
- **Accent / Active:** Sky Blue `#2196F3` (icons, chips, selected states)
- **Text primary:** Dark Navy `#1F2A4A` (Baloo2 headings, Nunito body)
- **Error:** Playful Red `#FF6B6B`
- **Font:** Baloo2 36px display / 24px title, Nunito 18px body / 14px caption
- **Card Radius:** 24.0
- **Button Radius:** 999.0 (pill shape)
- **Chip Radius:** 999.0 (pill shape)
- **Min Tap Target:** 56.0px

#### Dark Theme (Kids' Night Mode)
- **Background:** Deep Navy `#0F1A2E`
- **Surface:** `#2E3C5C`
- **Primary CTA:** Sunny Yellow `#FFC53D`
- **Accent:** Sky Blue `#2196F3` / Sunny Yellow `#FFC53D`
- **Text:** Cream `#F5F3E8` (Baloo2 headings, Nunito body)
- **Error:** Playful Red `#FF6B6B`
- **Font:** Same sizes as light theme

#### Parent Zone Theme
- **Background:** Warm Cream `#FFF8E1`
- **Cards:** White `#FFFFFF`
- **Primary:** Blue-Gray `#607D8B` (adult, muted)
- **Secondary:** `#78909C`
- **Text:** `#444444`
- **Font:** Nunito 16px (smaller, adult styling)

**Branded Colors:**

||| Token | Hex | Role |
|||-------|-----|------|
||| `sunnyYellow` | `#FFC53D` | Primary background & CTA |
||| `skyBlue` | `#2196F3` | Primary accent / active |
||| `skyBlueLight` | `#81D4FA` | Decorative light blue |
||| `playfulRed` | `#FF6B6B` | Warm accent / error |
||| `mintGreen` | `#4FD1A5` | Success / growth |
||| `softPurple` | `#B79CEC` | Secondary section accent |
||| `darkNavy` | `#1F2A4A` | Primary text |
||| `deepNavy` | `#0F1A2E` | Hero / night mode bg |
||| `creamBg` | `#FFC53D` | Scaffold background |
||| `offWhite` | `#FFFDF5` | Card surfaces |
||| `white` | `#FFFFFF` | Pure white surfaces |

**Design Tokens:**

|| Token | Value | Description |
||-------|-------|-------------|
|| `cardRadius` | 24.0 | Card border radius |
|| `buttonRadius` | 999.0 | Full-width pill buttons |
|| `chipRadius` | 999.0 | Full-width pill chips |
|| `blobRadius` | 24.0 | Decorative blob radius |
|| `minTapSize` | 56.0 | Minimum tap target |
|| `displaySize` | 36.0 | Display text (Baloo2) |
|| `headlineSize` | 30.0 | Headline text (Baloo2) |
|| `titleSize` | 24.0 | Title text (Baloo2) |
|| `bodySize` | 18.0 | Body text (Nunito) |
|| `captionSize` | 14.0 | Caption text (Nunito) |

**Branded Colors:**

|| Token | Hex | Role |
||-------|-----|------|
|| `sunnyYellow` | `#FFC53D` | Primary background & CTA |
|| `skyBlue` | `#2196F3` | Primary accent / active |
|| `skyBlueLight` | `#81D4FA` | Decorative light blue |
|| `playfulRed` | `#FF6B6B` | Warm accent / error |
|| `mintGreen` | `#4FD1A5` | Success / growth |
|| `softPurple` | `#B79CEC` | Secondary section accent |
|| `darkNavy` | `#1F2A4A` | Primary text |
|| `deepNavy` | `#0F1A2E` | Hero / night mode bg |
|| `creamBg` | `#FFC53D` | Scaffold background |
|| `offWhite` | `#FFFDF5` | Card surfaces |
|| `white` | `#FFFFFF` | Pure white surfaces |

### Constants

**File:** `core/constants/app_constants.dart`

```dart
class AppConstants {
  // API
  static const String prodBaseUrl = 'https://api.bariisaa.com/api/v1';
  static const String devBaseUrl = 'http://10.0.2.2:3000/api/v1';
  
  static String get apiBaseUrl {
    if (kIsWeb) return prodBaseUrl;
    if (const bool.fromEnvironment('dart.tool.product')) return prodBaseUrl;
    if (defaultTargetPlatform == TargetPlatform.android) return devBaseUrl;
    if (defaultTargetPlatform == TargetPlatform.iOS) return devBaseUrl;
    return prodBaseUrl;
  }

  // OAuth
  static const String oauthClientId = 'bariisaa-mobile';
  static const String deepLinkScheme = 'com.bariisaa.app';
  static const String deepLinkHost = 'callback';

  // Audio
  static const double audioSkipForward = 30;
  static const double audioSkipBackward = 10;
  static const List<double> playbackSpeeds = [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0, 2.25, 2.5, 2.75, 3.0];
  static const List<int> sleepTimerMinutes = [5, 10, 15, 30, 45, 60];

  // Progress sync
  static const Duration connectTimeout = Duration(seconds: 30);
  static const Duration receiveTimeout = Duration(seconds: 30);

  // Downloads
  static const int maxDevices = 5;
  static const int pageSize = 20;
}
```

---

## Features & Screens

### Total Screen Count

The Flutter mobile app contains **19 feature screens** (excluding auth screens which are in the web-auth React app):

| Category | Screens | Count |
|----------|---------|-------|
| **Launch** | Splash, OAuth Callback Handler | 2 |
| **Discovery** | Discovery, Book Detail, Search Results, Category Browse | 4 |
| **Content Consumption** | Audio Player, E-Book Reader | 2 |
| **Additional Content** | Storytelling, Music, My Doctor, My Captain, Habits | 5 |
| **User Management** | Favorites, History, Notifications, Profile, Edit Profile, Devices | 6 |
| **Subscription** | Plans, Payment Success, Payment Failure, Payment History | 4 |
| **Reviews** | Reviews, Write Review | 2 |
| **Other** | Author Profile, Download Manager, Menu All | 3 |
| **Mini Components** | Mini Player (overlay), Sign-In Bottom Sheet | 2 |
| **Total** | | **30** |

**Note:** Authentication screens (Login, Signup, OTP, Email Verification, Forgot Password, Reset Password, Google Auth) are handled by the external **web-auth React application** and are not part of the Flutter app.

### 1. Splash Screen

**File:** `features/splash/presentation/splash_screen.dart`

- Animated fade-in logo with "Bariisaa Tv" title
- Auto-auth check on init (calls `AuthCubit.checkAuthStatus()`)
- 5-second timeout → defaults to guest mode
- Routes to `/menu-all` (authenticated/guest) or auth screens

### 2. Authentication (OAuth 2.0 + PKCE)

The app uses **browser-based OAuth 2.0 Authorization Code flow with PKCE** for authentication. All login/signup UI is handled by a separate React web-auth app. The Flutter app opens the system browser and receives the authentication result via deep links.

**Architecture:**
```
Flutter App → System Browser → Web-Auth React App (login UI) → Backend OAuth → Deep Link Callback → Flutter App
```

#### Authentication Flow

**File:** `features/auth/presentation/auth_cubit.dart`

The authentication process works as follows:

1. **User initiates login** in Flutter app
2. **Flutter generates PKCE parameters:**
   - `code_verifier` — Random 43-128 character string
   - `code_challenge` — SHA-256 hash of code_verifier (base64url encoded)
   - `state` — Random state parameter for CSRF protection
3. **Flutter opens system browser** using `url_launcher`:
   ```
   https://auth.bariisaa.com/authorize?
     response_type=code&
     client_id=bariisaa-mobile&
     redirect_uri=com.bariisaa.app://callback&
     code_challenge=<SHA256_HASH>&
     code_challenge_method=S256&
     state=<RANDOM_STATE>
   ```
4. **User completes authentication** in web-auth React app:
   - Login with email/phone + password
   - Login with phone OTP
   - Signup with email/phone
   - Password reset flows
   - Google Sign-In (optional)
5. **Web-auth calls backend** `/oauth/authorize` (GET) with JWT token
6. **Backend returns authorization code** + state
7. **Web-auth redirects** to `com.bariisaa.app://callback?code=<AUTH_CODE>&state=<STATE>`
8. **Flutter deep link handler** captures the callback
9. **Flutter exchanges code for tokens:**
   ```
   POST /oauth/token
   {
     grant_type: "authorization_code",
     code: "<AUTH_CODE>",
     code_verifier: "<CODE_VERIFIER>",
     client_id: "bariisaa-mobile",
     redirect_uri: "com.bariisaa.app://callback"
   }
   ```
10. **Backend validates PKCE** and returns access + refresh tokens
11. **Flutter stores tokens** in FlutterSecureStorage (encrypted)
12. **User navigates to home screen**

#### Continue as Guest

**File:** `features/auth/presentation/auth_cubit.dart`

- Users can skip authentication and browse content as guests
- No tokens stored
- Restricted actions (listen, read, favorite, download) trigger sign-in prompt
- `AuthGuard` utility shows sign-in bottom sheet when guest tries restricted actions

**API Integration:**
- Web-auth React app runs at `https://auth.bariisaa.com`
- Backend OAuth endpoints at `https://api.bariisaa.com/api/v1/oauth/`
- Deep link scheme: `com.bariisaa.app://callback`

**Key Files:**
- `core/auth/pkce_service.dart` — PKCE parameter generation
- `core/auth/oauth_client.dart` — Token exchange, refresh, revoke
- `core/auth/deep_link_handler.dart` — Deep link callback handling
- `features/auth/presentation/auth_cubit.dart` — Auth state management
- `features/auth/data/auth_repository.dart` — OAuth API calls

**Supported Authentication Methods (via web-auth):**
1. Email + Password
2. Phone + Password
3. Phone OTP Login
4. Google Sign-In (OAuth)
5. Continue as Guest (no authentication)

**Password Reset Flow:**
- User requests reset in web-auth
- Backend sends reset email/SMS
- User clicks link → redirects to web-auth reset page
- User enters new password
- Web-auth completes OAuth flow → redirects to Flutter app

**Note:** The Flutter app no longer has dedicated login/signup/OTP screens. All authentication UI is handled by the external web-auth React application for improved security and consistency.

**Authentication Navigation Summary:**
| User Action | Flow |
|-------------|------|
| Tap "Sign In" from splash/menu | → Opens system browser → Web-auth login → OAuth callback → `/menu-all` |
| Tap "Continue as Guest" | → `/menu-all` (guest mode, no authentication) |
| Restricted action as guest | → Shows sign-in bottom sheet → Opens browser for auth |
| Tap "Forgot Password" (in web-auth) | → Password reset flow in web-auth → Email/SMS sent |
| OAuth callback received | → Deep link handler → Token exchange → Store tokens → `/menu-all` |

**Authentication Error Handling:**
| Error Scenario | Behavior |
|----------------|----------|
| User cancels in browser | → Returns to app, stays on current screen |
| Invalid credentials | → Error shown in web-auth, user retries |
| Network error during OAuth | → Shows network error in Flutter with retry |
| Invalid auth code | → Shows "Authentication failed" error |
| State parameter mismatch | → CSRF protection, rejects callback |
| Token exchange fails | → Clears stored data, shows error |

### 3. Book Discovery (4 screens)

#### Discovery Screen — Modern Kids-First UI/UX
**File:** `features/discovery/presentation/discovery_screen.dart`

A full-screen kids-first discovery home with a warm yellow (`#FFC53D`) cream background, playful owl mascot, and layered content shelves. Designed for small fingers with big touch targets, colorful section headers, and smooth auto-scrolling carousels.

**UI Layout (top to bottom):**

1. **App Bar** — Transparent overlay with:
   - Owl avatar (left, gradient yellow circle with `🦉` emoji)
   - "🦉 Bariisaa" title (Baloo2 bold, dark navy `#1F2A4A`)
   - Search icon (sky blue) → navigates to Search Results
   - Notifications icon (playful red) → navigates to Notifications

2. **Featured Carousel** — Auto-scrolling hero banner:
   - Full-width (100% screen width) cards with 160px height
   - Yellow (`#FFC53D`) shelf header with "✨ Featured"
   - Each card: 50/50 split — cover image (left) + title/subtitle/type badge (right)
   - Cover images use `CachedNetworkImage` with emoji fallbacks (`📚`, `🎵`, `📖`)
   - Rounded 18px corners, yellow shadow glow (`#FFC53D` alpha 0.5)
   - **Auto-scroll timer**: 5-second interval, `Curves.easeInOutCubic` at 600ms
   - **Drag-aware**: Timer pauses on pointer down/resumes on pointer up — no jarring jumps during user touch
   - `PageController(viewportFraction: 1.0)` for full-width rendering
   - `Listener` widget handles `onPointerDown`/`onPointerUp`/`onPointerCancel` for drag detection
   - Shuffled content from `featuredContent` (mix of music, books, audiobooks, stories)

3. **Quick Category Pills** — Horizontal scrollable pill row:
   - 44px height, rounded 12px corners with colored backgrounds
   - Colors: sunny yellow, sky blue, playful red, mint green, soft purple, soft amber
   - Each pill: emoji icon + category name (Nunito bold, dark navy)
   - Tap navigates to category route
   - Softly colored backgrounds (`color.withValues(alpha: 0.15)`) with colored border

4. **Books Shelf** — Horizontal auto-scrolling 80% width cards:
   - Yellow (`#FFF3E0`) section header with "📚 Books"
   - Each card: 50/50 cover + text layout, 110px height
   - Cover uses `CachedNetworkImage` with category emoji fallback
   - "READ" badge (sunny yellow pill)
   - PageView with `viewportFraction` for partial-cards effect

5. **Audio Books Shelf** — Same layout as Books but with audio styling:
   - Soft blue (`#E3F2FD`) section header with "🎧 Audio Books"
   - "🎧 LISTEN" badge (playful red pill)
   - Long-press → opens audio player

6. **Music Shelf** — Same layout as Books but with music styling:
   - Mint green (`#E8F5E9`) section header with "🎵 Music"
   - "PLAY" badge (mint green pill)
   - Tapping → opens Music screen

7. **Stories Shelf** — Same layout as Books but with stories styling:
   - Lavender (`#F3E5F5`) section header with "📖 Stories"
   - "📖 READ" badge (soft purple pill)
   - Tapping → opens Storytelling screen

8. **Explore Grid** — 2-column colorful gradient grid:
   - Sky blue light section header with "🧭 Explore"
   - Each category card: gradient background (top-left to bottom-right), rounded 16px
   - Emoji icon (28px) + category name + description (2 lines)
   - Tapping → navigates to category route

9. **Shimmer Loading State** — When data is loading:
   - Hero placeholder: 220px rounded container with yellow-to-blue gradient shimmer
   - 3 shelf rows with horizontal list placeholders (200px wide cards)
   - Shimmer animation via `ShimmerLoading` widget

10. **Pull-to-Refresh** — `RefreshIndicator` wraps the entire ListView
    - Triggers `DiscoveryCubit.loadCategories()` on pull-down
    - Yellow accent color

**Section Color Palette:**
| Section | Color | Hex |
|---------|-------|-----|
| Books | Warm Peach | `#FFF3E0` |
| Audio | Soft Blue | `#E3F2FD` |
| Music | Mint | `#E8F5E9` |
| Stories | Lavender | `#F3E5F5` |

**State Management:**
- `DiscoveryCubit` with `CategoriesLoaded` state provides all data
- `BlocBuilder` rebuilds shelves on state change
- `didChangeDependencies` triggers initial load (once only via `_initialLoadDone` flag)
- `RefreshIndicator` calls `loadCategories()` for pull-to-refresh

**API Calls:**
- `GET /books` — Main book catalog (split into ebooks/audiobooks)
- `GET /categories` — All categories
- `GET /recommendations` — Homepage recommendations
- `GET /music` — Music tracks
- `GET /music/featured` — Featured music for carousel
- `GET /storytelling` — Stories
- `GET /categories/explore` — Explore categories

**UX Design Principles:**
- **Kids-first**: Large tap targets, emoji mascots, rounded corners (18px), playful colors
- **Smooth transitions**: 600ms `easeInOutCubic` carousel animation, no jank during drag
- **Visual hierarchy**: Warm yellow background → white card surfaces → colorful section headers
- **Typography**: Baloo2 for headings (bold, 15-18px), Nunito for body (10-11px)
- **Color coding**: Each content type has its own section color for instant visual recognition
- **Performance**: `BlocBuilder` for efficient rebuilds, `CacheNetworkImage` for image caching, `compute()` for background parsing

**API Calls:**
- `GET /books`
- `GET /categories`
- `GET /recommendations`
- `GET /music`
- `GET /music/featured`
- `GET /storytelling`
- `GET /categories/explore`

#### Book Detail Screen
**File:** `features/discovery/presentation/book_detail_screen.dart`

- SliverAppBar with cover image
- Title, author names
- Star rating (avgRating)
- Premium/Free badges
- Category chips
- Collapsible "About Book" description
- "Listen" button → opens audio player
- "Read" button → opens ebook reader
- "Download" button
- Reviews section (first 3)
- "More Books" related shelf

**API Calls:**
- `GET /books/:id`
- `GET /reviews/book/:bookId`
- `POST /favorites/toggle`

#### Search Results Screen
**File:** `features/discovery/presentation/search_results_screen.dart`

- Search bar with filter icon
- Filter bottom sheet (category dropdown, language dropdown)
- Results grid (2 columns)
- Empty state for no results

**API Calls:**
- `GET /books?search=...&category=...&language=...`

#### Category Browse Screen
**File:** `features/discovery/presentation/category_browse_screen.dart`

- Category name in AppBar
- Book grid (2 columns)
- Shimmer loading
- Empty state

**API Calls:**
- `GET /books?category=...`

### 4. Audio Player (2 screens)

#### Audio Player Screen
**File:** `features/audio_player/presentation/audio_player_screen.dart`

Full-screen audio player with gradient background:

- Cover art (centered, large)
- Book title
- Author name
- Current chapter name
- Seekable progress slider with time labels
- Main controls:
  - Previous chapter (⏮)
  - Play/Pause (large yellow circle ▶️⏸)
  - Next chapter (⏭)
- Secondary controls:
  - Skip back 10s (⏪)
  - Sleep timer (🌙)
  - Playback speed (1x)
  - Bookmark (🔖)
  - Chapter list (📝)
- Bottom sheets for:
  - Speed selection (0.5x - 3.0x)
  - Sleep timer (5, 10, 15, 30, 45, 60 min)
  - Chapter navigation

#### Mini Player Widget
**File:** `features/audio_player/presentation/mini_player_widget.dart`

- Persistent bottom bar on other screens
- Shows: cover thumbnail, title, play/pause button
- Tapping opens full audio player
- Blue background

### 5. E-Book Reader (1 screen)

#### E-Book Reader Screen
**File:** `features/ebook_reader/presentation/ebook_reader_screen.dart`

- PDF viewer using `flutter_pdfview`
- Tap to toggle settings overlay
- Settings panel:
  - Theme selector (Light/Sepia/Dark)
  - Font size +/- buttons
  - Font family picker
  - Bookmark button
  - Chapters/bookmarks list
- Completion celebration bottom sheet (when reaching end)
- Progress syncs every 15 seconds
- Fallback text view for non-PDF content

### 6. Storytelling (1 screen)

#### Storytelling Screen
**File:** `features/storytelling/presentation/storytelling_screen.dart`

- Horizontal category chips (Folk, Bedtime, Moral, Adventure, Fables, Poems)
- Featured stories horizontal scroll (gradient cards)
- All stories grid
- Pull-to-refresh

**API Calls:**
- `GET /storytelling`
- `GET /storytelling/categories/:category`

### 7. Music (1 screen)

#### Music Screen
**File:** `features/music/presentation/music_screen.dart`

- Genre chips (Pop, Jazz, Classical, Folk, HipHop, R&B)
- "Trending Now" horizontal album cards
- "Popular Tracks" list with play icons
- Pull-to-refresh

**API Calls:**
- `GET /music`
- `GET /music/categories/:category`

### 8. My Doctor (1 screen)

#### My Doctor Screen
**File:** `features/my_doctor/presentation/my_doctor_screen.dart`

- Quick actions row (Appointment, Medicine, Health Info, Emergency)
- Health tips list with auto-assigned emojis
- Available doctors horizontal scroll cards
- Availability status indicators

**API Calls:**
- `GET /my-doctor/tips`
- `GET /my-doctor/profiles`

### 9. My Captain (1 screen)

#### My Captain Screen
**File:** `features/my_captain/presentation/my_captain_screen.dart`

- "Captain's Log" header with welcome message
- Stats row (Stars, Days, Missions)
- Achievements grid (locked/unlocked with emojis)
- Leaderboard with rank medals (gold/silver/bronze)

**API Calls:**
- `GET /my-captain/achievements`
- `GET /my-captain/leaderboard`

### 10. Habits (1 screen)

#### Habits Screen
**File:** `features/habits/presentation/habits_screen.dart`

- Guest banner prompting sign-in for tracking
- Authenticated:
  - Stats card (streak, completions, habits count)
  - All habits list with emoji, title, category
  - Complete button (green check)

**API Calls:**
- `GET /habits`
- `POST /habits/:id/complete`

### 11. Favorites (1 screen)

#### Favorites Screen
**File:** `features/favorites/presentation/favorites_screen.dart`

- Grid of favorited books (2 columns)
- Pull-to-refresh
- Star button to unfavorite
- Guest prompt if not authenticated

**API Calls:**
- `GET /favorites`
- `POST /favorites/toggle`

### 12. History (1 screen)

#### History Screen
**File:** `features/history/presentation/history_screen.dart`

- TabBar with "Reading" and "Listening" tabs
- List of history items with cover thumbnails
- Swipe-to-delete individual items
- "Clear All" button per tab
- Tap opens ebook reader or audio player

**API Calls:**
- `GET /history/reading`
- `GET /history/listening`
- `DELETE /history/:type/:bookId`
- `DELETE /history/reading/all`
- `DELETE /history/listening/all`

### 13. Notifications (1 screen)

#### Notifications Screen
**File:** `features/notifications/presentation/notifications_screen.dart`

- List of notifications with type-based emojis:
  - 📚 New Book
  - 🎉 Promotion
  - ⭐ Subscription
  - 🔔 Update
- Unread indicator (blue dot)
- Swipe-to-delete
- "Mark all read" button
- Pull-to-refresh
- Relative time formatting ("2 hours ago")

**API Calls:**
- `GET /notifications`
- `PUT /notifications/:id/read`
- `PUT /notifications/read-all`
- `DELETE /notifications/:id`

### 14. Profile (3 screens)

#### Profile Screen
**File:** `features/profile/presentation/profile_screen.dart`

- User avatar (circular)
- Name, email/phone
- Subscription card (plan name, days remaining)
- Menu items:
  - Reading History
  - Listening History
  - Favorites
  - Downloads
  - Subscription Plans
  - Payment History
  - Devices
  - Logout
- Guest prompt with account benefits list

#### Edit Profile Screen
**File:** `features/profile/presentation/edit_profile_screen.dart`

- Edit name field
- Edit preferred language field
- Avatar display
- Save button

#### Devices Screen
**File:** `features/profile/presentation/devices_screen.dart`

- List of registered devices
- Platform icons (Android/iOS)
- Device name, last active date
- Remove device with confirmation dialog

### 15. Subscription (4 screens)

#### Plans Screen
**File:** `features/subscription/presentation/plans_screen.dart`

- Current subscription card with progress bar
- Cancel subscription option
- Plan cards with:
  - Plan name
  - Price + duration
  - Feature list (with checkmarks)
- Payment gateway selector (Stripe/Chapa/Telebirr)
- Coupon code input with validation
- "Subscribe Now" button

#### Payment Success Screen
**File:** `features/subscription/presentation/payment_success_screen.dart`

- Celebration emoji 🎉
- Optional message
- "Continue Reading" button

#### Payment Failure Screen
**File:** `features/subscription/presentation/payment_failure_screen.dart`

- Error emoji 😅
- Error message
- "Try Again" button
- "Go to Menu" button

#### Payment History Screen
**File:** `features/subscription/presentation/payment_history_screen.dart`

- List of past payments
- Each item shows:
  - Amount + currency
  - Gateway name
  - Status (completed/failed/pending/refunded)
  - Date
- Status-colored badges

### 16. Reviews (2 screens)

#### Reviews Screen
**File:** `features/reviews/presentation/reviews_screen.dart`

- Rating distribution bar chart (1-5 stars)
- Review list with:
  - User avatar
  - User name
  - Star rating
  - Review content
  - Date
- "Write" button → navigates to review form

#### Write Review Screen
**File:** `features/reviews/presentation/write_review_screen.dart`

- Tap-to-rate star selector (1-5)
- Labels: Poor, Fair, Good, Very Good, Excellent
- Optional text review (500 char max, 6 lines)
- Submit button

### 17. Author Profile (1 screen)

#### Author Profile Screen
**File:** `features/author_profile/presentation/author_profile_screen.dart`

- SliverAppBar with author photo
- Circular avatar
- Author name
- Bio text
- Grid of author's books (2 columns)

### 18. Download Manager (1 screen)

#### Download Manager Screen
**File:** `features/offline/presentation/download_manager_screen.dart`

- Storage usage display (MB)
- List of downloads with:
  - Cover image
  - Title
  - Status (downloading/paused/completed/failed/pending)
  - Progress bar for active downloads
- Popup menu: Pause, Resume, Delete
- "Clear All" with confirmation dialog

### 19. Menu All Screens (1 screen)

#### Menu All Screen
**File:** `shared/widgets/menu_all_screen.dart`

Central navigation hub with 3 sections:

**Content:**
- Books (📚)
- Storytelling (📖)
- Music (🎵)
- My Doctor (🏥)
- My Captain (⚓)
- Habits (✅)

**History:**
- Reading History
- Listening History
- Payment History

**Account:**
- Profile
- Edit Profile
- Favorites
- Downloads
- Notifications
- Plans
- Devices
- Search

---

## State Management (BLoC/Cubit)

Each feature has its own Cubit with defined states:

### AuthCubit
**File:** `features/auth/presentation/auth_cubit.dart`

| State | Description |
|-------|-------------|
| `AuthInitial` | App start, no auth check yet |
| `AuthLoading` | Authentication in progress |
| `AuthSuccess(message)` | Action completed (signup, reset, etc.) |
| `AuthAuthenticated(UserModel)` | User is logged in |
| `AuthGuest` | User is browsing as guest |
| `AuthBrowserLaunching` | Opening system browser for OAuth |
| `AuthCallbackReceived` | Deep link callback received |
| `AuthTokenExchanging` | Exchanging auth code for tokens |
| `AuthRefreshing` | Refreshing access token |
| `AuthSessionExpired` | Session expired, re-login required |
| `AuthError(message)` | Authentication error |

**Actions:**
- `checkAuthStatus()` — Check for existing tokens, refresh if needed
- `startLogin()` — Generate PKCE parameters, open system browser
- `handleCallback(code, state)` — Verify state, exchange code for tokens
- `checkSession()` — Validate current session via `/oauth/userinfo`
- `refreshTokens()` — Refresh access token via `/oauth/token`
- `continueAsGuest()` — Guest mode
- `logout()` — Revoke tokens, clear all stored data
- `resetState()` — Reset to initial

### DiscoveryCubit
**File:** `features/discovery/presentation/discovery_cubit.dart`

| State | Description |
|-------|-------------|
| `DiscoveryInitial` | Initial state |
| `DiscoveryLoading` | Loading |
| `SearchLoaded(query, results, selectedCategory, selectedLanguage)` | Search results |
| `CategoriesLoaded(categories, books, exploreCategories, ebooks, audiobooks, music, stories, featuredContent)` | Discovery page data with featured carousel |
| `BookDetailLoaded(book, reviews, relatedBooks)` | Book detail |
| `DiscoveryError(message)` | Error |

**Actions:**
- `searchBooks(query, category, language)` — Search
- `loadCategories()` — Load all categories, featured content, music, stories, ebooks, audiobooks
- `loadBookDetail(bookId)` — Book detail
- `toggleFavorite(bookId)` — Toggle favorite

**`CategoriesLoaded` State Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `categories` | `List<CategoryModel>` | All categories |
| `books` | `List<BookModel>` | Full book catalog |
| `exploreCategories` | `List<CategoryModel>` | Categories for Explore grid |
| `ebooks` | `List<BookModel>` | Books with `pdfFile` (for Books shelf) |
| `audiobooks` | `List<BookModel>` | Books with `audioFile` (for Audio shelf) |
| `music` | `List<Map<String, dynamic>>` | Music tracks |
| `stories` | `List<Map<String, dynamic>>` | Storytelling entries |
| `featuredContent` | `List<Map<String, dynamic>>` | Unified featured mix (music, books, audiobooks, stories) shuffled — powers the auto-scrolling carousel |

**Carousel State Flow:**
- `_DiscoveryScreenState.initState()` calls `_startCarouselTimer()` via post-frame callback
- Timer fires every 5 seconds → `animateToPage()` with `Curves.easeInOutCubic` (600ms)
- Timer pauses on `pointerDown` (user dragging), resumes on `pointerUp`/`pointerCancel`
- `onPageChanged` updates `_carouselIndex` only when not dragging
- `dispose()` cancels timer and disposes `PageController`

### AudioPlayerCubit
**File:** `features/audio_player/presentation/audio_player_cubit.dart`

| State | Description |
|-------|-------------|
| `AudioPlayerInitial` | Initial state |
| `AudioPlayerLoading` | Loading book |
| `AudioPlayerLoaded(book, isPlaying, position, duration, playbackSpeed, sleepTimerMinutes, bookmarks, currentChapterIndex)` | Playing |
| `AudioPlayerError(message)` | Error |

**Actions:**
- `loadBook(bookId)` — Load audio book
- `play()` / `pause()` / `togglePlayPause()` — Playback control
- `seek(position)` — Seek to position
- `skipForward()` — Skip 30s
- `skipBackward()` — Skip 10s
- `setPlaybackSpeed(speed)` — Change speed
- `setSleepTimer(minutes)` — Set timer
- `cancelSleepTimer()` — Cancel timer
- `seekToChapter(index)` — Jump to chapter
- `addBookmark(label)` — Add bookmark
- `deleteBookmark(id)` — Delete bookmark

### EbookReaderCubit
**File:** `features/ebook_reader/presentation/ebook_reader_cubit.dart`

| State | Description |
|-------|-------------|
| `EbookReaderInitial` | Initial state |
| `EbookReaderLoading` | Loading book |
| `EbookReaderLoaded(book, localPdfPath, theme, fontSize, fontFamily, bookmarks, currentPage)` | Reading |
| `EbookReaderError(message)` | Error |

**Actions:**
- `loadBook(bookId)` — Load ebook
- `setTheme(theme)` — Change theme
- `setFontSize(size)` — Set font size
- `increaseFontSize()` / `decreaseFontSize()` — Adjust font
- `setFontFamily(family)` — Change font
- `setCurrentPage(page)` — Update page
- `addBookmark(label)` — Add bookmark
- `deleteBookmark(id)` — Delete bookmark

### Other Cubits

| Cubit | States | Key Actions |
|-------|--------|-------------|
| `FavoritesCubit` | Initial, Loading, Loaded, Error | loadFavorites, removeFavorite |
| `HistoryCubit` | Initial, Loading, Loaded, Error | loadHistory, deleteItem, clearReading, clearListening |
| `ProfileCubit` | Initial, Loading, Loaded, DevicesLoaded, Success, Error | loadProfile, updateProfile, uploadAvatar, loadDevices, removeDevice, logout |
| `NotificationsCubit` | Initial, Loading, Loaded, Error | loadNotifications, markAsRead, markAllAsRead, deleteNotification |
| `SubscriptionCubit` | Initial, Loading, PlansLoaded, PaymentHistoryLoaded, Success, Error | loadPlans, createSubscription, cancelSubscription, loadPaymentHistory, applyCoupon |
| `OfflineCubit` | Initial, Loading, Loaded, Error | loadDownloads, startDownload, pauseDownload, resumeDownload, deleteDownload, clearAllDownloads |
| `ReviewsCubit` | Initial, Loading, Loaded, Success, Error | loadReviews, submitReview |
| `AuthorProfileCubit` | Initial, Loading, Loaded, Error | loadAuthor |
| `StorytellingCubit` | Initial, Loading, Loaded, Error | loadStories |
| `MusicCubit` | Initial, Loading, Loaded, Error | loadMusic |
| `MyDoctorCubit` | Initial, Loading, Loaded, Error | loadHealthData |
| `MyCaptainCubit` | Initial, Loading, Loaded, Error | loadCaptainData |
| `HabitsCubit` | Initial, Loading, Loaded, Error | loadHabits, loadMyStats, completeHabit |

---

## Data Models

**File:** `shared/models/models.dart`

All models in a single file with `fromJson`/`toJson`:

### UserModel
```dart
class UserModel {
  final String id;
  final String? email;
  final String? phone;
  final String name;
  final String? avatarUrl;
  final bool emailVerified;
  final bool phoneVerified;
  final String status;
  final String preferredLanguage;
}
```

### BookModel
```dart
class BookModel {
  final String id;
  final String title;
  final String? description;
  final String? coverUrl;
  final String? thumbnailUrl;
  final String language;
  final bool isFeatured;
  final bool isPremium;
  final bool isFree;
  final String status;
  final double avgRating;
  final int ratingCount;
  final int viewCount;
  final List<AuthorModel> authors;
  final List<CategoryModel> categories;
  final List<String> tags;
  final AudioFileModel? audioFile;
  final PdfFileModel? pdfFile;
}
```

### AuthorModel
```dart
class AuthorModel {
  final String id;
  final String name;
  final String? bio;
  final String? photoUrl;
}
```

### CategoryModel
```dart
class CategoryModel {
  final String id;
  final String name;
  final String? description;
  final String slug;
}
```

### AudioFileModel
```dart
class AudioFileModel {
  final String id;
  final String fileUrl;
  final int durationSeconds;
  final int fileSizeBytes;
  final String format;
  final List<AudioChapterModel> chapters;
}
```

### AudioChapterModel
```dart
class AudioChapterModel {
  final String id;
  final String title;
  final int startSeconds;
  final int endSeconds;
  final int trackOrder;
}
```

### PdfFileModel
```dart
class PdfFileModel {
  final String id;
  final String fileUrl;
  final int pageCount;
  final int fileSizeBytes;
}
```

### SubscriptionPlanModel
```dart
class SubscriptionPlanModel {
  final String id;
  final String name;
  final int durationMonths;
  final double price;
  final String currency;
  final List<String> features;
  final bool isActive;
}
```

### SubscriptionModel
```dart
class SubscriptionModel {
  final String id;
  final SubscriptionPlanModel plan;
  final DateTime startDate;
  final DateTime endDate;
  final String status;
  final bool autoRenew;
  // Computed: isActive, daysRemaining
}
```

### PaymentModel
```dart
class PaymentModel {
  final String id;
  final double amount;
  final String currency;
  final String gateway;
  final String status;
  final DateTime createdAt;
}
```

### NotificationModel
```dart
class NotificationModel {
  final String id;
  final String title;
  final String body;
  final String type;
  final bool isRead;
  final DateTime? readAt;
  final DateTime createdAt;
}
```

### DeviceModel
```dart
class DeviceModel {
  final String id;
  final String deviceUid;
  final String deviceName;
  final String platform;
  final String? osVersion;
  final DateTime lastActiveAt;
}
```

### ReviewModel
```dart
class ReviewModel {
  final String id;
  final UserModel user;
  final double rating;
  final String? content;
  final DateTime createdAt;
}
```

### BookmarkModel
```dart
class BookmarkModel {
  final String id;
  final String bookId;
  final String type; // "page", "AUDIO", "PDF"
  final String? position;
  final String? label;
  final int? timestampSeconds;
  final DateTime createdAt;
}
```

### DownloadItemModel
```dart
class DownloadItemModel {
  final String bookId;
  final String title;
  final String? coverUrl;
  final String type;
  final int totalBytes;
  final int downloadedBytes;
  final String status;
  final String? localPath;
  // Computed: progress, isDownloading, isCompleted, isPaused, isFailed, isPending
}
```

---

## Custom Widgets

**File:** `shared/widgets/shared_widgets.dart`

| Widget | Description |
|--------|-------------|
| `KidsBookCard` | Book card with cover (CachedNetworkImage), audio badge (headphones icon), progress bar, title, author name, star rating |
| `BigTapButton` | Large animated button with scale-down press animation. Gradient decoration. Kid-friendly tap target (56px min) |
| `CategoryBlob` | Circular gradient blob with emoji or icon and label. Used in category browsing |
| `FunSectionHeader` | Section header with icon, title, and "All" see-more button |
| `ShimmerLoading` | Animated shimmer placeholder with gradient sweep. Configurable width, height, borderRadius |
| `ShimmerBookCard` | Pre-composed shimmer for book cards (cover + title + author lines) |
| `ShimmerListTile` | Pre-composed shimmer for list items (avatar + two text lines) |
| `MascotBubble` | Circular emoji mascot with label. Pre-set: cheering, waving, thinking, sleeping, listening, reading, oops, empty, loading |
| `FunEmptyState` | Empty state with emoji, title, subtitle, optional action button |
| `FunErrorState` | Error state with emoji, message, and "Let's try again!" retry button |
| `LoadingMascot` | Bouncing emoji animation with optional message |
| `ProgressBadge` | Circular progress indicator with percentage text. Star emoji at 100% |
| `KidsMiniPlayer` | Mini audio player bar with cover image, title, play/pause button. Blue background |
| `AuthGuard` | Static utility: `isAuthenticated()`, `isGuest()`, `requireAuth()` (shows sign-in bottom sheet) |
| `ParentGate` | Parental control: math question (addition). Unlocks child content after correct answer. Uses Parent Zone theme |
| `ShelfRow` | Horizontal scrolling row with configurable item dimensions |

---

## Authentication Flow

### Architecture: OAuth 2.0 + PKCE

The app uses browser-based OAuth authentication. All login/signup UI is handled by the web-auth React app (`web-auth/`). The Flutter app opens the system browser and handles the callback via deep links.

### Flow Diagram

```
Flutter App                    System Browser              Web-Auth App              Backend
    |                               |                          |                       |
    |-- 1. Generate PKCE ---------->|                          |                       |
    |   (verifier, challenge, state)|                          |                       |
    |                               |                          |                       |
    |-- 2. Open browser ----------->|-- Navigate to login ---->|                       |
    |   (url_launcher)              |   ?client_id=...         |                       |
    |                               |   &code_challenge=...    |                       |
    |                               |   &state=...             |                       |
    |                               |                          |-- 3. User logs in --->|
    |                               |                          |   (email/password,     |
    |                               |                          |    phone, OTP)         |
    |                               |                          |                       |
    |                               |                          |-- 4. /oauth/authorize->|
    |                               |                          |   (GET with JWT)       |
    |                               |                          |<-- auth code + state --|
    |                               |                          |                       |
    |<-- 5. Deep link callback -----|-- Redirect to -----------|                       |
    |   com.bariisaa.app://callback |   com.bariisaa.app://    |                       |
    |   ?code=...&state=...         |   callback?code=...      |                       |
    |                               |                          |                       |
    |-- 6. Verify state ----------->|                          |                       |
    |-- 7. Exchange code ---------->|                          |                       |
    |   POST /oauth/token           |                          |                       |
    |   (code + code_verifier)      |                          |                       |
    |<-- access_token + refresh ----|                          |                       |
    |                               |                          |                       |
    |-- 8. Store tokens ----------->|                          |                       |
    |   SecureStorage               |                          |                       |
```

### Supported Methods

1. **Email + Password** (via web-auth)
   - User enters credentials in web-auth React app
   - Web-auth calls `/auth/login` → gets JWT
   - Web-auth calls `/oauth/authorize` → gets authorization code
   - Redirects back to Flutter via deep link with auth code
   - Flutter exchanges code + PKCE verifier for tokens

2. **Phone + Password** (via web-auth)
   - Same flow as email login
   - Phone number validation in web-auth

3. **Phone OTP** (via web-auth)
   - User enters phone number in web-auth
   - Backend sends OTP via SMS (Africa's Talking)
   - User enters OTP in web-auth
   - After verification, same OAuth flow as above

4. **Google Sign-In** (via web-auth, optional)
   - User clicks Google Sign-In in web-auth
   - Google OAuth flow in system browser
   - Web-auth receives Google token, exchanges for backend JWT
   - Continues with OAuth flow (authorization code + PKCE)

5. **Continue as Guest**
   - Clears any existing tokens
   - Sets `AuthGuest` state in AuthCubit
   - Full browsing access, restricted actions prompt sign-in
   - No server authentication requiredrowsing, restricted actions require sign-in

### PKCE Implementation

**File:** `core/auth/pkce_service.dart`

```dart
class PkceService {
  static String generateCodeVerifier();     // 43-128 char random string
  static String generateCodeChallenge(String verifier);  // SHA-256 base64url
  static String generateState();            // Random state parameter
}
```

**File:** `core/auth/oauth_client.dart`

```dart
class OAuthClient {
  Future<OAuthTokenResponse> exchangeCode({
    required String code,
    required String codeVerifier,
    required String redirectUri,
  });
  Future<OAuthTokenResponse> refreshTokens(String refreshToken);
  Future<void> revokeTokens(String token);
}
```

### Token Management

| Token | Storage | Expiry | Refresh |
|-------|---------|--------|---------|
| Access Token | FlutterSecureStorage | 15 minutes | Auto via Dio interceptor |
| Refresh Token | FlutterSecureStorage | 30 days | Via `/oauth/token` (refresh grant) |
| Code Verifier | FlutterSecureStorage | Session only | Used once for code exchange |

**Auto-refresh flow:**
1. Dio interceptor catches 401 response
2. Checks if already refreshing (lock flag)
3. If not, calls `/oauth/token` with refresh token
4. Updates stored tokens
5. Retries original request
6. Queues concurrent requests during refresh

**Logout:**
1. Calls `POST /oauth/revoke` with tokens
2. Clears all stored data from FlutterSecureStorage (tokens + PKCE data)
3. Resets AuthCubit to `AuthInitial`

### Deep Link Configuration

**Android (`AndroidManifest.xml`):**
```xml
<intent-filter android:autoVerify="true">
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="com.bariisaa.app" android:host="callback" />
</intent-filter>

<!-- AudioService configuration for background audio -->
<service android:name="com.ryanheise.audioservice.AudioService"
    android:foregroundServiceType="mediaPlayback"
    android:exported="true">
    <intent-filter>
        <action android:name="android.media.browse.MediaBrowserService" />
    </intent-filter>
</service>
```

**iOS (`Info.plist`):**
```xml
<!-- Deep Link URL Schemes -->
<key>CFBundleURLTypes</key>
<array>
    <dict>
        <key>CFBundleTypeRole</key>
        <string>Editor</string>
        <key>CFBundleURLName</key>
        <string>com.bariisaa.app</string>
        <key>CFBundleURLSchemes</key>
        <array>
            <string>com.bariisaa.app</string>
        </array>
    </dict>
</array>

<!-- Universal Links (optional, for production) -->
<key>com.apple.developer.associated-domains</key>
<array>
    <string>applinks:bariisaa.com</string>
    <string>applinks:auth.bariisaa.com</string>
</array>
```

**iOS (`Runner.entitlements`):**
```xml
<key>com.apple.developer.associated-domains</key>
<array>
    <string>applinks:bariisaa.com</string>
    <string>applinks:auth.bariisaa.com</string>
</array>
```

### App Links / Universal Links

For production, the backend serves verification files:

**Android:** `backend/.well-known/assetlinks.json`
```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "com.naik.naik_mobile",
    "sha256_cert_fingerprints": ["<RELEASE_KEY_SHA256>"]
  }
}]
```

**iOS:** `backend/.well-known/apple-app-site-association`
```json
{
  "applinks": {
    "apps": [],
    "details": [{
      "appID": "<TEAM_ID>.com.naik.naikMobile",
      "paths": ["/callback", "/oauth/callback"]
    }]
  }
}
```

### Auth States

| State | Description |
|-------|-------------|
| `AuthInitial` | App start, no auth check yet |
| `AuthLoading` | Authentication in progress |
| `AuthSuccess(message)` | Action completed (signup, reset, etc.) |
| `AuthAuthenticated(UserModel)` | User is logged in |
| `AuthGuest` | User is browsing as guest |
| `AuthBrowserLaunching` | Opening system browser for OAuth |
| `AuthCallbackReceived` | Deep link callback received |
| `AuthTokenExchanging` | Exchanging auth code for tokens |
| `AuthRefreshing` | Refreshing access token |
| `AuthSessionExpired` | Session expired, re-login required |
| `AuthError(message)` | Authentication error |

### AuthCubit Actions

| Method | Description |
|--------|-------------|
| `startLogin()` | Generate PKCE + open browser |
| `handleCallback(code, state)` | Exchange code for tokens |
| `checkSession()` | Validate current session |
| `refreshTokens()` | Refresh access token |
| `logout()` | Revoke tokens + clear storage |
| `continueAsGuest()` | Enter guest mode |
| `resetState()` | Reset to initial |

---

## Audio Player Deep Dive

### Core Engine

| Library | Purpose |
|---------|---------|
| `just_audio` | Audio playback (play, pause, seek, speed, source from URL) |
| `audio_service` | Background/lock-screen controls |
| `audio_session` | Audio session management |

### AudioHandler (BariisaaTvAudioHandler)

**File:** `features/audio_player/data/audio_handler.dart`

Extends `BaseAudioHandler` with `SeekHandler`. Maps `PlaybackEvent` to `PlaybackState` for OS integration.

**OS Media Controls:**
- Play / Pause
- Rewind (10s)
- Forward (30s)
- Stop
- Skip to previous/next chapter

### Features

| Feature | Implementation |
|---------|---------------|
| Play/Pause | `just_audio` `player.play()` / `player.pause()` |
| Chapter Navigation | Seek to `chapter.startSeconds` |
| Skip Forward/Backward | `player.seek(position + 30s)` / `player.seek(position - 10s)` |
| Playback Speed | `player.setSpeed(speed)` — 0.5x to 3.0x in 0.25x steps |
| Sleep Timer | `Timer` that calls `player.pause()` after duration |
| Bookmarks | Stored via `POST /bookmarks` API |
| Progress Sync | `Timer.periodic(30s)` → `PUT /history/listening/progress` |
| Resume | `GET /history/listening/continue` → `player.seek(lastTimestampSec)` |
| Mini Player | Persistent bottom bar, state from `AudioPlayerCubit` |

### Playback Speeds

| Speed | Label |
|-------|-------|
| 0.5 | 0.5x |
| 0.75 | 0.75x |
| 1.0 | Normal |
| 1.25 | 1.25x |
| 1.5 | 1.5x |
| 1.75 | 1.75x |
| 2.0 | 2.0x |
| 2.25 | 2.25x |
| 2.5 | 2.5x |
| 2.75 | 2.75x |
| 3.0 | 3.0x |

### Sleep Timer Options

5, 10, 15, 30, 45, 60 minutes. Auto-pause when timer expires.

---

## Offline Downloads

### Architecture

**File:** `features/offline/data/offline_repository.dart`

- Downloads managed via `manifest.json` in app documents directory
- Uses Dio's `download()` with `CancelToken` for pause/resume
- Each download tracked as `DownloadItemModel`

### Download States

```
pending → downloading → completed
                  ↓
                paused → downloading → completed
                  ↓
                failed
```

### Features

| Feature | Implementation |
|---------|---------------|
| Download Audio/PDF | `dio.download(fileUrl, localPath, cancelToken: cancelToken)` |
| Download Manager | ListView with progress bars, status badges |
| Pause | `cancelToken.cancel()` — saves progress |
| Resume | Re-download from where it left off |
| Delete | Remove file + manifest entry |
| Clear All | Remove all files + reset manifest |
| Storage Tracking | Calculate total bytes from manifest |
| Manifest Persistence | JSON file tracks all download states |
| Auto-detect | Check if file exists before downloading |
| Offline Playback | Audio player uses local file paths |
| Resume from Local | Ebook reader opens locally cached PDFs |

### Manifest Structure

```json
{
  "downloads": [
    {
      "bookId": "...",
      "title": "...",
      "coverUrl": "...",
      "type": "audio",
      "totalBytes": 1024000,
      "downloadedBytes": 1024000,
      "status": "completed",
      "localPath": "/data/user/0/.../files/downloads/book_id.mp3"
    }
  ]
}
```

---

## Firebase Configuration

### Project: `bariisaa-tv`

| Config | Value |
|--------|-------|
| Project ID | `bariisaa-tv` |
| Auth Domain | `bariisaa-tv.firebaseapp.com` |
| Storage Bucket | `bariisaa-tv.firebasestorage.app` |
| Messaging Sender ID | `446551709086` |
| Measurement ID | `G-5FEZ3824LH` |

### Platform Configs

| Platform | App ID | Package |
|----------|--------|---------|
| Android | `1:446551709086:android:eed81952bb49d64dc8728f` | `com.naik.naik_mobile` |
| iOS | `1:446551709086:ios:fb45db6d957c7958c8728f` | `com.naik.naikMobile` |
| Web | `1:446551709086:web:feb2c7cdee5cc4cec8728f` | — |

### Firebase Services Used

| Service | Purpose |
|---------|---------|
| Firebase Messaging | Push notifications (FCM) |
| Firebase Core | Initialization |

### Initialization

Firebase is initialized **after** `runApp()` to prevent ANR (Application Not Responding):

```dart
void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await setupDependencies();
  runApp(const BariisaaTvApp());
  _initializeFirebase();  // Deferred — non-blocking
  _loadFonts();
}
```

---

## Assets

### Images
- `assets/images/logo.png` — App logo

### Fonts

| Font Family | File | Weights | Purpose |
|-------------|------|---------|---------|
| Roboto | `Roboto.woff2`, `Roboto-Bold.woff2` | 400, 700 | Default fallback |
| NotoSansEthiopic | `NotoSansEthiopic.ttf` | 400 | Amharic/Oromo script |
| NotoColorEmoji | `NotoColorEmoji.woff2` | 400 | Emoji rendering |
| Baloo2 | `Baloo2.woff2` | 400 | Playful headings (kids theme) |
| Nunito | `Nunito.woff2` | 400 | Rounded body text (kids theme) |

### Icons
- `assets/icons/` — App icons directory

---

## Commands

### Development

```bash
cd mobile

# Install dependencies
flutter pub get

# Run on emulator (interactive)
flutter run

# Run on specific device
flutter run -d <device-id>

# Run with verbose logging
flutter run -v
```

### Build

```bash
# Debug APK
flutter build apk --debug

# Release APK
flutter build apk --release

# App Bundle (for Play Store)
flutter build appbundle
```

### Quality

```bash
# Dart analyzer (lint)
flutter analyze

# Run unit tests
flutter test

# Run tests with coverage
flutter test --coverage

# Check outdated packages
flutter pub outdated
```

### Maintenance

```bash
# Clear build cache
flutter clean

# Regenerate pubspec.lock
flutter pub get

# Upgrade dependencies
flutter pub upgrade

# Downgrade dependencies
flutter pub downgrade
```

---

## Routing Summary

| # | Route | Screen | Description |
|---|-------|--------|-------------|
| 1 | `/` | SplashScreen | Animated logo, auth check |
| 2 | `/oauth-callback` | OAuth Callback Handler | Processes OAuth deep link callback |
| 3 | `/discovery` | DiscoveryScreen | Book browsing |
| 4 | `/books` | DiscoveryScreen | Books (root nav) |
| 5 | `/book/:id` | BookDetailScreen | Book detail |
| 6 | `/search` | SearchResultsScreen | Search results |
| 7 | `/category/:id` | CategoryBrowseScreen | Category books |
| 8 | `/audio-player` | AudioPlayerScreen | Audio player |
| 9 | `/ebook-reader` | EbookReaderScreen | PDF reader |
| 10 | `/storytelling` | StorytellingScreen | Stories |
| 11 | `/music` | MusicScreen | Music |
| 12 | `/my-doctor` | MyDoctorScreen | Health tips |
| 13 | `/my-captain` | MyCaptainScreen | Achievements |
| 14 | `/habits` | HabitsScreen | Habit tracking |
| 15 | `/favorites` | FavoritesScreen | Favorite books |
| 16 | `/history` | HistoryScreen | Reading/listening history |
| 17 | `/notifications` | NotificationsScreen | Notifications |
| 18 | `/profile` | ProfileScreen | User profile |
| 19 | `/edit-profile` | EditProfileScreen | Edit profile |
| 20 | `/devices` | DevicesScreen | Manage devices |
| 21 | `/plans` | PlansScreen | Subscription plans |
| 22 | `/payment-success` | PaymentSuccessScreen | Payment success |
| 23 | `/payment-failure` | PaymentFailureScreen | Payment failure |
| 24 | `/payment-history` | PaymentHistoryScreen | Payment history |
| 25 | `/downloads` | DownloadManagerScreen | Download manager |
| 26 | `/reviews/:bookId` | ReviewsScreen | Book reviews |
| 27 | `/write-review/:bookId` | WriteReviewScreen | Write review |
| 28 | `/author/:id` | AuthorProfileScreen | Author page |
| 29 | `/menu-all` | MenuAllScreen | Navigation hub |

**External (Web-Auth React App):**
- `https://auth.bariisaa.com/login` — Login screen
- `https://auth.bariisaa.com/signup` — Signup screen
- `https://auth.bariisaa.com/otp` — OTP verification
- `https://auth.bariisaa.com/forgot-password` — Password reset request
- `https://auth.bariisaa.com/reset-password` — Password reset form
- `https://auth.bariisaa.com/callback` — OAuth callback processor

---

## Screen Flow & Navigation

This section documents how every screen connects, what triggers each navigation, and the complete user journey through the app.

### Global Navigation Pattern

The app uses **GoRouter** with a central hub pattern (no bottom navigation bar). All navigation goes through `MenuAllScreen`:

```
                        +-----------------+
                        |  SplashScreen   |
                        +--------+--------+
                                 |
                    +------------+------------+
                    |                         |
              [Has Token]              [No Token / Guest]
                    |                         |
                    v                         v
            +-------+-------+        +-------+-------+
            | AuthCubit     |        | AuthCubit     |
            | checkAuth()   |        | checkAuth()   |
            +-------+-------+        +-------+-------+
                    |                         |
         +----------+----------+              |
         |                     |              |
   [Authenticated]       [Guest]             |
         |                     |              |
         v                     v              v
  +------+------+     +------+------+  +------+------+
  |   MenuAll   |<----|   MenuAll   |  |   Login     |
  |   Screen    |     |   Screen    |  |   Screen    |
  +------+------+     +------+------+  +------+------+
         |                     |              |
         v                     v              v
    [All Features]       [All Features]  [All Auth Screens]
```

### Complete Flow Diagrams

#### 1. App Launch Flow

```
+------------------+
|    main()        |
| WidgetsFlutter   |
| ensureInitialized|
+--------+---------+
         |
         v
+--------+---------+
| setupDependencies|  <-- Registers 25 singletons via get_it
+--------+---------+
         |
         v
+--------+---------+
|    runApp()      |  <-- App renders immediately
+--------+---------+
         |
         v
+--------+---------+
| SplashScreen     |
| - Animated logo  |
| - Auth check     |
| - 5s timeout     |
+--------+---------+
         |
    +----+----+
    |         |
[Token]   [No Token]
    |         |
    v         v
[Authenticated] [AuthGuest]
    |         |
    v         v
+---+----+ +---+----+
|MenuAll | |MenuAll |
|Screen  | |Screen  |
+--------+ +--------+
```

#### 2. Authentication Flow

```
+-------------------+
| Splash / MenuAll  |
| (User taps login) |
+--------+----------+
         |
         v
+--------+---------+
|   AuthCubit      |
| startLogin()     |
+--------+---------+
         |
    [Generate PKCE]
    [code_verifier, code_challenge, state]
         |
         v
+--------+---------+
| url_launcher     |
| Opens System     |
| Browser          |
+--------+---------+
         |
         v
+-------------------+
| Web-Auth React App|
| (Login/Signup UI) |
+--------+----------+
         |
    [User authenticates]
    [Email/Phone/OTP/Google]
         |
         v
+--------+---------+
| Web-Auth calls   |
| /oauth/authorize |
+--------+---------+
         |
    [Gets auth code]
         |
         v
+--------+---------+
| Redirect to      |
| com.bariisaa.app |
| ://callback      |
| ?code=...&state=.|
+--------+---------+
         |
         v
+--------+---------+
| Deep Link Handler|
| Catches callback |
+--------+---------+
         |
    [Verify state]
         |
         v
+--------+---------+
| AuthCubit        |
| handleCallback() |
| Exchange code +  |
| code_verifier    |
+--------+---------+
         |
    [POST /oauth/token]
         |
    +----+----+
    |         |
[Success] [Error]
    |         |
    v         v
+---+----+ +--+---+
| Store  | | Auth |
| Tokens | |Error |
+---+----+ +------+
    |
    v
+---+----+
| MenuAll |
| Screen  |
+--------+

Alternative: Continue as Guest
+-------------------+
| Splash / MenuAll  |
+--------+----------+
         |
    [Tap "Continue as Guest"]
         |
         v
+--------+---------+
| AuthCubit        |
| continueAsGuest()|
+--------+---------+
         |
    [Set AuthGuest state]
         |
         v
+--------+---------+
| MenuAll Screen   |
| (Guest mode)     |
+------------------+
```

**Authentication Navigation:**
| User Action | Navigation |
|-------------|------------|
| Tap "Sign In" | → Opens system browser → Web-auth OAuth flow → Deep link callback → Token exchange → `/menu-all` |
| Tap "Continue as Guest" | → `/menu-all` (guest mode, no authentication) |
| Restricted action as guest | → Shows sign-in bottom sheet → Opens browser for auth (if user confirms) |
| OAuth callback success | → Deep link → Exchange code for tokens → Store in secure storage → `/menu-all` |
| OAuth callback error | → Shows error message → Stays on current screen |
| User cancels browser | → Returns to app → Stays on current screen |

#### 3. Discovery & Book Flow

```
+-------------------+
|  MenuAll Screen   |
+--------+----------+
          |
     +----+----+
     |         |
     v         v
+---+---+ +---+--------+
|Explore| |Featured    |
|Grid   | |Carousel    |
+---+---+ +---+--------+
    |         |
    v         v
+---+---------+---+
| Discovery Screen |
| (with App Bar)  |
+--------+--------+
          |
     +----+----+----+----+
     |    |    |    |    |
     v    v    v    v    v
 [Pill][Book][Audio][Music][Story]
 Shelf Shelf Shelf Shelf Shelf
     |    |    |    |    |
     v    v    v    v    v
 +---+--+ +--+---+ +---+--------+
 |Books | |Audio | |Explore     |
 |Shelf | |Shelf | |Grid        |
 +------+ +------+ +---+--------+
                          |
                     +----+----+----+
                     |    |    |    |
                     v    v    v    v
                   [Music][Story]   [Category]
                     Shelf Shelf    Detail
                          |        |
                          v        v
                    +---+---+ +----+-----+
                    |Music  | |Storytell |
                    |Screen | |  Screen  |
                    +-------+ +----------+
```

**Discovery Screen Navigation:**
| User Action | Navigation |
|-------------|------------|
| Tap search icon | → `/search` |
| Tap notification icon | → `/notifications` |
| Tap profile/owl avatar | → `/profile` |
| Tap category pill | → Navigates to category route |
| Tap Featured carousel card | → `/book/:id`, `/music/:id`, or `/storytelling/:id` depending on type |
| Tap Books shelf card | → `/book/:id` |
| Tap Audio shelf card | → `/book/:id` (tap) or `/audio-player` (long-press) |
| Tap Music shelf card | → `/music` |
| Tap Stories shelf card | → `/storytelling` |
| Tap Explore category | → Navigates to category route |
| Tap "READ" badge on book card | → `/book/:id` |
| Pull to refresh | → Reloads all categories + featured content |

**Book Detail Screen Navigation:**
| User Action | Navigation |
|-------------|------------|
| Tap "Listen" button | → `/audio-player` (passes BookModel) |
| Tap "Read" button | → `/ebook-reader` (passes BookModel) |
| Tap "Download" button | → Starts download (stays on screen) |
| Tap "Reviews" section | → `/reviews/:bookId` |
| Tap "Write Review" | → `/write-review/:bookId` (requires auth) |
| Tap related book | → `/book/:id` (nested) |
| Tap author name | → `/author/:id` |
| Tap back arrow | → Pop (previous screen) |

**Search Results Navigation:**
| User Action | Navigation |
|-------------|------------|
| Tap filter icon | → Show filter bottom sheet |
| Select category/language | → Re-search with filters |
| Tap book card | → `/book/:id` |
| Tap back | → `/discovery` |

**Category Browse Navigation:**
| User Action | Navigation |
|-------------|------------|
| Tap book card | → `/book/:id` |
| Tap back | → `/discovery` |

#### 4. Audio Player Flow

```
+-------------------+
| Audio Player      |
| Screen            |
+--------+----------+
         |
    +----+----+----+----+----+----+
    |    |    |    |    |    |    |
    v    v    v    v    v    v    v
 [Play][Prev][Next][Skip][Speed][Sleep][Bookmark]
 /Pause Ch    Ch   Fwd/Bck       Timer
    |    |    |    |    |    |    |
    v    v    v    v    v    v    v
 [just_audio plays audio with controls]
    |
    +----+----+----+----+
    |    |    |    |    |
    v    v    v    v    v
 [Chapters][Speed][Sleep][Bookmarks]
 List      Sheet  Sheet  Sheet
    |       |      |      |
    v       v      v      v
 [Bottom sheets for selection]
    |
    v
 [Progress sync every 30s]
 [OS media controls active]
 [Mini player on other screens]
```

**Audio Player Navigation:**
| User Action | Navigation |
|-------------|------------|
| Tap play/pause | → Toggle playback (stays on screen) |
| Tap previous chapter | → Seek to previous chapter start |
| Tap next chapter | → Seek to next chapter start |
| Tap skip forward | → Seek +30 seconds |
| Tap skip backward | → Seek -10 seconds |
| Tap speed button | → Show speed bottom sheet |
| Tap sleep timer | → Show sleep timer bottom sheet |
| Tap bookmark | → Add bookmark at current position |
| Tap chapter list | → Show chapters bottom sheet |
| Tap back arrow | → Pop (mini player continues) |
| App goes to background | → Audio continues (audio_service) |
| Lock screen | → OS media controls available |

**Mini Player Navigation:**
| User Action | Navigation |
|-------------|------------|
| Tap mini player bar | → `/audio-player` (full screen) |
| Tap play/pause on mini | → Toggle playback (stays on current screen) |

#### 5. E-Book Reader Flow

```
+-------------------+
| E-Book Reader     |
| Screen            |
+--------+----------+
         |
    +----+----+
    |         |
    v         v
[Tap screen] [Tap screen]
    |              |
    v              v
[Show overlay] [Hide overlay]
    |
    +----+----+----+----+----+
    |    |    |    |    |    |
    v    v    v    v    v    v
 [Theme][Font][Font][Back][Bookmark][Chapters]
 Size  Family      ]
 +/-   Picker
    |    |    |    |    |    |
    v    v    v    v    v    v
 [Settings panel changes reader]
    |
    v
 [Progress sync every 15s]
 [Completion celebration at end]
```

**E-Book Reader Navigation:**
| User Action | Navigation |
|-------------|------------|
| Tap center of screen | → Toggle settings overlay |
| Tap theme button | → Switch theme (light/sepia/dark) |
| Tap font +/- | → Increase/decrease font size |
| Tap font family | → Change font family |
| Tap bookmark | → Add bookmark at current page |
| Tap chapter list | → Show chapters/bookmarks bottom sheet |
| Tap back arrow | → Pop (save progress) |
| Reach last page | → Show completion celebration |
| Swipe left/right | → Turn pages (PDF mode) |

#### 6. Content Features Flow

```
+-------------------+
|   MenuAll Screen  |
+--------+----------+
         |
    +----+----+----+----+
    |    |    |    |    |
    v    v    v    v    v
 [Story][Music][My  ][My  ][Habits]
 telling      DoctorCaptain
    |    |    |    |    |
    v    v    v    v    v
+---+--+ +--+---+ +--+---+ +--+---+ +--+---+
|Story | |Music | |My    | |My    | |Habits|
|Screen| |Screen| |Doctor| |Captain| |Screen|
+------+ +------+ +------+ +------+ +------+
    |        |        |        |        |
    v        v        v        v        v
 [Category][Genre][Quick ][Stats ][Complete]
 Chips     Chips Actions  Row    Button
    |        |        |        |        |
    v        v        v        v        v
 [Content cards / lists]
    |
    v
 [Pull to refresh on all]
```

**Storytelling Screen Navigation:**
| User Action | Navigation |
|-------------|------------|
| Tap category chip | → Filter stories by category |
| Tap featured story card | → Story detail |
| Tap back | → `/menu-all` |

**Music Screen Navigation:**
| User Action | Navigation |
|-------------|------------|
| Tap genre chip | → Filter music by genre |
| Tap album card | → Album/track detail |
| Tap play icon on track | → Play audio |
| Tap back | → `/menu-all` |

**My Doctor Screen Navigation:**
| User Action | Navigation |
|-------------|------------|
| Tap quick action (Appointment) | → Appointment screen |
| Tap quick action (Medicine) | → Medicine info |
| Tap quick action (Health Info) | → Health info |
| Tap quick action (Emergency) | → Emergency contacts |
| Tap doctor card | → Doctor profile detail |
| Tap back | → `/menu-all` |

**My Captain Screen Navigation:**
| User Action | Navigation |
|-------------|------------|
| Tap achievement card | → Achievement detail |
| Tap leaderboard item | → Player profile |
| Tap back | → `/menu-all` |

**Habits Screen Navigation:**
| User Action | Navigation |
|-------------|------------|
| Tap complete button (green check) | → Mark habit complete |
| Tap habit card | → Habit detail |
| Guest: Tap "Sign In" banner | → `/login` |
| Tap back | → `/menu-all` |

#### 7. User Management Flow

```
+-------------------+
|   MenuAll Screen  |
+--------+----------+
         |
    +----+----+----+----+
    |    |    |    |    |
    v    v    v    v    v
 [Profile][Edit][Down][Devices][Notif]
          Profile loads
    |    |    |    |    |
    v    v    v    v    v
+---+--+ +--+---+ +--+---+ +--+---+ +--+---+
|Profile| |Edit  | |Down  | |Device| |Notif |
|Screen | |Profile| |loads | |Screen| |Screen|
+---+---+ +------+ +------+ +------+ +------+
    |
    +----+----+----+----+----+----+
    |    |    |    |    |    |    |
    v    v    v    v    v    v    v
 [Read][List][Fav][Sub][Pay][Dev][Logout]
 Historyening     Plans Historyices
```

**Profile Screen Navigation:**
| User Action | Navigation |
|-------------|------------|
| Tap "Reading History" | → `/history?tab=reading` |
| Tap "Listening History" | → `/history?tab=listening` |
| Tap "Favorites" | → `/favorites` |
| Tap "Downloads" | → `/downloads` |
| Tap "Subscription Plans" | → `/plans` |
| Tap "Payment History" | → `/payment-history` |
| Tap "Devices" | → `/devices` |
| Tap "Edit Profile" | → `/edit-profile` |
| Tap "Logout" | → Confirm dialog → `/login` |
| Guest: Tap "Sign In" | → `/login` |
| Guest: Tap "Create Account" | → `/signup` |
| Tap back | → `/menu-all` |

**Edit Profile Navigation:**
| User Action | Navigation |
|-------------|------------|
| Tap "Save" (valid) | → Pop with success message |
| Tap "Save" (invalid) | → Error state (stays on screen) |
| Tap back | → Pop (discard changes) |

**Devices Screen Navigation:**
| User Action | Navigation |
|-------------|------------|
| Tap "Remove" on device | → Confirmation dialog |
| Confirm remove | → Device removed (stays on screen) |
| Cancel remove | → Dialog closes (stays on screen) |
| Tap back | → `/profile` |

**Notifications Screen Navigation:**
| User Action | Navigation |
|-------------|------------|
| Tap "Mark all read" | → All marked read (stays on screen) |
| Swipe notification | → Delete notification |
| Tap notification | → Mark as read |
| Pull to refresh | → Reload notifications |
| Tap back | → `/menu-all` |

#### 8. Subscription & Payment Flow

```
+-------------------+
|   MenuAll Screen  |
+--------+----------+
         |
         v
+--------+---------+
|  Plans Screen    |
+--------+----------+
         |
    +----+----+----+
    |    |    |    |
    v    v    v    v
 [Select][Apply][Subscribe][Cancel]
 Plan    Coupon  Button     Sub
    |       |      |
    v       v      v
 [Payment Gateway Selection]
    |
    +----+----+
    |         |
    v         v
[Success] [Failure]
    |         |
    v         v
+---+---+ +---+--------+
|Payment| |Payment     |
|Success| |Failure     |
|Screen | |Screen      |
+---+---+ +---+--------+
    |         |
    v         v
 [Continue] [Try Again → Plans]
 Reading
    |
    v
/menu-all
```

**Plans Screen Navigation:**
| User Action | Navigation |
|-------------|------------|
| Tap "Subscribe Now" (valid coupon) | → Payment gateway → `/payment-success` |
| Tap "Subscribe Now" (payment fails) | → `/payment-failure` |
| Tap "Apply Coupon" | → Validate coupon, update price |
| Tap "Cancel Subscription" | → Confirm → Cancel subscription |
| Tap back | → `/menu-all` |

**Payment Success Navigation:**
| User Action | Navigation |
|-------------|------------|
| Tap "Continue Reading" | → `/menu-all` |
| Tap back | → `/menu-all` |

**Payment Failure Navigation:**
| User Action | Navigation |
|-------------|------------|
| Tap "Try Again" | → `/plans` |
| Tap "Go to Menu" | → `/menu-all` |
| Tap back | → `/plans` |

**Payment History Navigation:**
| User Action | Navigation |
|-------------|------------|
| Tap payment item | → Expand details |
| Tap back | → `/profile` |

#### 9. Reviews Flow

```
+-------------------+
|  Book Detail      |
|  Screen           |
+--------+----------+
         |
         v
+--------+---------+
|  Reviews Screen  |
+--------+----------+
         |
    +----+----+
    |         |
    v         v
[Review List][Write Button]
    |              |
    v              v
[User reviews]  +---+-----------+
                | Write Review  |
                | Screen        |
                +-------+-------+
                        |
                   +----+----+
                   |         |
                   v         v
              [Submit]   [Cancel]
                  |         |
                  v         v
              [Pop with  [Pop]
               success]
```

**Reviews Screen Navigation:**
| User Action | Navigation |
|-------------|------------|
| Tap "Write" button | → `/write-review/:bookId` (requires auth) |
| Tap back | → Pop (book detail) |

**Write Review Navigation:**
| User Action | Navigation |
|-------------|------------|
| Tap stars | → Set rating (1-5) |
| Tap "Submit" (valid) | → Pop with success message |
| Tap "Submit" (invalid) | → Error state (stays on screen) |
| Tap back | → Pop (discard review) |

#### 10. Favorites & History Flow

```
+-------------------+
|   MenuAll Screen  |
+--------+----------+
         |
    +----+----+
    |         |
    v         v
+---+---+ +---+--------+
|Favor | |History     |
|ites  | |Screen      |
|Screen| +---+--------+
+---+---+     |
    |     +---+---+
    |     |       |
    v     v       v
 [Grid] [Reading][Listening]
         Tab      Tab
           |        |
           v        v
        [List]   [List]
           |        |
           v        v
        [Tap → Reader/Player]
        [Swipe → Delete]
```

**Favorites Screen Navigation:**
| User Action | Navigation |
|-------------|------------|
| Tap book card | → `/book/:id` |
| Tap star to unfavorite | → Remove from favorites |
| Guest: Tap "Sign In" | → `/login` |
| Pull to refresh | → Reload favorites |
| Tap back | → `/menu-all` |

**History Screen Navigation:**
| User Action | Navigation |
|-------------|------------|
| Tap "Reading" tab | → Show reading history |
| Tap "Listening" tab | → Show listening history |
| Tap history item | → `/ebook-reader` (reading) or `/audio-player` (listening) |
| Swipe item | → Delete history entry |
| Tap "Clear All" | → Confirm → Clear all history |
| Tap back | → `/menu-all` |

#### 11. Download Manager Flow

```
+-------------------+
|   MenuAll Screen  |
+--------+----------+
         |
         v
+--------+---------+
| Download Manager |
| Screen           |
+--------+----------+
         |
    +----+----+----+
    |    |    |    |
    v    v    v    v
 [Storage][Download][Pause/Resume][Delete]
 Usage    List       Button       Button
    |       |          |            |
    v       v          v            v
 [MB Bar] [Progress] [Toggle] [Confirm → Remove]
                    State
```

**Download Manager Navigation:**
| User Action | Navigation |
|-------------|------------|
| Tap "Pause" on downloading item | → Pause download |
| Tap "Resume" on paused item | → Resume download |
| Tap "Delete" on item | → Confirm → Delete |
| Tap "Clear All" | → Confirm → Delete all |
| Tap back | → `/menu-all` |

#### 12. Author Profile Flow

```
+-------------------+
|  Book Detail      |
|  Screen           |
+--------+----------+
         |
         v
+--------+---------+
| Author Profile   |
| Screen           |
+--------+----------+
         |
         v
+--------+---------+
| Author Books     |
| Grid             |
+--------+----------+
         |
         v
    [Tap book → /book/:id]
```

**Author Profile Navigation:**
| User Action | Navigation |
|-------------|------------|
| Tap book card | → `/book/:id` |
| Tap back | → Pop (book detail) |

### Screen Transition Summary

| From Screen | To Screen | Trigger |
|-------------|-----------|---------|
| Splash | MenuAll | Auth check (authenticated or guest) |
| Splash | System Browser (Web-Auth) | Initiate OAuth login |
| System Browser (Web-Auth) | OAuth Callback → MenuAll | Successful authentication |
| MenuAll | All feature screens | Grid item tap |
| Discovery | Book Detail | Book card tap |
| Discovery | Category Browse | Category blob tap |
| Discovery | Search Results | Search query submit |
| Book Detail | Audio Player | "Listen" button |
| Book Detail | E-Book Reader | "Read" button |
| Book Detail | Reviews | "Reviews" section tap |
| Book Detail | Author Profile | Author name tap |
| Audio Player | (back with mini player) | Back arrow |
| E-Book Reader | (back) | Back arrow (progress saved) |
| Profile | Edit Profile | "Edit Profile" tap |
| Profile | History | "Reading/Listening History" tap |
| Profile | Favorites | "Favorites" tap |
| Profile | Downloads | "Downloads" tap |
| Profile | Plans | "Subscription Plans" tap |
| Profile | Devices | "Devices" tap |
| Plans | Payment Success | Successful payment |
| Plans | Payment Failure | Failed payment |
| Any screen (guest) | System Browser (Web-Auth) | Restricted action trigger |
| All screens | MenuAll | Back navigation (eventually) |

### Auth Guard Behavior

When a guest tries to access a restricted action:

```
[Guest taps restricted action]
         |
         v
+--------+---------+
| AuthGuard         |
| requireAuth()     |
+--------+----------+
         |
         v
+--------+---------+
| Sign-In Bottom    |
| Sheet             |
| - Create Account  |
| - Sign In         |
| - Maybe Later     |
+--------+----------+
         |
    +----+----+----+
    |         |    |
    v         v    v
 [Create] [Sign] [Close]
 Account   In     Sheet
    |       |      |
    v       v      v
 /signup  /login  (stays)
```

**Restricted Actions (require auth):**
- Listen to audio
- Read ebooks
- Add/remove favorites
- Write reviews
- Manage devices
- Subscribe to plans
- View payment history
- Download content
- Complete habits

**Guest-Allowed Actions:**
- Browse books
- View book details
- View categories
- View author profiles
- View reviews
- View storytelling
- View music
- View health tips
- View achievements


---

## Summary of OAuth PKCE Architecture

### Key Changes from Traditional Auth

This mobile app uses a **modern, secure OAuth 2.0 Authorization Code flow with PKCE**, which differs from traditional mobile authentication:

#### Traditional Mobile Auth (Old Approach)
❌ Login/signup forms embedded in mobile app  
❌ Credentials transmitted directly to backend  
❌ Authentication state managed entirely in app  
❌ WebView-based authentication (security risks)  
❌ Separate auth flows for each platform

#### OAuth PKCE Architecture (Current Approach)
✅ Authentication UI in separate web-auth React app  
✅ System browser handles all auth (no WebView)  
✅ PKCE prevents authorization code interception  
✅ Deep links for secure callback handling  
✅ Consistent auth experience across platforms  
✅ Separation of concerns (auth UI vs. app logic)  
✅ Enhanced security with state parameter (CSRF protection)

### Architecture Benefits

| Benefit | Description |
|---------|-------------|
| **Security** | PKCE prevents man-in-the-middle attacks by requiring code_verifier to exchange auth code for tokens |
| **Consistency** | Same web-auth UI for mobile and web, easier maintenance |
| **System Browser** | Better security, password managers work, 2FA support, no embedded WebView vulnerabilities |
| **Separation of Concerns** | Auth logic isolated in web-auth, Flutter app focuses on features |
| **Token Security** | Tokens stored in FlutterSecureStorage (hardware-backed encryption on supported devices) |
| **Auto-Refresh** | Dio interceptor automatically refreshes expired tokens without user intervention |
| **State Management** | AuthCubit provides reactive auth state with 11 distinct states |

### OAuth Flow Summary

1. **User Action** → Tap "Sign In" in Flutter app
2. **PKCE Generation** → Flutter generates code_verifier, code_challenge, state
3. **Browser Launch** → Flutter opens system browser to web-auth app
4. **User Authentication** → User logs in via web-auth (email/phone/OTP/Google)
5. **Authorization Code** → Backend issues authorization code
6. **Deep Link Callback** → Web-auth redirects to `com.bariisaa.app://callback?code=...&state=...`
7. **State Verification** → Flutter verifies state parameter (CSRF protection)
8. **Token Exchange** → Flutter sends code + code_verifier to backend
9. **PKCE Validation** → Backend validates code_verifier against stored code_challenge
10. **Token Issuance** → Backend returns access + refresh tokens
11. **Token Storage** → Flutter stores tokens in FlutterSecureStorage
12. **Navigation** → User redirected to home screen

### Security Features

| Feature | Implementation |
|---------|---------------|
| **PKCE** | SHA-256 hashing of code_verifier → code_challenge |
| **State Parameter** | Random string to prevent CSRF attacks |
| **Token Encryption** | FlutterSecureStorage (AES-256 on Android, Keychain on iOS) |
| **Token Rotation** | Refresh tokens rotated on every refresh |
| **Auto-Refresh** | Dio interceptor with lock/queue for concurrent requests |
| **Deep Link Validation** | Verifies state parameter before processing callback |
| **Secure Browser** | System browser (no WebView), supports password managers |
| **Token Revocation** | Explicit revocation on logout |
| **Session Validation** | Periodic session checks via `/oauth/userinfo` |

### Key Components

| Component | Location | Purpose |
|-----------|----------|---------|
| **PkceService** | `core/auth/pkce_service.dart` | Generate PKCE parameters |
| **OAuthClient** | `core/auth/oauth_client.dart` | Token exchange, refresh, revoke |
| **DeepLinkHandler** | `core/auth/deep_link_handler.dart` | Process OAuth callbacks |
| **AuthCubit** | `features/auth/presentation/auth_cubit.dart` | Auth state management |
| **AuthRepository** | `features/auth/data/auth_repository.dart` | OAuth API calls |
| **ApiClient** | `core/network/api_client.dart` | Auto-refresh interceptor |
| **SecureStorageService** | `core/storage/secure_storage.dart` | Token storage |
| **Web-Auth App** | External React app | Authentication UI |

### Token Lifecycle

```
[User Login] → [OAuth Flow] → [Access Token (15 min)] → [Stored in SecureStorage]
                                      |
                                      v
                            [API Request with Bearer Token]
                                      |
                        +-------------+-------------+
                        |                           |
                   [200 OK]                    [401 Unauthorized]
                        |                           |
                        v                           v
                 [Continue]              [Dio Interceptor Catches]
                                                    |
                                         +----------+-----------+
                                         |                      |
                                   [Has Refresh?]         [No Refresh]
                                         |                      |
                                         v                      v
                              [POST /oauth/token]     [AuthSessionExpired]
                              [grant_type=refresh]          |
                                         |                   v
                                   +-----+-----+        [Redirect to Login]
                                   |           |
                              [Success]   [Failure]
                                   |           |
                                   v           v
                      [Update Tokens]   [Clear Tokens]
                      [Retry Request]   [Redirect to Login]
```

### Error Handling

| Error Type | Flutter Behavior | User Experience |
|------------|------------------|-----------------|
| User cancels browser | Return to app | "Sign in to continue" message |
| Invalid credentials | N/A (handled in web-auth) | Error in web-auth, retry |
| Network error | Show error in Flutter | "Connection error" with retry |
| Invalid auth code | Clear stored data | "Authentication failed" |
| State mismatch | Reject callback | "Security error, please try again" |
| Token exchange fails | Clear tokens, show error | "Authentication failed" |
| Refresh token expired | Clear tokens | "Session expired, please sign in" |
| Token revocation fails | Clear local tokens anyway | Silent (best effort) |

### Development Tips

**Testing OAuth Flow:**
```bash
# Run web-auth app locally
cd web-auth
npm run dev  # Runs on http://localhost:5173

# Update Flutter constants for local testing
# core/constants/app_constants.dart
static const String webAuthUrl = 'http://localhost:5173';

# Run Flutter app with dev backend
cd mobile
flutter run
```

**Debugging Deep Links:**
```bash
# Android: Test deep link
adb shell am start -W -a android.intent.action.VIEW -d "com.bariisaa.app://callback?code=test123&state=test456" com.naik.naik_mobile

# iOS: Test deep link (in simulator)
xcrun simctl openurl booted "com.bariisaa.app://callback?code=test123&state=test456"
```

**Viewing Secure Storage (Debug Only):**
```dart
// In debug builds, you can inspect stored tokens
final storage = getIt<SecureStorageService>();
final accessToken = await storage.read('access_token');
print('Access Token: $accessToken');
```

**Common Issues:**
| Issue | Solution |
|-------|----------|
| Deep link not working | Check AndroidManifest.xml intent-filter and Info.plist URL schemes |
| Token refresh loop | Check refresh token expiry, ensure backend returns new refresh token |
| PKCE validation fails | Verify code_challenge uses SHA-256 and base64url encoding |
| State mismatch | Ensure state is stored before opening browser and verified on callback |
| Browser doesn't open | Check url_launcher permissions, ensure web-auth URL is accessible |

---

**For more details:**
- Backend OAuth implementation: See `backend/src/modules/oauth/`
- Web-Auth React app: See `web-auth/` directory
- Main README: See project root `README.md`
- Architecture docs: See `docs/ARCHITECTURE.md`
