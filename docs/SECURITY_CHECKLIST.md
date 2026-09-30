# Production Security Checklist — Naik Audio Book & E-Book Platform

> **Phase 40** | Comprehensive security audit covering authentication, data protection, API security, DRM, infrastructure, payments, mobile security, and compliance.

---

## How to Use This Checklist

Each item includes:
- **Description** — What the control does and why it matters
- **Status** — [ ] Not implemented / [x] Implemented / [~] Partial
- **Configuration Details** — Specific configuration values, file paths, commands

Go through each section before every production release. Items marked with **CRITICAL** must be addressed before launch.

---

## 1. Authentication & Authorization

### 1.1 JWT Token Rotation
- **Description**: Access tokens expire after 15 minutes. Refresh tokens expire after 7 days and are rotated on each use (old refresh token is invalidated when a new one is issued).
- **Status**: [ ]
- **Configuration**:
  ```env
  JWT_EXPIRATION=15m
  JWT_REFRESH_EXPIRATION=7d
  JWT_SECRET=<64-char-random-hex>
  JWT_REFRESH_SECRET=<64-char-random-hex>
  ```
  Generate secrets: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
- **Implementation**: `backend/src/auth/auth.service.ts:45`

### 1.2 Password Hashing (bcrypt)
- **Description**: All passwords are hashed with bcrypt at cost factor 12 before storage. Raw passwords are never logged or stored.
- **Status**: [ ]
- **Configuration**:
  ```ts
  const salt = await bcrypt.genSalt(12);
  const hashedPassword = await bcrypt.hash(password, salt);
  ```
- **Verification**: Check DB -- passwords in `user` table must not be plaintext. Run: `SELECT LENGTH(password) FROM "user" LIMIT 1;` -- should return 60.

### 1.3 Role-Based Access Control (RBAC)
- **Description**: Three roles: `USER`, `AUTHOR`, `ADMIN`. Guard decorators enforce access at the controller level. Admin routes check `role === 'ADMIN'` via custom decorator.
- **Status**: [ ]
- **Configuration**:
  ```ts
  export const ROLES_KEY = 'roles';
  export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

  @Post()
  @Roles('ADMIN')
  async createBook(@Body() dto: CreateBookDto) { ... }
  ```
- **Verification**: Test that `USER` role receives 403 on `/api/admin/*` endpoints.

### 1.4 Rate Limiting
- **Description**: Throttle middleware limits requests per IP. Default: 100 requests per 60 seconds. Auth endpoints have stricter limits (10 requests per 15 minutes).
- **Status**: [ ]
- **Configuration**:
  ```env
  THROTTLE_TTL=60
  THROTTLE_LIMIT=100
  ```
  ```ts
  @Throttle({ default: { limit: 10, ttl: 900000 } })
  @Post('login')
  async login(@Body() dto: LoginDto) { ... }
  ```
- **Verification**: Send 11 rapid requests to `/api/auth/login` -- 11th should return 429.

### 1.5 Session Management
- **Description**: Server-side refresh token stored hashed in DB. On logout, token is invalidated server-side. User can revoke all sessions from profile settings.
- **Status**: [ ]
- **Configuration**: `backend/src/prisma/schema.prisma` -- User model has `refreshToken` field.

### 1.6 Multi-Factor Authentication (Future)
- **Description**: MFA via TOTP (Google Authenticator) or SMS codes. Not implemented in v1 but architecture supports adding it.
- **Status**: [~]
- **Notes**: Auth service has `enableMfa()` and `verifyMfaCode()` method stubs.

### 1.7 Account Lockout
- **Description**: After 5 consecutive failed login attempts, account is locked for 15 minutes. Lockout count resets on successful login.
- **Status**: [ ]
- **Configuration**:
  ```env
  MAX_LOGIN_ATTEMPTS=5
  LOCKOUT_DURATION_MINUTES=15
  ```

---

## 2. Data Protection

