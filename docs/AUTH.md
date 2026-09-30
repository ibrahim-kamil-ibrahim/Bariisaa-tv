# Authentication System

Complete documentation of all authentication flows across mobile, backend, and admin.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Token System](#token-system)
- [Mobile Auth](#mobile-auth)
- [Backend Auth](#backend-auth)
- [Admin Auth](#admin-auth)
- [Signup Fields (Admin-Managed)](#signup-fields-admin-managed)
- [Security](#security)
- [RBAC (Role-Based Access Control)](#rbac-role-based-access-control)
- [OAuth 2.0 (Legacy, Retained)](#oauth-20-legacy-retained)
- [Troubleshooting](#troubleshooting)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        MOBILE APP                                │
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────────┐  │
│  │  Login   │  │  Guest   │  │  Google  │  │  Profile       │  │
│  │  Screen  │  │  Signup  │  │  Sign-In │  │  Verification  │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └───────┬────────┘  │
│       │              │              │                │            │
│  ┌────▼──────────────▼──────────────▼────────────────▼────────┐  │
│  │                    AuthCubit                                │  │
│  │  States: Initial → Loading → AuthAuthenticated              │  │
│  │          | Guest | LoggedOut | Error | SessionExpired       │  │
│  └────────────────────────┬───────────────────────────────────┘  │
│                           │                                      │
│  ┌────────────────────────▼───────────────────────────────────┐  │
│  │                   AuthRepository                            │  │
│  │  login(), signupAsGuest(), loginWithGoogle()                │  │
│  │  sendProfileEmailOtp(), verifyProfileEmail()               │  │
│  │  sendProfilePhoneOtp(), verifyProfilePhone()               │  │
│  └────────────────────────┬───────────────────────────────────┘  │
│                           │                                      │
│  ┌────────────────────────▼───────────────────────────────────┐  │
│  │                 ApiClient (Dio)                              │  │
│  │  Auth interceptor → Bearer token                            │  │
│  │  Refresh interceptor → Auto-refresh on 401                  │  │
│  └────────────────────────┬───────────────────────────────────┘  │
│                           │ HTTPS                                │
└───────────────────────────┼──────────────────────────────────────┘
                            │
┌───────────────────────────▼──────────────────────────────────────┐
│                   BACKEND (Express)                               │
│                                                                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────────┐  │
│  │  Auth    │  │  OAuth   │  │ Signup   │  │  Middleware     │  │
│  │  Routes  │  │  Routes  │  │ Fields   │  │  authenticate  │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  │  authorize     │  │
│       │              │              │        │  rateLimiter   │  │
│  ┌────▼──────────────▼──────────────▼────────▼────────────────┐  │
│  │                    AuthService                              │  │
│  │  signupAsGuest, login, Google OAuth,                        │  │
│  │  sendProfileEmailOtp, verifyProfileEmail,                   │  │
│  │  sendProfilePhoneOtp, verifyProfilePhone,                   │  │
│  │  passwordReset, OTP generate/verify, lockout                │  │
│  └────────────────────────┬───────────────────────────────────┘  │
│                           │                                      │
│  ┌────────────────────────▼───────────────────────────────────┐  │
│  │              PostgreSQL (Prisma)                             │  │
│  │  users, refresh_tokens, otp_codes, signup_fields,           │  │
│  │  oauth_tokens, authorization_codes, devices                  │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
                            │
┌───────────────────────────▼──────────────────────────────────────┐
│                   ADMIN PANEL (React)                             │
│                                                                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                       │
│  │  Login   │  │  Zustand │  │  Axios   │                       │
│  │  Page    │  │  Store   │  │  + Auth  │                       │
│  └──────────┘  └──────────┘  └──────────┘                       │
└──────────────────────────────────────────────────────────────────┘
```

---

## Token System

### Token Types

| Token | Lifetime | Storage | Purpose |
|-------|----------|---------|---------|
| **Access Token** | 15 minutes (configurable) | Memory + SecureStorage | API authentication |
| **Refresh Token** | 30 days | SecureStorage (mobile), localStorage (admin) | Token renewal |
| **OAuth Code** | 10 minutes | Ephemeral | OAuth2 authorization code exchange |

### Token Structure

**Access Token (JWT payload):**
```json
{
  "userId": "clx...",
  "email": "user@example.com",
  "jti": "unique-token-id",
  "iat": 1690000000,
  "exp": 1690000900
}
```

**Refresh Token (JWT payload):**
```json
{
  "userId": "clx...",
  "tokenFamilyId": "family-uuid",
  "jti": "unique-token-id",
  "iat": 1690000000,
  "exp": 1692592000
}
```

### Token Rotation

```
Request with expired access token
  → 401 response
  → Client sends refresh token to POST /auth/refresh-token
  → Backend verifies refresh token:
      1. Check token exists in DB and not revoked
      2. Check familyId matches (reuse detection)
      3. Revoke old token
      4. Issue new access + refresh token pair
      5. Store new refresh token with same familyId
  → If token reused (already revoked):
      → Revoke ENTIRE family (all tokens with same familyId)
      → Return error → client must re-login
```

---

## Mobile Auth

### Files

| File | Purpose |
|------|---------|
| `features/auth/presentation/auth_cubit.dart` | Auth state machine |
| `features/auth/data/auth_repository.dart` | HTTP calls to backend |
| `features/auth/domain/auth_state.dart` | 12 auth state classes |
| `features/auth/presentation/login_screen.dart` | Email/password login UI |
| `features/auth/presentation/signup_screen.dart` | Guest-first signup form (name + age + gender) |
| `features/auth/presentation/auth_widgets.dart` | Reusable auth UI components |
| `features/profile/presentation/profile_screen.dart` | Profile + verification UI |
| `core/network/api_client.dart` | Dio with auth + refresh interceptors |
| `core/storage/secure_storage.dart` | Token storage |
| `core/navigation/app_router.dart` | Auth-based routing |

### Auth States

```dart
AuthInitial          // App just launched
AuthLoading          // Checking auth status / logging in
AuthAuthenticated    // User is logged in (has UserModel)
AuthGuest            // Guest mode (browsing only)
AuthLoggedOut        // No session (shows signup)
AuthSuccess          // Signup success message
AuthError            // Error with message
AuthSessionExpired   // Refresh failed → re-login
AuthRefreshing       // Refreshing tokens
AuthBrowserLaunching // OAuth browser opening (legacy)
AuthCallbackReceived // OAuth callback received (legacy)
AuthTokenExchanging  // OAuth code exchange (legacy)
```

### Flow: Email/Password Login

```
User enters email + password
  → AuthCubit.login(email, password)
  → AuthRepository.login()
  → POST /auth/login { email, password }
  → Backend: bcrypt compare, generate JWT pair
  → Response: { user, accessToken, refreshToken }
  → SecureStorage.saveTokens(accessToken, refreshToken)
  → AuthCubit emits AuthAuthenticated(UserModel)
  → GoRouter redirect → /discovery
```

### Flow: Guest Signup (Primary)

```
User opens /signup (first launch or after logout)
  → SignUpScreen loads (kid-friendly, ages 6-13)
  → User fills: full name + age (wheel picker) + gender (tappable cards)
  → Tap "Let's Go! 🚀"
  → AuthCubit.completeGuestSignup(name, profileData: { age, gender })
  → AuthRepository.signupAsGuest()
  → POST /auth/signup/guest { name, profileData }
  → Backend: create user with null email/phone/passwordHash
  → Response: { user (accountStatus: "guest"), accessToken, refreshToken }
  → SecureStorage.saveTokens(accessToken, refreshToken)
  → AuthCubit emits AuthAuthenticated(UserModel)
  → GoRouter redirect → /discovery
```

### Flow: Profile Verification (Post-Signup)

```
User opens profile screen
  → If accountStatus == "guest" → show "Secure Your Account" banner
  → User taps "Add Email" → bottom sheet opens
  → Enter email → POST /auth/profile/email/send-otp { email }
  → Backend: generate OTP, store in otp_codes, send email
  → User enters 6-digit code → POST /auth/profile/email/verify { email, code }
  → Backend: verify OTP, update user.email + user.emailVerified
  → AuthCubit.refreshUserProfile() → GET /auth/me
  → Updated UserModel → badge shows "✅ Email"

  (Same flow for phone: send OTP → verify → badge shows "✅ Phone")
```

### Flow: Google Sign-In

```
User taps "Continue with Google"
  → AuthCubit.loginWithGoogle()
  → GoogleSignIn.signIn() → native Google account picker
  → account.authentication.idToken
  → POST /auth/google { idToken }
  → Backend: verify ID token against GOOGLE_CLIENT_IDS
  → Response: { user, accessToken, refreshToken }
  → SecureStorage.saveTokens()
  → AuthCubit emits AuthAuthenticated(UserModel)
```

### Flow: Session Check (App Launch)

```
App starts → SplashScreen
  → AuthCubit.checkAuthStatus()
  → Has refresh token? → No → AuthLoggedOut → /signup
  → Yes → tryRefreshAccessToken()
    → POST /auth/refresh-token { refreshToken }
    → Success → getCurrentUser()
    → GET /users/profile
    → AuthAuthenticated(UserModel) → /discovery
    → Fail → clearTokens() → AuthLoggedOut → /signup
```

### Flow: Auto-Refresh on 401

```
API request fails with 401
  → Dio RefreshInterceptor catches error
  → If no refresh token → clearAll → reject
  → If already refreshing → enqueue Completer, await
  → Otherwise:
    → Set _isRefreshing = true
    → OAuthClient.refreshTokens()
    → POST /auth/refresh-token { refreshToken }
    → New tokens saved
    → Retry original request
    → Complete queued requests
    → _isRefreshing = false
  → On refresh failure → clearAll → reject
```

### Router Redirect Logic

```dart
// app_router.dart redirect:
if (authState is AuthAuthenticated) {
  // On splash/login/onboarding → redirect to /discovery
}

if (authState is AuthLoggedOut) {
  // Allow /signup and /login
  // Everything else → /signup
}

if (authState is AuthGuest) {
  // Allow everything except splash → /discovery
}
```

### Auth Widgets

| Widget | Description |
|--------|-------------|
| `AuthField` | Rounded text field with leading icon, password toggle, error text |
| `AuthPrimaryButton` | Gradient pill button with claymorphism shadow, loading spinner |
| `BariisaaBadge` | Purple pill brand mark with pink heart |
| `AuthGuard` | Static helpers: `isAuthenticated()`, `isGuest()`, `requireAuth()` |

---

## Backend Auth

### Files

| File | Purpose |
|------|---------|
| `modules/auth/auth.routes.ts` | All auth route definitions |
| `modules/auth/auth.controller.ts` | Request handlers |
| `modules/auth/auth.service.ts` | Business logic (524 lines) |
| `modules/auth/auth.validation.ts` | Zod request schemas |
| `middleware/authenticate.ts` | JWT verification middleware |
| `middleware/authorize.ts` | RBAC permission checks |
| `middleware/rateLimiter.ts` | Rate limiting |
| `utils/loginAttempts.ts` | Login lockout logic |

### API Endpoints

#### Auth (`/api/v1/auth`)

| Method | Endpoint | Rate Limit | Description |
|--------|----------|------------|-------------|
| POST | `/signup/guest` | authLimiter | Guest signup (name + profileData, no email/phone/password) |
| POST | `/login` | authLimiter | Email/phone + password |
| POST | `/login/send-otp` | otpLimiter | Send OTP for phone login |
| POST | `/login/otp` | otpLimiter | Verify OTP + login |
| POST | `/google` | authLimiter | Google OAuth login |
| GET | `/verify-email` | public | Verify email via token |
| POST | `/verify-phone` | auth | Verify phone via OTP |
| POST | `/profile/email/send-otp` | auth | Send OTP to verify email (post-signup) |
| POST | `/profile/email/verify` | auth | Verify email OTP code |
| POST | `/profile/phone/send-otp` | auth | Send OTP to verify phone (post-signup) |
| POST | `/profile/phone/verify` | auth | Verify phone OTP code |
| POST | `/forgot-password` | authLimiter | Request password reset |
| POST | `/reset-password` | authLimiter | Reset with token |
| POST | `/refresh-token` | public | Refresh access token |
| POST | `/logout` | public | Revoke refresh token |
| POST | `/resend-email-verification` | auth | Resend verification |
| POST | `/resend-phone-otp` | auth | Resend phone OTP |

#### Signup Fields (`/api/v1/signup-fields`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | public | Active fields for mobile app |
| GET | `/all` | admin | All fields for admin panel |
| POST | `/` | admin | Create field |
| PUT | `/:id` | admin | Update field |
| DELETE | `/:id` | admin | Delete field |

### Middleware Stack

```
Request → Helmet → CORS → Rate Limiter → authenticate (optional) → authorize → Controller
```

#### `authenticate` Middleware

```
1. Extract Bearer token from Authorization header
2. Verify JWT with JWT_ACCESS_SECRET
3. Load user from DB (id, email, name, status, roles, permissions)
4. Attach to req.user
5. If token invalid/expired → 401
6. Optional: optionalAuth sets req.user = null instead of 401
```

#### `authorize` Middleware

```
1. Check req.user exists (authenticate must run first)
2. Load user's roles and permissions from DB
3. If user has 'super_admin' role → bypass all checks (allow)
4. Check if user has required permission string (e.g., 'books:create')
5. If not → 403 Forbidden
```

### Login Lockout

```
Login attempt tracking (in-memory Map):
  Key: email/phone
  Value: { attempts: number, lastAttempt: timestamp }

After MAX_LOGIN_ATTEMPTS (configurable) failures:
  → Lock account for LOGIN_LOCKOUT_MINUTES (configurable)
  → Return "Account temporarily locked" error
  → Reset on successful login
```

### Account Status

`accountStatus` is computed on the fly from `emailVerified` and `phoneVerified` (not stored as a DB field). Returned in all auth responses:

| Status | Condition |
|--------|-----------|
| `guest` | No email, no phone (default after guest signup) |
| `partial` | Has email or phone but not verified |
| `verified` | Email or phone verified |

### Password Hashing

- **Algorithm:** bcrypt
- **Rounds:** 12
- **Storage:** `passwordHash` field in users table
- **Comparison:** `bcrypt.compare(plaintext, hash)`

---

## Admin Auth

### Files

| File | Purpose |
|------|---------|
| `store/authStore.ts` | Zustand auth store (user, token, login/logout) |
| `services/api.ts` | Axios with auth interceptor + refresh queue |
| `auth/pages/LoginPage.tsx` | Admin login page |
| `auth/lib/api.ts` | Lightweight fetch client for pre-login pages |

### Auth Store (Zustand)

```typescript
// store/authStore.ts
interface AuthState {
  user: User | null;
  token: string | null;
  login: (user, token) => void;   // Sets state + localStorage
  logout: () => void;             // Clears state + localStorage
  hydrate: () => void;            // Loads from localStorage on app start
}

// Persisted keys:
//   naik_admin_token → JWT access token
//   naik_admin_user  → serialized User object
```

### Axios Interceptor

```
Request interceptor:
  → Read token from authStore
  → If token exists → set Authorization: Bearer <token>

Response interceptor:
  → On 401:
    → If no refresh token → logout, redirect to /login
    → If already refreshing → enqueue request, await
    → Otherwise:
      → Set isRefreshing = true
      → POST /auth/refresh-token { refreshToken }
      → Update token in store
      → Retry failed request
      → Complete queued requests
    → On failure → logout, redirect to /login
```

### Admin Login Page

```
Email + password form
  → POST /auth/login { email, password }
  → Backend returns { user, accessToken, refreshToken }
  → authStore.login(user, token)
  → Redirect to /dashboard
```

### Pre-Login API Client

```typescript
// auth/lib/api.ts
// Lightweight fetch-based client for pages that run BEFORE
// the main Axios interceptor is available (login, signup, etc.)
// No auth headers, no refresh logic
```

---

## Signup Fields (Admin-Managed)

### How It Works

1. **Admin creates fields** at `/signup-fields` in the admin panel
2. **Backend stores** fields in `signup_fields` table
3. **Mobile fetches** active fields via `GET /signup-fields`
4. **Mobile renders** fields dynamically based on type
5. **User fills** fields → answers saved as `profileData` JSON

### Field Schema

```typescript
{
  key: string;          // Unique identifier (snake_case), e.g. "school_name"
  label: string;        // Display label, e.g. "School Name"
  type: string;         // "text" | "number" | "dropdown" | "date"
  required: boolean;    // Must be filled to submit
  options: string[];    // For dropdown: ["Male", "Female"]
  placeholder: string;  // Hint text
  order: number;        // Sort order (ascending)
  isActive: boolean;    // Shown in app or not
}
```

### Mobile Rendering

| Type | Widget | Behavior |
|------|--------|----------|
| `text` | `TextField` | Free text input |
| `number` | `TextField` (keyboard: number) | Parses to int on submit |
| `dropdown` | `DropdownButton<String>` | Shows options list |
| `date` | `showDatePicker` on tap | Stores ISO date string |

### Data Flow

```
Admin: POST /signup-fields { key, label, type, ... }
  → DB: signup_fields table

Mobile: GET /signup-fields
  → Returns: [{ key: "full_name", label: "Full Name", type: "text", ... }, ...]
  → Renders form fields

User fills fields + taps Continue
  → GuestProfile(nickname, profileData: { "full_name": "Abdi", "age": 8, "gender": "Male" })
  → Saved to SecureStorage
  → AuthCubit.continueAsGuest() → /discovery
```

---

## Security

### Rate Limiting

| Limiter | Limit | Window | Applied To |
|---------|-------|--------|------------|
| `authLimiter` | Configurable | Per-IP | Login, signup, password reset |
| `authSpeedLimiter` | Progressive delay | After 3 hits | Login (extra protection) |
| `otpLimiter` | 3 requests | 15 minutes | OTP send/verify |
| `uploadLimiter` | Configurable | Per-IP | File uploads |
| `generalLimiter` | Configurable | Per-IP | All other routes |

### Suspicious Header Blocking

Blocks requests with User-Agent matching:
- `sqlmap`, `nikto`, `nmap`, `masscan`, `dirbuster`, `gobuster`
- `python-requests`, `curl`, `wget` (in production)

### HTTPS

- Enforced in production via Helmet HSTS
- Development: HTTP allowed (localhost / emulator)

### CORS

- Configurable origins via `CORS_ORIGIN` env var
- Wildcard blocked in production
- Credentials allowed for admin panel

---

## RBAC (Role-Based Access Control)

### Default Roles

| Role | Description |
|------|-------------|
| `super_admin` | Bypasses all permission checks |
| `content_manager` | Manage books, categories, authors, stories, music |
| `support_agent` | View users, handle support tickets |

### Permission Format

```
resource:action
```

**Resources (18):** users, books, categories, authors, subscriptions, payments, coupons, notifications, reports, roles, audit, settings, storytelling, music, my-doctor, my-captain, signup_fields, devices

**Actions:** create, read, update, delete

### Example Permissions

```
books:create      → Create new books
books:read        → View books
users:update      → Update user status
signup_fields:read → View signup fields
signup_fields:create → Create signup fields
```

### Middleware Usage

```typescript
// Require specific permission:
router.post('/', authenticate, authorize('books:create'), createBook);

// Require any of multiple permissions:
router.get('/', authenticate, authorize('books:read', 'books:create'), listBooks);

// Admin-only (super_admin bypasses automatically):
router.delete('/:id', authenticate, authorize('books:delete'), deleteBook);
```

---

## OAuth 2.0 (Legacy, Retained)

> **Note:** The mobile app's primary flow is native guest-first signup (name + age + gender, no email/phone required) and email/password login. OAuth PKCE is retained for future SSO or third-party integrations.

### Endpoints (`/api/v1/oauth`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/authorize` | Authorization URL with PKCE |
| POST | `/token` | Code exchange / refresh / revoke |
| POST | `/revoke` | Revoke token |
| GET | `/userinfo` | Get user info |
| GET | `/.well-known/openid-configuration` | OpenID discovery |

### PKCE Flow

```
1. Mobile generates:
   - code_verifier (random 43-128 char string)
   - code_challenge = SHA256(code_verifier)
   - state (random, for CSRF)

2. Opens browser:
   /oauth/authorize?
     response_type=code&
     client_id=bariisaa-mobile&
     redirect_uri=com.bariisaa.app://callback&
     code_challenge=<challenge>&
     code_challenge_method=S256&
     scope=openid profile email&
     state=<state>

3. User authenticates in browser → redirect to:
   com.bariisaa.app://callback?code=<auth_code>&state=<state>

4. DeepLinkHandler catches callback
   → Verifies state matches stored value
   → POST /oauth/token {
       grant_type: "authorization_code",
       code: <auth_code>,
       code_verifier: <verifier>,
       client_id: "bariisaa-mobile"
     }
   → Returns access_token + refresh_token
```

---

## Troubleshooting

### Login fails with "Invalid credentials"

1. Check email/password are correct
2. Check `users` table exists and has the user
3. Check `passwordHash` is bcrypt format
4. Check rate limiter isn't blocking (check IP)

### Token refresh fails (loops back to login)

1. Check `refresh_tokens` table has the token
2. Check token isn't revoked (`revokedAt` is null)
3. Check token family wasn't revoked (reuse detection)
4. Check `JWT_REFRESH_SECRET` matches what issued the token

### Mobile can't reach backend

1. Android emulator: use `http://10.0.2.2:3000/api/v1`
2. iOS simulator: use `http://localhost:3000/api/v1`
3. Physical device: use machine's IP address
4. Check `API_BASE_URL` in `app_constants.dart`

### Signup fields not showing

1. Check `GET /signup-fields` returns data (backend running?)
2. Check `signup_fields` table has active fields (`isActive: true`)
3. Check mobile network config allows localhost/10.0.2.2
4. Check `auth_repository.dart` → `getSignupFields()` method

### Admin login redirects in a loop

1. Check `localStorage` has `naik_admin_token`
2. Check token isn't expired
3. Check refresh token exists in `refresh_tokens` table
4. Check `authStore.hydrate()` runs on app start
