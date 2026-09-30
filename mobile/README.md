# Bariisaa Tv Mobile

The Flutter mobile application for the Bariisaa Tv Audio Book & E-Book Platform
(kid-friendly). **No authentication required** — users jump straight into content.

## 🎨 Background Update (Sep 2026)

All screen backgrounds have been updated to remove the yellow book-pattern image (`app_bg.jpg`).
Screens now use solid theme colors instead:

- **Discovery, Books, Music, Storytelling, My Doctor, My Captain** — clean solid backgrounds
- **Themed Screen Scaffold** — background scrim removed, content displays over solid color

The `AppBackground` widget remains in the codebase (`lib/shared/widgets/app_background.dart`) but is no longer
imported by any screen. Screens previously wrapped in `AppBackground()` now use their
inherited `Theme` background or `AppTheme.creamBg` / `AppTheme.scaffoldBackground`.

## Brand Palette (Bariisaa — purple + gold)

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

Defined in `lib/core/theme/app_theme.dart` (`lightTheme`, `darkTheme`, `parentTheme`).
Legacy constant names (`skyBlue`, `deepIndigo`, `sunnyYellow`, `darkText`, …) are
retained as aliases so existing screens pick up the brand colors automatically.

## Tech Stack

- **Framework:** Flutter 3.x / Dart
- **State:** flutter_bloc (Cubit)
- **Routing:** go_router
- **HTTP:** dio
- **DI:** get_it
- **Secure storage:** flutter_secure_storage (dev-mode flag only)
- **Audio:** media_kit (cross-platform)
- **PDF:** pdfrx (Android/iOS), url_launcher (desktop fallback)
- **Media:** cached_network_image, image_picker/image_cropper
- **Payments / push:** Stripe / Chapa / Telebirr, FCM

## Features

- **No authentication required** — open the app and browse immediately
- Discovery Hub with **featured content carousel** (mixed music + books + stories)
- Books split; For You cover carousel + Explore cards + bottom navigation
- Unified image-first content cards (`lib/shared/widgets/content_cards.dart`):
  Ebook / AudioBook / Story / Music / Category / Featured / Continue cards
- Book discovery, search, categories, and detail
- Audio player with background playback (media_kit)
- **Dedicated music player** with play/pause, next/prev, seek, speed control, sleep timer, PDF viewer
- E-book reader (PDF) with themes, font size, bookmarks (pdfrx)
- Favorites, reviews, reading/listening history
- Offline downloads
- Subscription plans & payments
- Push notifications
- Storytelling, My Doctor, My Captain, Habits, Messaging

## Getting Started

### Prerequisites

