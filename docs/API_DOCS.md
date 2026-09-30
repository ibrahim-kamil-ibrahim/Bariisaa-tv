# Naik Audio Book & E-Book Platform API Documentation

**Base URL:** `/api/v1`  
**Auth Scheme:** `Bearer <JWT_TOKEN>`  
**Content-Type:** `application/json`

---

## Auth Module

### POST /auth/signup/email
Register with email.

**Auth:** No  
**Request Body:**
```json
{
  "name": "string (required, 2-50 chars)",
  "email": "string (required, valid email)",
  "password": "string (required, min 8 chars, uppercase + lowercase + number)",
  "confirmPassword": "string (required, must match password)"
}
```
**Response (201):**
```json
{
  "success": true,
  "message": "Verification email sent. Please verify your email.",
  "data": { "userId": "string" }
}
```
**Errors:** 400 (validation), 409 (email exists)

---

### POST /auth/signup/phone
Register with phone number.

**Auth:** No  
**Request Body:**
```json
{
  "name": "string (required, 2-50 chars)",
  "phone": "string (required, valid phone number)",
  "password": "string (required, min 8 chars)",
  "confirmPassword": "string (required, must match password)"
}
```
**Response (201):**
```json
{
  "success": true,
  "message": "OTP sent to phone number.",
  "data": { "userId": "string", "otpExpiresIn": 300 }
}
```
**Errors:** 400 (validation), 409 (phone exists)

---

### POST /auth/login
Login with email/phone + password.

**Auth:** No  
**Request Body:**
```json
{
  "emailOrPhone": "string (required)",
  "password": "string (required)",
  "deviceInfo": { "udid": "string", "fcmToken": "string", "platform": "string", "model": "string" }
}
```
**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": { "id": "string", "name": "string", "email": "string", "phone": "string", "role": "user|admin", "avatar": "string|null", "isVerified": true },
    "tokens": { "accessToken": "string", "refreshToken": "string", "expiresIn": 3600 }
  }
}
```
**Errors:** 400, 401 (invalid credentials)

---

### POST /auth/login/otp
Login with phone OTP.

**Auth:** No  
**Request Body:**
```json
{
  "phone": "string (required)",
  "otp": "string (required, 6 digits)",
  "deviceInfo": { "udid": "string", "fcmToken": "string", "platform": "string", "model": "string" }
}
```
**Response (200):** Same as login response.  
**Errors:** 400, 401

---

### GET /auth/verify-email
Verify email via token.

**Auth:** No  
**Query Params:** `token` (string, required)  
**Response (200):**
```json
{ "success": true, "message": "Email verified successfully." }
```
**Errors:** 400 (invalid/expired token)

---

### POST /auth/verify-phone
Verify phone via OTP.

**Auth:** No  
**Request Body:**
```json
{
  "userId": "string (required)",
  "otp": "string (required, 6 digits)"
}
```
**Response (200):**
```json
{ "success": true, "message": "Phone verified successfully." }
```
**Errors:** 400, 401

---

### POST /auth/forgot-password
Send password reset email/OTP.

**Auth:** No  
**Request Body:**
```json
{
  "emailOrPhone": "string (required)"
}
```
**Response (200):**
```json
{
  "success": true,
  "message": "Reset instructions sent.",
  "data": { "resetToken": "string (if email)" }
}
```

---

### POST /auth/reset-password
Reset password with token.

**Auth:** No  
**Request Body:**
```json
{
  "token": "string (required)",
  "newPassword": "string (required, min 8 chars)",
  "confirmPassword": "string (required)"
}
```
**Response (200):**
```json
{ "success": true, "message": "Password reset successfully." }
```
**Errors:** 400, 401

---

### POST /auth/refresh-token
Refresh access token.

**Auth:** No  
**Request Body:**
```json
{
  "refreshToken": "string (required)"
}
```
**Response (200):**
```json
{
  "success": true,
  "data": { "accessToken": "string", "refreshToken": "string", "expiresIn": 3600 }
}
```
**Errors:** 401 (invalid/expired refresh token)

---

### POST /auth/logout
Logout and invalidate tokens.

**Auth:** Yes  
**Request Body:**
```json
{
  "refreshToken": "string (required)",
  "deviceUdid": "string (optional)"
}
```
**Response (200):**
```json
{ "success": true, "message": "Logged out successfully." }
```

---

### POST /auth/resend-email-verification
Resend verification email.

**Auth:** No  
**Request Body:**
```json
{
  "email": "string (required)"
}
```
**Response (200):**
```json
{ "success": true, "message": "Verification email resent." }
```

---

### POST /auth/resend-phone-otp
Resend phone OTP.

**Auth:** No  
**Request Body:**
```json
{
  "userId": "string (required)",
  "phone": "string (required)"
}
```
**Response (200):**
```json
{ "success": true, "message": "OTP resent.", "data": { "otpExpiresIn": 300 } }
```

---

## Users Module

### GET /users/profile
Get current user profile.

**Auth:** Yes  
**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "string", "name": "string", "email": "string", "phone": "string",
    "avatar": "string|null", "role": "user|admin", "isVerified": true,
    "isOnboarded": true, "preferredLanguage": "string",
    "subscription": { "plan": "string|null", "status": "active|canceled|expired|null", "expiresAt": "date|null" },
    "stats": { "booksCompleted": 0, "hoursListened": 0, "pagesRead": 0 }
  }
}
```

