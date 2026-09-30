import prisma from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import { uploadFile, deleteFile } from '../../utils/signedUrl';
import { sanitizeSearchInput } from '../../utils/sanitizer';
import {
  getActivePlanId,
  hasContentAccess,
  resolveActivePlanFor,
} from '../../middleware/subscriptionGuard';

interface CreateBookData {
  title: string;
  description?: string;
  language?: string;
  isbn?: string;
  publisher?: string;
  publishDate?: Date;
  pageCount?: number;
  isFeatured?: boolean;
  isPremium?: boolean;
  isFree?: boolean;
  accessTier?: 'FREE' | 'PAID';
  requiredPlanId?: string | null;
  categoryIds?: string[];
  authorIds?: string[];
  tags?: string[];
}

interface BookQuery {
  page: number;
  limit: number;
  search?: string;
  category?: string;
  author?: string;
  authorId?: string;
  language?: string;
  isFeatured?: boolean;
  isPremium?: boolean;
  isFree?: boolean;
  accessTier?: 'FREE' | 'PAID';
  sort?: string;
  status?: string;
}

async function resolveTags(tagNames: string[]) {
  const tags = [];
  for (const name of tagNames) {
    // Upsert is atomic — avoids the find-then-create race (P2002) under concurrency.
    const tag = await prisma.tag.upsert({ where: { name }, update: {}, create: { name } });
    tags.push(tag);
  }
  return tags;
}

/**
 * Never expose paid media URLs in public list responses, and annotate `isLocked`
 * so clients can render a lock badge. The flag is advisory only — real media
 * access is always re-validated server-side (bookMediaProxy / detail endpoint).
 */
async function sanitizeListBooks(books: any[], userId?: string | null) {
  const activePlanId = await resolveActivePlanFor(userId, books);
  return books.map((book) => {
    const entitled = hasContentAccess(book, activePlanId);
    return {
      ...book,
      isLocked: !entitled,
      audioFiles: entitled ? book.audioFiles : [],
      pdfFiles: entitled ? book.pdfFiles : [],
    };
  });
}

export async function createBook(data: CreateBookData) {
  const { categoryIds, authorIds, tags: tagNames, ...bookData } = data;

  // Keep the legacy gating flag in sync when the new tier field is used.
  if (bookData.accessTier) {
    bookData.isPremium = bookData.accessTier === 'PAID';
  }

  let tagRecords: { id: string }[] = [];
  if (tagNames && tagNames.length > 0) {
    tagRecords = await resolveTags(tagNames);
  }

  const book = await prisma.book.create({
    data: {
      ...bookData,
      status: 'PUBLISHED',
      categories: categoryIds?.length
        ? { create: categoryIds.map((id) => ({ categoryId: id })) }
        : undefined,
      authors: authorIds?.length
        ? { create: authorIds.map((id) => ({ authorId: id })) }
        : undefined,
      tags: tagRecords.length
        ? { create: tagRecords.map((t) => ({ tagId: t.id })) }
        : undefined,
    },
    include: {
      authors: { include: { author: true } },
      categories: { include: { category: true } },
      tags: { include: { tag: true } },
    },
  });

  return book;
}

export async function updateBook(id: string, data: CreateBookData) {
  const existing = await prisma.book.findUnique({ where: { id } });
  if (!existing) throw new AppError('Book not found', 404);

  const { categoryIds, authorIds, tags: tagNames, ...bookData } = data;

  // Keep the legacy gating flag in sync when the new tier field is used.
  if (bookData.accessTier) {
    bookData.isPremium = bookData.accessTier === 'PAID';
  }

  if (categoryIds) {
    await prisma.bookCategory.deleteMany({ where: { bookId: id } });
  }

  if (authorIds) {
    await prisma.bookAuthor.deleteMany({ where: { bookId: id } });
  }

  if (tagNames) {
    await prisma.bookTag.deleteMany({ where: { bookId: id } });
  }

  let tagRecords: { id: string }[] = [];
  if (tagNames && tagNames.length > 0) {
    tagRecords = await resolveTags(tagNames);
  }

  const book = await prisma.book.update({
    where: { id },
    data: {
      ...bookData,
      categories: categoryIds
        ? { create: categoryIds.map((cid) => ({ categoryId: cid })) }
        : undefined,
      authors: authorIds
        ? { create: authorIds.map((aid) => ({ authorId: aid })) }
        : undefined,
      tags: tagRecords.length
        ? { create: tagRecords.map((t) => ({ tagId: t.id })) }
        : undefined,
    },
    include: {
      authors: { include: { author: true } },
      categories: { include: { category: true } },
      tags: { include: { tag: true } },
    },
  });

  return book;
}

