import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import path from 'path';
import { env } from './config/environment';
import { generalLimiter, securityHeaders } from './middleware/rateLimiter';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { authenticate } from './middleware/authenticate';
import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/users/user.routes';
import bookRoutes from './modules/books/book.routes';
import categoryRoutes from './modules/categories/category.routes';
import authorRoutes from './modules/authors/author.routes';
import subscriptionRoutes from './modules/subscriptions/subscription.routes';
import paymentRoutes from './modules/payments/payment.routes';
import bookmarkRoutes from './modules/bookmarks/bookmark.routes';
import noteRoutes from './modules/notes/note.routes';
import highlightRoutes from './modules/highlights/highlight.routes';
import favoriteRoutes from './modules/favorites/favorite.routes';
import reviewRoutes from './modules/reviews/review.routes';
import notificationRoutes from './modules/notifications/notification.routes';
import deviceRoutes from './modules/devices/device.routes';
import reportRoutes from './modules/reports/report.routes';
import historyRoutes from './modules/history/history.routes';
import recommendationRoutes from './modules/recommendations/recommendation.routes';
import couponRoutes from './modules/coupons/coupon.routes';
import roleRoutes from './modules/roles/role.routes';
import auditLogRoutes from './modules/audit_logs/audit_log.routes';
import settingsRoutes from './modules/settings/settings.routes';
import storytellingRoutes from './modules/storytelling/storytelling.routes';
import musicRoutes from './modules/music/music.routes';
import myDoctorRoutes from './modules/my-doctor/my-doctor.routes';
import myCaptainRoutes from './modules/my-captain/my-captain.routes';
import habitRoutes from './modules/habits/habit.routes';
import globalSearchRoutes from './modules/global-search/global-search.routes';
import savedFilterRoutes from './modules/saved-filters/saved-filters.routes';
import bulkActionRoutes from './modules/bulk-actions/bulk-actions.routes';
import activityTimelineRoutes from './modules/activity-timeline/activity-timeline.routes';
import mediaRoutes from './modules/media/media.routes';
import cmsRoutes from './modules/cms/cms.routes';
import invoiceRoutes from './modules/invoices/invoices.routes';
import backupRoutes from './modules/backups/backups.routes';
import userDetailRoutes from './modules/user-detail/user-detail.routes';
import permissionsRoutes from './modules/permissions/permissions.routes';
import reportBuilderRoutes from './modules/report-builder/report-builder.routes';
import liveMonitoringRoutes from './modules/live-monitoring/live-monitoring.routes';
import oauthRoutes from './modules/oauth/oauth.routes';
import messagingRoutes from './modules/messaging/messaging.routes';
import contentAccessRoutes from './modules/content-access/content-access.routes';
import { swaggerUiServe, swaggerUiSetup, docsPath } from './docs/swagger';

const app = express();

app.set('trust proxy', 1);

// Block obvious scanner/bot user-agents
app.use(securityHeaders);

const allowedOrigins = env.CORS_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean);
if (env.NODE_ENV === 'production' && allowedOrigins.includes('*')) {
  throw new Error('Wildcard CORS origin is not allowed in production');
}

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      return callback(null, origin);
    }
    if (env.NODE_ENV !== 'production') {
      if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
        return callback(null, origin);
      }
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Enforce HTTPS in production
if (env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
      return next();
    }
    res.redirect(301, `https://${req.headers.host}${req.url}`);
  });
}

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      // 'unsafe-eval' and dev origins are production-only relaxations removed;
      // 'unsafe-inline' stays for Swagger UI's inline init script at /api/v1/docs.
      scriptSrc: env.NODE_ENV === 'production'
        ? ["'self'", "'unsafe-inline'"]
        : ["'self'", "'unsafe-eval'", "'unsafe-inline'"],
      connectSrc: env.NODE_ENV === 'production'
        ? ["'self'"]
        : ["'self'", 'http://localhost:*', 'http://127.0.0.1:*', 'http://localhost:5173'],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: env.NODE_ENV === 'production'
        ? ["'none'"]
        : ["'self'", 'http://localhost:5173'],
      upgradeInsecureRequests: [],
    },
  },
  hsts: {
    maxAge: 63072000,
    includeSubDomains: true,
    preload: true,
  },
  frameguard: false,
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
}));

