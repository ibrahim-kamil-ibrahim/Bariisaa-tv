# Database Entity Relationship Diagram (ERD)
# Audio Book & E-Book Platform
## Version 1.0

---

## 1. ERD OVERVIEW

The database consists of 29 tables organized into 7 domains:
1. **Identity & Access** — Users, Roles, Permissions, UserRoles, RolePermissions
2. **Devices** — Devices
3. **Content** — Books, Authors, BookAuthors, Categories, BookCategories, AudioFiles, AudioChapters, PdfFiles, Tags, BookTags
4. **User Engagement** — Bookmarks, Notes, Highlights, Favorites, Reviews, ReadingHistory, ListeningHistory
5. **Subscriptions** — SubscriptionPlans, Subscriptions
6. **Payments** — Payments, Coupons, CouponUsage
7. **System** — Notifications, UserNotifications, AuditLogs

---

## 2. ENTITY RELATIONSHIP DIAGRAM (Text-Based)

```
┌─────────────────────┐       ┌─────────────────────┐
│       roles          │       │    permissions       │
├─────────────────────┤       ├─────────────────────┤
│ id (PK)             │       │ id (PK)             │
│ name (UNIQUE)       │       │ name (UNIQUE)       │
│ description         │       │ resource            │
│ created_at          │       │ action              │
│ updated_at          │       │ description         │
└──────────┬──────────┘       └──────────┬──────────┘
           │                             │
           │  ┌───────────────────────┐  │
           └──┤  role_permissions     ├──┘
              ├───────────────────────┤
              │ role_id (FK)          │
              │ permission_id (FK)    │
              │ (composite PK)        │
              └───────────────────────┘

┌─────────────────────┐       ┌──────────────────────┐
│       users          │       │     user_roles        │
├─────────────────────┤       ├──────────────────────┤
│ id (PK)             │◀──────│ user_id (FK)          │
│ email (UNIQUE)      │       │ role_id (FK) ─────────│──▶ roles
│ phone (UNIQUE)      │       │ (composite PK)        │
│ password_hash       │       └──────────────────────┘
│ name                │
│ avatar_url          │
│ email_verified      │
│ phone_verified      │
│ status              │
│ fcm_token           │
│ preferred_language  │
│ created_at          │
│ updated_at          │
└──────────┬──────────┘
           │
    ┌──────┼──────────────────────────────────────────────────┐
    │      │                                                   │
    ▼      ▼                                                   ▼
┌──────────────┐  ┌──────────────────┐  ┌──────────────────────────┐
│   devices     │  │   favorites      │  │      subscriptions       │
├──────────────┤  ├──────────────────┤  ├──────────────────────────┤
│ id (PK)      │  │ id (PK)         │  │ id (PK)                   │
│ user_id (FK) │  │ user_id (FK)    │  │ user_id (FK)              │
│ device_uid   │  │ book_id (FK)    │  │ plan_id (FK) ─────────────│──▶ subscription_plans
│ device_name  │  │ created_at      │  │ start_date                │
│ platform     │  │ (UNIQUE:        │  │ end_date                  │
│ os_version   │  │  user_id,       │  │ status                    │
│ fcm_token    │  │  book_id)       │  │ auto_renew                │
│ last_active  │  └──────────────────┘  │ payment_id (FK)          │
│ created_at   │                        │ created_at                │
└──────────────┘                        │ updated_at                │
                                        └──────────────────────────┘

┌──────────────────────┐
│  subscription_plans   │
├──────────────────────┤
│ id (PK)              │
│ name                 │
│ duration_months      │
│ price                │
│ currency             │
│ features (JSON)      │
│ is_active            │
│ created_at           │
│ updated_at           │
└──────────────────────┘

┌─────────────────────┐       ┌──────────────────────┐
│      authors         │       │     categories        │
├─────────────────────┤       ├──────────────────────┤
│ id (PK)             │       │ id (PK)              │
│ name                │       │ name                 │
│ bio                 │       │ description          │
│ photo_url           │       │ parent_id (FK, self) │
│ created_at          │       │ slug (UNIQUE)        │
│ updated_at          │       │ created_at           │
└──────────┬──────────┘       └──────────┬───────────┘
           │                             │
           │  ┌───────────────────┐      │  ┌───────────────────┐
           └──┤  book_authors     │      └──┤  book_categories  │
              ├───────────────────┤         ├───────────────────┤
              │ book_id (FK)      │         │ book_id (FK)      │
              │ author_id (FK)    │         │ category_id (FK)  │
              │ (composite PK)    │         │ (composite PK)    │
              └───────────────────┘         └───────────────────┘
                      │                             │
                      ▼                             ▼
              ┌─────────────────────────────────────────┐
              │                 books                     │
              ├─────────────────────────────────────────┤
              │ id (PK)                                 │
              │ title                                   │
              │ description                             │
              │ cover_url                               │
              │ thumbnail_url                           │
              │ language                                │
              │ isbn                                    │
              │ publisher                               │
              │ publish_date                            │
              │ page_count                              │
              │ is_featured                             │
              │ is_premium                              │
              │ is_free                                 │
              │ status (draft/published/archived)       │
              │ view_count                              │
              │ download_count                          │
              │ avg_rating                              │
              │ rating_count                            │
              │ created_at                              │
              │ updated_at                              │
              └──────────┬──────────────────────────────┘
                         │
           ┌─────────────┼─────────────────────────────────────┐
           │             │                                      │
           ▼             ▼                                      ▼
┌──────────────────┐ ┌──────────────────┐  ┌──────────────────────────┐
│   audio_files     │ │    pdf_files      │  │        reviews           │
├──────────────────┤ ├──────────────────┤  ├──────────────────────────┤
│ id (PK)         │ │ id (PK)         │  │ id (PK)                   │
│ book_id (FK)    │ │ book_id (FK)    │  │ user_id (FK)              │
│ file_url        │ │ file_url        │  │ book_id (FK)              │
│ duration_seconds│ │ page_count      │  │ rating (1-5)              │
│ file_size_bytes │ │ file_size_bytes │  │ content (text)            │
│ format          │ │ format          │  │ created_at                │
│ sample_url      │ │ sample_url      │  │ updated_at                │
│ created_at      │ │ created_at      │  │ (UNIQUE: user_id,book_id) │
└────────┬─────────┘ └─────────────────┘  └──────────────────────────┘
         │
         ▼
┌──────────────────┐
│  audio_chapters   │
├──────────────────┤
│ id (PK)         │
│ audio_file_id   │
│   (FK)          │
│ title           │
│ start_seconds   │
│ end_seconds     │
│ track_order     │
└──────────────────┘

┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐
│     bookmarks         │  │       notes           │  │     highlights       │
├──────────────────────┤  ├──────────────────────┤  ├──────────────────────┤
│ id (PK)             │  │ id (PK)             │  │ id (PK)             │
│ user_id (FK)        │  │ user_id (FK)        │  │ user_id (FK)        │
│ book_id (FK)        │  │ book_id (FK)        │  │ book_id (FK)        │
│ type (audio/pdf)    │  │ content             │  │ selected_text       │
│ position            │  │ position            │  │ color               │
│ label               │  │ page_number         │  │ position            │
│ timestamp_seconds   │  │ created_at          │  │ page_number         │
│ created_at          │  │ updated_at          │  │ created_at          │
└──────────────────────┘  └──────────────────────┘  └──────────────────────┘

┌──────────────────────┐  ┌──────────────────────┐
│   reading_history     │  │  listening_history    │
├──────────────────────┤  ├──────────────────────┤
│ id (PK)             │  │ id (PK)             │
│ user_id (FK)        │  │ user_id (FK)        │
│ book_id (FK)        │  │ book_id (FK)        │
│ last_position       │  │ last_timestamp_sec  │
│ progress_percent    │  │ progress_percent    │
│ last_accessed_at    │  │ last_accessed_at    │
│ (UNIQUE:            │  │ (UNIQUE:            │
│  user_id, book_id)  │  │  user_id, book_id)  │
└──────────────────────┘  └──────────────────────┘

┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐
│      payments         │  │      coupons          │  │    coupon_usage      │
├──────────────────────┤  ├──────────────────────┤  ├──────────────────────┤
│ id (PK)             │  │ id (PK)             │  │ id (PK)             │
│ user_id (FK)        │  │ code (UNIQUE)       │  │ coupon_id (FK)      │
│ subscription_id(FK) │  │ discount_type       │  │ user_id (FK)        │
│ amount              │  │ discount_value      │  │ payment_id (FK)     │
│ currency            │  │ max_uses            │  │ used_at             │
│ gateway             │  │ used_count          │  └──────────────────────┘
│ gateway_txn_id      │  │ per_user_limit      │
│ status              │  │ applicable_plans    │
│ metadata (JSON)     │  │   (JSON)            │
│ created_at          │  │ is_active           │
│ updated_at          │  │ expires_at          │
└──────────────────────┘  │ created_at          │
                          └──────────────────────┘

┌──────────────────────┐  ┌──────────────────────┐
│    notifications      │  │  user_notifications   │
├──────────────────────┤  ├──────────────────────┤
│ id (PK)             │  │ id (PK)             │
│ title               │  │ notification_id (FK)  │
│ body                │  │ user_id (FK)          │
│ type                │  │ is_read               │
│ data (JSON)         │  │ read_at               │
│ target_type         │  │ created_at            │
│ target_ids (JSON)   │  └──────────────────────┘
│ sent_at             │
│ created_by (FK)     │
│ created_at          │
└──────────────────────┘

┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐
│     audit_logs        │  │       tags            │  │      book_tags       │
├──────────────────────┤  ├──────────────────────┤  ├──────────────────────┤
│ id (PK)             │  │ id (PK)             │  │ book_id (FK)        │
│ user_id (FK)        │  │ name (UNIQUE)       │  │ tag_id (FK)         │
│ action              │  │ created_at          │  │ (composite PK)      │
│ resource            │  └──────────────────────┘  └──────────────────────┘
│ resource_id         │
│ details (JSON)      │
│ ip_address          │
│ user_agent          │
│ created_at          │
└──────────────────────┘
```

