# Bariisaa TV — Content System (End-to-End)

This document explains how the 7 content surfaces work across the three layers
(**backend** → **admin** → **mobile**), and lists every problem found in a
read-only audit of the content code paths.

| # | Content surface | Backend module | Admin page | Mobile feature |
|---|---|---|---|---|
| 1 | Discovery / Home Hub | `books` + `categories` + `recommendations` | `BooksPage`, `CategoriesPage` | `features/discovery/` |
| 2 | Books | `books` | `books/` (3 pages) | `features/books/` |
| 3 | Storytelling | `storytelling` | `StorytellingPage` | `features/storytelling/` |
| 4 | Music | `music` | `MusicPage` | `features/music/` |
| 5 | My Doctor | `my-doctor` | `MyDoctorPage` (2 tabs) | `features/my_doctor/` |
| 6 | My Captain | `my-captain` | `MyCaptainPage` (2 tabs) | `features/my_captain/` |
| 7 | Habits | `habits` | `HabitsPage` | `features/habits/` |

---

## 1. Data model (Prisma — `backend/prisma/schema.prisma`)

| Content type | Models | Key fields / relations |
|---|---|---|
| Books | `Book` + `Author`/`BookAuthor`, `Category`/`BookCategory`, `Tag`/`BookTag`, `AudioFile`/`AudioChapter`, `PdfFile` | `isFeatured`, `isPremium`, `isFree`, `status` (DRAFT/PUBLISHED/ARCHIVED), `viewCount`, `downloadCount`, `avgRating`, `ratingCount` |
| Categories | `Category` (hierarchical via `parentId`) | `name`, `slug` (unique), `imageUrl`, `iconEmoji`, `route`, `sortOrder` |
| Storytelling | `Story` | `title`, `description`, `coverUrl`, `audioUrl`, `category` (**plain string**), `status`, `isFeatured`, `viewCount`, `tags` (**string**, not a relation) |
| Music | `MusicTrack` | `title`, `artist` (denormalized) + `artistId` → `Author`, `album`, `coverUrl`, `audioUrl`, `genre` (string), `durationSeconds`, `status`, `isFeatured`, `playCount`, `trackOrder` |
| My Doctor | `HealthTip` + `DoctorProfile` | Tip: `title`, `content`, `emoji`, `category`, `order`. Doctor: `name`, `specialty`, `bio`, `photoUrl`, `available`, `order` |
| My Captain | `Achievement` + `LeaderboardEntry` | Achievement: `title`, `description`, `emoji`, `iconUrl`, `points`, `isHidden`, `order`. Leaderboard: `playerName`, `score`, `rank`, `avatarUrl` |
| Habits | `Habit` + `UserHabit` + `HabitProgress` + `HabitReminder` | Habit: `title`, `emoji`, `category`, `points`, `isActive`, `order`. UserHabit: `streak`, `bestStreak`, `totalCompletions` |

**Structural inconsistency:** Books are fully relational (authors/categories/tags as
join tables, audio/pdf as child tables). Every other content type uses loose
string fields (`Story.category`/`tags`, `MusicTrack.genre`, `HealthTip.category`,
`Habit.category`) and no media child tables.

---

## 2. Backend (Node/Express + Prisma)

All routes mount under `env.API_PREFIX` = `/api/v1` (`backend/src/app.ts`).
Response envelope: list = `{success, message, data, meta:{page,limit,total,totalPages}}`,
single = `{success, message, data}` (`backend/src/utils/response.ts`).

### 2.1 Books — `/books` (`modules/books/book.routes.ts`)

| Endpoint | Purpose | Permission / auth |
|---|---|---|
| `GET /` | List books (filters: `status`,`search`,`language`,`isFeatured`,`isPremium`,`isFree`,`category`→**slug**,`author`; sort: `newest`/`popularity`/`rating`/`alphabetical`; paginated) | public / optionalAuth |
| `GET /featured` `GET /trending` `GET /new-releases` `GET /free` | Curated shelves | public |
| `GET /:id` | Detail (includes reviews, audioFiles+chapters, pdfFiles, per-user reading/listening progress; **increments viewCount**) | optionalAuth |
| `GET /:id/related` | Same-category books | optionalAuth |
| `POST /` `PUT /:id` `DELETE /:id` | CRUD (delete = soft archive) | `books:create/update/delete` |
| `PUT /:id/cover` `PUT /:id/thumbnail` `POST /:id/audio` `POST /:id/pdf` + deletes | Media attach | `books:update` |

Service notes (`book.service.ts`): `createBook` hardcodes `status:'PUBLISHED'`;
`resolveTags` does find-or-create per tag; audio duration is *estimated* from file
size (`file.size/(128*1024/8)` ≈ 1 MB/min).

### 2.2 Categories — `/categories` (`modules/categories/category.routes.ts`)

