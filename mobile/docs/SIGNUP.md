# Signup Feature (Kid-Friendly Onboarding)

## Overview
4-step immersive wizard for kids: **Name → Age → Gender → Avatar**
- Full-screen colorful gradients per step (yellow → green → pink → blue)
- Bouncing mascot animations, haptic feedback, confetti celebration
- Creates `GuestProfile` → emits `AuthGuest` → navigates to `/discovery`
- Account creation (email/password) deferred to Profile screen

---

## Files
```
lib/features/auth/presentation/
├── signup_screen.dart      # Main wizard (4 steps, animations, haptics)
├── auth_cubit.dart         # continueAsGuest() → emits AuthGuest
├── pastel_widgets.dart     # (Legacy) PastelBackground, PastelCard, etc.
```

`lib/features/onboarding/domain/guest_profile.dart` — GuestProfile model + `generateId()`
`lib/features/onboarding/data/guest_profile_repository.dart` — SecureStorage persistence

`lib/core/navigation/app_router.dart` — Route `/signup` (replaces `/onboarding/kid`)

---

## Step Details

| Step | UI | Input | Validation |
|------|-----|-------|------------|
| 0 | Name field + ✏️ bouncing mascot | Text (capitalized) | Non-empty |
| 1 | 4×2 age bubbles (5–12) | Tap selection | Required |
| 2 | Boy / Girl cards + "I'd rather not say" | Tap or skip | Optional |
| 3 | 4×2 avatar cards (emoji + name) | Tap selection | Required |

---

## Animation Controllers

| Controller | Purpose |
|------------|---------|
| `_mascotController` | Bounce + rotate mascot (1.5s loop) |
| `_bgController` | Floating background bubbles (20s loop) |
| `_transitionController` | Step slide/fade (500ms) |
| `_celebrationController` | Scale-in avatar + text (800ms) |
| `_confettiController` | 50 particles burst (1.5s) |

---

## Haptic Feedback
- `_hapticLight()` — back button, skip gender
- `_hapticMedium()` — continue/next, completion
- `_hapticSelection()` — age, gender, avatar tap

---

## Colors (AppTheme)
```dart
sunnyYellow   // step 0 bg
freshGreen    // step 1 bg + age accent
pink          // step 2 bg + gender accent
skyBlue       // step 3 bg + avatar accent (maps to gold)
gold          // step 0 accent
```

---

## Flow
```
App open → Splash → AuthLoggedOut → /signup
  → Name → Age → Gender → Avatar
  → GuestProfile saved (secure storage)
  → AuthCubit.continueAsGuest()
  → AuthGuest state
  → Router redirect → /discovery
```

---

## Testing Checklist
- [ ] Hot restart lands on `/signup` (Name step)
- [ ] Name field: autofocus, capitalization, "Nice to meet you" appears
- [ ] Age: 8 bubbles, green border + scale on select
- [ ] Gender: Boy/Girl cards pink border + scale, skip works
- [ ] Avatar: 8 cards with names, blue border + scale
- [ ] Progress dots animate (easeOutBack)
- [ ] Back button works on steps 1–3
- [ ] Completion: confetti + celebration → redirect to discovery
- [ ] No `AnimatedContainer` with `boxShadow` (Flutter bug)

---

## Dependencies
- `flutter_bloc` (AuthCubit)
- `flutter_secure_storage` (GuestProfileRepository)
- `AppTheme` (colors, shadows)
- `AppStyles` (Baloo2 / Nunito fonts)

---

## Key Classes

### `GuestProfile`
```dart
id: String (generateId())
name: String
age: int
gender: String?  // 'boy' | 'girl' | null
avatar: String   // emoji
createdAt: DateTime
```

### `AuthCubit`
```dart
continueAsGuest() → emits AuthGuest(profile)
```

---

## Customization
- **Add steps**: Update `_canAdvance`, `_buildStepContent`, progress dots (4 → N)
- **Change avatars**: Edit `_avatars` + `_avatarNames` lists
- **Colors**: Modify `_bgColor()` / `_accentColor()` switch
- **Celebration**: Tweak `_buildCelebrationOverlay()` confetti count/colors