### 2.1 AES-256 Encryption at Rest
- **Description**: Media files stored on S3 are encrypted at rest using SSE-S3 or SSE-KMS. Database volume uses EBS encryption.
- **Status**: [ ]
- **Configuration**:
  ```bash
  aws s3api put-bucket-encryption --bucket naik-production-assets --server-side-encryption-configuration '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'
  ```

### 2.2 TLS 1.3 in Transit
- **Description**: All API traffic uses TLS 1.3. TLS 1.0 and 1.1 are disabled.
- **Status**: [ ]
- **Configuration**:
  ```nginx
  ssl_protocols TLSv1.2 TLSv1.3;
  ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
  ssl_prefer_server_ciphers on;
  ssl_session_cache shared:SSL:10m;
  ssl_session_timeout 1d;
  ssl_session_tickets off;
  ```
- **Verification**: Use ssllabs.com/ssltest/

### 2.3 Signed URLs (1hr Expiry)
- **Description**: Audio and book file access uses S3 pre-signed URLs with 1-hour expiry. Users cannot access files directly.
- **Status**: [ ]
- **Configuration**:
  ```ts
  import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
  import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
  async getSignedFileUrl(key: string): Promise<string> {
    const command = new GetObjectCommand({ Bucket: 'naik-production-assets', Key: key });
    return getSignedUrl(this.s3Client, command, { expiresIn: 3600 });
  }
  ```

### 2.4 No Plaintext Secrets
- **Description**: Environment variables manage all secrets. No secrets in code. `.env` files are never committed.
- **Status**: [ ]
- **Configuration**: `.gitignore` includes `.env`, `*.jks`, `*.p12`, `*.pem`, `google-services.json`, `GoogleService-Info.plist`

### 2.5 Encryption Key Rotation
- **Description**: JWT secrets are rotated every 90 days. KMS keys on S3 are rotated annually.
- **Status**: [ ]
- **Configuration**: Calendar reminder for JWT secret rotation every 90 days. `aws kms enable-key-rotation --key-id alias/naik-s3-key`

### 2.6 Personal Data Encryption
- **Description**: PII fields (email, name, phone) are encrypted at rest using PostgreSQL pgcrypto.
- **Status**: [~]
- **Configuration**:
  ```sql
  CREATE EXTENSION IF NOT EXISTS pgcrypto;
  UPDATE "user" SET email = pgp_sym_encrypt(email, current_setting('app.encryption_key'));
  ```

---

## 3. API Security

### 3.1 Helmet Security Headers
- **Description**: All API responses include Helmet middleware: HSTS, CSP, X-Frame-Options, X-Content-Type-Options.
- **Status**: [ ]
- **Configuration**:
  ```ts
  import helmet from 'helmet';
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        scriptSrc: ["'self'"],
        connectSrc: ["'self'", "https://api.naik.com"],
      },
    },
    hsts: { maxAge: 63072000, includeSubDomains: true, preload: true },
  }));
  ```
- **Verification**: `curl -I https://api.naik.com` -- check for security headers.

### 3.2 CORS Whitelist
- **Description**: CORS configured with specific origins. No wildcard in production.
- **Status**: [ ]
- **Configuration**:
  ```ts
  app.enableCors({
    origin: ['https://admin.naik.com', 'https://naik.com'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 86400,
  });
  ```
- **Verification**: Cross-origin requests from unknown domains should be blocked.

### 3.3 Input Validation (Zod)
- **Description**: All request bodies validated with Zod schemas. Invalid input returns 400.
- **Status**: [ ]
- **Configuration**:
  ```ts
  export const CreateBookSchema = z.object({
    title: z.string().min(1).max(200),
    description: z.string().min(10).max(5000),
    price: z.number().positive().max(999.99),
    categories: z.array(z.string()).min(1).max(5),
    authors: z.array(z.string()).min(1).max(5),
  });
  ```
- **Verification**: Send `{"price": -5}` -- should return 400.