`GET /` (root tree), `GET /:id` (with children), `GET /explore` (flat, `route != null`),
`POST /`, `PUT /:id`, `DELETE /:id` (hard delete, reparents children). Slug auto-generated
via `slugify`.

### 2.3 Storytelling — `/storytelling`

CRUD + `GET /featured` + `GET /:id` (increments viewCount) + `GET /` (filters `category` string, `status`, `search`). **No `/categories` endpoint.**

### 2.4 Music — `/music`

CRUD (soft archive) + `GET /featured` + `GET /:id` + `GET /` (filters `genre`,`status`,`search`) +
`POST /upload-audio` + `POST /upload-cover`. `resolveArtist` denormalizes `artistId`→`artist`.
**No `/genres` endpoint; no playCount increment anywhere.**

### 2.5 My Doctor — `/my-doctor`

`HealthTip` CRUD at `/tips`, `DoctorProfile` CRUD at `/profiles`, `GET /tips`, `GET /profiles`
(`available:true`). Hard deletes. No validation.

### 2.6 My Captain — `/my-captain`

`Achievement` CRUD at `/achievements`, `LeaderboardEntry` CRUD at `/leaderboard`,
`GET /achievements` (`isHidden:false`), `GET /leaderboard` (rank asc, top 50).
**No `/profile` endpoint.**

### 2.7 Habits — `/habits`

`POST /`, `PUT /:id`, `DELETE /:id`, `GET /`, `GET /:id`, `POST /:id/complete`,
`GET /my/stats` (`{userHabits, weeklyProgress, monthlyProgress}`), `GET /my/progress`.
`completeHabit` computes streak vs "real yesterday" and upserts `UserHabit`.

### 2.8 Recommendations — `/recommendations`

`GET /` (auth) = collaborative filtering on category affinity from reading/listening
history + reviews; `GET /fallback` (public) = featured + popular. **Not called by mobile.**

---

## 3. Admin (React 18 + TS + Vite + MUI + TanStack Query)

`api` = axios (`admin/src/services/api.ts`), baseURL `/api/v1`, Bearer from
`localStorage['naik_admin_token']`. List rows = `data.data`, total = `data.meta.total`.

| Page | Endpoints used | Media upload | Notable gaps |
|---|---|---|---|
| `BooksPage` | `GET /books`, `DELETE /books/:id`, `POST /bulk/books` | — | sort-direction no-op; no viewCount column |
| `BookFormPage` | `GET/POST /books`, `PUT /books/:id`, `PUT /books/:id/cover` (field `image`), `POST /books/:id/pdf` (field `pdf`), `GET /categories`, `GET /authors` | cover + PDF only | **no audio upload UI**; no status/isFeatured/isPremium/isFree/language/isbn/publisher/tags fields; can't delete existing PDF; category list filtered `!c.route` |
| `BookDetailPage` | `GET /books/:id` | — | read-only; status chip always green |
| `CategoriesPage` | `GET/POST/PUT/DELETE /categories` (multipart: `name,description,iconEmoji,route,sortOrder,image`) | image | `route` hardcoded 6 options; `sortOrder` sent as string |
| `MusicPage` | `GET/POST/PUT/DELETE /music`, `POST /music/upload-audio` (field `audio`), `POST /music/upload-cover` (field `cover`), `GET /authors` | audio + cover | **`genre` never set**; `artist`/`album`/`trackOrder` uneditable |
| `StorytellingPage` | `GET/POST/PUT/DELETE /storytelling` | **none** (URL text only) | cover/audio are text fields |
| `MyDoctorPage` | `GET/POST/PUT/DELETE /my-doctor/tips` & `/profiles` | none | DELETE uses singular `/tip`/`/doctor` (mismatch); pagination non-functional |
| `MyCaptainPage` | `GET/POST/PUT/DELETE /my-captain/achievements` & `/leaderboard` | none | DELETE uses singular `/achievement` (mismatch); `iconUrl` has no input; pagination hardcoded 50 |
| `HabitsPage` | `GET/POST/PUT/DELETE /habits` | none | `category` hardcoded enum; `Number()` coercion of empty → 0 |

Shared: `DataTable` renders sort labels only when `onSort` is wired — almost no page
wires it (dead sort everywhere except Books). Search has no debounce (refetch per keystroke).
`EmptyState`/`StatCard` components are unused by content pages.

---

## 4. Mobile (Flutter — Cubit/Repository/Model)

Base URL = `AppConstants.apiBaseUrl` (prod `https://api.bariisaa.com/api/v1`, dev
`10.0.2.2:3000`/`localhost:3000`).

**Typed vs untyped split:** only `BookModel`, `CategoryModel`, `AuthorModel`,
`AudioFileModel`, `AudioChapterModel`, `PdfFileModel` have model classes
(`lib/shared/models/models.dart`). Storytelling, Music, My Doctor, My Captain, and
Habits all consume raw `Map<String, dynamic>` / `List<dynamic>`.