---

### PUT /users/profile
Update profile.

**Auth:** Yes  
**Request Body:**
```json
{
  "name": "string (optional, 2-50 chars)",
  "bio": "string (optional, max 500 chars)",
  "preferredLanguage": "string (optional)"
}
```
**Response (200):** Updated user object.

---

### PUT /users/avatar
Upload avatar.

**Auth:** Yes  
**Request:** `multipart/form-data` with `avatar` file field.  
**Response (200):**
```json
{ "success": true, "data": { "avatarUrl": "string" } }
```

---

### GET /users/devices
Get user's registered devices.

**Auth:** Yes  
**Response (200):**
```json
{
  "success": true,
  "data": [
    { "id": "string", "udid": "string", "platform": "string", "model": "string", "isCurrent": true, "lastActiveAt": "date" }
  ]
}
```

---

### DELETE /users/devices/:id
Remove a device.

**Auth:** Yes  
**Response (200):**
```json
{ "success": true, "message": "Device removed." }
```

---

### GET /users (Admin)
List all users.

**Auth:** Yes (Admin)  
**Query Params:** `page` (int, default 1), `limit` (int, default 20), `search` (string), `status` (active|suspended|banned), `role` (user|admin), `sortBy` (string), `sortOrder` (asc|desc)  
**Response (200):**
```json
{
  "success": true,
  "data": { "users": [...], "pagination": { "page": 1, "limit": 20, "total": 100, "pages": 5 } }
}
```

---

### GET /users/:id (Admin)
Get user by ID.

**Auth:** Yes (Admin)  
**Response (200):** Full user object with subscription, stats, devices.

---

### PATCH /users/:id/status (Admin)
Update user status.

**Auth:** Yes (Admin)  
**Request Body:**
```json
{
  "status": "active|suspended|banned (required)",
  "reason": "string (optional)"
}
```
**Response (200):** Updated user.

---

### POST /users/:id/reset-password (Admin)
Admin-reset user password.

**Auth:** Yes (Admin)  
**Request Body:**
```json
{
  "newPassword": "string (required, min 8 chars)"
}
```
**Response (200):**
```json
{ "success": true, "message": "Password reset successfully." }
```

---

## Books Module

### POST /books
Create a book.

**Auth:** Yes (Admin)  
**Request Body:**
```json
{
  "title": "string (required)",
  "description": "string (optional)",
  "isbn": "string (optional)",
  "language": "string (optional, default 'en')",
  "publisher": "string (optional)",
  "publishDate": "date (optional)",
  "pageCount": "number (optional)",
  "duration": "number (optional, seconds)",
  "status": "draft|published|archived (default 'draft')",
  "isFeatured": "boolean (default false)",
  "isPremium": "boolean (default false)",
  "isFree": "boolean (default false)",
  "price": "number (optional)",
  "categoryIds": ["string"],
  "authorIds": ["string"],
  "tags": ["string"]
}
```
**Response (201):** Created book object.

