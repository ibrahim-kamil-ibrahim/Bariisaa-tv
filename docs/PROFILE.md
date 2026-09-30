# Profile Screen

## Overview

The profile screen displays the user's identity card, account verification status, and provides access to profile verification (email/phone), screen themes, and logout.

---

## Architecture

```
ProfileScreen (StatefulWidget)
  ├─ BlocBuilder<ScreenThemeCubit, ScreenThemeState>
  │   └─ ThemedScreenScaffold(screenKey: 'profile')
  │       └─ SingleChildScrollView
  │           ├─ _buildProfileHeader()   — Identity card (ClayAvatar + badges)
  │           ├─ _buildAccountSection()  — Verification banner + stats
  │           ├─ _buildAppSection()      — Screen Themes button
  │           └─ _buildLogoutSection()   — Logout button + version
  │
  ├─ BlocListener<AuthCubit, AuthState>  — Error/success feedback
  │
  └─ _showVerifyBottomSheet()            — OTP verification flow
```

### State Management

| Cubit | Purpose |
|-------|---------|
| `AuthCubit` | User state, profile refresh, OTP send/verify |
| `ScreenThemeCubit` | Background image + avatar from admin |

---

## UI Sections

### 1. Identity Card (`_buildProfileHeader`)

Claymorphism card with:
- `ClayAvatar` (admin-changeable via `profile` screen theme)
- User name (from `user.name`)
- "My Bariisaa Account ✨" label
- Badges: "📧 {email}" / "✅ Email" or "📱 {phone}" / "✅ Phone" (shows verification status)

### 2. Account Section (`_buildAccountSection`)

- **Verification banner** (only for `accountStatus == 'guest'`):
  - Yellow/amber banner: "Secure Your Account 🔒"
  - "Add Your Email 📧" / "Add Your Phone 📱" buttons (gradient pill style)
  - Tapping opens `_showVerifyBottomSheet()`

- **Stats row** (3 cards):
  - 📚 Books card
  - ⭐ Favorites card
  - 🎧 Listening card

### 3. App Section (`_buildAppSection`)

- "Screen Themes" button → navigates to `/screen-themes`

### 4. Logout Section (`_buildLogoutSection`)

- "Log Out 👋" button (red background)
- Confirmation dialog with red background, white text
- "Bariisaa v1.0.0 · Made with ❤️ for kids" version text

---

## Verification Bottom Sheet

### Email Flow

```
_showVerifyBottomSheet(type: 'email')
  → Bottom sheet with:
      Title: "Add Your Email 📧"
      Subtitle: "We'll send a code to verify it's you"
      Input: Email address
      Button: "Send Code 📨" → AuthCubit.sendProfileEmailOtp(email)
      → Backend: POST /auth/profile/email/send-otp
  → After send:
      Title: "Check Your Email 📧"
      Input: 6-digit code (TextInputType.number)
      Button: "Verify Code ✅" → AuthCubit.verifyProfileEmail(email, code)
      → Backend: POST /auth/profile/email/verify
  → After verify:
      AuthCubit.refreshUserProfile() → GET /auth/me
      Updated UserModel → badge shows "✅ Email"
      Bottom sheet closes
```

### Phone Flow

Same as email but with:
- `AuthCubit.sendProfilePhoneOtp(phone)` → `POST /auth/profile/phone/send-otp`
- `AuthCubit.verifyProfilePhone(phone, code)` → `POST /auth/profile/phone/verify`
- Badge shows "✅ Phone"

### Error Handling

- `BlocListener<AuthCubit, AuthState>` catches `AuthError` states
- Shows floating SnackBar (rounded, purple background)
- Error auto-clears after 2 seconds

---

## Backend Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/auth/profile/email/send-otp` | POST | Yes | Send 6-digit OTP to email |
| `/auth/profile/email/verify` | POST | Yes | Verify email OTP code |
| `/auth/profile/phone/send-otp` | POST | Yes | Send 6-digit OTP to phone |
| `/auth/profile/phone/verify` | POST | Yes | Verify phone OTP code |
| `/auth/me` | GET | Yes | Get current user profile |

### Request/Response

**POST `/auth/profile/email/send-otp`**
```json
// Request
{ "email": "user@example.com" }

// Response 200
{ "message": "Verification code sent to email" }
```

**POST `/auth/profile/email/verify`**
```json
// Request
{ "email": "user@example.com", "code": "123456" }

// Response 200
{
  "message": "Email verified successfully",
  "user": { "id": "...", "email": "user@example.com", "emailVerified": true, "accountStatus": "verified" }
}
```

---

## Screen Themes

The profile screen reads its theme from `ScreenThemeCubit` with key `'profile'`:
- **Background:** Network image → bundled fallback → pastel gradient (never blank)
- **Avatar:** Network image → default avatar

Admin can customize at `/screen-themes` → select "Profile" screen.

---

## Auth States

| State | Behavior |
|-------|----------|
| `AuthAuthenticated` | Shows profile content |
| `AuthLoading` | Loading spinner |
| Other | Redirected by GoRouter |

---

## Files

| File | Purpose |
|------|---------|
| `features/profile/presentation/profile_screen.dart` | Main profile screen |
| `features/auth/presentation/auth_cubit.dart` | Auth state + OTP methods |
| `features/auth/data/auth_repository.dart` | HTTP calls for OTP |
| `features/screen_theme/themed_screen_scaffold.dart` | Themed scaffold |
| `features/screen_theme/screen_theme_cubit.dart` | Screen theme state |
| `shared/models/models.dart` | `UserModel` with `accountStatus` |

---

## Dependencies

- `flutter_bloc` — state management
- `go_router` — navigation
- `flutter_secure_storage` — token storage
- `url_launcher` — open links
- `claymorphism` — clay UI effects