app.use(compression());

// Stripe webhook needs raw body BEFORE express.json() parses it
app.use(`${env.API_PREFIX}/payments/webhooks/stripe`, express.raw({ type: 'application/json' }));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(generalLimiter);

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
app.get('/api/v1/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Interactive API documentation (OpenAPI 3 + Swagger UI)
app.use(docsPath, swaggerUiServe, swaggerUiSetup);

app.use(`${env.API_PREFIX}/auth`, authRoutes);
app.use(`${env.API_PREFIX}/users`, userRoutes);
app.use(`${env.API_PREFIX}/books`, bookRoutes);
app.use(`${env.API_PREFIX}/categories`, categoryRoutes);
app.use(`${env.API_PREFIX}/authors`, authorRoutes);
app.use(`${env.API_PREFIX}/subscriptions`, subscriptionRoutes);
app.use(`${env.API_PREFIX}/payments`, paymentRoutes);
app.use(`${env.API_PREFIX}/bookmarks`, bookmarkRoutes);
app.use(`${env.API_PREFIX}/notes`, noteRoutes);
app.use(`${env.API_PREFIX}/highlights`, highlightRoutes);
app.use(`${env.API_PREFIX}/favorites`, favoriteRoutes);
app.use(`${env.API_PREFIX}/reviews`, reviewRoutes);
app.use(`${env.API_PREFIX}/notifications`, notificationRoutes);
app.use(`${env.API_PREFIX}/devices`, deviceRoutes);
app.use(`${env.API_PREFIX}/reports`, reportRoutes);
app.use(`${env.API_PREFIX}/history`, historyRoutes);
app.use(`${env.API_PREFIX}/recommendations`, recommendationRoutes);
app.use(`${env.API_PREFIX}/coupons`, couponRoutes);
app.use(`${env.API_PREFIX}/roles`, roleRoutes);
app.use(`${env.API_PREFIX}/audit-logs`, auditLogRoutes);
app.use(`${env.API_PREFIX}/settings`, settingsRoutes);
app.use(`${env.API_PREFIX}/storytelling`, storytellingRoutes);
app.use(`${env.API_PREFIX}/music`, musicRoutes);
app.use(`${env.API_PREFIX}/my-doctor`, myDoctorRoutes);
app.use(`${env.API_PREFIX}/my-captain`, myCaptainRoutes);
app.use(`${env.API_PREFIX}/habits`, habitRoutes);
app.use(`${env.API_PREFIX}/search`, globalSearchRoutes);
app.use(`${env.API_PREFIX}/filters`, savedFilterRoutes);
app.use(`${env.API_PREFIX}/bulk`, bulkActionRoutes);
app.use(`${env.API_PREFIX}/activity`, activityTimelineRoutes);
app.use(`${env.API_PREFIX}/media`, mediaRoutes);
app.use(`${env.API_PREFIX}/cms`, cmsRoutes);
app.use(`${env.API_PREFIX}/invoices`, invoiceRoutes);
app.use(`${env.API_PREFIX}/backups`, backupRoutes);
app.use(`${env.API_PREFIX}/user-detail`, userDetailRoutes);
app.use(`${env.API_PREFIX}/permissions`, permissionsRoutes);
app.use(`${env.API_PREFIX}/report-builder`, reportBuilderRoutes);
app.use(`${env.API_PREFIX}/live`, liveMonitoringRoutes);
app.use(`${env.API_PREFIX}/oauth`, oauthRoutes);
app.use(`${env.API_PREFIX}/messages`, messagingRoutes);
app.use(`${env.API_PREFIX}/admin/content`, contentAccessRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