---

### PUT /books/:id
Update a book.

**Auth:** Yes (Admin)  
**Request Body:** Same fields as create (all optional).  
**Response (200):** Updated book object.

---

### DELETE /books/:id
Delete a book.

**Auth:** Yes (Admin)  
**Response (200):**
```json
{ "success": true, "message": "Book deleted." }
```

---

### GET /books/:id
Get book details.

**Auth:** Depends on book status (public for published)  
**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "string", "title": "string", "description": "string", "slug": "string",
    "isbn": "string", "language": "string", "publisher": "string",
    "publishDate": "date", "pageCount": 0, "duration": 0,
    "coverUrl": "string|null", "thumbnailUrl": "string|null",
    "status": "published", "isFeatured": false, "isPremium": false, "isFree": false,
    "price": 0, "rating": 4.5, "ratingCount": 100,
    "categories": [{ "id": "string", "name": "string", "slug": "string" }],
    "authors": [{ "id": "string", "name": "string" }],
    "tags": ["string"],
    "audioFiles": [{ "id": "string", "title": "string", "duration": 0, "fileUrl": "string", "order": 1 }],
    "pdfFiles": [{ "id": "string", "title": "string", "fileUrl": "string", "order": 1 }],
    "createdAt": "date", "updatedAt": "date"
  }
}
```

---

### GET /books
List books.

**Auth:** No  
**Query Params:** `page`, `limit`, `search`, `category`, `author`, `language`, `status` (admin only), `sortBy` (title, createdAt, rating, popularity), `sortOrder`, `minRating`, `isFeatured`, `isPremium`, `isFree`  
**Response (200):** Paginated books array.

---

### GET /books/featured
Get featured books.

**Auth:** No  
**Query Params:** `limit` (default 10)  
**Response (200):** Array of featured books.

---

### GET /books/trending
Get trending books.

**Auth:** No  
**Query Params:** `limit` (default 10), `period` (week|month|year, default week)  
**Response (200):** Array of trending books.

---

### GET /books/new-releases
Get new releases.

**Auth:** No  
**Query Params:** `limit` (default 10), `days` (default 30)  
**Response (200):** Array of recent books.

---

### GET /books/free
Get free books.

**Auth:** No  
**Query Params:** `limit` (default 10), `page`  
**Response (200):** Paginated free books.

---

### PUT /books/:id/cover
Upload cover image.

**Auth:** Yes (Admin)  
**Request:** `multipart/form-data` with `cover` file.  
**Response (200):**
```json
{ "success": true, "data": { "coverUrl": "string" } }
```

---

### PUT /books/:id/thumbnail
Upload thumbnail image.

**Auth:** Yes (Admin)  
**Request:** `multipart/form-data` with `thumbnail` file.  
**Response (200):**
```json
{ "success": true, "data": { "thumbnailUrl": "string" } }
```

---

## Categories Module

### POST /categories
Create category.

**Auth:** Yes (Admin)  
**Request Body:**
```json
{
  "name": "string (required, unique)",
  "description": "string (optional)"
}
```
**Response (201):** Category object with auto-generated slug.

---

### PUT /categories/:id
Update category.

**Auth:** Yes (Admin)  
**Request Body:**
```json
{
  "name": "string (optional)",
  "description": "string (optional)"
}
```
**Response (200):** Updated category.

---

### DELETE /categories/:id
Delete category.

**Auth:** Yes (Admin)  
**Response (200):**
```json
{ "success": true, "message": "Category deleted." }
```

---

### GET /categories/:id
Get category by ID.

**Auth:** No  
**Response (200):** Category object with book count.

---

### GET /categories
List categories.

**Auth:** No  
**Response (200):**
```json
{
  "success": true,
  "data": [
    { "id": "string", "name": "string", "slug": "string", "description": "string", "bookCount": 0 }
  ]
}
```

---

## Authors Module

### POST /authors
Create author.

**Auth:** Yes (Admin)  
**Request Body:**
```json
{
  "name": "string (required)",
  "bio": "string (optional)",
  "photo": "string (optional, URL)"
}
```
**Response (201):** Author object.

---

### PUT /authors/:id
Update author.

**Auth:** Yes (Admin)  
**Request Body:**
```json
{
  "name": "string (optional)",
  "bio": "string (optional)",
  "photo": "string (optional)"
}
```
**Response (200):** Updated author.

---

### DELETE /authors/:id
Delete author.

**Auth:** Yes (Admin)  
**Response (200):**
```json
{ "success": true, "message": "Author deleted." }
```

---

### GET /authors/:id
Get author by ID.

**Auth:** No  
**Response (200):** Author object with books array.

---

### GET /authors
List authors.

**Auth:** No  
**Response (200):**
```json
{
  "success": true,
  "data": [
    { "id": "string", "name": "string", "bio": "string", "photoUrl": "string", "bookCount": 0 }
  ]
}
```

---

## Subscriptions Module

### GET /subscriptions/plans
List all plans.

**Auth:** No  
**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "string", "name": "string", "description": "string",
      "price": 9.99, "currency": "ETB|USD", "durationDays": 30,
      "features": ["string"], "isActive": true, "popular": false
    }
  ]
}
```