| Feature | Repository calls | Data flow |
|---|---|---|
| Discovery | `/books`, `/categories`, `/books/:id`, `/reviews/book/:id`, `/categories/explore`, `/books/:id/related`, `/favorites/toggle` | `DiscoveryCubit.loadCategories` → `Future.wait` of 4 calls → `CategoriesLoaded`; `loadBookDetail` → 3 calls → `BookDetailLoaded` |
| Books | `/books/trending`, `/books/new-releases`, `/books`, `/categories`, `/authors` | `BooksCubit` modes (top/newest) + category filter + pagination |
| Storytelling | `/storytelling`, `/storytelling/categories` | `StorytellingCubit` → `Loaded(stories, categories)` |
| Music | `/music`, `/music/genres` | `MusicCubit` → `Loaded(music, genres)` |
| My Doctor | `/my-doctor/tips`, `/my-doctor/profiles` | `MyDoctorCubit` → `Loaded(healthTips, doctors)` |
| My Captain | `/my-captain/achievements`, `/my-captain/profile`, `/my-captain/leaderboard` | `MyCaptainCubit` → `Loaded(achievements, profile, leaderboard)` |
| Habits | `/habits`, `/habits/:id`, `/habits/:id/complete`, `/habits/my/stats`, `/habits/my/progress` | `HabitsCubit.loadHabits` (guest) vs `loadMyStats` (authed) |

**Dev-mode gating:** `DiscoveryRepository` and `BooksRepository` return `[]` when
`SecureStorageService.isDevMode()` is true (`devModeKey` in secure storage) — a stale
flag on a device blanks the whole content surface.

---

## 5. End-to-end flow

1. **Admin** creates/edits content (JSON body + multipart media) → **backend** validates
   (only books/categories/habits have partial validation) → persists to PostgreSQL, media to
   S3/local `uploads/`.
2. **Mobile** calls the public/list endpoints, parses `response.data['data']`, maps into
   models (books) or raw maps (everything else), and renders via a Cubit state.

---

## 6. Problems found

### 6.1 Cross-layer contract breaks (highest impact)

1. **`GET /my-captain/profile` doesn't exist** — mobile `MyCaptainRepository.getCaptainProfile()` calls it, gets 404, and swallows to `{}`. Result: captain header welcome, stats (`stars`/`days`/`missions`), and the streak badge are always empty. (Root cause of the `Null → num` crash fixed earlier; the fix is now correct but has no data.)
2. **`GET /music/genres` doesn't exist** — music genre chips are always `[]`.
3. **`GET /storytelling/categories` doesn't exist** — it even matches `GET /:id` with `id="categories"` → "Story not found"; storytelling category chips always `[]`.
4. **`/books` list endpoints omit `audioFiles`/`pdfFiles`** — `BookModel.audioFile`/`pdfFile` are always null in lists, so Discovery's "E-Books"/"Audio Books" shelves, audio-vs-ebook classification, and Books' `AudioBookCard` branch never populate.
5. **Category filter id vs slug mismatch** — mobile sends `category=<categoryId>`, backend `listBooks` filters `categories.some.category.slug == category`. Category filtering returns empty/wrong results in Discovery + Books.
6. **Discovery "For You" is not recommendations** — the real `/recommendations` engine (collaborative filtering) is never called; the hero shelf is just `GET /books` (latest 20).
7. **Recommendation response shape is inconsistent** — personalized branch returns `categories:{categoryId}` (no `name`/`slug`) while `/fallback` returns full `{id,name,slug}`; `BookModel.fromJson` would crash on the personalized shape if it were ever used.

### 6.2 Backend bugs

- **`playCount` never incremented** (`music.service.ts`) → `/music/featured` "popularity" is meaningless (all tie at 0).
- **`downloadCount` is dead** (schema field, never read/written).
- **`completeHabit` streak is wrong for backdated dates** — "yesterday" is computed from real now, not from `date`; `dateStr` is unvalidated (`Invalid Date` → NaN).
- **`completeHabit` race** — findUnique-then-create is not atomic; concurrent completions violate `@@unique` → 500 instead of 409.
- **`completeHabit` ignores `habit.isActive`** — inactive habits can still be completed.
- **`resolveTags` N+1 + race** (`book.service.ts`) — per-tag findUnique+create; concurrent creates can throw unique-constraint 500.
- **Four modules have no request validation** — music, storytelling, my-doctor, my-captain have no `.validation.ts`/`validate`; `habit.validation.ts` is dead (never used). Malformed bodies → Prisma 500s instead of 422s.
- **`createBook` hardcodes `PUBLISHED`** and the create/update schemas omit `status` → cannot create a draft.
- **Delete semantics differ** — books/music/storytelling soft-delete; categories/my-doctor/my-captain/habits hard-delete. Archived rows are still returned by `GET /:id`.
- **`deleteFile` key-vs-URL mismatch** (`signedUrl.ts` vs `localUpload.ts`) — `uploadFile` returns an S3 key or a full local URL; `deleteFile` only handles S3, orphaning local files and mixing key/URL in `fileUrl`.
- **No premium/entitlement gating** — `getBookById` returns full audio/pdf URLs to anonymous/optionalAuth callers with no `isPremium` vs subscription check.
- **View counts inflate on every read** — `incrementViewCount` on every `GET /:id` with no dedup.
- **Permission resource names inconsistent** — `doctor:` (my-doctor) and `captain:` (my-captain) vs `books:`/`music:`/etc.