### 3.4 Request Size Limits (10MB)
- **Description**: Max request body is 10MB for JSON. File uploads have 500MB limit.
- **Status**: [ ]
- **Configuration**: `app.use(json({ limit: '10mb' }));` and `client_max_body_size 500M;` in nginx.

### 3.5 SQL Injection Prevention (Prisma)
- **Description**: All queries use Prisma ORM with parameterized queries. No raw SQL.
- **Status**: [ ]
- **Configuration**: Grep for `$queryRaw` and `$executeRaw`; ensure no string interpolation.

### 3.6 API Versioning
- **Description**: All routes prefixed with `/api/v1/`. Enables backward-compatible updates.
- **Status**: [ ]
- **Configuration**: `app.setGlobalPrefix('api/v1');`

---

## 4. Content Protection (DRM)

### 4.1 AES-256 Offline Encryption
- **Description**: Downloaded audio books encrypted with AES-256 before saving. Keys in OS keychain/keystore.
- **Status**: [ ]
- **Configuration**:
  ```dart
  class EncryptionService {
    Future<Encrypted> encryptFile(File file, String key) async {
      final encrypter = Encrypter(AES(Key.fromUtf8(key)));
      final plaintext = await file.readAsBytes();
      return encrypter.encryptBytes(plaintext);
    }
  }
  ```

### 4.2 Device-Bound Keys
- **Description**: Content decryption keys tied to device ID and user account. Key fetched on device A cannot be used on device B.
- **Status**: [ ]
- **Configuration**: Backend generates per-device RSA key pair on first launch. Public key stored server-side.

### 4.3 Screenshot Blocking (FLAG_SECURE)
- **Description**: Android FLAG_SECURE set during reader/player view. Screenshots and screen recording blocked.
- **Status**: [ ]
- **Configuration**:
  ```kotlin
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    window.setFlags(WindowManager.LayoutParams.FLAG_SECURE, WindowManager.LayoutParams.FLAG_SECURE)
  }
  ```

### 4.4 Screen Recording Detection
- **Description**: Detect screen recording on both platforms. Pause playback with warning.
- **Status**: [ ]
- **Configuration**: Platform-specific callbacks for `MediaProjection` (Android) and `UIScreen.captured` (iOS).

### 4.5 Signed Time-Limited Streaming URLs
- **Description**: Streaming URLs include signature and expiration. 1 hour for streaming, 48 hours for download.
- **Status**: [ ]
- **Configuration**: `getSignedUrl(s3Client, command, { expiresIn: 3600 });`

### 4.6 Download Expiry with Subscription
- **Description**: Downloaded content expires when subscription lapses. Local files removed on expiry.
- **Status**: [ ]
- **Configuration**:
  ```dart
  Future<void> checkDownloadsAccess() async {
    final isActive = await subscriptionRepository.isActive();
    if (!isActive) await localFileService.removeAllDownloads();
  }
  ```

---

## 5. Infrastructure Security

### 5.1 SSL/TLS Everywhere
- **Description**: All services communicate over TLS. Certificates auto-renewed via Let's Encrypt.
- **Status**: [ ]
- **Configuration**: `0 3 * * * /usr/bin/certbot renew --quiet --post-hook "systemctl reload nginx"`

### 5.2 Firewall (UFW / Security Groups)
- **Description**: Only ports 22, 80, 443 open. Security Groups enforce network segmentation.
- **Status**: [ ]
- **Configuration**:
  ```bash
  sudo ufw default deny incoming
  sudo ufw default allow outgoing
  sudo ufw allow 22/tcp
  sudo ufw allow 80/tcp
  sudo ufw allow 443/tcp
  sudo ufw enable
  ```

### 5.3 DDoS Protection (Cloudflare / AWS Shield)
- **Description**: Cloudflare proxying all public traffic. AWS Shield Standard for layer 3/4 protection.
- **Status**: [ ]
- **Configuration**: Enable Cloudflare proxy (orange cloud). Enable WAF rate limiting rules.