---

### GET /subscriptions/plans/:id
Get plan by ID.

**Auth:** No  
**Response (200):** Single plan object.

---

### POST /subscriptions/plans
Create plan.

**Auth:** Yes (Admin)  
**Request Body:**
```json
{
  "name": "string (required)",
  "description": "string (optional)",
  "price": "number (required, > 0)",
  "currency": "string (required, ETB|USD)",
  "durationDays": "number (required, > 0)",
  "features": ["string"],
  "isActive": "boolean (default true)",
  "popular": "boolean (default false)"
}
```
**Response (201):** Created plan.

---

### PUT /subscriptions/plans/:id
Update plan.

**Auth:** Yes (Admin)  
**Request Body:** Same fields as create (all optional).  
**Response (200):** Updated plan.

---

### POST /subscriptions/subscribe
Subscribe to a plan.

**Auth:** Yes  
**Request Body:**
```json
{
  "planId": "string (required)",
  "paymentMethod": "stripe|chapa|telebirr (required)",
  "couponCode": "string (optional)"
}
```
**Response (201):**
```json
{
  "success": true,
  "data": {
    "subscriptionId": "string",
    "paymentUrl": "string (for redirect, if applicable)",
    "status": "pending|active"
  }
}
```

---

### GET /subscriptions/current
Get current user subscription.

**Auth:** Yes  
**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "string", "plan": { "name": "string", "features": ["string"] },
    "status": "active|canceled|expired|pending",
    "startDate": "date", "endDate": "date",
    "autoRenew": true, "cancelledAt": "date|null"
  }
}
```

---

### GET /subscriptions/history
Get user subscription history.

**Auth:** Yes  
**Query Params:** `page`, `limit`  
**Response (200):** Paginated subscription history.

---

## Payments Module

### POST /payments/validate-coupon
Validate a coupon code.

**Auth:** No  
**Request Body:**
```json
{
  "code": "string (required)",
  "planId": "string (optional)"
}
```
**Response (200):**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "coupon": { "code": "string", "discountPercent": 20, "discountAmount": 0 },
    "discountedPrice": 7.99
  }
}
```

---

### POST /payments/webhooks/stripe
Stripe webhook handler.

**Auth:** No (verified via Stripe signature)  
**Request:** Raw Stripe event.  
**Response (200):** `{ "received": true }`

---

### POST /payments/webhooks/chapa
Chapa webhook handler.

**Auth:** No (verified via signature)  
**Request:** Chapa event payload.  
**Response (200):** `{ "received": true }`

---

### POST /payments/webhooks/telebirr
Telebirr webhook handler.

**Auth:** No (verified via signature)  
**Request:** Telebirr event payload.  
**Response (200):** `{ "received": true }`

---

### GET /payments
Get current user's payments.

**Auth:** Yes  
**Query Params:** `page`, `limit`, `status`  
**Response (200):**
```json
{
  "success": true,
  "data": {
    "payments": [
      {
        "id": "string", "amount": 9.99, "currency": "ETB",
        "method": "chapa|stripe|telebirr",
        "status": "completed|pending|failed|cancelled",
        "description": "string",
        "createdAt": "date"
      }
    ],
    "pagination": { "page": 1, "limit": 20, "total": 50, "pages": 3 }
  }
}
```