---

## 3. RELATIONSHIP SUMMARY

| Relationship | Type | Description |
|-------------|------|-------------|
| Users → Roles | Many-to-Many | Via user_roles junction table |
| Roles → Permissions | Many-to-Many | Via role_permissions junction table |
| Users → Devices | One-to-Many | A user has multiple registered devices |
| Users → Favorites | One-to-Many | A user favorites multiple books |
| Users → Bookmarks | One-to-Many | A user creates multiple bookmarks |
| Users → Notes | One-to-Many | A user creates multiple notes |
| Users → Highlights | One-to-Many | A user creates multiple highlights |
| Users → Reviews | One-to-Many | A user writes multiple reviews |
| Users → ReadingHistory | One-to-Many | A user reads multiple books |
| Users → ListeningHistory | One-to-Many | A user listens to multiple audiobooks |
| Users → Subscriptions | One-to-Many | A user has subscription history |
| Users → Payments | One-to-Many | A user makes multiple payments |
| Users → UserNotifications | One-to-Many | A user receives multiple notifications |
| Books → Authors | Many-to-Many | Via book_authors junction table |
| Books → Categories | Many-to-Many | Via book_categories junction table |
| Books → Tags | Many-to-Many | Via book_tags junction table |
| Books → AudioFiles | One-to-Many | A book can have multiple audio files/versions |
| Books → PdfFiles | One-to-Many | A book can have multiple PDF versions |
| Books → Reviews | One-to-Many | A book has multiple reviews |
| Books → Bookmarks | One-to-Many | A book has multiple bookmarks (across users) |
| AudioFiles → AudioChapters | One-to-Many | An audio file has multiple chapters |
| Categories → Categories | Self-referential | Parent-child hierarchy |
| Subscriptions → SubscriptionPlans | Many-to-One | A subscription belongs to a plan |
| Subscriptions → Payments | One-to-One | A subscription is linked to a payment |
| Payments → Coupons | Many-to-One | A payment may use a coupon |
| Coupons → CouponUsage | One-to-Many | A coupon has multiple usage records |
| Notifications → UserNotifications | One-to-Many | A notification is delivered to multiple users |
| Users → AuditLogs | One-to-Many | A user (admin) generates audit entries |

