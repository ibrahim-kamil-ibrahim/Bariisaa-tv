import prisma from '../../config/database';
import { AppError } from '../../middleware/errorHandler';

export async function toggleFavorite(userId: string, bookId: string) {
  const book = await prisma.book.findUnique({ where: { id: bookId } });
  if (!book) {
    throw new AppError('Book not found', 404);
  }

  const existing = await prisma.favorite.findUnique({
    where: {
      userId_bookId: { userId, bookId },
    },
  });

  if (existing) {
    await prisma.favorite.delete({
      where: { id: existing.id },
    });
    return { isFavorited: false };
  }

  await prisma.favorite.create({
    data: { userId, bookId },
  });

  return { isFavorited: true };
}

export async function getFavorites(userId: string, page: number, limit: number) {
  const skip = (page - 1) * limit;

  const [favorites, total] = await Promise.all([
    prisma.favorite.findMany({
      where: { userId },
      include: {
        book: {
          select: {
            id: true,
            title: true,
            description: true,
            coverUrl: true,
            thumbnailUrl: true,
            language: true,
            avgRating: true,
            ratingCount: true,
            isPremium: true,
            isFree: true,
            authors: {
              include: {
                author: {
                  select: { id: true, name: true },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.favorite.count({ where: { userId } }),
  ]);

  return { favorites, total, page, limit };
}

export async function isFavorite(userId: string, bookId: string): Promise<boolean> {
  const favorite = await prisma.favorite.findUnique({
    where: {
      userId_bookId: { userId, bookId },
    },
  });

  return !!favorite;
}