---

### GET /payments/:id
Get payment details.

**Auth:** Yes  
**Response (200):** Full payment object.

---

### GET /payments/admin/all
Get all payments (Admin).

**Auth:** Yes (Admin)  
**Query Params:** `page`, `limit`, `status`, `method`, `userId`, `fromDate`, `toDate`, `search`  
**Response (200):** Paginated payments with user info.

---

## Bookmarks Module

### POST /bookmarks
Create a bookmark.

**Auth:** Yes  
**Request Body:**
```json
{
  "bookId": "string (required)",
  "chapterId": "string (optional)",
  "title": "string (optional)",
  "position": { "cfi": "string", "page": 0, "percentage": 0.5, "timestamp": 0 }
}
```
**Response (201):** Created bookmark.

---

### DELETE /bookmarks/:id
Delete a bookmark.

**Auth:** Yes  
**Response (200):**
```json
{ "success": true, "message": "Bookmark deleted." }
```

---

### GET /bookmarks/book/:bookId
Get bookmarks for a book.

**Auth:** Yes  
**Response (200):**
```json
{
  "success": true,
  "data": [
    { "id": "string", "bookId": "string", "chapterId": "string",
      "title": "string", "position": { "cfi": "string", "page": 0, "percentage": 0.5, "timestamp": 0 },
      "createdAt": "date" }
  ]
}
```

---

### GET /bookmarks
Get all bookmarks for current user.

**Auth:** Yes  
**Query Params:** `page`, `limit`  
**Response (200):** Paginated bookmarks with book info.

---

## Notes Module

### POST /notes
Create a note.

**Auth:** Yes  
**Request Body:**
```json
{
  "bookId": "string (required)",
  "chapterId": "string (optional)",
  "text": "string (required, max 5000 chars)",
  "position": { "cfi": "string", "page": 0, "percentage": 0.5, "timestamp": 0 },
  "color": "string (optional, default 'yellow')",
  "tags": ["string"]
}
```
**Response (201):** Created note.

---

### PUT /notes/:id
Update a note.

**Auth:** Yes  
**Request Body:**
```json
{
  "text": "string (optional)",
  "color": "string (optional)",
  "tags": ["string"]
}
```
**Response (200):** Updated note.

---

### DELETE /notes/:id
Delete a note.

**Auth:** Yes  
**Response (200):**
```json
{ "success": true, "message": "Note deleted." }
```

---

### GET /notes/book/:bookId
Get notes for a book.

**Auth:** Yes  
**Response (200):**
```json
{
  "success": true,
  "data": [
    { "id": "string", "bookId": "string", "chapterId": "string",
      "text": "string", "position": { "cfi": "string", "page": 0, "percentage": 0.5, "timestamp": 0 },
      "color": "yellow", "tags": ["string"], "createdAt": "date", "updatedAt": "date" }
  ]
}
```

---

### GET /notes
Get all notes for current user.

**Auth:** Yes  
**Query Params:** `page`, `limit`, `bookId` (optional filter)  
**Response (200):** Paginated notes.

---

## Highlights Module

### POST /highlights
Create a highlight.

**Auth:** Yes  
**Request Body:**
```json
{
  "bookId": "string (required)",
  "chapterId": "string (optional)",
  "text": "string (required, max 2000 chars)",
  "color": "string (optional, yellow|green|blue|pink|purple)",
  "position": { "startOffset": 0, "endOffset": 100, "page": 0, "percentage": 0.5 }
}
```
**Response (201):** Created highlight.

---

### DELETE /highlights/:id
Delete a highlight.

**Auth:** Yes  
**Response (200):**
```json
{ "success": true, "message": "Highlight deleted." }
```

---

### GET /highlights/book/:bookId
Get highlights for a book.

**Auth:** Yes  
**Response (200):**
```json
{
  "success": true,
  "data": [
    { "id": "string", "bookId": "string", "chapterId": "string",
      "text": "string", "color": "yellow",
      "position": { "startOffset": 0, "endOffset": 100 },
      "createdAt": "date" }
  ]
}
```