### 5.4 Automated Backups
- **Description**: Daily database backups with 30-day retention. EBS snapshots for instance recovery.
- **Status**: [ ]
- **Configuration**:
  ```bash
  # Daily PostgreSQL backup
  0 2 * * * pg_dump -U naik_user naik_db | gzip > /backups/naik-db-$(date +%Y%m%d).sql.gz
  # Retain 30 days
  0 3 * * * find /backups/ -name "*.sql.gz" -mtime +30 -delete
  ```

### 5.5 Monitoring (Datadog / Sentry)
- **Description**: Application performance monitoring with Datadog. Error tracking with Sentry. Uptime monitoring with health checks.
- **Status**: [ ]
- **Configuration**:
  ```ts
  import * as Sentry from '@sentry/node';
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.2,
  });
  ```

### 5.6 Intrusion Detection
- **Description**: Fail2ban blocks IPs after repeated failed SSH/auth attempts. AWS GuardDuty for threat detection.
- **Status**: [ ]
- **Configuration**:
  ```bash
  sudo apt install -y fail2ban
  sudo systemctl enable fail2ban
  # Custom jail for API rate limit bypass
  sudo fail2ban-client set naik-api banip <offending-ip>
  ```

### 5.7 Secrets Management
- **Description**: Production secrets stored in AWS Secrets Manager. Rotated automatically. Never in environment files on disk.
- **Status**: [ ]
- **Configuration**: Secrets Manager with Lambda rotation for DB credentials.

---

## 6. Payment Security

### 6.1 Stripe Webhook Signature Verification
- **Description**: Every webhook event verified using Stripe's signature header. Rejected if tampered.
- **Status**: [ ]
- **Configuration**:
  ```ts
  const sig = req.headers['stripe-signature'];
  const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  ```

### 6.2 Idempotency Keys
- **Description**: Payment intents use idempotency keys to prevent duplicate charges on retry.
- **Status**: [ ]
- **Configuration**: `stripe.paymentIntents.create({ amount, currency }, { idempotencyKey: req.idempotencyKey });`

### 6.3 PCI Compliance via Stripe
- **Description**: All card data handled by Stripe directly via Elements or Checkout. No raw card numbers touch our servers.
- **Status**: [x]
- **Configuration**: Using Stripe Elements with `stripe.card` tokenization. SAQ A validated annually.

### 6.4 No Raw Card Data
- **Description**: Application never logs, stores, or transmits raw PAN/CVV data. Only Stripe token or payment method ID stored.
- **Status**: [x]
- **Verification**: Grep for `card_number`, `cvv`, `ccNumber` in codebase -- should return zero matches.

### 6.5 Refund Handling
- **Description**: Admin panel allows full and partial refunds via Stripe API. Refund reason logged for audit.
- **Status**: [ ]
- **Configuration**: `stripe.refunds.create({ paymentIntent: pi_id, amount: partial_amount });`

---

## 7. Mobile Security

### 7.1 Flutter Code Obfuscation
- **Description**: Release builds use Flutter code obfuscation to make reverse engineering difficult.
- **Status**: [ ]
- **Configuration**:
  ```bash
  flutter build appbundle --release --obfuscate --split-debug-info=build/debug-info
  flutter build ios --release --obfuscate --split-debug-info=build/debug-info
  ```

### 7.2 Firebase App Check
- **Description**: App Check verifies requests originate from genuine app instances. Blocks requests from unknown sources.
- **Status**: [ ]
- **Configuration**:
  ```dart
  await FirebaseAppCheck.instance.activate(
    androidProvider: AndroidProvider.playIntegrity,
    appleProvider: AppleProvider.appAttest,
  );
  ```

