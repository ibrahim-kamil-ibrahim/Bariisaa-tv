import prisma from '../../config/database';
import { AppError } from '../../middleware/errorHandler';

export async function createBookmark(
  userId: string,
  data: {
    bookId: string;
    type: 'AUDIO' | 'PDF';
    position: string;
    label?: string;
    timestampSeconds?: number;
  }
) {
  const book = await prisma.book.findUnique({ where: { id: data.bookId } });
  if (!book) {
    throw new AppError('Book not found', 404);
  }

  return prisma.bookmark.create({
    data: {
      userId,
      bookId: data.bookId,
      type: data.type,
      position: data.position,
      label: data.label,
      timestampSeconds: data.timestampSeconds,
    },
    include: {
      book: {
        select: { id: true, title: true, coverUrl: true },
      },
    },
  });
}

export async function deleteBookmark(bookmarkId: string, userId: string) {
  const bookmark = await prisma.bookmark.findFirst({
    where: { id: bookmarkId, userId },
  });

  if (!bookmark) {
    throw new AppError('Bookmark not found', 404);
  }

  await prisma.bookmark.delete({
    where: { id: bookmarkId },
  });

  return { message: 'Bookmark deleted successfully' };
}

export async function getBookmarks(userId: string, bookId: string, type?: 'AUDIO' | 'PDF') {
  const where: any = { userId, bookId };
  if (type) where.type = type;

  return prisma.bookmark.findMany({
    where,
    include: {
      book: {
        select: { id: true, title: true, coverUrl: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getAllBookmarks(userId: string, page: number, limit: number) {
  const skip = (page - 1) * limit;

  const [bookmarks, total] = await Promise.all([
    prisma.bookmark.findMany({
      where: { userId },
      include: {
        book: {
          select: { id: true, title: true, coverUrl: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.bookmark.count({ where: { userId } }),
  ]);

  return { bookmarks, total, page, limit };
}