---

### GET /highlights
Get all highlights for current user.

**Auth:** Yes  
**Query Params:** `page`, `limit`, `bookId` (optional filter)  
**Response (200):** Paginated highlights.

---

## Favorites Module

### POST /favorites/toggle
Toggle a book as favorite.

**Auth:** Yes  
**Request Body:**
```json
{
  "bookId": "string (required)"
}
```
**Response (200):**
```json
{
  "success": true,
  "data": { "isFavorited": true },
  "message": "Book added to favorites."
}
```

---

### GET /favorites
Get user's favorite books.

**Auth:** Yes  
**Query Params:** `page`, `limit`  
**Response (200):** Paginated books list.

---

### GET /favorites/check/:bookId
Check if book is favorited.

**Auth:** Yes  
**Response (200):**
```json
{
  "success": true,
  "data": { "isFavorited": true }
}
```

---

## Reviews Module

### POST /reviews
Create a review.

**Auth:** Yes  
**Request Body:**
```json
{
  "bookId": "string (required)",
  "rating": "number (required, 1-5)",
  "title": "string (optional, max 200 chars)",
  "body": "string (optional, max 5000 chars)"
}
```
**Response (201):** Created review.

---

### PUT /reviews/:id
Update a review.

**Auth:** Yes  
**Request Body:**
```json
{
  "rating": "number (optional, 1-5)",
  "title": "string (optional)",
  "body": "string (optional)"
}
```
**Response (200):** Updated review.

---

### DELETE /reviews/:id
Delete a review.

**Auth:** Yes  
**Response (200):**
```json
{ "success": true, "message": "Review deleted." }
```

---

### GET /reviews/book/:bookId
Get reviews for a book.

**Auth:** No  
**Query Params:** `page`, `limit`, `sortBy` (createdAt|rating), `sortOrder`  
**Response (200):**
```json
{
  "success": true,
  "data": {
    "reviews": [
      {
        "id": "string", "userId": "string",
        "user": { "name": "string", "avatar": "string|null" },
        "rating": 4, "title": "string", "body": "string",
        "createdAt": "date", "updatedAt": "date"
      }
    ],
    "pagination": { "page": 1, "limit": 20, "total": 50, "pages": 3 },
    "stats": { "averageRating": 4.2, "totalReviews": 50, "distribution": { "1": 2, "2": 3, "3": 5, "4": 20, "5": 20 } }
  }
}
```

---

### GET /reviews/book/:bookId/rating
Get rating summary for a book.

**Auth:** No  
**Response (200):**
```json
{
  "success": true,
  "data": {
    "averageRating": 4.2,
    "totalReviews": 50,
    "distribution": { "1": 2, "2": 3, "3": 5, "4": 20, "5": 20 }
  }
}
```

---

## Notifications Module

### POST /notifications/send (Admin)
Send notification to users.

**Auth:** Yes (Admin)  
**Request Body:**
```json
{
  "title": "string (required)",
  "body": "string (required)",
  "type": "info|promotion|update|alert (default 'info')",
  "target": "all|premium|active|specific (required)",
  "userIds": ["string (required if target = specific)"],
  "data": {}
}
```
**Response (201):**
```json
{ "success": true, "message": "Notifications sent.", "data": { "sentCount": 0 } }
```

---

### GET /notifications
Get user's notifications.

**Auth:** Yes  
**Query Params:** `page`, `limit`, `unreadOnly` (boolean)  
**Response (200):** Paginated notifications.

---

### PUT /notifications/:id/read
Mark notification as read.

**Auth:** Yes  
**Response (200):**
```json
{ "success": true }
```

---

### PUT /notifications/read-all
Mark all notifications as read.

**Auth:** Yes  
**Response (200):**
```json
{ "success": true, "data": { "updatedCount": 10 } }
```

---

### GET /notifications/unread-count
Get unread notification count.

**Auth:** Yes  
**Response (200):**
```json
{ "success": true, "data": { "count": 5 } }
```

---

### DELETE /notifications/:id
Delete a notification.

**Auth:** Yes  
**Response (200):**
```json
{ "success": true, "message": "Notification deleted." }
```

---

## Devices Module