export async function deleteBook(id: string) {
  const existing = await prisma.book.findUnique({ where: { id } });
  if (!existing) throw new AppError('Book not found', 404);

  await prisma.book.update({
    where: { id },
    data: { status: 'ARCHIVED' },
  });

  return { message: 'Book archived successfully' };
}

export async function getBookById(id: string, userId?: string) {
  const book = await prisma.book.findUnique({
    where: { id },
    include: {
      authors: { include: { author: true } },
      categories: { include: { category: true } },
      tags: { include: { tag: true } },
      reviews: {
        include: { user: { select: { id: true, name: true, avatarUrl: true } } },
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
      audioFiles: {
        include: { chapters: { orderBy: { trackOrder: 'asc' } } },
      },
      pdfFiles: true,
    },
  });

  if (!book) throw new AppError('Book not found', 404);

  let readingProgress = null;
  let listeningProgress = null;

  if (userId) {
    [readingProgress, listeningProgress] = await Promise.all([
      prisma.readingHistory.findUnique({
        where: { userId_bookId: { userId, bookId: id } },
      }),
      prisma.listeningHistory.findUnique({
        where: { userId_bookId: { userId, bookId: id } },
      }),
    ]);
  }

  const activePlanId = await getActivePlanId(userId);
  const entitled = hasContentAccess(book, activePlanId);

  return {
    ...book,
    isLocked: !entitled,
    audioFiles: entitled ? book.audioFiles : [],
    pdfFiles: entitled ? book.pdfFiles : [],
    readingProgress,
    listeningProgress,
  };
}

export async function getRelatedBooks(bookId: string, limit: number = 10, userId?: string | null) {
  const book = await prisma.book.findUnique({
    where: { id: bookId },
    include: { categories: { select: { categoryId: true } } },
  });
  if (!book) throw new AppError('Book not found', 404);

  const categoryIds = book.categories.map((c) => c.categoryId);

  if (categoryIds.length === 0) {
    const books = await prisma.book.findMany({
      where: { id: { not: bookId }, status: 'PUBLISHED' },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        authors: { include: { author: true } },
        categories: { include: { category: true } },
        audioFiles: { take: 1, include: { chapters: { orderBy: { trackOrder: 'asc' } } } },
        pdfFiles: { take: 1 },
      },
    });
    return sanitizeListBooks(books, userId);
  }

  const books = await prisma.book.findMany({
    where: {
      id: { not: bookId },
      status: 'PUBLISHED',
      categories: { some: { categoryId: { in: categoryIds } } },
    },
    take: limit,
    orderBy: { createdAt: 'desc' },
    include: {
      authors: { include: { author: true } },
      categories: { include: { category: true } },
      audioFiles: { take: 1, include: { chapters: { orderBy: { trackOrder: 'asc' } } } },
      pdfFiles: { take: 1 },
    },
  });
  return sanitizeListBooks(books, userId);
}

