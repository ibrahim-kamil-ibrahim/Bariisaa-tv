# Content Monetization / Subscription Paywall Migration Prompt

## Current State

The Bariisaa Tv Flutter mobile app currently serves all content the same way — there is no distinction between content that requires payment and content that is free to watch. Admins publish content without specifying an access tier, and the mobile app has no concept of a paywall, subscription plan, or entitlement check.

Relevant existing pieces (adjust paths to match the actual repo):

- `backend/src/modules/content/` — Content CRUD, likely `Content` Prisma model with fields like `title`, `description`, `mediaUrl`, `thumbnailUrl`, `category`, `publishedAt`
- `backend/src/modules/admin/` — Admin endpoints for creating/editing/publishing content
- `mobile/lib/features/content/` — Content listing, content detail/player screens
- `mobile/lib/features/auth/` — OAuth/PKCE auth client (see `prompt.md` for the auth migration; this feature builds on top of the authenticated user/session it produces)
- Backend already issues JWT access tokens containing user identity, so subscription status can be attached to or looked up from that identity

## Target State

### New Architecture: Subscription Plans + Content Access Tiers

1. **Backend**: Content gains an `accessTier` (FREE / PAID, extensible to plan-specific tiers), subscription plans and user subscriptions are modeled, and a guard checks entitlement before serving paid content or signed media URLs.
2. **Admin Panel/App**: When creating or editing a post, the admin explicitly marks it as `Free` or `Paid` (and optionally which plan/tier) before publishing. Admin dashboard can filter content by tier.
3. **Mobile App (Flutter)**: Content marked paid is visually locked for non-subscribers (lock icon/badge, blurred thumbnail, or paywall banner). Tapping locked content routes to a subscription/paywall screen instead of the player. Subscribers get uninterrupted access.
4. **Payments**: Subscription purchase is handled via a payment provider (e.g. Stripe / Chapa / Telebirr — confirm which is in scope), with webhooks updating subscription status.

### Access Flow

1. Admin creates/edits a content item and selects `Free` or `Paid` (plus optional plan/tier) at publish time
2. Content is stored with `accessTier` and, if paid, an optional `requiredPlanId`
3. Mobile app fetches content list; each item includes `accessTier` and a computed `isLocked` flag based on the current user's subscription status
4. User taps a `Paid` item they don't have access to → app shows a "Subscribe to unlock" screen instead of the player
5. User subscribes via the payment flow → backend activates `UserSubscription` on payment webhook confirmation
6. Mobile app re-checks entitlement (or receives updated `isLocked` on next fetch) → content unlocks
7. When a subscriber requests playback of paid content, the backend validates their active subscription (via `subscriptionGuard`) before returning the media URL / stream token

### Requirements

1. **Backend (Content & Subscription Data Model)**: Extend `Content` model with `accessTier` enum (`FREE`, `PAID`) and optional `requiredPlanId` (nullable FK to `SubscriptionPlan`), new Prisma models: `SubscriptionPlan`, `UserSubscription`, `PaymentTransaction`, migration to backfill existing content as `FREE` by default

2. **Backend (Endpoints)**: `GET /subscriptions/plans`, `POST /subscriptions/subscribe`, `GET /subscriptions/me`, `POST /subscriptions/cancel`, `POST /payments/webhook/:provider`, `PATCH /admin/content/:id/access`, middleware: `subscriptionGuard`

3. **Admin Panel**: Content create/edit form gains a `Free` / `Paid` toggle (and plan selector if multiple tiers exist), required before publish; Content list/dashboard filterable by access tier; Validation: paid content cannot be published without a selected plan/tier if multiple plans exist

4. **Mobile App (Flutter)**: `data/subscription_repository.dart` — Fetch plans, current subscription, initiate payment; `domain/subscription_state.dart` — States: Initial, Loading, NoSubscription, Active, Expired, Error; `presentation/subscription_cubit.dart` — Actions: loadPlans, subscribe, checkStatus, cancel; `presentation/paywall_screen.dart` — Shown when a locked item is tapped; lists plans, CTA to subscribe; Content list/grid widgets updated to show a lock badge on `accessTier == PAID` items when `isLocked == true`; Content detail/player screen checks `isLocked` before initiating playback; if locked, redirects to `paywall_screen.dart` instead of the player; Secure storage caches subscription status with a short TTL to avoid a network call on every content tap, refreshed after successful payment

5. **Payments Integration**: Choose and integrate a provider (Stripe / Chapa / Telebirr / other — confirm); Webhook handling with signature verification; Idempotent processing of renewal/expiry events

6. **Security & Correctness**: Never trust the client's `isLocked` flag for actual media access — always re-validate via `subscriptionGuard` server-side when issuing the playable media URL or stream token; Signed/short-lived media URLs for paid content to prevent link sharing; Webhook endpoints verify provider signatures; reject unsigned/invalid payloads; Subscription expiry is enforced by a scheduled job (or checked lazily on each request) that flips `ACTIVE` → `EXPIRED`

### Phases

#### Phase 1: Save Prompt (Current)
Save this prompt as `subscription-prompt.md` at project root.

#### Phase 2: Backend Data Model
- Add `accessTier` / `requiredPlanId` to `Content`
- Create `SubscriptionPlan`, `UserSubscription`, `PaymentTransaction` Prisma models
- Migration + backfill existing content as `FREE`

#### Phase 3: Backend Subscription & Payment Endpoints
- Plans, subscribe, me, cancel endpoints
- Payment provider webhook handler
- `subscriptionGuard` middleware

#### Phase 4: Admin Panel Updates
- Free/Paid toggle + plan selector on content create/edit
- Dashboard filter by access tier
- Publish-time validation for paid content

#### Phase 5: Flutter Subscription Client
- `subscription_repository.dart`, `subscription_state.dart`, `subscription_cubit.dart`
- `paywall_screen.dart`
- Lock badge on content list/grid items

#### Phase 6: Flutter Playback Gating
- Content detail/player checks `isLocked` before playback
- Redirect to paywall on locked tap
- Post-payment entitlement refresh

#### Phase 7: Payments Integration
- Provider SDK/integration (Stripe/Chapa/Telebirr)
- Webhook signature verification
- Idempotent renewal/expiry handling

#### Phase 8: Security Hardening
- Signed/short-lived media URLs for paid content
- Server-side re-validation on every protected media request
- Scheduled job for subscription expiry

#### Phase 9: Testing & Documentation
- Unit tests for `subscriptionGuard` and tier logic
- Integration tests for subscribe → webhook → unlock flow
- E2E tests: free content plays for anyone, paid content blocked/unblocked correctly