### POST /devices/register
Register a device.

**Auth:** Yes  
**Request Body:**
```json
{
  "udid": "string (required)",
  "platform": "string (required, ios|android|web)",
  "model": "string (optional)",
  "fcmToken": "string (optional)"
}
```
**Response (201):**
```json
{ "success": true, "data": { "id": "string" }, "message": "Device registered." }
```

---

### GET /devices
Get user's devices.

**Auth:** Yes  
**Response (200):** Array of devices.

---

### DELETE /devices/:id
Delete a device.

**Auth:** Yes  
**Response (200):**
```json
{ "success": true, "message": "Device removed." }
```

---

### PATCH /devices/:deviceUid/fcm-token
Update FCM token.

**Auth:** Yes  
**Request Body:**
```json
{
  "fcmToken": "string (required)"
}
```
**Response (200):**
```json
{ "success": true, "message": "FCM token updated." }
```

---

## Reports Module (Admin)

### GET /reports/dashboard
Get dashboard summary.

**Auth:** Yes (Admin)  
**Response (200):**
```json
{
  "success": true,
  "data": {
    "totalUsers": 1000,
    "activeSubscriptions": 350,
    "totalRevenue": 50000.00,
    "totalBooks": 200,
    "newUsersToday": 15,
    "revenueToday": 250.00,
    "totalAuthors": 80,
    "totalCategories": 25
  }
}
```

---

### GET /reports/revenue
Get revenue report.

**Auth:** Yes (Admin)  
**Query Params:** `period` (daily|weekly|monthly|yearly, default monthly), `fromDate`, `toDate`  
**Response (200):**
```json
{
  "success": true,
  "data": {
    "totalRevenue": 50000.00,
    "periodRevenue": [
      { "date": "2025-01-01", "amount": 1500.00, "count": 50, "method": { "stripe": 800, "chapa": 500, "telebirr": 200 } }
    ],
    "byMethod": { "stripe": 25000, "chapa": 15000, "telebirr": 10000 }
  }
}
```

---

### GET /reports/users
Get user report.

**Auth:** Yes (Admin)  
**Query Params:** `period`, `fromDate`, `toDate`  
**Response (200):**
```json
{
  "success": true,
  "data": {
    "total": 1000,
    "active": 800,
    "suspended": 50,
    "banned": 20,
    "unverified": 130,
    "byMethod": { "email": 600, "phone": 400 },
    "signups": [
      { "date": "2025-01-01", "count": 20 }
    ]
  }
}
```

---

### GET /reports/subscriptions
Get subscription report.

**Auth:** Yes (Admin)  
**Query Params:** `period`, `fromDate`, `toDate`  
**Response (200):**
```json
{
  "success": true,
  "data": {
    "active": 350,
    "canceled": 100,
    "expired": 150,
    "byPlan": [{ "planName": "Basic", "count": 150 }],
    "churnRate": 12.5,
    "conversionRate": 45.0,
    "trend": [{ "date": "2025-01-01", "newSubscriptions": 10, "cancellations": 3 }]
  }
}
```

---

### GET /reports/engagement
Get engagement report.

**Auth:** Yes (Admin)  
**Query Params:** `period`, `fromDate`, `toDate`  
**Response (200):**
```json
{
  "success": true,
  "data": {
    "totalReadingSessions": 5000,
    "totalListeningSessions": 3000,
    "avgReadingTimeMinutes": 25,
    "avgListeningTimeMinutes": 40,
    "completedBooks": 1200,
    "topBooks": [{ "id": "string", "title": "string", "sessions": 500 }],
    "dailyActivity": [{ "date": "2025-01-01", "readers": 200, "listeners": 150 }]
  }
}
```

---

### GET /reports/export/revenue
Export revenue report as CSV.

**Auth:** Yes (Admin)  
**Query Params:** `fromDate`, `toDate`, `format` (csv|pdf, default csv)  
**Response (200):** File download.

---

### GET /reports/export/users
Export user report as CSV.

**Auth:** Yes (Admin)  
**Query Params:** `fromDate`, `toDate`, `format` (csv|pdf, default csv)  
**Response (200):** File download.

---

## History Module

### PUT /history/reading/progress
Update reading progress.