export async function listBooks(query: BookQuery, userId?: string | null) {
  const { page, limit, search, category, author, authorId, language, isFeatured, isPremium, isFree, accessTier, sort, status } = query;
  const sanitizedSearch = search ? sanitizeSearchInput(search) : undefined;

  const where: Record<string, unknown> = {};

  if (status) {
    where.status = status;
  } else {
    where.status = 'PUBLISHED';
  }

  if (sanitizedSearch) {
    where.title = { contains: sanitizedSearch, mode: 'insensitive' };
  }

  if (language) {
    where.language = language;
  }

  if (typeof isFeatured === 'boolean') {
    where.isFeatured = isFeatured;
  }

  if (typeof isPremium === 'boolean') {
    where.isPremium = isPremium;
  }

  if (typeof isFree === 'boolean') {
    where.isFree = isFree;
  }

  if (accessTier) {
    where.accessTier = accessTier;
  }

  if (category) {
    where.categories = { some: { categoryId: category } };
  }

  if (author) {
    where.authors = { some: { author: { name: { contains: author, mode: 'insensitive' } } } };
  }

  if (authorId) {
    where.authors = { some: { authorId } };
  }

  let orderBy: Record<string, string> = { createdAt: 'desc' };
  if (sort === 'newest') orderBy = { publishDate: 'desc' };
  else if (sort === 'popularity') orderBy = { viewCount: 'desc' };
  else if (sort === 'rating') orderBy = { avgRating: 'desc' };
  else if (sort === 'alphabetical') orderBy = { title: 'asc' };

  const [books, total] = await Promise.all([
    prisma.book.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy,
      include: {
        authors: { include: { author: { select: { id: true, name: true } } } },
        categories: { include: { category: { select: { id: true, name: true, slug: true } } } },
        audioFiles: { take: 1, include: { chapters: { orderBy: { trackOrder: 'asc' } } } },
        pdfFiles: { take: 1 },
      },
    }),
    prisma.book.count({ where }),
  ]);

  return { books: await sanitizeListBooks(books, userId), total };
}

export async function getFeaturedBooks(limit = 10, userId?: string | null) {
  const books = await prisma.book.findMany({
    where: { status: 'PUBLISHED', isFeatured: true },
    orderBy: { viewCount: 'desc' },
    take: limit,
    include: {
      authors: { include: { author: { select: { id: true, name: true } } } },
      categories: { include: { category: { select: { id: true, name: true } } } },
      audioFiles: { take: 1, include: { chapters: { orderBy: { trackOrder: 'asc' } } } },
      pdfFiles: { take: 1 },
    },
  });

  return sanitizeListBooks(books, userId);
}

export async function getTrendingBooks(limit = 10, userId?: string | null) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const books = await prisma.book.findMany({
    where: {
      status: 'PUBLISHED',
      createdAt: { gte: thirtyDaysAgo },
    },
    orderBy: { viewCount: 'desc' },
    take: limit,
    include: {
      authors: { include: { author: { select: { id: true, name: true } } } },
      categories: { include: { category: { select: { id: true, name: true } } } },
      audioFiles: { take: 1, include: { chapters: { orderBy: { trackOrder: 'asc' } } } },
      pdfFiles: { take: 1 },
    },
  });

  return sanitizeListBooks(books, userId);
}

export async function getNewReleases(page = 1, limit = 10, userId?: string | null) {
  const skip = (page - 1) * limit;
  const [books, total] = await Promise.all([
    prisma.book.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { publishDate: 'desc' },
      skip,
      take: limit,
      include: {
        authors: { include: { author: { select: { id: true, name: true } } } },
        categories: { include: { category: { select: { id: true, name: true } } } },
        audioFiles: { take: 1, include: { chapters: { orderBy: { trackOrder: 'asc' } } } },
        pdfFiles: { take: 1 },
      },
    }),
    prisma.book.count({ where: { status: 'PUBLISHED' } }),
  ]);

  return { books: await sanitizeListBooks(books, userId), total };
}

