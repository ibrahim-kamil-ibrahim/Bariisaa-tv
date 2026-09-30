# Store Submission Guide — Naik Audio Book & E-Book Platform

> **Phase 42** | Complete store submission readiness guide covering Google Play Store, Apple App Store, required assets, privacy policy, and terms of service.

---

## Table of Contents

1. [Google Play Store](#google-play-store)
2. [Apple App Store](#apple-app-store)
3. [Required Assets](#required-assets)
4. [Privacy Policy Template](#privacy-policy-template)
5. [Terms of Service Template](#terms-of-service-template)

---

## Google Play Store

### Developer Account

1. Go to https://play.google.com/console/signup
2. Sign in with a Google account (create a dedicated developer account, not personal)
3. Pay the one-time registration fee of **$25 USD**
4. Complete your developer profile:
   - Developer name: `Naik`
   - Email: `support@naik.com`
   - Phone: Developer support contact
   - Website: `https://naik.com`
5. Verification: Google may require identity verification for new accounts

### App Listing

#### Basic Information

| Field | Value |
|-------|-------|
| **App Name** | Naik |
| **Short Description** (80 chars max) | "Discover thousands of audio books and e-books. Listen, read, and learn anywhere with Naik." |
| **Full Description** (4000 chars max) | See below |

**Full Description Text**:
```
Discover the ultimate audio book and e-book experience with Naik. Whether you are commuting, working out, or relaxing at home, Naik gives you access to thousands of titles across every genre.

WHY NAIK?

Extensive Library: Browse thousands of audio books and e-books across fiction, non-fiction, mystery, romance, sci-fi, self-help, and more.

Listen Offline: Download audio books to listen offline. No internet connection required.

Read Anywhere: Sync your reading progress across all your devices. Pick up right where you left off.

Personalized Recommendations: Our smart recommendation engine suggests books based on your reading and listening history.

Multiple Narration Options: Many books feature multiple narrator options. Choose the voice that you love.

Adjustable Playback Speed: Listen at 0.5x to 3x speed. Perfect for speed listening or language learning.

Sleep Timer: Fall asleep to your favorite book with the built-in sleep timer.

Bookmarks and Notes: Never lose your place. Add bookmarks and notes while you read or listen.

SUBSCRIPTION PLANS

Basic Plan: Access to 1,000+ e-books and 500+ audio books.
Premium Plan: Unlimited access to the entire library. Offline downloads. Ad-free experience.
Family Plan: Share with up to 5 family members. Each with their own profile and progress.

CATEGORIES

- Fiction
- Non-Fiction
- Mystery and Thriller
- Romance
- Science Fiction and Fantasy
- Biography and Memoir
- Self-Help
- Business and Economics
- History
- Children
- Young Adult
- Poetry
- Classics
- Horror
- Health and Wellness

WHAT USERS ARE SAYING

"Naik has completely changed my commute. I have listened to 15 books this month alone!" - Sarah M.

"The selection of audio books is incredible. I found titles here that I could not find anywhere else." - James K.

"As an avid reader, the e-book reader is fantastic. The night mode is perfect for late-night reading." - Priya R.

SUPPORT

Having issues? Contact us at support@naik.com or visit our Help Center at https://naik.com/help.

Follow us for updates:
Instagram: @naikapp
Twitter: @naikapp
Facebook: /naikapp

DOWNLOAD NAIK TODAY AND START YOUR LISTENING AND READING JOURNEY!
```

#### Category and Tags

| Field | Selection |
|-------|-----------|
| **Category** | Books & Reference |
| **Genre** | Books |
| **Tags** | audio books, e-books, reading, listening, books, literature, audiobooks, learning, education, fiction |

### Screenshot Requirements

#### Phone Screenshots (Minimum 8 required)

| Dimension | Orientation | Content |
|-----------|-------------|---------|
| 1080 x 1920 px (or larger, up to 3840px) | Portrait | Home screen with featured books |
| 1080 x 1920 px | Portrait | Library / My Books screen |
| 1080 x 1920 px | Portrait | Book detail with Listen/Read buttons |
| 1080 x 1920 px | Portrait | Audio player (now playing screen) |
| 1080 x 1920 px | Portrait | E-book reader view |
| 1080 x 1920 px | Portrait | Search with results |
| 1080 x 1920 px | Portrait | Subscription plans screen |
| 1080 x 1920 px | Portrait | User profile / settings |

**Tips**:
- Use the highest resolution device available (e.g., Pixel 8 Pro or Samsung Galaxy S24 Ultra)
- Remove the status bar (battery, time) for cleaner screenshots
- Add subtle captions or callouts using the Play Console screenshot editor
- Do not include UI that looks different from the current app version
- Show the app in its best light — use popular books with attractive covers

#### Tablet Screenshots (Minimum 3 required)

| Dimension | Orientation | Content |
|-----------|-------------|---------|
| 1920 x 1200 px (or larger) | Landscape | Home screen (tablet layout) |
| 1920 x 1200 px | Landscape | Reader split view (book on left, notes on right) |
| 1920 x 1200 px | Landscape | Library grid view |

### Feature Graphic

| Requirement | Detail |
|-------------|--------|
| **Size** | 1024 x 500 px |
| **Format** | PNG or JPEG (no transparency for PNG) |
| **Content** | App branding, tagline, clean design |
| **Safe Zone** | Keep text and logos within 921 x 386 px center area |

**Design Notes**: Use the Naik brand colors (#1A1A2E primary, #E94560 accent). Include the app name "Naik" and tagline "Audio Books & E-Books." Do not include device frames or screenshots in the feature graphic.

### App Icon

| Requirement | Detail |
|-------------|--------|
| **Size** | 512 x 512 px (32-bit PNG) |
| **Format** | PNG (no alpha channel — full opacity) |
| **Design** | Flat, simple, recognizable at small sizes |
| **File Size** | Max 1024 KB |
| **Legacy Icon** | Also provide at 96 x 96 px |

### Privacy Policy URL

Provide a publicly accessible URL. Use the privacy policy template in this document (section 4).

Placeholder if not yet deployed:
```
https://naik.com/privacy
```

### Content Rating Questionnaire

Complete the Google Play Content Rating questionnaire:

1. **Email:** support@naik.com
2. **Category:** Books & Reference
3. **Rating Criteria:**
   - **Violence**: None
   - **Sexual Content**: None / Mild (some romance novel descriptions)
   - **Language**: Mild (some books may contain occasional mild profanity)
   - **Alcohol, Tobacco, Drugs**: None / References in books (educational/historical)
   - **User Generated Content**: No user-generated content
   - **Sharing Location**: No location sharing
   - **Digital Purchases**: Yes (in-app purchases for subscriptions and individual books)
   - **Use of Phone Features**: No
4. **Expected Rating**: Everyone (E) or Everyone 10+ (E10+) depending on book content

### Data Safety Form

Complete the form in Play Console ? App Content ? Data Safety.

**Data Collected**:

| Data Type | Collected | Shared | Purpose |
|-----------|-----------|--------|---------|
| Email | Yes | No | Account management, notifications |
| Name | Yes | No | Profile display |
| User ID | Yes | No | Account management |
| Purchase history | Yes | No | Receipts, subscriptions |
| Reading/listening activity | Yes | No | Recommendations, sync |
| Device ID | Yes | No | Push notifications, license binding |
| Crash logs | Yes | Yes (Sentry) | Crash analytics |
| Performance data | Yes | Yes (Sentry) | App performance monitoring |

**Data NOT Collected**:
- Location
- Contacts
- Photos/Videos
- Microphone
- SMS

**Security Practices**:
- Data encrypted in transit (TLS 1.3)
- Data encrypted at rest (AES-256)
- Account deletion available in settings
- Data shared with third parties only for analytics (Sentry)

### AAB Upload

#### Build Command

```bash
cd mobile

# Ensure you have the keystore configured (see DEPLOYMENT_GUIDE.md)
flutter build appbundle --release

# Output: build/app/outputs/bundle/release/app-release.aab
```

#### Signing

The AAB is signed automatically during the build process using `key.properties`. Ensure:
- `naik-keystore.jks` is in `mobile/android/app/`
- `key.properties` has correct values
- Keystore is backed up securely (you cannot update the app without it)

#### Upload to Play Console

1. Go to Play Console ? Naik ? Production ? Create new release
2. Upload `app-release.aab`
3. Fill in release notes, e.g.:
   ```
   Version 1.0.0 — Initial Release
   
   What's new:
   - Browse thousands of audio books and e-books
   - Listen offline with download support
   - Adjustable playback speed (0.5x to 3x)
   - Personalized book recommendations
   - Sleep timer and bookmarks
   - Multiple subscription plans
   ```
4. Save and review

#### Release Tracks

| Track | Purpose | Rollout Strategy |
|-------|---------|------------------|
| **Internal** | Internal team testing (up to 100 testers) | 100% rollout |
| **Alpha** | Closed alpha testers (Google Groups) | 100% rollout |
| **Beta** | Open beta testing (public link) | 100% rollout |
| **Production** | Public release | Staged: 10% ? 50% ? 100% over 7 days |

**Recommended Release Flow**:
1. Upload to Internal track ? Test all features
2. Promote to Alpha ? Get feedback from early testers
3. Promote to Beta ? Wide testing, fix any issues
4. Promote to Production ? Start at 10%, increase to 50% after 24 hours, 100% after 72 hours if no issues

### Review Checklist

Before submitting to Google Play, verify:

- [ ] App builds successfully with `flutter build appbundle --release`
- [ ] No crashes on launch and core flows
- [ ] All in-app purchases work correctly (test with license test accounts)
- [ ] No placeholder text or debug logs in release build
- [ ] Privacy policy is accessible and matches the app's data collection
- [ ] All required screenshots uploaded (minimum 8 phone + 3 tablet)
- [ ] Feature graphic uploaded (1024x500)
- [ ] App icon uploaded (512x512)
- [ ] Content rating questionnaire complete
- [ ] Data safety form complete
- [ ] App is not targeted at children under 13 (unless COPPA compliant)
- [ ] No copyrighted content without permission
- [ ] All third-party libraries comply with their licenses
- [ ] Deep links are functional (test with `adb shell am start -W -a android.intent.action.VIEW -d "naik://open/book/test123"`)
- [ ] Push notifications work (test with Firebase Console)
- [ ] Offline playback works after download
- [ ] Subscription restore works (test with different Google accounts)

---

## Apple App Store

### Apple Developer Program

1. Go to https://developer.apple.com/programs/
2. Enroll with your Apple ID (create a dedicated Apple ID for the developer account)
3. Pay the annual fee of **$99 USD** (or $299 for Enterprise)
4. Complete identity verification (may take 1-2 days)
5. Sign the Apple Developer Agreement

### App Store Connect Setup

1. Go to https://appstoreconnect.apple.com/
2. Click **My Apps** ? **+** ? **New App**
3. Fill in:

| Field | Value |
|-------|-------|
| **Platforms** | iOS |
| **Name** | Naik |
| **Primary Language** | English (US) |
| **Bundle ID** | `com.naik.app` (must match Xcode project) |
| **SKU** | `NAIK_001` |
| **User Access** | Limited Access (add team members individually) |

### App Information

| Field | Value |
|-------|-------|
| **Name** | Naik |
| **Subtitle** | Audio Books & E-Books |
| **Privacy Policy URL** | `https://naik.com/privacy` |
| **Category** | Books |
| **Primary Language** | English |

### Description (4000 chars max)

Use the same description as Google Play (see above in section 1).

### Keywords

```
naik, audio books, audiobooks, e-books, ebooks, books, reading, listening, fiction, non-fiction, literature, stories, novels, learning, education, book club, audio, reader, library, storyteller, narrated, bestseller
```

### Screenshots

#### iPhone Screenshots (Required)

| Device Class | Resolution | Count |
|-------------|------------|-------|
| 6.7" (iPhone 15 Pro Max, 14 Plus) | 1290 x 2796 px | 4-6 |
| 6.5" (iPhone 14 Pro Max, 12 Pro Max) | 1242 x 2688 px | 4-6 |
| 5.5" (iPhone 8 Plus, SE 3) | 1242 x 2208 px | 4-6 |

**Recommended Screenshot Content**:

1. **Home/Browse**: Featured books, categories carousel
2. **Book Detail**: Cover large, Listen/Read buttons, description
3. **Audio Player**: Now playing with controls, progress bar, speed selector
4. **E-Book Reader**: Clean reading view with typography
5. **Search**: Search results with filters
6. **Library**: User's downloaded books and current reads

**Tips**:
- Use a high-resolution iPhone simulator (e.g., iPhone 15 Pro Max)
- Set the simulator to 100% scale for clean screenshots
- Remove the simulator's toolbar and hide the device chrome
- Use App Store Connect's screenshot editor to add text overlays
- Text overlays should be short, benefit-driven: "10,000+ Books", "Listen Offline", "Adjustable Speed"

#### iPad Screenshots (Optional but Recommended)

| Device Class | Resolution | Count |
|-------------|------------|-------|
| 12.9" iPad Pro (3rd gen+) | 2048 x 2732 px | 3-5 |

**Content**: Show the tablet-optimized layout (split view, grid library, landscape reading).

### App Preview Video (Optional but Recommended)

| Requirement | Detail |
|-------------|--------|
| **Duration** | 15-30 seconds |
| **Resolution** | 1920 x 1080 px (landscape) or 1080 x 1920 px (portrait) |
| **Codec** | H.264 |
| **File Size** | Max 500 MB |
| **Content** | Highlight top 3-4 features with smooth transitions, upbeat music, text overlays |

### App Icon

| Requirement | Detail |
|-------------|--------|
| **Size** | 1024 x 1024 px |
| **Format** | PNG (no transparency) |
| **File Size** | Max 10 MB |
| **Design** | Must match Android icon in branding. Flat, simple, with no transparency. |

### App Review Information

| Field | Value |
|-------|-------|
| **Sign-in required** | Yes |
| **Demo Account Email** | `admin@naik.com` |
| **Demo Account Password** | `Admin@123` |
| **Contact Name** | App Review Team |
| **Contact Email** | `support@naik.com` |
| **Contact Phone** | `+1-555-0123` (or your actual support number) |
| **Notes** | The demo account has full access to all features including all subscription plans and book purchases. To test: login with the credentials above, navigate to the home screen, tap any book. |

### Build Upload

#### Method 1: Xcode Archive

1. Open `mobile/ios/Runner.xcworkspace` in Xcode
2. Select **Product** ? **Archive**
3. Once archive completes, the Organizer window opens
4. Select the archive ? **Distribute App**
5. Choose **App Store Connect** ? **Upload**
6. Signing: Automatically manage signing
7. Wait for validation and upload

#### Method 2: Transporter App

```bash
# Build the .xcarchive
cd mobile/ios
xcodebuild -workspace Runner.xcworkspace -scheme Runner -sdk iphoneos -configuration Release archive -archivePath build/Runner.xcarchive

# Export for App Store
xcodebuild -exportArchive -archivePath build/Runner.xcarchive -exportPath build/ -exportOptionsPlist ExportOptions.plist
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
    <key>uploadBitcode</key>
    <false/>
    <key>compileBitcode</key>
    <false/>
    <key>destination</key>
    <string>upload</string>
    <key>signingStyle</key>
    <string>automatic</string>
    <key>provisioningProfiles</key>
    <dict>
        <key>com.naik.app</key>
        <string>AppStore com.naik.app</string>
    </dict>
</dict>
</plist>
```

Upload using Transporter app (from Mac App Store):
1. Open Transporter
2. Click **+** ? select the exported `.ipa` file
3. Click **Deliver**
4. Wait for processing (may take 5-15 minutes)

### TestFlight

1. In App Store Connect ? App ? TestFlight
2. Enable **TestFlight Beta Testing**
3. Add **Internal Testers**:
   - Add up to 100 team members by email
   - They receive an invitation email
   - Build is available immediately
4. Enable **External Testing** (Optional):
   - Up to 10,000 testers
   - Requires Beta App Review by Apple
   - Use **Public Link** for easy sharing
5. **What to Test**:
   - Complete signup, login, logout flow
   - Browse books, search, filter
   - Play audio, adjust speed, sleep timer
   - Read e-books, change font, night mode
   - Purchase subscription (use sandbox account)
   - Download offline, remove download
   - Push notifications
   - Deep links

### Age Rating Declaration

Complete in App Store Connect ? App ? Pricing and Availability ? Age Rating:

| Question | Answer |
|----------|--------|
| None Restrictive (no objectionable content) | Yes |
| Cartoon or Fantasy Violence | None |
| Realistic Violence | None |
| Prolonged Graphic/Sadistic Violence | None |
| Graphic/Sexual Content | None |
| Horror/Fear Themes | None |
| Medical/Treatment Information | None |
| Alcohol, Tobacco, or Drug Use | None |
| Gambling and Contests | No |
| Gambling Simulated | No |
| Gambling Real | No |
| Contests | No |
| Unrestricted Web Access | No |
| Profanity or Crude Humor | None |
| Mature or Suggestive Themes | None |
| Sexual Content/Nudity | None |
| Sexual Content/Nudity (Text) | None |

**Expected Age Rating**: 4+ (or 9+ if mature books are included)

### Export Compliance Information

Complete in App Store Connect ? App ? iOS App ? Version ? Export Compliance:

| Question | Answer |
|----------|--------|
| Does your app use encryption? | Yes |
| Does your app qualify for any exemptions? | Yes (App uses only HTTPS, qualifies for EAR99/NLR exemption) |
| Contains encryption after August 2016? | No (only standard HTTPS/TLS) |

**Export Compliance Documentation**:
- Naik uses standard HTTPS/TLS encryption for all network communications
- This qualifies for the mass market encryption commodity classification (ENC)
- File an annual self-classification report to the U.S. government if required
- Select: "Yes, my app uses encryption but qualifies for an exemption"

---

## Required Assets

### Complete Image Asset List

| Asset | Android | iOS | Web/Other |
|-------|---------|-----|-----------|
| App Icon (main) | 512x512 PNG | 1024x1024 PNG | 512x512 PNG |
| Adaptive Icon (foreground) | 108x108 PNG | — | — |
| Adaptive Icon (background) | 108x108 PNG | — | — |
| Feature Graphic | 1024x500 PNG | — | — |
| Play Store Screenshot 1 | 1080x1920 | — | — |
| Play Store Screenshot 2 | 1080x1920 | — | — |
| Play Store Screenshot 3 | 1080x1920 | — | — |
| Play Store Screenshot 4 | 1080x1920 | — | — |
| Play Store Screenshot 5 | 1080x1920 | — | — |
| Play Store Screenshot 6 | 1080x1920 | — | — |
| Play Store Screenshot 7 | 1080x1920 | — | — |
| Play Store Screenshot 8 | 1080x1920 | — | — |
| Play Store Tablet SS 1 | 1920x1200 | — | — |
| Play Store Tablet SS 2 | 1920x1200 | — | — |
| Play Store Tablet SS 3 | 1920x1200 | — | — |
| App Store Screenshot 6.7" | — | 1290x2796 | — |
| App Store Screenshot 6.5" | — | 1242x2688 | — |
| App Store Screenshot 5.5" | — | 1242x2208 | — |
| App Store iPad SS | — | 2048x2732 | — |
| App Preview Video | — | 1080x1920 | — |
| Splash Screen | — | — | 1242x2688 |
| Social Media (Facebook) | — | — | 1200x630 |
| Social Media (Twitter) | — | — | 1024x512 |
| Email Header | — | — | 600x200 |
| Blog/Press Kit | — | — | 1920x1080 |
| CDN Thumbnail Small | 200x300 | 200x300 | — |
| CDN Thumbnail Medium | 400x600 | 400x600 | — |
| CDN Thumbnail Large | 800x1200 | 800x1200 | — |

---

## Privacy Policy Template

**Last Updated**: January 15, 2025

### 1. Introduction

Welcome to Naik ("we," "our," or "us"). Naik provides an audio book and e-book platform that allows users to discover, stream, download, and read digital books (the "Service"). This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application and related services.

By using Naik, you agree to the collection and use of information in accordance with this policy. If you do not agree with this policy, please do not use the Service.

### 2. Information We Collect

#### 2.1 Information You Provide

- **Account Information**: When you register, we collect your name, email address, and password.
- **Profile Information**: You may optionally provide a profile picture, biography, and reading preferences.
- **Payment Information**: When you make purchases, payment processing is handled by Stripe. We do not store credit card numbers. Stripe may share your payment method type and transaction details with us.
- **Communications**: When you contact our support team, we collect your email, message content, and any attachments.

#### 2.2 Information Collected Automatically

- **Usage Data**: We collect information about how you use the Service, including books viewed, listened to, search queries, time spent, and interaction patterns.
- **Device Information**: We collect device model, operating system version, unique device identifiers, and mobile network information.
- **Log Data**: Our servers automatically record information including your IP address, browser type, referring URLs, and access times.
- **Crash Reports**: We use Sentry to collect crash reports and performance data to improve the Service.

#### 2.3 Information from Third Parties

- **Firebase**: We use Firebase for push notifications and analytics. Firebase collects device tokens and interaction events.
- **Stripe**: We receive transaction confirmations and limited payment method details from Stripe.
- **Google/Apple Sign-In**: If you sign in with Google or Apple, we receive your email and name from those providers.

### 3. How We Use Your Information

We use the collected information for the following purposes:

- **Provide and Maintain the Service**: Create and manage your account, process purchases, deliver content, sync progress across devices.
- **Personalize Your Experience**: Recommend books based on your preferences, adjust UI based on device type.
- **Communicate With You**: Send account notifications (password resets, purchase confirmations), respond to support inquiries, send marketing communications (with your consent).
- **Improve the Service**: Analyze usage patterns, fix bugs, add new features based on user behavior.
- **Security**: Detect and prevent fraud, abuse, and unauthorized access, enforce our Terms of Service.
- **Legal Compliance**: Comply with applicable laws, regulations, and legal processes.

### 4. Data Sharing and Disclosure

We do not sell your personal information. We may share your information in the following circumstances:

- **Service Providers**: We share data with third-party service providers who perform services on our behalf: cloud hosting (AWS), analytics (Sentry), payments (Stripe), push notifications (Firebase), email delivery (SendGrid).
- **Legal Requirements**: We may disclose information if required by law, subpoena, or other legal process, or to protect our rights, property, or safety.
- **Business Transfers**: In the event of a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction.
- **With Your Consent**: We may share your information for any other purpose with your explicit consent.

### 5. Data Retention

We retain your personal information for as long as your account is active or as needed to provide the Service. Specifically:
- **Account data**: Retained until you delete your account.
- **Purchase history**: Retained for 7 years for tax and accounting purposes.
- **Usage analytics**: Retained for 2 years in aggregated form.
- **Communication logs**: Retained for 1 year.
- **Crash reports**: Retained for 90 days.

### 6. Data Security

We implement appropriate technical and organizational measures to protect your personal information:
- Encryption in transit using TLS 1.3
- Encryption at rest using AES-256
- Secure token-based authentication with short-lived access tokens
- Regular security audits and penetration testing
- Employee access controls and training

### 7. Your Rights and Choices

Depending on your jurisdiction, you may have the following rights:

- **Access**: Request a copy of the personal data we hold about you.
- **Correction**: Request correction of inaccurate or incomplete data.
- **Deletion**: Request deletion of your personal data (subject to legal retention requirements).
- **Portability**: Request a machine-readable copy of your data.
- **Objection**: Object to processing of your data for marketing purposes.
- **Withdraw Consent**: Withdraw consent at any time where we rely on consent to process your data.

To exercise these rights, contact us at privacy@naik.com. We will respond within 30 days.

### 8. Children's Privacy

Naik is not intended for children under 13 years of age (or 16 in the European Economic Area). We do not knowingly collect personal information from children. If you believe a child has provided us with personal data, please contact us, and we will delete it.

### 9. International Data Transfers

Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place through Standard Contractual Clauses or equivalent mechanisms.

### 10. Changes to This Policy

We may update this Privacy Policy from time to time. We will notify you of material changes by email or through the app. Your continued use of the Service after changes constitutes acceptance of the updated policy.

### 11. Contact Us

If you have questions about this Privacy Policy, please contact us:

- Email: privacy@naik.com
- Address: Naik Inc., 123 Tech Street, San Francisco, CA 94105, USA
- Data Protection Officer: dpo@naik.com

---

## Terms of Service Template

**Last Updated**: January 15, 2025

### 1. Acceptance of Terms

By downloading, installing, or using Naik ("the App"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree, do not use the App.

### 2. Description of Service

Naik is a digital platform that provides access to audio books and e-books through streaming, downloading, and reading functionality. The Service includes:
- Access to a library of licensed digital books
- Audio streaming and offline playback
- E-book reading with sync across devices
- Personalized recommendations
- User accounts with progress tracking

### 3. Eligibility

You must be at least 13 years old (or 16 in the European Economic Area) to use Naik. By using the Service, you represent that you meet this age requirement.

### 4. Account Registration

- You must provide accurate, current, and complete information during registration.
- You are responsible for maintaining the confidentiality of your account credentials.
- You are responsible for all activities that occur under your account.
- Notify us immediately of any unauthorized use: security@naik.com.

### 5. Subscriptions and Purchases

#### 5.1 Subscription Plans

- Subscription plans provide access to content as described in the app.
- Plans auto-renew unless canceled at least 24 hours before the renewal date.
- You can manage and cancel subscriptions through your account settings or app store account.
- Free trials convert to paid subscriptions unless canceled before the trial ends.

#### 5.2 Individual Purchases

- Individual books may be purchased separately.
- Prices are displayed at the time of purchase.
- All purchases are final unless required by applicable consumer law.

#### 5.3 Refunds

- Refund requests for subscriptions should be directed to the app store (Google Play or App Store) where the purchase was made.
- For issues with individual books, contact support@naik.com within 14 days of purchase.

### 6. License to Use Content

- Naik grants you a limited, non-exclusive, non-transferable license to access and use content for personal, non-commercial purposes.
- Content may be streamed or downloaded for offline use within the app only.
- Downloaded content must not be copied, modified, distributed, or transferred outside the app.
- Downloaded content access expires if your subscription is canceled (for subscriber-only content).

### 7. User Conduct

You agree not to:
- Use the Service for any unlawful purpose
- Attempt to circumvent DRM or content protection measures
- Reverse engineer, decompile, or disassemble the app
- Use automated tools (bots, scrapers) to access the Service
- Share account credentials with unauthorized users
- Upload or transmit any malicious code
- Interfere with the proper functioning of the Service

### 8. Intellectual Property

- Naik, the Naik logo, and all related trademarks are owned by Naik Inc.
- All content in the app is licensed from publishers and authors and is protected by copyright.
- You may not reproduce, distribute, or create derivative works from our content without permission.

### 9. Termination

We may terminate or suspend your account at any time for violation of these Terms. Upon termination:
- Your access to the Service ceases immediately
- Downloaded content that requires online verification may become inaccessible
- No refunds for the current billing period

### 10. Disclaimer of Warranties

THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE." WE MAKE NO WARRANTIES, EXPRESS OR IMPLIED, REGARDING THE SERVICE, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.

### 11. Limitation of Liability

TO THE MAXIMUM EXTENT PERMITTED BY LAW, NAIK SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE SERVICE, INCLUDING LOST PROFITS, DATA LOSS, OR BUSINESS INTERRUPTION. OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT YOU PAID US IN THE 12 MONTHS PRECEDING THE CLAIM.

### 12. Indemnification

You agree to indemnify and hold Naik harmless from any claims, damages, losses, and expenses (including legal fees) arising from your violation of these Terms or your use of the Service.

### 13. Governing Law

These Terms shall be governed by the laws of the State of California, United States, without regard to conflict of law principles. Any disputes shall be resolved in the courts of San Francisco, California.

### 14. Changes to Terms

We may update these Terms at any time. We will notify you of material changes via email or app notification. Continued use after changes constitutes acceptance.

### 15. Contact

For questions about these Terms:
- Email: legal@naik.com
- Address: Naik Inc., 123 Tech Street, San Francisco, CA 94105, USA