- [Flutter SDK](https://docs.flutter.dev/get-started/install) 3.x
- Dart SDK (included with Flutter)
- Android Studio / Xcode for emulators or physical devices

### Installation

```bash
flutter pub get
```

### API base URL

Configured in `lib/core/constants/app_constants.dart`. Dev vs prod is selected
by `kReleaseMode`:

| Mode | Base URL |
|------|----------|
| Debug (Android emulator) | `http://10.0.2.2:3000/api/v1` |
| Debug (desktop / web) | `http://localhost:3000/api/v1` |
| Release | `https://api.bariisaa.com/api/v1` |

For a **physical device**, use your machine's LAN IP instead of
`localhost` / `10.0.2.2`.

### Run

```bash
flutter run                     # debug
flutter run -d chrome           # web (dev → localhost:3000)
flutter run -d <device> --dart-define=GOOGLE_CLIENT_ID=<web-client-id>
```

### Build

```bash
flutter build apk --debug       # Debug APK
flutter build apk --release     # Release APK
flutter build appbundle         # AAB for Play Store
flutter build ios               # iOS (macOS only)
flutter build web               # production web (prod API)
```

## Authentication

The mobile app **does not require authentication** for browsing content. All content endpoints are public.
The app opens directly to the Discovery screen — no login, signup, onboarding, or guest mode flow exists.

**Note:** Some features (favorites, progress tracking, subscriptions, payments) require a valid JWT token
from the backend. The app includes auth persistence via `SecureStorageService` — tokens are stored on first
login and restored on app reopen. Admin panel uses the backend's JWT auth system separately.

### Dev mode

Set `NODE_ENV=development` in `backend/.env` and run the backend via `start.cmd` on port 3000.
Configure API URLs in `lib/core/constants/app_constants.dart` (`kReleaseMode` flag).

## Project Structure

```
lib/
├── main.dart                     # Entry point (providers, fonts, routing)
├── core/
│   ├── theme/app_theme.dart      # Brand palette + light/dark/parent themes
│   ├── constants/                # API URLs, limits, constants
│   ├── navigation/app_router.dart# GoRouter routes
│   ├── network/api_client.dart   # Dio
│   ├── storage/                  # Secure storage (dev-mode flag)
│   └── di/                       # get_it dependency injection
├── features/                     # Feature modules (data / domain / presentation)
│   ├── discovery/                # Discovery Hub + Books + Featured Carousel
│   ├── audio_player/
│   ├── ebook_reader/
│   ├── storytelling/
│   ├── music/                    # Music list + dedicated MusicPlayerScreen
│   ├── my_doctor/
│   ├── my_captain/
│   ├── habits/
│   ├── messaging/
│   └── ...
├── shared/
│   ├── models/                   # Data models
│   ├── styles.dart               # Shared text styles
│   └── widgets/                  # Reusable widgets (content_cards.dart)
└── assets/                       # Images, fonts, icons
```

## Verification

```bash
flutter analyze   # 0 errors / 0 warnings (after fixing any remaining issues)
flutter test
```

**Note:** `flutter analyze` may report `unused_local_variable` for the now-unused `AppBackground` import
in screens that were recently refactored — these are expected and can be safely removed.

## Troubleshooting

### Backend not running

If content screens show empty white boxes or timeout errors:

1. Start the backend: `cd C:\Users\Administrator\Desktop\naik\backend && start.cmd`
2. Ensure port 3000 is available
3. Verify `API_PREFIX=/api/v1` in `backend/.env`
4. Use debug build with `http://10.0.2.2:3000/api/v1` (Android emulator) or your machine's LAN IP (physical device)

### `type 'Null' is not a subtype of type 'num'` crash

See the existing troubleshooting section in this README for the `My Captain` streak badge fix pattern.

## Troubleshooting

### `type 'Null' is not a subtype of type 'num' in type cast`

**Symptom:** Runtime crash when opening a screen that reads an optional numeric
field from a decoded JSON map (e.g. a streak/count the backend omits until the
user has data).

**Where it surfaced:** `lib/features/my_captain/presentation/my_captain_screen.dart`
— the My Captain streak badge. The original code was:

```dart
// ❌ BUG: `?? 0` hides the null in the `is num` check, but the later
// `as num` cast still operates on the raw (null) value.
if ((state.profile['days'] ?? 0) is num && (state.profile['days'] as num) > 0) ...[
  StreakCounter(days: (state.profile['days'] as num).toInt()),
]
```

**Root cause:** `state.profile['days']` is `dynamic` and can be `null` (the API
returns no `days` until the user has a streak). `(state.profile['days'] ?? 0)`
evaluates to `0`, so `0 is num` passes — but `(state.profile['days'] as num)`
then casts the **raw null** to `num`, which throws `type 'Null' is not a subtype
of type 'num' in type cast`.

**Fix:** extract the value once and let the `is num` type-check narrow the
`dynamic` variable (Dart promotes it), so no cast ever touches a null value:

```dart
// ✅ FIX: single null-safe extraction; `days is num` promotes `days` to `num`.
final days = state.profile['days'];
if (days is num && days > 0) ...[
  StreakCounter(days: days.toInt()),
]
```

**General rule for JSON numbers in this app:** never write a bare `as num` /
`as int` / `as double` cast on a field the API may omit. Either use the nullable
cast + fallback — `(json['x'] as num?)?.toDouble() ?? 0.0` — or guard with
`is num` on a local variable first. The models in `lib/shared/models/models.dart`
already follow this pattern.

## License

This project is proprietary and confidential.