### 6.3 Admin bugs

- **Dead sorting everywhere** — pages mark columns `sortable` but never pass `onSort`; Books' sort-direction toggle is never sent to the API; `viewCount` in `sortMap` has no column.
- **Delete route mismatches** — MyDoctor DELETE uses singular `/tip`/`/doctor` (vs plural `/tips`/`/profiles`); MyCaptain DELETE uses singular `/achievement` (vs plural). Likely 404s.
- **Books form is incomplete** — no audio upload UI; no status/isFeatured/isPremium/isFree/language/isbn/publisher/tags; can't delete an existing PDF; "Upload pending files" broken in create mode.
- **Music form can't set `genre`** (required in interface, absent from UI); `artist`/`album`/`trackOrder` uneditable.
- **Storytelling has no media upload** — cover/audio are text URL fields only (inconsistent with Books/Music).
- **My Captain achievement `iconUrl` has no input.**
- **Pagination broken/non-functional** on MyDoctor and MyCaptain (no params sent / hardcoded 50).
- **Category `route` hardcoded** to 6 values; `sortOrder` sent as string.
- **No search debounce** (refetch per keystroke).
- **`EmptyState`/`StatCard` unused**; DataTable hardcodes "No data found".

### 6.4 Mobile bugs / fragility

- **Untyped content** — Story/Music/HealthTip/Achievement/Habit/Leaderboard are raw maps; no `fromJson` safety.
- **`BooksLoaded.copyWith` null trap** (`books_state.dart:56`) — `copyWith(selectedCategoryId: null)` keeps the old value, so the "All" chip can never clear the genre filter.
- **Field-name mismatches** — `Story` has no `author`/`ageGroup`/`durationSeconds` (storytelling screen reads them); `MusicTrack.artist` may be null (screen ignores `artistAuthor`); health-tip `content` never rendered.
- **Fragile bare casts** — `CategoryModel.slug` (`as String`), tag `name`, genre/category chip `['name'] as String`, `stats['userHabits'] as List`, `_rankMedal(int)` dynamic→int.
- **Dead branches** — doctor "Offline" badge (backend filters `available:true`), achievement "🔒 isHidden" (backend filters `isHidden:false`), music "New Releases" = duplicate of "Top Tracks".
- **`loadMyStats` re-fetches `/habits` on every completion** (redundant round-trip).
- **Music/Storytelling/MyDoctor/MyCaptain repos swallow `DioException`** → errors surface as silently-empty screens instead of error states.

### 6.5 Consistency / dead code

- `DoctorStatus` enum unused (DoctorProfile uses `available`).
- `HabitReminder` model has no routes/services.
- `deleteCategory` fetches `_count.books` and never uses it; detaches books silently.
- Tagging model differs per content type (relation vs string).
- Sort options differ per module (books 4 modes; music `trackOrder` only; stories `createdAt` only).
- `slugify` strips non-Latin scripts (Amharic/Oromo → empty slug + timestamp suffix).
- `POST /books` chains `uploadMultiple` but `createBook` ignores `req.files`.

---

## 7. Suggested fix priority

1. **Add missing endpoints** — `/my-captain/profile`, `/music/genres`, `/storytelling/categories` (or point mobile at real fields).
2. **Include `audioFiles`/`pdfFiles` in `/books` list** (or add `hasAudio`/`hasPdf` booleans) so the audio/ebook split works.
3. **Fix category filter** — align on slug (mobile sends `category.slug`) or change backend to match by id.
4. **Wire the real recommendation engine** into Discovery's "For You" (and fix its response shape).
5. **Add validation to music/storytelling/my-doctor/my-captain**; fix `completeHabit` (atomic + date-relative + `isActive` check); fix `resolveTags` (upsert); fix `deleteFile` key/URL handling.
6. **Fix admin delete routes + wire sorting + complete the Books/Music/Storytelling forms.**
7. **Add typed models** for Story/Music/HealthTip/Achievement/Habit; replace bare casts with `as num?`/`as int?` + `??`.
