# Setup Guide — Naik Audio Book & E-Book Platform

> **Phase 41** | Complete setup guide covering development prerequisites, installation, environment variables, API usage, and admin panel usage for the Naik platform.

---

## Table of Contents

1. [Development Prerequisites](#development-prerequisites)
2. [Installation](#installation)
3. [Environment Variables](#environment-variables)
4. [API Usage Guide](#api-usage-guide)
5. [Admin Usage Guide](#admin-usage-guide)

---

## Development Prerequisites

### Required Software

| Component       | Version      | Download / Install                                     |
|-----------------|--------------|--------------------------------------------------------|
| Node.js         | 20.x LTS     | https://nodejs.org (or `nvm install 20`)               |
| npm             | 10.x         | Included with Node.js                                  |
| Flutter         | 3.22+        | https://docs.flutter.dev/get-started/install            |
| PostgreSQL      | 15+          | https://www.postgresql.org/download/                   |
| Redis           | 7+           | https://redis.io/download (or Docker)                  |
| Git             | 2.x          | https://git-scm.com/downloads                          |
| Java (Android)  | 17+          | https://adoptium.net/ (for Android builds)             |
| Xcode (iOS)     | 15+          | Mac App Store (macOS only, for iOS builds)              |
| VS Code         | Latest       | https://code.visualstudio.com/ (recommended IDE)       |
| Docker          | Latest       | https://www.docker.com/products/docker-desktop/        |

### Cloud Services (Development)

| Service                      | Purpose                        | Sign Up                                        |
|------------------------------|--------------------------------|------------------------------------------------|
| Firebase Project             | Auth, Push Notifications       | https://console.firebase.google.com            |
| S3-Compatible Storage        | File storage (covers, audio)   | AWS S3, MinIO (local), or DigitalOcean Spaces  |
| Stripe (Test Mode)           | Payment processing             | https://dashboard.stripe.com/register           |
| SendGrid / SMTP              | Email delivery                 | https://sendgrid.com/ (free tier available)    |
| Sentry (Optional)            | Error tracking                 | https://sentry.io/signup/                      |

### System Dependencies

**Windows**:
```powershell
# Install PostgreSQL (https://www.postgresql.org/download/windows/)
# Enable PostgreSQL service
net start postgresql-x64-15

# Install Redis via WSL or Docker
docker run -d -p 6379:6379 --name redis redis:7
```

**macOS**:
```bash
brew install node@20 postgresql@15 redis
brew services start postgresql@15
brew services start redis
```

**Linux (Ubuntu/Debian)**:
```bash
# Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# PostgreSQL
sudo apt install -y postgresql-15 postgresql-contrib
sudo systemctl start postgresql

# Redis
sudo apt install -y redis-server
sudo systemctl start redis
```

### Verify Installation

```bash
node -v          # Should be v20.x.x
npm -v           # Should be 10.x.x
flutter --version # Should be 3.22.x
psql --version   # Should be 15.x
redis-cli ping   # Should return PONG
git --version    # Should be 2.x
```

---

## Installation

### Step 1: Clone Repository

```bash
git clone https://github.com/your-org/naik-platform.git
cd naik-platform
```

The repository is organized as a monorepo with three main projects:

```
naik-platform/
+-- backend/          # NestJS API server
+-- mobile/           # Flutter mobile app
+-- admin/            # React admin panel
+-- docs/             # Documentation
+-- .github/          # CI/CD workflows
```

### Step 2: Backend Setup

#### 2.1 Create Database

```bash
# Windows (psql shell or pgAdmin)
psql -U postgres
CREATE DATABASE naik_dev;
CREATE USER naik_dev_user WITH PASSWORD 'dev_password';
GRANT ALL PRIVILEGES ON DATABASE naik_dev TO naik_dev_user;
\q

# macOS / Linux
sudo -u postgres createdb naik_dev
sudo -u postgres psql -c "CREATE USER naik_dev_user WITH PASSWORD 'dev_password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE naik_dev TO naik_dev_user;"
```

#### 2.2 Configure Environment

```bash
cd backend
cp .env.example .env
```

Edit `.env` with your local values:

```env
NODE_ENV=development
PORT=4000

DATABASE_URL=postgresql://naik_dev_user:dev_password@localhost:5432/naik_dev
REDIS_URL=redis://localhost:6379

JWT_SECRET=dev-jwt-secret-change-in-production
JWT_REFRESH_SECRET=dev-refresh-secret-change-in-production
JWT_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

S3_PROVIDER=local
S3_ENDPOINT=http://localhost:9000
S3_BUCKET_NAME=naik-dev
S3_REGION=us-east-1
AWS_ACCESS_KEY_ID=minioadmin
AWS_SECRET_ACCESS_KEY=minioadmin

STRIPE_SECRET_KEY=sk_test_xxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxx

FIREBASE_SERVER_KEY=AAAAxxxxxxxx
FIREBASE_PROJECT_ID=naik-dev-12345

SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.xxxxx
SMTP_FROM=noreply@naik.com

FRONTEND_URL=http://localhost:5173

THROTTLE_TTL=60
THROTTLE_LIMIT=100

ADMIN_EMAIL=admin@naik.com
ADMIN_PASSWORD=Admin@123
```

#### 2.3 Install Dependencies

```bash
cd backend
npm install
```

#### 2.4 Database Migration & Seed

```bash
# Run migrations
npx prisma migrate dev

# Optional: Open Prisma Studio to view data
npx prisma studio

# Seed the database (creates admin user, categories, sample books)
npx prisma db seed
```

#### 2.5 Start Development Server

```bash
# Start backend in watch mode
npm run dev

# Server runs at http://localhost:4000
# Swagger docs at http://localhost:4000/api/docs
```

Verify the server is running:

```bash
curl http://localhost:4000/api/health
# Expected: { "success": true, "data": { "status": "healthy", ... } }
```

#### 2.6 Local File Storage (MinIO) — Optional

For local S3-compatible storage without AWS:

```bash
docker run -d -p 9000:9000 -p 9001:9001 \
  -e MINIO_ROOT_USER=minioadmin \
  -e MINIO_ROOT_PASSWORD=minioadmin \
  --name minio \
  quay.io/minio/minio server /data --console-address ":9001"
```

Then create a bucket named `naik-dev` through the MinIO console at http://localhost:9001.

### Step 3: Flutter Mobile App Setup

#### 3.1 Install Flutter Dependencies

```bash
cd mobile
flutter pub get
```

#### 3.2 Firebase Configuration

**Android**:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (or use existing)
3. Add Android app with package name `com.naik.app`
4. Download `google-services.json`
5. Place at `mobile/android/app/google-services.json`

**iOS**:

1. In Firebase Console ? Add iOS app with bundle ID `com.naik.app`
2. Download `GoogleService-Info.plist`
3. Place at `mobile/ios/Runner/GoogleService-Info.plist`
4. Add the file to Xcode project: open `mobile/ios/Runner.xcworkspace` in Xcode, right-click Runner, Add Files to Runner, select `GoogleService-Info.plist`

#### 3.3 Environment Configuration

Create `mobile/lib/env/env.dart`:

```dart
class AppEnvironment {
  static const String apiBaseUrl = 'http://10.0.2.2:4000/api'; // Android emulator
  // For iOS simulator use: 'http://localhost:4000/api'
  // For physical device use your machine's IP

  static const String stripePublishableKey = 'pk_test_xxxxxxxxx';

  static const String appName = 'Naik Dev';

  static const bool enableLogging = true;
}
```

#### 3.4 Run the App

```bash
# Check connected devices
flutter devices

# Run on specific device
flutter run -d <device-id>

# Run on Chrome (web debugging)
flutter run -d chrome
```

### Step 4: Admin Panel Setup

#### 4.1 Configure Environment

```bash
cd admin
cp .env.example .env
```

Edit `.env`:

```env
VITE_API_BASE_URL=http://localhost:4000/api
VITE_APP_NAME=Naik Admin (Dev)
VITE_SENTRY_DSN=
VITE_GOOGLE_ANALYTICS_ID=
VITE_DEFAULT_PAGE_SIZE=20
VITE_MAX_UPLOAD_SIZE=500
VITE_ENABLE_DARK_MODE=true
```

#### 4.2 Install and Run

```bash
cd admin
npm install
npm run dev
# Admin panel runs at http://localhost:5173
```

Login with:
- Email: `admin@naik.com`
- Password: `Admin@123`

---

## Environment Variables

### Backend Environment Variables

| Variable | Description | Required | Default | Example |
|----------|-------------|----------|---------|---------|
| `NODE_ENV` | Runtime environment | Yes | `development` | `production` |
| `PORT` | Server port | No | `4000` | `4000` |
| `DATABASE_URL` | PostgreSQL connection string | Yes | — | `postgresql://user:pass@localhost:5432/naik_db` |
| `REDIS_URL` | Redis connection string | No | `redis://localhost:6379` | `redis://:pass@redis.example.com:6379` |
| `JWT_SECRET` | JWT signing secret (64+ chars) | Yes | — | `openssl rand -hex 64` |
| `JWT_REFRESH_SECRET` | Refresh token secret (64+ chars) | Yes | — | `openssl rand -hex 64` |
| `JWT_EXPIRATION` | Access token TTL | No | `15m` | `5m` |
| `JWT_REFRESH_EXPIRATION` | Refresh token TTL | No | `7d` | `30d` |
| `S3_PROVIDER` | Storage provider (aws/local) | Yes | `aws` | `minio` |
| `AWS_ACCESS_KEY_ID` | S3 access key | Yes* | — | `AKIAIOSFODNN7EXAMPLE` |
| `AWS_SECRET_ACCESS_KEY` | S3 secret key | Yes* | — | `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY` |
| `S3_BUCKET_NAME` | S3 bucket name | Yes | — | `naik-production-assets` |
| `S3_REGION` | S3 region | No | `us-east-1` | `eu-west-1` |
| `S3_ENDPOINT` | S3 endpoint (for MinIO) | No | — | `http://localhost:9000` |
| `STRIPE_SECRET_KEY` | Stripe secret key (sk_) | Yes | — | `sk_live_xxxxxxxxx` |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | Yes | — | `whsec_xxxxxxxxx` |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (pk_) | No | — | `pk_live_xxxxxxxxx` |
| `FIREBASE_SERVER_KEY` | Firebase Cloud Messaging server key | Yes* | — | `AAAAxxxxxxxx` |
| `FIREBASE_PROJECT_ID` | Firebase project identifier | Yes* | — | `naik-app-12345` |
| `SMTP_HOST` | SMTP server host | Yes* | — | `smtp.sendgrid.net` |
| `SMTP_PORT` | SMTP server port | No | `587` | `465` |
| `SMTP_USER` | SMTP username | Yes* | — | `apikey` |
| `SMTP_PASS` | SMTP password | Yes* | — | `SG.xxxxx` |
| `SMTP_FROM` | Sender email address | Yes* | — | `noreply@naik.com` |
| `FRONTEND_URL` | CORS allowed origin | Yes | — | `https://admin.naik.com` |
| `THROTTLE_TTL` | Rate limit window (seconds) | No | `60` | `60` |
| `THROTTLE_LIMIT` | Max requests per window | No | `100` | `200` |
| `ADMIN_EMAIL` | Initial admin seed email | No | `admin@naik.com` | `admin@naik.com` |
| `ADMIN_PASSWORD` | Initial admin seed password | No | — | `Admin@123` |
| `SENTRY_DSN` | Sentry error tracking DSN | No | — | `https://xxx@xxxx.ingest.sentry.io/xxxxx` |
| `LOG_LEVEL` | Logging verbosity | No | `debug` | `info` |
| `CORS_ORIGINS` | Additional CORS origins (comma-separated) | No | — | `https://app.naik.com,https://staging.naik.com` |
| `DEFAULT_PAGE_SIZE` | Default pagination size | No | `20` | `50` |
| `MAX_FILE_SIZE` | Maximum upload size (MB) | No | `500` | `1000` |

### Admin Panel Environment Variables

| Variable | Description | Required | Default | Example |
|----------|-------------|----------|---------|---------|
| `VITE_API_BASE_URL` | Backend API URL | Yes | `http://localhost:4000/api` | `https://api.naik.com/api` |
| `VITE_APP_NAME` | Application display name | No | `Naik Admin` | `Naik Admin (Production)` |
| `VITE_SENTRY_DSN` | Sentry DSN for error tracking | No | — | `https://xxx@xxxx.ingest.sentry.io/xxxxx` |
| `VITE_GOOGLE_ANALYTICS_ID` | Google Analytics measurement ID | No | — | `G-XXXXXXXXXX` |
| `VITE_DEFAULT_PAGE_SIZE` | Default pagination page size | No | `20` | `50` |
| `VITE_MAX_UPLOAD_SIZE` | Max file upload size (MB) | No | `500` | `100` |
| `VITE_ENABLE_DARK_MODE` | Enable dark mode toggle | No | `true` | `false` |

### Flutter App Configuration

Configured directly in code at `mobile/lib/env/env.dart`:

| Variable | Description | Example |
|----------|-------------|---------|
| `apiBaseUrl` | Backend API base URL | `https://api.naik.com/api` |
| `stripePublishableKey` | Stripe publishable key | `pk_live_xxxxxxxxx` |
| `appName` | App display name | `Naik` |
| `enableLogging` | Enable debug logging | `false` |
| `sentryDsn` | Sentry DSN | `https://xxx@xxxx.ingest.sentry.io/xxxxx` |
| `appVersion` | App version from pubspec | `1.0.0+1` |

---

## API Usage Guide

### Authentication Flow

Naik uses JWT-based authentication with access and refresh tokens.

#### 1. Sign Up

```http
POST /api/auth/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "StrongPass1!",
  "name": "John Doe"
}
```

**Response** (201):
```json
{
  "success": true,
  "data": {
    "message": "Account created. Please verify your email.",
    "verificationToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

#### 2. Verify Email

```http
POST /api/auth/verify-email
Content-Type: application/json

{
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "message": "Email verified successfully."
  }
}
```

#### 3. Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "StrongPass1!"
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "user-uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "USER",
      "isVerified": true
    }
  }
}
```

#### 4. Use Access Token

Include `accessToken` in the `Authorization` header for all authenticated requests:

```http
GET /api/books
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

#### 5. Refresh Token

When the access token expires (after 15 minutes), use the refresh token to get a new pair:

```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### Pagination

List endpoints support pagination with `page` and `limit` query parameters:

```http
GET /api/books?page=1&limit=20
Authorization: Bearer <token>
```

**Response**:
```json
{
  "success": true,
  "data": [
    { "id": "book-1", "title": "Book Title", ... }
  ],
  "meta": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "totalPages": 8,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

### Error Response Format

All API errors follow a consistent format:

```json
{
  "success": false,
  "message": "Human-readable error message",
  "errors": [
    {
      "field": "email",
      "message": "Email is required"
    }
  ],
  "statusCode": 400,
  "timestamp": "2025-01-15T10:30:00Z",
  "path": "/api/auth/signup"
}
```

Common HTTP status codes:
| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (missing/invalid token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 409 | Conflict (duplicate resource) |
| 422 | Unprocessable Entity |
| 429 | Too Many Requests (rate limited) |
| 500 | Internal Server Error |

### Rate Limits

| Endpoint Group | Limit | Window |
|----------------|-------|--------|
| Auth (login, signup) | 10 requests | 15 minutes |
| General API | 100 requests | 60 seconds |
| File Upload | 20 requests | 60 seconds |

Rate limit headers are included in responses:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1705312800
```

### Example: Fetching Books

```javascript
// Using fetch in JavaScript
const API_BASE = 'https://api.naik.com/api';

async function getBooks() {
  const response = await fetch(`${API_BASE}/books?page=1&limit=20`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }

  return response.json();
}

// Using axios
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://api.naik.com/api',
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor for auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');
      const { data } = await api.post('/auth/refresh', { refreshToken });
      localStorage.setItem('accessToken', data.data.accessToken);
      localStorage.setItem('refreshToken', data.data.refreshToken);
      originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`;
      return api(originalRequest);
    }
    return Promise.reject(error);
  }
);
```

### API Endpoints Overview

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/signup` | No | Register new user |
| POST | `/api/auth/verify-email` | No | Verify email address |
| POST | `/api/auth/login` | No | Login with credentials |
| POST | `/api/auth/refresh` | No | Refresh access token |
| POST | `/api/auth/logout` | Yes | Logout (invalidate refresh token) |
| GET | `/api/auth/me` | Yes | Get current user profile |
| PUT | `/api/auth/me` | Yes | Update profile |
| PUT | `/api/auth/change-password` | Yes | Change password |
| GET | `/api/books` | No | List books (paginated) |
| GET | `/api/books/:id` | No | Get book details |
| POST | `/api/books` | Admin | Create a book |
| PUT | `/api/books/:id` | Admin | Update a book |
| DELETE | `/api/books/:id` | Admin | Delete a book |
| GET | `/api/books/search` | No | Search books |
| GET | `/api/categories` | No | List categories |
| POST | `/api/purchases` | Yes | Purchase a book |
| GET | `/api/purchases` | Yes | List user purchases |
| POST | `/api/subscriptions` | Yes | Create subscription |
| GET | `/api/subscriptions/plans` | No | List subscription plans |
| GET | `/api/subscriptions/active` | Yes | Get active subscription |
| POST | `/api/coupons/validate` | No | Validate coupon code |
| POST | `/api/payments/create-intent` | Yes | Create Stripe payment intent |
| POST | `/api/payments/webhook` | No | Stripe webhook (raw body) |
| GET | `/api/users` | Admin | List users (paginated) |
| PUT | `/api/users/:id/block` | Admin | Block/unblock user |
| POST | `/api/notifications/send` | Admin | Send push notification |
| GET | `/api/reports/revenue` | Admin | Revenue report |
| GET | `/api/admin/dashboard` | Admin | Dashboard statistics |
| GET | `/api/health` | No | Health check |

---

## Admin Usage Guide

### Logging In

1. Navigate to `https://admin.naik.com` (or `http://localhost:5173` for local)
2. Sign in with your admin credentials:
   - Dev default: `admin@naik.com` / `Admin@123`
3. You will see the dashboard with key metrics:
   - Total users, books, revenue, active subscriptions
   - Revenue chart (last 30 days)
   - Recent transactions
   - Popular categories

### 1. Creating a Book

#### Step 1: Navigate to Books

Click **Books** in the left sidebar, then click **Add New Book** button.

#### Step 2: Fill Book Details

| Field | Required | Description |
|-------|----------|-------------|
| Title | Yes | Book title (max 200 characters) |
| Description | Yes | Book description/synopsis (min 10, max 5000 characters) |
| ISBN | No | International Standard Book Number |
| Price | Yes | Price in USD (0.01 to 999.99) |
| Categories | Yes | Select 1-5 categories (Fiction, Non-Fiction, Mystery, etc.) |
| Authors | Yes | Select 1-5 authors (or create new authors) |
| Publisher | No | Publisher name |
| Language | Yes | Book language (English, Spanish, etc.) |
| Page Count | No | Number of pages (for e-books) |
| Duration | No | Audio duration in minutes (for audio books) |
| Age Rating | No | Age rating (All, 12+, 16+, 18+) |
| Tags | No | Comma-separated tags for search |

#### Step 3: Upload Cover Image

- Click on the **Cover Image** upload area
- Select an image file (JPEG/PNG, max 10MB, recommended 1200x1800px)
- A preview will appear after selection
- Crop/adjust if needed

#### Step 4: Upload Audio File (for audio books)

- Click **Upload Audio File**
- Supported formats: MP3, M4A, OGG, WAV
- Max file size: 500MB
- A progress bar shows upload status
- Optionally set chapter markers

#### Step 5: Upload E-Book File (for e-books)

- Click **Upload E-Book File**
- Supported formats: PDF, EPUB, MOBI
- Max file size: 100MB

#### Step 6: Configure Book Settings

- **Visibility**: Published (visible to users) or Draft (hidden)
- **Featured**: Show on home page carousel
- **Free**: Mark as free (price becomes $0.00)
- **Subscription Only**: Available only to subscribers
- **Preview Pages**: Number of free preview pages (e-books)
- **Preview Duration**: Free preview duration in minutes (audio books)

#### Step 7: Save

Click **Create Book**. The book will appear in the books list. You can edit or delete it from the list view.

### 2. Managing Users

#### View Users

1. Click **Users** in the left sidebar
2. Table shows: name, email, role, status, registration date, last login
3. Use the search bar to find users by name or email
4. Use filters: role (User/Author/Admin), status (Active/Blocked/Unverified)

#### Block/Unblock a User

1. Find the user in the list
2. Click the three-dot menu (or right-click)
3. Select **Block User** or **Unblock User**
4. Optionally enter a reason for the block (visible to user on login)
5. Confirm

#### Reset User Password

1. Find the user in the list
2. Click **Reset Password** from the actions menu
3. Enter a new password (must meet strength requirements)
4. Click **Send Reset Link** (user receives email) or **Force Reset** (immediate)

#### Edit User Details

1. Click on the user's name or row
2. Edit fields: name, email, role, phone number
3. Click **Save Changes**

### 3. Creating Subscription Plans

1. Navigate to **Subscriptions** ? **Plans**
2. Click **Add New Plan**
3. Fill in:
   - **Name**: e.g., "Monthly Premium", "Annual Basic"
   - **Description**: What the plan includes
   - **Price**: Monthly or yearly price
   - **Billing Interval**: Monthly / Yearly / Quarterly
   - **Trial Period**: Days of free trial (0 for none)
   - **Features**: Checkboxes for:
     - Unlimited audio streaming
     - Unlimited e-book access
     - Offline downloads
     - Ad-free experience
     - Early access to new releases
   - **Max Devices**: Number of simultaneous devices (e.g., 3)
   - **Status**: Active / Inactive
4. Click **Create Plan**

The plan will appear on the mobile app's subscription screen.

### 4. Creating Coupon Codes

1. Navigate to **Marketing** ? **Coupons**
2. Click **Create Coupon**
3. Fill in:
   - **Code**: e.g., `SUMMER2025` (auto-generate option available)
   - **Discount Type**: Percentage (e.g., 20% off) or Fixed Amount (e.g., $10 off)
   - **Discount Value**: e.g., `20` for 20%, or `10` for $10
   - **Min Order Value**: Minimum cart value to apply (0 for no minimum)
   - **Max Usage Count**: Total number of times this coupon can be used (0 for unlimited)
   - **Max Uses Per User**: How many times a single user can use it (default: 1)
   - **Applies To**: All books / Specific categories / Specific books
   - **Start Date**: When the coupon becomes active
   - **Expiry Date**: When the coupon expires
   - **Status**: Active / Inactive
4. Click **Create Coupon**

### 5. Sending Push Notifications

1. Navigate to **Notifications** ? **Send Notification**
2. Configure:
   - **Title**: Notification title (max 50 chars)
   - **Body**: Notification message (max 200 chars)
   - **Target Audience**:
     - All Users
     - Active Subscribers
     - Users with specific role
     - Users who purchased specific book
     - Custom segment (by tags)
   - **Platform**: Android / iOS / Both
   - **Deep Link**: Optional URL to open when tapped:
     - `naik://open/book/{id}` ? Opens book detail
     - `naik://open/subscription` ? Opens subscription page
     - `naik://open/promotion` ? Opens promotion page
   - **Schedule**: Send now or schedule for later
   - **Image**: Optional notification image (icon or banner)
3. Click **Preview** to see how it looks on mobile
4. Click **Send Notification**

### 6. Exporting Reports

1. Navigate to **Reports**
2. Available reports:
   - **Revenue Report**: Daily/monthly/yearly revenue, MRR, ARR
   - **User Report**: New users, active users, churn rate
   - **Book Report**: Most popular books, categories, authors
   - **Subscription Report**: Subscriber growth, plan distribution, cancellations
   - **Coupon Report**: Coupon usage, discount amounts
   - **Transaction Report**: All transactions with filters
3. Set date range (presets: Today, Last 7 days, Last 30 days, This Month, Last Month, Custom)
4. Click **Generate Report**
5. Export options: CSV (.csv), Excel (.xlsx), PDF (.pdf)
6. Reports are also sent to your email if you select **Email Report**

### 7. Managing Admin Roles and Permissions

#### View Admin Users

1. Navigate to **Settings** ? **Admin Users**
2. List of all admin accounts with their roles

#### Create Admin User

1. Click **Add Admin**
2. Enter email of existing user
3. Select role:
   - **Super Admin**: Full access to everything
   - **Admin**: Access to all management features except billing
   - **Editor**: Can manage books, categories, authors
   - **Support**: Can view users and subscriptions, send notifications
   - **Analyst**: Read-only access to reports and dashboard
4. The user receives an email notification about their new admin access

#### Custom Permission Sets

Instead of predefined roles, you can create custom permission sets:

1. Click **Create Permission Set**
2. Name it (e.g., "Marketing Manager")
3. Toggle individual permissions:
   - Books: Create / Read / Update / Delete
   - Users: View / Block / Reset Password
   - Subscriptions: View / Create Plans / Edit Plans
   - Coupons: Create / Edit / Delete
   - Notifications: Send
   - Reports: View / Export
   - Settings: View / Edit
4. Assign this permission set to admin users

#### Audit Log

All admin actions are logged and visible in **Settings** ? **Audit Log**:
- Date/time of action
- Admin user who performed action
- Action description (e.g., "Updated book 'The Great Gatsby' price from $12.99 to $14.99")
- IP address
- Status (Success / Failed)

---

## Common Development Tasks

### Running the Full Stack Locally

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Admin Panel
cd admin
npm run dev

# Terminal 3: Mobile (optional)
cd mobile
flutter run

# Terminal 4: Redis + PostgreSQL (if using Docker)
docker-compose up -d
```

### Accessing Services

| Service | URL |
|---------|-----|
| Backend API | http://localhost:4000/api |
| Swagger Docs | http://localhost:4000/api/docs |
| Admin Panel | http://localhost:5173 |
| Prisma Studio | http://localhost:5555 |
| MinIO Console | http://localhost:9001 |
| PostgreSQL | localhost:5432 |
| Redis | localhost:6379 |

### Common Commands

```bash
# Backend
cd backend
npm run dev        # Start dev server with hot reload
npm run build      # Production build
npm run start:prod # Start production server
npm run lint       # Run ESLint
npm run format     # Run Prettier
npx prisma studio  # Open Prisma Studio
npx prisma migrate dev --name add-book-table # Create migration
npx prisma generate # Regenerate Prisma client

# Flutter
cd mobile
flutter pub get              # Install dependencies
flutter pub upgrade          # Upgrade dependencies
flutter run                  # Run on connected device
flutter build appbundle      # Build Android AAB
flutter build ios            # Build iOS
flutter analyze              # Static analysis
flutter clean                # Clean build cache
flutter test                 # Run tests

# Admin
cd admin
npm run dev        # Dev server
npm run build      # Production build
npm run preview    # Preview production build
npm run lint       # Lint check
npm run typecheck  # TypeScript check
npm run test       # Run tests
```

### Troubleshooting

| Issue | Solution |
|-------|----------|
| `prisma: error: Migration` | Run `npx prisma migrate dev --name init` to reset |
| Database connection refused | Ensure PostgreSQL is running: `sudo systemctl start postgresql` |
| Redis connection refused | Ensure Redis is running: `sudo systemctl start redis` or `docker start redis` |
| Flutter build fails | Run `flutter clean && flutter pub get` |
| Port 4000 already in use | Kill process: `lsof -ti:4000 | xargs kill -9` (macOS/Linux) or `netstat -ano | findstr :4000` (Windows) |
| Admin panel network error | Ensure backend is running and CORS is configured correctly |
| File upload fails | Check MinIO/AWS S3 credentials and bucket permissions |
| Stripe payment fails | Use test keys (`sk_test_...`). Check webhook endpoint is configured in Stripe dashboard. |
| SMTP emails not sending | Check SendGrid API key. Check spam folder. |
| `flutter pub get` fails | Check internet connection. Try clearing cache: `flutter pub cache repair` |
