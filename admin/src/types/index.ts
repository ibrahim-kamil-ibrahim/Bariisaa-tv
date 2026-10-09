export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string | null;
  role: 'user' | 'admin' | 'superadmin';
  roles: string[];
  status: 'active' | 'suspended' | 'banned';
  isVerified: boolean;
  isOnboarded: boolean;
  preferredLanguage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Book {
  id: string;
  title: string;
  description?: string;
  slug: string;
  isbn?: string;
  language: string;
  publisher?: string;
  publishDate?: string;
  pageCount?: number;
  duration?: number;
  coverUrl?: string | null;
  thumbnailUrl?: string | null;
  status: 'draft' | 'published' | 'archived';
  isFeatured: boolean;
  isPremium: boolean;
  isFree: boolean;
  accessTier?: 'FREE' | 'PAID';
  requiredPlanId?: string | null;
  price?: number;
  rating: number;
  ratingCount: number;
  categories: Category[];
  authors: Author[];
  audioFiles?: AudioFile[];
  pdfFiles?: PdfFile[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AudioFile {
  id: string;
  bookId: string;
  fileUrl: string;
  durationSeconds: number;
  fileSizeBytes: number;
  format: string;
  sampleUrl?: string | null;
  chapters: AudioChapter[];
  createdAt: string;
}

export interface AudioChapter {
  id: string;
  audioFileId: string;
  title: string;
  startSeconds: number;
  endSeconds: number;
  trackOrder: number;
}

export interface PdfFile {
  id: string;
  bookId: string;
  fileUrl: string;
  pageCount?: number | null;
  fileSizeBytes: number;
  format: string;
  sampleUrl?: string | null;
  createdAt: string;
}

export interface Author {
  id: string;
  name: string;
  bio?: string;
  photoUrl?: string | null;
  bookCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  iconEmoji?: string;
  route?: string;
  sortOrder: number;
  bookCount: number;
  createdAt: string;
  updatedAt: string;
}

export type AccessTier = 'FREE' | 'PAID';

export interface SubscriptionPlan {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  durationMonths: number;
  features: string[];
  isActive: boolean;
  popular: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Coupon {
  id: string;
  code: string;
  discountPercent: number;
  discountAmount: number;
  maxUses?: number;
  currentUses: number;
  expiresAt?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  userId: string;
  user?: { name: string; email: string };
  amount: number;
  currency: string;
  method: 'stripe' | 'chapa' | 'telebirr';
  status: 'completed' | 'pending' | 'failed' | 'cancelled';
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  title: string;
  body: string;
  type: 'info' | 'promotion' | 'update' | 'alert';
  target: 'all' | 'premium' | 'active' | 'specific';
  userIds?: string[];
  readAt?: string | null;
  createdAt: string;
}

export interface Report {
  totalUsers: number;
  activeSubscriptions: number;
  totalRevenue: number;
  totalBooks: number;
  newUsersToday: number;
  revenueToday: number;
  totalAuthors: number;
  totalCategories: number;
}

export interface Permission {
  id: string;
  resource: string;
  action: string;
  description?: string;
}

export interface AuditLog {
  id: string;
  userId?: string | null;
  user?: { name: string | null; email: string | null } | null;
  action: string;
  resource: string;
  resourceId?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