---

## 4. INDEXES (Performance)

| Table | Index | Type | Purpose |
|-------|-------|------|---------|
| users | email | UNIQUE | Login lookup |
| users | phone | UNIQUE | Login lookup |
| users | status | BTREE | Filter active users |
| books | title | GIN (tsvector) | Full-text search |
| books | status | BTREE | Filter published books |
| books | is_featured | BTREE | Featured section |
| books | is_premium | BTREE | Premium filter |
| books | publish_date | BTREE | Sort by date |
| books | avg_rating | BTREE | Sort by rating |
| books | view_count | BTREE | Trending/popular |
| audio_files | book_id | BTREE | Lookup by book |
| pdf_files | book_id | BTREE | Lookup by book |
| favorites | (user_id, book_id) | UNIQUE | Prevent duplicates |
| reviews | (user_id, book_id) | UNIQUE | One review per user per book |
| reading_history | (user_id, book_id) | UNIQUE | One record per user per book |
| listening_history | (user_id, book_id) | UNIQUE | One record per user per book |
| bookmarks | (user_id, book_id, position) | BTREE | Lookup bookmarks |
| subscriptions | user_id + status | BTREE | Find active subscription |
| payments | user_id | BTREE | Payment history |
| payments | gateway_txn_id | UNIQUE | Idempotency |
| coupons | code | UNIQUE | Coupon lookup |
| audit_logs | user_id + created_at | BTREE | Audit trail queries |
| audit_logs | resource + resource_id | BTREE | Resource-specific audit |
| notifications | sent_at | BTREE | Notification ordering |
| user_notifications | user_id + is_read | BTREE | Unread notification count |

---

*End of ERD Document*