**Auth:** Yes  
**Request Body:**
```json
{
  "bookId": "string (required)",
  "chapterId": "string (optional)",
  "page": "number (optional)",
  "percentage": "number (required, 0-100)",
  "cfi": "string (optional)"
}
```
**Response (200):**
```json
{ "success": true, "message": "Progress updated." }
```

---

### PUT /history/listening/progress
Update listening progress.

**Auth:** Yes  
**Request Body:**
```json
{
  "bookId": "string (required)",
  "chapterId": "string (optional)",
  "timestamp": "number (required, seconds)",
  "duration": "number (required, seconds)",
  "percentage": "number (required, 0-100)"
}
```
**Response (200):**
```json
{ "success": true, "message": "Progress updated." }
```

---

### GET /history/reading
Get reading history.

**Auth:** Yes  
**Query Params:** `page`, `limit`  
**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "string", "bookId": "string",
      "book": { "title": "string", "coverUrl": "string", "authors": [{ "name": "string" }] },
      "percentage": 75, "page": 150, "lastReadAt": "date"
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 50, "pages": 3 }
}
```

---

### GET /history/listening
Get listening history.

**Auth:** Yes  
**Query Params:** `page`, `limit`  
**Response (200):** Same structure as reading with `timestamp` and `duration` instead of `page`.

---

### GET /history/reading/continue
Get continue reading books.

**Auth:** Yes  
**Response (200):**
```json
{
  "success": true,
  "data": [
    { "id": "string", "bookId": "string",
      "book": { "title": "string", "coverUrl": "string" },
      "percentage": 75, "lastReadAt": "date" }
  ]
}
```

---

### GET /history/listening/continue
Get continue listening books.

**Auth:** Yes  
**Response (200):** Same as above with listening-specific fields.

---

### DELETE /history/reading/:id
Delete a reading history entry.

**Auth:** Yes  
**Response (200):**
```json
{ "success": true, "message": "Reading history deleted." }
```

---

### DELETE /history/listening/:id
Delete a listening history entry.

**Auth:** Yes  
**Response (200):**
```json
{ "success": true, "message": "Listening history deleted." }
```

---

### DELETE /history/reading/all
Clear all reading history.

**Auth:** Yes  
**Response (200):**
```json
{ "success": true, "message": "All reading history cleared." }
```

---

### DELETE /history/listening/all
Clear all listening history.

**Auth:** Yes  
**Response (200):**
```json
{ "success": true, "message": "All listening history cleared." }
```

---

## Recommendations Module

### GET /recommendations
Get personalized recommendations.

**Auth:** Yes  
**Query Params:** `limit` (default 10)  
**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "string", "title": "string", "coverUrl": "string",
      "authors": [{ "name": "string" }], "rating": 4.5,
      "reason": "Based on books you read",
      "score": 0.95
    }
  ]
}
```

---

### GET /recommendations/fallback
Get fallback recommendations (no auth required).

**Auth:** No  
**Query Params:** `limit` (default 10)  
**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "string", "title": "string", "coverUrl": "string",
      "authors": [{ "name": "string" }], "rating": 4.5,
      "reason": "Popular on Naik",
      "score": 0.8
    }
  ]
}
```

---

## Common Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed.",
    "details": [
      { "field": "email", "message": "Email is required" }
    ]
  }
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or expired token."
  }
}
```

### 403 Forbidden
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have permission to perform this action."
  }
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Resource not found."
  }
}
```

### 409 Conflict
```json
{
  "success": false,
  "error": {
    "code": "CONFLICT",
    "message": "Resource already exists."
  }
}
```

### 429 Too Many Requests
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many requests. Please try again later.",
    "retryAfter": 60
  }
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred."
  }
}
```

---

## HTTP Status Codes Summary

| Code | Meaning |
|------|---------|
| 200 | OK - Successful GET, PUT, PATCH |
| 201 | Created - Successful POST |
| 204 | No Content - Successful DELETE |
| 400 | Bad Request - Validation error |
| 401 | Unauthorized - Missing/invalid auth |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 409 | Conflict - Resource already exists |
| 429 | Rate Limited - Too many requests |
| 500 | Internal Server Error |