### 7.3 Certificate Pinning
- **Description**: App pins TLS certificates for api.naik.com to prevent MITM attacks via forged certificates.
- **Status**: [ ]
- **Configuration**: Using `http_client` with pinned SHA-256 fingerprints:
  ```dart
  final httpClient = IOClient(
    HttpClient()..badCertificateCallback = (cert, host, port) => false,
  );
  ```
  Android: `res/xml/network_security_config.xml`:
  ```xml
  <network-security-config>
    <domain-config cleartextTrafficPermitted="false">
      <domain includeSubdomains="true">api.naik.com</domain>
      <pin-set expiration="2026-12-31">
        <pin digest="SHA-256">base64encodedpinfingerprint=</pin>
      </pin-set>
    </domain-config>
  </network-security-config>
  ```

### 7.4 Secure Storage (Keystore / Keychain)
- **Description**: Tokens and decryption keys stored in platform secure storage. Not in SharedPreferences or NSUserDefaults.
- **Status**: [ ]
- **Configuration**:
  ```dart
  import 'package:flutter_secure_storage/flutter_secure_storage.dart';
  final storage = FlutterSecureStorage();
  await storage.write(key: 'auth_token', value: token);
  ```

### 7.5 Jailbreak / Root Detection
- **Description**: App detects jailbroken/rooted devices and prevents access to DRM content.
- **Status**: [ ]
- **Configuration**: Using `jailbreak_utils` package:
  ```dart
  if (await JailbreakUtils.isJailbroken()) {
    showLockScreen(); // Or restrict to non-DRM content only
  }
  ```

### 7.6 Biometric Authentication
- **Description**: Optional biometric lock (fingerprint/face) for opening the app and accessing purchases.
- **Status**: [ ]
- **Configuration**: Using `local_auth` package:
  ```dart
  final auth = LocalAuthentication();
  final authenticated = await auth.authenticate(
    localizedReason: 'Authenticate to access Naik',
    biometricOnly: true,
  );
  ```

---

## 8. Compliance

### 8.1 GDPR Data Access / Deletion
- **Description**: Users can request a copy of all their personal data or request account deletion. Data exported as JSON within 30 days.
- **Status**: [ ]
- **Configuration**: `/api/v1/user/data` exports all PII. `/api/v1/user/delete` triggers cascade deletion.

### 8.2 Privacy Policy
- **Description**: Public privacy policy covering data collection, usage, sharing, retention, and user rights.
- **Status**: [ ]
- **Configuration**: Available at `/privacy` on website. Updated annually or on material change.

### 8.3 Cookie Consent
- **Description**: Cookie consent banner on admin panel and marketing site. Users must opt in before non-essential cookies.
- **Status**: [ ]
- **Configuration**: Only essential cookies set by default. Google Analytics requires consent.

### 8.4 Data Retention Policy
- **Description**: Audit logs retained for 2 years. User data retained until account deletion request. Payment data retained for 7 years (tax compliance).
- **Status**: [ ]
- **Configuration**:
  ```ts
  // Cron job runs monthly
  @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT)
  async cleanupOldLogs() {
    const cutoff = new Date();
    cutoff.setFullYear(cutoff.getFullYear() - 2);
    await this.prisma.auditLog.deleteMany({ where: { createdAt: { lt: cutoff } } });
  }
  ```

### 8.5 Audit Logging (2 Years)
- **Description**: All admin actions, payment events, and sensitive data access logged with user ID, action, timestamp, IP address.
- **Status**: [ ]
- **Configuration**:
  ```ts
  // audit-log.interceptor.ts
  @Injectable()
  export class AuditLogInterceptor implements NestInterceptor {
    async intercept(context: ExecutionContext, next: CallHandler) {
      const request = context.switchToHttp().getRequest();
      const user = request.user;
      const response = await next.handle().toPromise();
      await this.prisma.auditLog.create({
        data: {
          userId: user?.id,
          action: `${request.method} ${request.route.path}`,
          ip: request.ip,
          userAgent: request.headers['user-agent'],
          timestamp: new Date(),
        },
      });
      return response;
    }
  }
  ```

