# Deployment Guide — Naik Audio Book & E-Book Platform

> **Phase 39** | Complete production deployment guide covering backend (Express/EC2), admin panel (Vercel/Netlify/S3+CF), mobile apps (Android/iOS stores), and CI/CD pipeline.

> **Stack facts (this repo):** Express 4 on Node 22 (port **3000**, prefix `/api/v1`), PostgreSQL 18 via Prisma 5 (`npx prisma migrate deploy` — do NOT use `migrate dev`), React+Vite admin at `bariisaa.com` domains, Flutter mobile. Health endpoint is **`GET /health`** → `{"status":"ok"}`. API docs at **`/api/v1/docs`**. Redis is **not required** by the current stack (in-memory rate limiting); treat Redis/Sentry/Datadog sections below as optional hardening. Domains: `api.bariisaa.com` (prod), `staging-api.bariisaa.com` (staging).

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Backend Deployment (Ubuntu/AWS EC2)](#backend-deployment-ubuntuaws-ec2)
3. [Admin Panel Deployment](#admin-panel-deployment)
4. [Mobile Deployment](#mobile-deployment)
5. [CI/CD Pipeline](#cicd-pipeline)
6. [Scaling](#scaling)

---

## Prerequisites

### Software Requirements

| Component     | Version    | Purpose                              |
|---------------|------------|--------------------------------------|
| Node.js       | 20.x LTS   | Backend Express runtime               |
| PostgreSQL    | 15+        | Primary database                     |
| Redis         | 7+         | Caching, rate limiting, queues       |
| Nginx         | 1.24+      | Reverse proxy, SSL termination       |
| PM2           | 5.x        | Node.js process manager              |
| Flutter       | 3.22+      | Mobile app build                     |
| Java (JDK)    | 17+        | Android build                        |
| Xcode         | 15+        | iOS build (macOS only)               |

### Cloud Services

| Service                  | Purpose                        | Cost Estimate (Monthly) |
|--------------------------|--------------------------------|-------------------------|
| AWS EC2 (t3.medium)      | Backend server                 | ~$30                    |
| AWS RDS (db.t3.medium)   | Managed PostgreSQL             | ~$50                    |
| AWS ElastiCache          | Redis caching                  | ~$15                    |
| AWS S3                   | File storage (covers, audio)   | ~$5 (per GB)            |
| CloudFront               | CDN for media delivery         | ~$10 (per TB)           |
| Firebase (Spark/Blaze)   | Push notifications, auth       | Free-$25                |
| Vercel / Netlify         | Admin panel hosting            | Free-Pro                |
| Domain + SSL             | Custom domain, cert            | ~$15/yr                 |
| Google Play Dev Account  | Android store listing          | $25 (one-time)          |
| Apple Developer Program  | iOS store listing              | $99/yr                  |
| Sentry                   | Error tracking                 | Free-$26                |
| Datadog                  | Monitoring                     | Free-$15                |

### Environment Variables to Prepare

Before deploying, gather these values:
- `DATABASE_URL` — PostgreSQL connection string
- `REDIS_URL` — Redis connection string
- `JWT_SECRET` / `JWT_REFRESH_SECRET` — Random 64-char hex strings
- `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` — S3 credentials
- `S3_BUCKET_NAME` / `S3_REGION` — Bucket configuration
- `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` — Payment processing
- `FIREBASE_SERVER_KEY` / `FIREBASE_PROJECT_ID` — Push notifications
- `SENTRY_DSN` — Error monitoring
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` — Initial admin credentials
- `FRONTEND_URL` — CORS allowed origin
- `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` — Email delivery
- `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` — Image optimization (optional)

---

## Backend Deployment (Ubuntu/AWS EC2)

### 1. System Setup

Launch an Ubuntu 22.04 LTS EC2 instance (t3.medium or larger). SSH into it:

```bash
ssh -i your-key.pem ubuntu@your-instance-ip
```

Update system packages:

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git nginx certbot python3-certbot-nginx build-essential
```

### 2. Install Node.js 20

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v   # Should show v20.x.x
npm -v    # Should show 10.x.x
```

### 3. Install and Configure PostgreSQL 15

```bash
sudo apt install -y postgresql-15 postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql -c "CREATE USER naik_user WITH PASSWORD 'your_strong_password';"
sudo -u postgres psql -c "CREATE DATABASE naik_db OWNER naik_user;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE naik_db TO naik_user;"

# Allow password authentication
sudo sed -i 's/local   all             all                                     peer/local   all             all                                     md5/' /etc/postgresql/15/main/pg_hba.conf
sudo systemctl restart postgresql
```

### 4. Install Redis

```bash
sudo apt install -y redis-server
sudo systemctl start redis
sudo systemctl enable redis
redis-cli ping   # Should return PONG
```

### 5. Clone Repository and Setup Backend

```bash
sudo mkdir -p /opt/naik
sudo chown -R ubuntu:ubuntu /opt/naik
cd /opt/naik

git clone https://github.com/your-org/naik-backend.git backend
cd backend

# Install dependencies
npm ci

# Create environment file
cp .env.example .env
nano .env   # Fill in all values
```

### 6. Environment Configuration

Contents of `/opt/naik/backend/.env`:

```env
# Server
NODE_ENV=production
PORT=3000

# Database
DATABASE_URL=postgresql://naik_user:your_strong_password@localhost:5432/naik_db

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=<generate: openssl rand -hex 64>
JWT_REFRESH_SECRET=<generate: openssl rand -hex 64>
JWT_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# S3 / File Storage
S3_PROVIDER=aws
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
S3_BUCKET_NAME=naik-production-assets
S3_REGION=us-east-1
S3_ENDPOINT=https://s3.amazonaws.com

# Payment
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Firebase Cloud Messaging
FIREBASE_SERVER_KEY=AAAA...
FIREBASE_PROJECT_ID=naik-app-12345

# Email
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG....
SMTP_FROM=noreply@bariisaa.com

# Frontend
FRONTEND_URL=https://admin.bariisaa.com

# Monitoring
SENTRY_DSN=https://xxx@xxxx.ingest.sentry.io/xxxxx

# Rate Limiting
THROTTLE_TTL=60
THROTTLE_LIMIT=100

# Admin Seed
ADMIN_EMAIL=admin@bariisaa.com
ADMIN_PASSWORD=<strong-password>
```

### 7. Build and Run Migrations

```bash
cd /opt/naik/backend
npm run build

# Run database migrations
npx prisma migrate deploy

# Seed initial data (admin user, categories, etc.)
npx prisma db seed

# Verify database
npx prisma studio   # Optional: check data in browser
```

### 8. PM2 Process Manager

Install PM2 globally:

```bash
npm install -g pm2
```

Create PM2 ecosystem configuration:

`/opt/naik/backend/ecosystem.config.js`:

```js
module.exports = {
  apps: [
    {
      name: 'naik-backend',
      script: 'dist/main.js',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
      },
      env_file: '.env',
      max_memory_restart: '500M',
      error_file: 'logs/err.log',
      out_file: 'logs/out.log',
      log_file: 'logs/combined.log',
      time: true,
      autorestart: true,
      watch: false,
      max_restarts: 10,
      restart_delay: 5000,
    },
  ],
};
```

Start the application:

```bash
cd /opt/naik/backend
pm2 start ecosystem.config.js
pm2 save
pm2 startup   # Follow instructions to enable PM2 on boot
```

### 9. Nginx Reverse Proxy

Create Nginx configuration:

`/etc/nginx/sites-available/naik`:

```nginx
server {
    listen 80;
    server_name api.bariisaa.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.bariisaa.com;

    # SSL certificates (managed by Certbot)
    ssl_certificate /etc/letsencrypt/live/api.bariisaa.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.bariisaa.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;
    ssl_session_tickets off;

    # HSTS
    add_header Strict-Transport-Security "max-age=63072000" always;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Max upload size (for audio files)
    client_max_body_size 500M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }

    # Health check endpoint (no auth)
    location /health {
        proxy_pass http://127.0.0.1:3000/health;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Static file serving for uploads
    location /uploads/ {
        alias /opt/naik/backend/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    access_log /var/log/nginx/naik-access.log;
    error_log /var/log/nginx/naik-error.log;
}
```

Enable the site and restart Nginx:

```bash
sudo ln -sf /etc/nginx/sites-available/naik /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 10. SSL Certificate with Certbot

```bash
sudo certbot --nginx -d api.bariisaa.com --non-interactive --agree-tos -m admin@bariisaa.com

# Verify auto-renewal
sudo certbot renew --dry-run
```

### 11. Firewall Configuration

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status
```

### 12. Health Check Verification

```bash
# Test local health
curl http://localhost:3000/health

# Test via Nginx
curl https://api.bariisaa.com/health

# Expected response:
# {
#   "status": "ok",
#   "timestamp": "2026-10-09T10:30:00.000Z"
# }
```

### 13. Monitoring Setup

```bash
# Install Sentry CLI
npm install -g @sentry/cli

# Setup Datadog agent (if using Datadog)
DD_API_KEY=your_api_key bash -c "$(curl -L https://s3.amazonaws.com/dd-agent/scripts/install_script.sh)"

# Restart PM2 with monitoring
pm2 restart naik-backend
pm2 monit   # Real-time monitoring in terminal
```

---

## Admin Panel Deployment

### Build with Vite

```bash
cd admin

# Create production .env file
cat > .env.production << 'EOF'
VITE_API_BASE_URL=https://api.bariisaa.com
VITE_APP_NAME=Naik Admin
VITE_SENTRY_DSN=https://xxx@xxxx.ingest.sentry.io/xxxxx
VITE_GOOGLE_ANALYTICS_ID=G-XXXXXXX
VITE_DEFAULT_PAGE_SIZE=20
VITE_MAX_UPLOAD_SIZE=500
VITE_ENABLE_DARK_MODE=true
EOF

# Build
npm ci
npm run build   # Output in dist/
```

### Option A: Deploy to Vercel

Create `vercel.json` in admin root:

```json
{
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm ci",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    },
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" }
      ]
    }
  ],
  "env": {
    "VITE_API_BASE_URL": "https://api.bariisaa.com",
    "VITE_APP_NAME": "Naik Admin"
  }
}
```

Deploy:

```bash
# Via Vercel CLI
npm i -g vercel
vercel --prod

# Or connect GitHub repo directly via Vercel dashboard:
# 1. Go to vercel.com/new
# 2. Import your GitHub repo
# 3. Set framework to Vite
# 4. Add environment variables
# 5. Deploy
```

### Option B: Deploy to Netlify

Create `netlify.toml` in admin root:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "20"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Content-Security-Policy = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' https: data: blob:; font-src 'self' data:; connect-src 'self' https://api.bariisaa.com https://sentry.io;"

[context.production.environment]
  VITE_API_BASE_URL = "https://api.bariisaa.com"
  VITE_APP_NAME = "Naik Admin"
```

Deploy:

```bash
# Via Netlify CLI
npm i -g netlify-cli
netlify deploy --prod --dir=dist

# Or connect GitHub repo via Netlify dashboard:
# 1. Go to app.netlify.com
# 2. Import from Git
# 3. Set build command to "npm run build"
# 4. Set publish directory to "dist"
# 5. Add environment variables
# 6. Deploy
```

### Option C: Deploy to S3 + CloudFront

Create an S3 bucket and configure for static website hosting:

```bash
# Create bucket (must be globally unique)
aws s3 mb s3://naik-admin-panel --region us-east-1

# Block public access (CloudFront will access via Origin Access Control)
aws s3api put-public-access-block \
  --bucket naik-admin-panel \
  --public-access-block-configuration "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"

# Upload built files
aws s3 sync dist/ s3://naik-admin-panel/ --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

CloudFront distribution settings:
- Origin: S3 bucket `naik-admin-panel`
- Origin Access: OAC (Origin Access Control)
- Viewer Protocol Policy: Redirect HTTP to HTTPS
- Cache Policy: CachingOptimized
- Error Pages: 404 → /index.html (200), 403 → /index.html (200)
- Price Class: Use Only North America and Europe (reduce cost)
- Alternate Domain Name: admin.bariisaa.com
- SSL Certificate: ACM certificate in us-east-1

---

## Mobile Deployment

### Android Deployment

#### 1. Generate Keystore

```bash
cd mobile/android

# Generate upload keystore
keytool -genkey -v -keystore naik-keystore.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias naik-upload-key \
  -storepass <your-store-password> \
  -keypass <your-key-password>

# Output: naik-keystore.jks (keep this safe! Never commit to git.)
```

#### 2. Configure Signing

Create `mobile/android/key.properties`:

```properties
storeFile=naik-keystore.jks
storePassword=<your-store-password>
keyPassword=<your-key-password>
keyAlias=naik-upload-key
```

Add signing config to `mobile/android/app/build.gradle`:

```gradle
def keystoreProperties = new Properties()
def keystorePropertiesFile = rootProject.file('key.properties')
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

android {
    // ... existing config ...

    signingConfigs {
        release {
            keyAlias keystoreProperties['keyAlias']
            keyPassword keystoreProperties['keyPassword']
            storeFile keystoreProperties['storeFile'] ? file(keystoreProperties['storeFile']) : null
            storePassword keystoreProperties['storePassword']
        }
    }

    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

#### 3. Configure App

`mobile/android/app/src/main/AndroidManifest.xml`:

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.naik.app">
    
    <uses-permission android:name="android.permission.INTERNET"/>
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE"/>
    
    <!-- Deep linking -->
    <intent-filter android:autoVerify="true">
        <action android:name="android.intent.action.VIEW"/>
        <category android:name="android.intent.category.DEFAULT"/>
        <category android:name="android.intent.category.BROWSABLE"/>
        <data android:scheme="https" android:host="bariisaa.com"/>
        <data android:scheme="naik" android:host="open"/>
    </intent-filter>
    
    <application
        android:label="Naik"
        android:name="${applicationName}"
        android:icon="@mipmap/ic_launcher"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:allowBackup="false"
        android:theme="@style/LaunchTheme"
        android:networkSecurityConfig="@xml/network_security_config">
        
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:launchMode="singleTask"
            android:screenOrientation="portrait"
            android:showWhenLocked="true"
            android:turnScreenOn="true"
            android:theme="@style/LaunchTheme"
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|smallestScreenSize|locale|layoutDirection|fontScale|screenLayout|density|uiMode"
            android:hardwareAccelerated="true"
            android:windowSoftInputMode="adjustResize">
            
            <meta-data
                android:name="io.flutter.embedding.android.NormalTheme"
                android:resource="@style/NormalTheme"/>
                
            <intent-filter>
                <action android:name="android.intent.action.MAIN"/>
                <category android:name="android.intent.category.LAUNCHER"/>
            </intent-filter>
        </activity>
        
        <!-- DRM: Disable screenshots -->
        <meta-data
            android:name="flutter.secureScreen"
            android:value="true"/>
    </application>
</manifest>
```

#### 4. Build AAB

```bash
cd mobile

# Clean
flutter clean

# Get packages
flutter pub get

# Generate Firebase config (from Firebase Console -> Android app -> Download google-services.json)
# Place at: mobile/android/app/google-services.json

# Build release AAB
flutter build appbundle --release

# Output: mobile/build/app/outputs/bundle/release/app-release.aab
```

#### 5. Play Console Upload

1. Go to [Google Play Console](https://play.google.com/console/)
2. Create new app: **Naik** — Books & Reference category
3. Complete store listing (see STORE_SUBMISSION.md)
4. Go to **Production** → **Create new release**
5. Upload `app-release.aab`
6. Fill in release notes
7. Review and roll out

#### 6. Release Track Management

| Track    | Purpose                          | Rollout % |
|----------|----------------------------------|-----------|
| Internal | Team testing (up to 100 testers) | 100%      |
| Alpha    | Early testers                    | 20%       |
| Beta     | Public beta testers              | 50%       |
| Production | Full release                   | 100% staged |

**Track promotion flow**: Internal → Alpha → Beta → Production (staged: 10% → 50% → 100%)

### iOS Deployment

#### 1. Prerequisites

- macOS with Xcode 15+
- Apple Developer Program membership ($99/year)
- iPhone / iPad running iOS 16+ for testing

#### 2. App Store Connect Setup

1. Go to [App Store Connect](https://appstoreconnect.apple.com/)
2. Create new app: **Naik** — Books category
3. Fill in basic information:
   - Name: Naik
   - Primary Language: English
   - Bundle ID: com.naik.app
   - SKU: NAIK_001

#### 3. Configure Xcode Project

```bash
cd mobile/ios

# Install CocoaPods dependencies
pod install

# Open workspace in Xcode
open Runner.xcworkspace
```

In Xcode:
1. Select **Runner** target → **Signing & Capabilities**
2. Set Team to your Apple Developer account
3. Bundle Identifier: `com.naik.app`
4. Enable capabilities:
   - Push Notifications
   - Background Modes (Remote notifications)
   - Associated Domains (`applinks:bariisaa.com`, `naik://open`)

#### 4. Generate App Icon

Use `flutter_launcher_icons` package:

```yaml
# pubspec.yaml
dev_dependencies:
  flutter_launcher_icons: ^0.13.1

flutter_launcher_icons:
  android: true
  ios: true
  image_path: "assets/icons/app-icon.png"
  adaptive_icon_background: "#1A1A2E"
  adaptive_icon_foreground: "assets/icons/app-icon-foreground.png"
```

```bash
flutter pub get
flutter pub run flutter_launcher_icons
```

#### 5. Firebase iOS Setup

1. In Firebase Console → Add iOS app with bundle ID `com.naik.app`
2. Download `GoogleService-Info.plist`
3. Place at `mobile/ios/Runner/GoogleService-Info.plist`
4. Add to Xcode project (drag and drop into Runner)

#### 6. Build and Upload via Xcode

1. In Xcode: Product → Archive
2. Once archive completes, Organizer window opens
3. Select the archive → **Distribute App**
4. Choose **App Store Connect** → **Upload**
5. Configure signing automatically
6. Wait for validation and upload

#### 7. Alternative: Upload via Transporter

```bash
# Build the .ipa
cd mobile
flutter build ios --release --no-codesign

# Create IPA with xcodebuild
cd ios
xcodebuild -workspace Runner.xcworkspace -scheme Runner -sdk iphoneos -configuration Release archive -archivePath build/Runner.xcarchive
xcodebuild -exportArchive -archivePath build/Runner.xcarchive -exportPath build/ -exportOptionsPlist ExportOptions.plist

# Open Transporter app, drag the .ipa, upload
```

**ExportOptions.plist**:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>method</key>
    <string>app-store</string>
    <key>teamID</key>
    <string>YOUR_TEAM_ID</string>
    <key>uploadSymbols</key>
    <true/>
    <key>destination</key>
    <string>upload</string>
    <key>signingStyle</key>
    <string>automatic</string>
</dict>
</plist>
```

#### 8. TestFlight

1. In App Store Connect → App → TestFlight
2. Enable TestFlight beta testing
3. Add internal testers (up to 100 users by email)
4. Optionally enable public link for external testing
5. External builds require Beta App Review

#### 9. Submit for Review

1. In App Store Connect → App → iOS App → Prepare for Submission
2. Complete all metadata:
   - Screenshots (all required sizes)
   - App icon
   - Description
   - Keywords
   - Support URL
   - Marketing URL
   - Privacy Policy URL
3. Build selection → Select the uploaded build
4. App Review Information:
   - Sign-in credentials: `admin@bariisaa.com` / `Admin@123`
   - Contact: `support@bariisaa.com` / `+1-555-0123`
   - Notes: "Demo account has full access to all features"
5. Submit for Review

### Firebase Cloud Messaging Setup

#### Android

```bash
# In Firebase Console -> Project Settings -> Cloud Messaging
# Note: Server Key and Sender ID

cd mobile/android
# google-services.json should already be in place
```

#### iOS

```bash
# In Firebase Console -> Project Settings -> Cloud Messaging
# Upload APNs Authentication Key (.p8 file)

# Alternatively upload APNs certificate (.p12)
```

### Deep Linking Configuration

#### Android

`mobile/android/app/src/main/AndroidManifest.xml`:

```xml
<intent-filter android:autoVerify="true">
    <action android:name="android.intent.action.VIEW"/>
    <category android:name="android.intent.category.DEFAULT"/>
    <category android:name="android.intent.category.BROWSABLE"/>
    <data android:scheme="https" android:host="bariisaa.com"/>
    <data android:scheme="naik" android:host="open"/>
</intent-filter>
```

Deeplink paths:
- `https://bariisaa.com/book/{id}` → Open book detail
- `https://bariisaa.com/profile` → Open profile
- `https://bariisaa.com/subscription` → Open subscription plans
- `naik://open/book/{id}` → Native deep link

#### iOS

In Xcode: Runner → Signing & Capabilities → + → Associated Domains
Add:
- `applinks:bariisaa.com`
- `naik://open`

Handle in Flutter:

```dart
// Using app_links package
import 'package:app_links/app_links.dart';

void initDeepLinks() {
  final appLinks = AppLinks();

  // Handle link when app is opened from cold state
  appLinks.getInitialLink().then((uri) {
    if (uri != null) {
      handleDeepLink(uri);
    }
  });

  // Handle link when app is already running
  appLinks.uriLinkStream.listen((uri) {
    handleDeepLink(uri);
  });
}

void handleDeepLink(Uri uri) {
  if (uri.pathSegments.contains('book') && uri.pathSegments.length > 1) {
    final bookId = uri.pathSegments[1];
    // Navigate to book detail
  }
}
```

---

## CI/CD Pipeline

### GitHub Actions — Backend Full Pipeline

`.github/workflows/deploy-backend.yml`:

```yaml
name: Deploy Backend

on:
  push:
    branches: [main]
    paths:
      - 'backend/**'
  workflow_dispatch:
    inputs:
      environment:
        description: 'Deploy environment'
        required: true
        default: 'staging'
        type: choice
        options:
          - staging
          - production

env:
  NODE_VERSION: '20'

jobs:
  quality:
    name: Quality Checks
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: naik_test
          POSTGRES_PASSWORD: test_pass
          POSTGRES_DB: naik_test
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          cache-dependency-path: backend/package-lock.json

      - name: Install dependencies
        working-directory: backend
        run: npm ci

      - name: Lint
        working-directory: backend
        run: npm run lint

      - name: Type check
        working-directory: backend
        run: npx tsc --noEmit

      - name: Run tests with coverage
        working-directory: backend
        run: npm run test:cov
        env:
          DATABASE_URL: postgresql://naik_test:test_pass@localhost:5432/naik_test
          JWT_SECRET: test_jwt_secret
          JWT_REFRESH_SECRET: test_refresh_secret

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v4
        with:
          directory: backend/coverage/
          flags: backend
          name: backend-coverage

      - name: SonarQube Scan
        uses: SonarSource/sonarqube-scan-action@v1
        env:
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}

  build:
    name: Build
    needs: quality
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}

      - name: Install dependencies
        working-directory: backend
        run: npm ci

      - name: Generate Prisma client
        working-directory: backend
        run: npx prisma generate

      - name: Build
        working-directory: backend
        run: npm run build

      - name: Upload build artifact
        uses: actions/upload-artifact@v4
        with:
          name: backend-build
          path: backend/dist/
          retention-days: 7

  deploy-staging:
    name: Deploy to Staging
    needs: build
    if: github.event.inputs.environment == 'staging' || (github.ref == 'refs/heads/main' && github.event_name == 'push')
    runs-on: ubuntu-latest
    environment: staging

    steps:
      - uses: actions/checkout@v4

      - name: Download build artifact
        uses: actions/download-artifact@v4
        with:
          name: backend-build
          path: backend/dist/

      - name: Deploy to staging server
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.STAGING_HOST }}
          username: ${{ secrets.STAGING_USER }}
          key: ${{ secrets.STAGING_SSH_KEY }}
          script: |
            cd /opt/naik/backend
            git pull origin main
            npm ci --production
            cp -r ${{ github.workspace }}/backend/dist/* dist/
            npx prisma migrate deploy
            pm2 restart naik-backend-staging
            echo "Staging deployment complete"

      - name: Run smoke tests
        run: |
          sleep 10
          curl -f https://staging-api.bariisaa.com/health || exit 1
          echo "Smoke tests passed"

  deploy-production:
    name: Deploy to Production
    needs: deploy-staging
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    runs-on: ubuntu-latest
    environment: production
    concurrency: production

    steps:
      - uses: actions/checkout@v4

      - name: Download build artifact
        uses: actions/download-artifact@v4
        with:
          name: backend-build
          path: backend/dist/

      - name: Deploy to production servers
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.PROD_HOST }}
          username: ${{ secrets.PROD_USER }}
          key: ${{ secrets.PROD_SSH_KEY }}
          script: |
            cd /opt/naik/backend
            git pull origin main
            npm ci --production
            cp -r ${{ github.workspace }}/backend/dist/* dist/
            npx prisma migrate deploy
            pm2 reload ecosystem.config.js
            pm2 reset naik-backend
            echo "Production deployment complete"

      - name: Run smoke tests
        run: |
          sleep 15
          curl -f https://api.bariisaa.com/health || exit 1
          echo "Production smoke tests passed"

      - name: Notify Sentry release
        uses: getsentry/action-release@v1
        env:
          SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}
          SENTRY_ORG: naik
          SENTRY_PROJECT: naik-backend
        with:
          environment: production
          version: ${{ github.sha }}
```

### GitHub Actions — Mobile Android

`.github/workflows/deploy-android.yml`:

```yaml
name: Build & Deploy Android

on:
  push:
    branches: [main]
    paths:
      - 'mobile/**'
  workflow_dispatch:
    inputs:
      track:
        description: 'Release track'
        required: true
        default: 'internal'
        type: choice
        options:
          - internal
          - alpha
          - beta
          - production
      versionCode:
        description: 'Version code (auto-increment if empty)'
        required: false

jobs:
  test-android:
    name: Test Android
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Flutter
        uses: subosito/flutter-action@v2
        with:
          flutter-version: '3.22.x'
          channel: 'stable'

      - name: Setup Java
        uses: actions/setup-java@v4
        with:
          distribution: 'zulu'
          java-version: '17'

      - name: Install dependencies
        working-directory: mobile
        run: flutter pub get

      - name: Analyze code
        working-directory: mobile
        run: flutter analyze

      - name: Run tests
        working-directory: mobile
        run: flutter test

  build-android:
    name: Build Android AAB
    needs: test-android
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Flutter
        uses: subosito/flutter-action@v2
        with:
          flutter-version: '3.22.x'
          channel: 'stable'

      - name: Setup Java
        uses: actions/setup-java@v4
        with:
          distribution: 'zulu'
          java-version: '17'

      - name: Install dependencies
        working-directory: mobile
        run: flutter pub get

      - name: Decode Firebase config
        run: |
          echo "${{ secrets.GOOGLE_SERVICES_JSON }}" | base64 --decode > mobile/android/app/google-services.json

      - name: Decode Keystore
        run: |
          echo "${{ secrets.ANDROID_KEYSTORE_BASE64 }}" | base64 --decode > mobile/android/app/naik-keystore.jks

      - name: Create key.properties
        run: |
          echo "storeFile=naik-keystore.jks" > mobile/android/key.properties
          echo "storePassword=${{ secrets.KEYSTORE_PASSWORD }}" >> mobile/android/key.properties
          echo "keyPassword=${{ secrets.KEY_PASSWORD }}" >> mobile/android/key.properties
          echo "keyAlias=${{ secrets.KEY_ALIAS }}" >> mobile/android/key.properties

      - name: Increment version
        working-directory: mobile
        run: |
          # Bump version code in pubspec.yaml automatically
          $versionCode = (Select-String -Path "pubspec.yaml" -Pattern "version: (\d+\.\d+\.\d+)\+(\d+)" | ForEach-Object { $_.Matches.Groups[2].Value })
          $newCode = [int]$versionCode + 1
          (Get-Content pubspec.yaml) -replace "version: (\d+\.\d+\.\d+)\+(\d+)", "version: `$1+$newCode" | Set-Content pubspec.yaml

      - name: Build AAB
        working-directory: mobile
        run: flutter build appbundle --release

      - name: Upload AAB artifact
        uses: actions/upload-artifact@v4
        with:
          name: android-release
          path: mobile/build/app/outputs/bundle/release/app-release.aab
          retention-days: 30

  deploy-android:
    name: Deploy to Play Store
    needs: build-android
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Download AAB
        uses: actions/download-artifact@v4
        with:
          name: android-release
          path: build/

      - name: Upload to Google Play
        uses: r0adkll/upload-google-play@v1
        with:
          serviceAccountJsonPlainText: ${{ secrets.PLAY_SERVICE_ACCOUNT_JSON }}
          packageName: com.naik.app
          releaseFile: build/app-release.aab
          track: ${{ github.event.inputs.track || 'internal' }}
          status: completed
          userFraction: ${{ github.event.inputs.track == 'production' && '0.1' || '1.0' }}
          whatsNewDirectory: mobile/android/whatsnew/
          inAppUpdatePriority: 1

      - name: Notify Slack
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {
              "text": "Android release ${{ github.event.inputs.track || 'internal' }} deployed successfully!",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "✅ *Android Release Deployed*\nTrack: `${{ github.event.inputs.track || 'internal' }}`\nCommit: `${{ github.sha }}`\nBuild: <${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}|View workflow>"
                  }
                }
              ]
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

---

## Scaling

### 1. Load Balancer (Application Layer)

Configure an AWS Application Load Balancer (ALB) to distribute traffic across EC2 instances:

```hcl
# Terraform snippet
resource "aws_lb" "naik" {
  name               = "naik-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets           = aws_subnet.public[*].id
}

resource "aws_lb_target_group" "naik" {
  name        = "naik-tg"
  port        = 3000
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "instance"

  health_check {
    path                = "/health"
    interval            = 30
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 3
  }
}

resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.naik.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn   = aws_acm_certificate.naik.arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.naik.arn
  }
}
```

### 2. Auto Scaling Group

```hcl
resource "aws_launch_template" "naik" {
  name          = "naik-template"
  image_id      = "ami-0c55b159cbfafe1f0"  # Ubuntu 22.04 LTS
  instance_type = "t3.medium"
  user_data     = base64encode(file("deploy.sh"))

  iam_instance_profile {
    name = aws_iam_instance_profile.naik.name
  }

  network_interfaces {
    associate_public_ip_address = false
    security_groups            = [aws_security_group.instance.id]
  }
}

resource "aws_autoscaling_group" "naik" {
  name                = "naik-asg"
  vpc_zone_identifier = aws_subnet.private[*].id
  target_group_arns   = [aws_lb_target_group.naik.arn]
  health_check_type   = "EC2"
  min_size           = 2
  max_size           = 10
  desired_capacity   = 2

  launch_template {
    id      = aws_launch_template.naik.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value              = "naik-instance"
    propagate_at_launch = true
  }
}

# Scale up policy (CPU > 70%)
resource "aws_autoscaling_policy" "scale_up" {
  name                   = "naik-scale-up"
  scaling_adjustment     = 1
  adjustment_type        = "ChangeInCapacity"
  cooldown              = 300
  autoscaling_group_name = aws_autoscaling_group.naik.name
}

resource "aws_cloudwatch_metric_alarm" "high_cpu" {
  alarm_name          = "naik-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "120"
  statistic           = "Average"
  threshold           = "70"
  alarm_actions       = [aws_autoscaling_policy.scale_up.arn]
}
```

### 3. Database Read Replicas

```bash
# Create read replica in AWS RDS
aws rds create-db-instance-read-replica \
  --db-instance-identifier naik-db-replica \
  --source-db-instance-identifier naik-db \
  --db-instance-class db.t3.medium \
  --region us-east-1
```

Update Prisma schema to use read replicas:

```prisma
datasource db {
  provider          = "postgresql"
  url               = env("DATABASE_URL")
  directUrl         = env("DATABASE_URL_DIRECT")
  shadowDatabaseUrl = env("DATABASE_URL_SHADOW")

  // Read replica for queries
  relationMode = "prisma"
}

// Use read replicas in service
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Read from replica for queries
  // Write to primary for mutations
});
```

### 4. Redis Caching (optional � not used by the current stack; illustrative snippet)

```bash
# Use ElastiCache Redis cluster
aws elasticache create-cache-cluster \
  --cache-cluster-id naik-redis \
  --cache-node-type cache.t3.micro \
  --engine redis \
  --num-cache-nodes 1 \
  --security-group-ids sg-xxxxx
```

Caching strategy:

```ts
// cache.service.ts
import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class CacheService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async getOrSet<T>(key: string, factory: () => Promise<T>, ttl = 3600): Promise<T> {
    const cached = await this.cacheManager.get<T>(key);
    if (cached) return cached;

    const value = await factory();
    await this.cacheManager.set(key, value, ttl);
    return value;
  }

  async invalidate(pattern: string): Promise<void> {
    // Invalidate all keys matching pattern
    await this.cacheManager.del(pattern);
  }
}
```

### 5. CDN Configuration (CloudFront)

```bash
# Create CloudFront distribution for S3 assets
aws cloudfront create-distribution \
  --origin-domain-name naik-production-assets.s3.amazonaws.com \
  --default-root-object index.html \
  --enabled \
  --comment "Naik Media CDN"

# Cache behaviors:
# /covers/*        -> TTL 7 days, compress
# /audio/*         -> TTL 1 hour, compress
# /api/*           -> No cache (forward to backend)
```

### 6. Database Connection Pooling

Use PgBouncer for connection pooling:

```bash
sudo apt install -y pgbouncer
```

`/etc/pgbouncer/pgbouncer.ini`:

```ini
[databases]
naik_db = host=localhost port=5432 dbname=naik_db

[pgbouncer]
listen_addr = 127.0.0.1
listen_port = 6432
auth_type = md5
auth_file = /etc/pgbouncer/userlist.txt
pool_mode = transaction
max_client_conn = 200
default_pool_size = 20
reserve_pool_size = 5
reserve_pool_timeout = 5.0
```

Update DATABASE_URL: `postgresql://naik_user:pass@localhost:6432/naik_db`

---

## Monitoring & Alerts

### Sentry Setup

```bash
# Backend
npm install @sentry/node @sentry/profiling-node

# main.ts
import * as Sentry from '@sentry/node';
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.2,
  profilesSampleRate: 0.2,
});
```

### Datadog Dashboard

Key metrics to monitor:
- Request rate (req/sec)
- Error rate (5xx responses)
- P99/P95/P50 latency
- Database connection pool usage
- Redis cache hit ratio
- CPU/Memory utilization
- Disk I/O
- Active users (from application metrics)

### Alert Thresholds

| Alert | Condition | Action |
|-------|-----------|--------|
| High Error Rate | > 1% 5xx in 5 min | Notify Slack, page on-call |
| High Latency | P99 > 5s in 5 min | Scale up, investigate query |
| Database Connection Saturation | > 80% connections in 1 min | Increase pool size, check slow queries |
| Low Disk Space | < 20% free | Clean logs, increase volume |
| Instance Down | Health check fails 3x | Auto-replace via ASG |
| SSL Certificate Expiry | < 30 days | Auto-renew via Certbot |

---

## Rollback Procedure

### Backend Rollback

```bash
# Via PM2
cd /opt/naik/backend
git revert HEAD
git push origin main
npm ci
npm run build
pm2 reload naik-backend

# Or restore from backup
cp -r dist-backup-2025-01-15 dist/
pm2 restart naik-backend

# Database rollback
npx prisma migrate resolve --rolled-back "migration_name"
npx prisma migrate deploy  # Re-runs migrations up to target
```

### Mobile Rollback

**Android**: In Play Console → Release → Retire problematic release → Re-promote previous working release.

**iOS**: In App Store Connect → My Apps → iOS App → Select previous version → "Make Current" (if compatible with latest iOS).

---

## Backup Strategy

### Database backups (built-in)

The backend ships a **Backups module** (`backend/src/modules/backups/`):

| Endpoint | Auth | Purpose |
|----------|------|---------|
| `POST /api/v1/backups` | `settings:create` | Create a backup (runs `pg_dump` in background, audited) |
| `GET /api/v1/backups` | `settings:read` | List backup history (status: IN_PROGRESS/COMPLETED/FAILED) |
| `POST /api/v1/backups/:id/restore` | `settings:update` | Restore from a completed backup (audited) |
| `DELETE /api/v1/backups/:id` | `settings:delete` | Delete a backup (audited) |

Implementation notes:
- `pg_dump` is invoked with connection parameters derived from `DATABASE_URL` (**password passed via `PGPASSWORD` env — never on the argv, never logged**), `maxBuffer` 512MB.
- Requires `pg_dump`/`pg_restore` binaries on the server PATH (PostgreSQL client tools).
- Backup rows are tracked in the `backups` table (Prisma `Backup` model).

### Recommended production schedule

```bash
# Nightly logical backup + 7-day retention (cron on the DB host)
0 2 * * * PGPASSWORD="$DB_PASS" pg_dump -h localhost -U naik_user -d naik_db -Fc \
  -f /var/backups/naik/naik_db_$(date +\%F).dump && \
  find /var/backups/naik -name 'naik_db_*.dump' -mtime +7 -delete
```

- **Offsite**: sync `/var/backups/naik/` to S3/R2 with lifecycle rules (e.g., `rclone sync` or `aws s3 sync`).
- **WAL archiving / PITR** (optional, RDS or `archive_command`) for point-in-time recovery.
- **Restore drill**: restore into a scratch DB quarterly: `pg_restore -d naik_restore naik_db_<date>.dump`.

### Files (media)

- S3/R2 buckets: enable **versioning** + lifecycle (delete old versions after 30–90 days).
- Media rows are DB-backed (`media_files`); DB backup + bucket versioning together are sufficient to rebuild.

---

## Admin Panel Deployment Notes (SPA fallback)

The admin panel is a Vite SPA — deep links (`/books/123/edit`, `/admins`, …) must fall back to `index.html`:

- **Netlify**: `admin/public/_redirects` is committed (`/* /index.html 200`) and copied into `dist/` by Vite. No extra config needed.
- **Vercel**: `vercel.json` rewrites (see Option A above).
- **Nginx** (self-hosted): add

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

- API base URL is injected at build time (`VITE_API_BASE_URL=https://api.bariisaa.com`); rebuild on domain change — do not commit `.env.production`.
- After login the panel only talks to the API (no server-side rendering needed); CORS must allow the admin origin (`CORS_ORIGIN`).

---

## Post-Deployment Checklist

- [ ] Health endpoint returns 200
- [ ] Database migrations ran successfully
- [ ] SSL certificate installed and valid
- [ ] Domain DNS resolves to correct IP
- [ ] CORS allows admin panel origin
- [ ] S3 uploads working (covers, audio)
- [ ] Stripe webhook fires correctly
- [ ] Push notifications deliver to both platforms
- [ ] Rate limiting active (100 req/min per IP)
- [ ] Logs are being shipped to logging service
- [ ] Sentry error tracking receiving events
- [ ] Backups are running (daily database backup)
- [ ] PM2 process will restart on reboot
- [ ] All environment variables set on production
- [ ] Admin panel loads without console errors
- [ ] Mobile app builds and runs on both platforms
- [ ] Deep links work from email/notification
- [ ] Search indexing complete (if using Elasticsearch)