export async function getFreeBooks(limit = 10, userId?: string | null) {
  const books = await prisma.book.findMany({
    where: { status: 'PUBLISHED', isFree: true },
    take: limit,
    include: {
      authors: { include: { author: { select: { id: true, name: true } } } },
      categories: { include: { category: { select: { id: true, name: true } } } },
      audioFiles: { take: 1, include: { chapters: { orderBy: { trackOrder: 'asc' } } } },
      pdfFiles: { take: 1 },
    },
  });

  return sanitizeListBooks(books, userId);
}

export async function uploadBookCover(bookId: string, file: Express.Multer.File) {
  const book = await prisma.book.findUnique({ where: { id: bookId } });
  if (!book) throw new AppError('Book not found', 404);

  const key = await uploadFile(file.buffer, file.originalname, file.mimetype, 'covers');

  const updated = await prisma.book.update({
    where: { id: bookId },
    data: { coverUrl: key },
    select: { id: true, coverUrl: true },
  });

  return updated;
}

export async function uploadBookThumbnail(bookId: string, file: Express.Multer.File) {
  const book = await prisma.book.findUnique({ where: { id: bookId } });
  if (!book) throw new AppError('Book not found', 404);

  const key = await uploadFile(file.buffer, file.originalname, file.mimetype, 'thumbnails');

  const updated = await prisma.book.update({
    where: { id: bookId },
    data: { thumbnailUrl: key },
    select: { id: true, thumbnailUrl: true },
  });

  return updated;
}

export async function uploadBookAudio(
  bookId: string,
  file: Express.Multer.File,
  chapterTitle: string,
  trackOrder: number
) {
  const book = await prisma.book.findUnique({ where: { id: bookId } });
  if (!book) throw new AppError('Book not found', 404);

  const key = await uploadFile(file.buffer, file.originalname, file.mimetype, 'audio');

  // Calculate approximate duration from file size (rough: 1MB ≈ 1min at 128kbps)
  const approxDurationSeconds = Math.round(file.size / (128 * 1024 / 8));

  const audioFile = await prisma.audioFile.create({
    data: {
      bookId,
      fileUrl: key,
      durationSeconds: approxDurationSeconds,
      fileSizeBytes: file.size,
      format: file.originalname.endsWith('.m4a') ? 'm4a' : file.originalname.endsWith('.wav') ? 'wav' : 'mp3',
      chapters: {
        create: {
          title: chapterTitle || file.originalname,
          startSeconds: 0,
          endSeconds: approxDurationSeconds,
          trackOrder,
        },
      },
    },
    include: { chapters: { orderBy: { trackOrder: 'asc' } } },
  });

  return audioFile;
}

export async function deleteBookAudio(bookId: string, audioId: string) {
  const audio = await prisma.audioFile.findUnique({ where: { id: audioId } });
  if (!audio || audio.bookId !== bookId) throw new AppError('Audio file not found', 404);

  await deleteFile(audio.fileUrl);
  await prisma.audioFile.delete({ where: { id: audioId } });

  return { message: 'Audio file deleted' };
}

export async function uploadBookPdf(bookId: string, file: Express.Multer.File) {
  const book = await prisma.book.findUnique({ where: { id: bookId } });
  if (!book) throw new AppError('Book not found', 404);

  const key = await uploadFile(file.buffer, file.originalname, file.mimetype, 'pdfs');

  const pdfFile = await prisma.pdfFile.create({
    data: {
      bookId,
      fileUrl: key,
      fileSizeBytes: file.size,
      format: file.originalname.endsWith('.epub') ? 'epub' : 'pdf',
    },
  });

  return pdfFile;
}

export async function deleteBookPdf(bookId: string, pdfId: string) {
  const pdf = await prisma.pdfFile.findUnique({ where: { id: pdfId } });
  if (!pdf || pdf.bookId !== bookId) throw new AppError('PDF file not found', 404);

  await deleteFile(pdf.fileUrl);
  await prisma.pdfFile.delete({ where: { id: pdfId } });

  return { message: 'PDF file deleted' };
}

export async function incrementViewCount(bookId: string) {
  await prisma.book.update({
    where: { id: bookId },
    data: { viewCount: { increment: 1 } },
  });
}