### 8.6 Age Verification
- **Description**: Users must confirm they are 13+ (or 16+ in EU) during signup. Content with age restrictions requires age verification.
- **Status**: [ ]
- **Configuration**: Checkbox during registration: "I confirm I am 13 years or older."

### 8.7 Accessibility Compliance (WCAG 2.1)
- **Description**: Admin panel and mobile app aim for WCAG 2.1 AA compliance. Screen reader support, sufficient color contrast, keyboard navigation.
- **Status**: [~]
- **Configuration**: Audit with axe DevTools. Target contrast ratio 4.5:1 for normal text.

---

## 9. Security Incident Response Plan

### 9.1 Response Steps
1. **Detect**: Automated monitoring (Sentry, Datadog) alerts on-call engineer.
2. **Triage**: Within 15 minutes, determine severity (Critical/High/Medium/Low).
3. **Contain**: For critical incidents, block offending IPs, rotate secrets, take instance offline.
4. **Investigate**: Review logs, determine root cause and data impact.
5. **Eradicate**: Patch vulnerability, update dependencies, rotate all affected credentials.
6. **Recover**: Restore from clean backup, verify system integrity.
7. **Notify**: Inform affected users within 72 hours (GDPR). Publish post-mortem.

### 9.2 Key Contacts
| Role | Name | Contact |
|------|------|---------|
| Security Lead | TBD | security@naik.com |
| DevOps Lead | TBD | devops@naik.com |
| Legal / DPO | TBD | legal@naik.com |
| On-Call Engineer | Rotation | pager@naik.com |

### 9.3 Communication Templates

**Data Breach Notification**:
```
Subject: Security Incident Notification - Naik

Dear [User],

We are writing to notify you of a security incident that may involve your personal data.

Date of Incident: [DATE]
What Happened: [Brief description]
Data Involved: [Types of data affected]
Actions Taken: [Steps we've taken]
What You Should Do: [Recommendations, e.g., change password]

We sincerely apologize for this incident. If you have questions, contact security@naik.com.

Sincerely,
The Naik Security Team
```

---

## 10. Security Testing Schedule

| Test Type | Frequency | Tool / Method |
|-----------|-----------|---------------|
| SAST (Static Analysis) | Every commit | SonarQube, ESLint security plugin |
| DAST (Dynamic Analysis) | Weekly | OWASP ZAP |
| Dependency Scan | Weekly | `npm audit`, Dependabot, Snyk |
| Penetration Test | Quarterly | Third-party security firm |
| Bug Bounty Program | Continuous | HackerOne / Intigriti |
| Compliance Audit | Annually | SOC 2 Type II (planned v2) |

### Dependency Audit Command
```bash
cd backend
npm audit --production
npm audit fix --production

cd admin
npm audit --production

# Snyk scan
npx snyk test --all-projects
```

### OWASP ZAP Baseline Scan
```bash
docker run -t owasp/zap2docker-stable zap-baseline.py \
  -t https://api.naik.com \
  -r zap-report.html \
  -I
```

---

## Quick Audit Summary

| Section | Items | Critical | Implemented | Partial | Not Started |
|---------|-------|----------|-------------|---------|-------------|
| Auth & Authz | 7 | 4 | 0 | 1 | 6 |
| Data Protection | 6 | 3 | 0 | 1 | 5 |
| API Security | 6 | 3 | 0 | 0 | 6 |
| Content Protection (DRM) | 6 | 3 | 0 | 0 | 6 |
| Infrastructure | 7 | 4 | 0 | 0 | 7 |
| Payment Security | 5 | 3 | 2 | 0 | 3 |
| Mobile Security | 6 | 3 | 0 | 0 | 6 |
| Compliance | 7 | 2 | 0 | 1 | 6 |
| **Total** | **50** | **25** | **2** | **3** | **45** |

> Run this checklist before every production release. Critical items must be resolved before launch.
