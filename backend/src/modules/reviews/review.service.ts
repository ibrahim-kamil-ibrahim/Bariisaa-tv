import prisma from '../../config/database';
import { AppError } from '../../middleware/errorHandler';

async function recalculateBookRating(bookId: string) {
  const reviews = await prisma.review.findMany({
    where: { bookId },
    select: { rating: true },
  });

  const count = reviews.length;
  const avgRating = count > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / count : 0;

  await prisma.book.update({
    where: { id: bookId },
    data: {
      avgRating: Math.round(avgRating * 100) / 100,
      ratingCount: count,
    },
  });
}

export async function createReview(
  userId: string,
  data: {
    bookId: string;
    rating: number;
    content?: string;
  }
) {
  const book = await prisma.book.findUnique({ where: { id: data.bookId } });
  if (!book) {
    throw new AppError('Book not found', 404);
  }

  const activeSubscription = await prisma.subscription.findFirst({
    where: {
      userId,
      status: 'ACTIVE',
      endDate: { gte: new Date() },
    },
  });

  if (!activeSubscription) {
    throw new AppError('Active subscription required to leave a review', 403);
  }

  const existingReview = await prisma.review.findUnique({
    where: {
      userId_bookId: { userId, bookId: data.bookId },
    },
  });

  if (existingReview) {
    throw new AppError('You have already reviewed this book', 409);
  }

  const review = await prisma.review.create({
    data: {
      userId,
      bookId: data.bookId,
      rating: data.rating,
      content: data.content,
    },
    include: {
      user: {
        select: { id: true, name: true, avatarUrl: true },
      },
    },
  });

  await recalculateBookRating(data.bookId);

  return review;
}

export async function updateReview(
  reviewId: string,
  userId: string,
  data: {
    rating?: number;
    content?: string;
  }
) {
  const review = await prisma.review.findFirst({
    where: { id: reviewId, userId },
  });

  if (!review) {
    throw new AppError('Review not found', 404);
  }

  const updated = await prisma.review.update({
    where: { id: reviewId },
    data,
    include: {
      user: {
        select: { id: true, name: true, avatarUrl: true },
      },
    },
  });

  await recalculateBookRating(review.bookId);

  return updated;
}

export async function deleteReview(reviewId: string, userId: string) {
  const review = await prisma.review.findFirst({
    where: { id: reviewId, userId },
  });

  if (!review) {
    throw new AppError('Review not found', 404);
  }

  await prisma.review.delete({
    where: { id: reviewId },
  });

  await recalculateBookRating(review.bookId);

  return { message: 'Review deleted successfully' };
}

export async function getReviews(bookId: string, page: number, limit: number) {
  const skip = (page - 1) * limit;

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where: { bookId },
      include: {
        user: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.review.count({ where: { bookId } }),
  ]);

  return { reviews, total, page, limit };
}

export async function getBookRating(bookId: string) {
  const book = await prisma.book.findUnique({
    where: { id: bookId },
    select: { avgRating: true, ratingCount: true },
  });

  if (!book) {
    throw new AppError('Book not found', 404);
  }

  const distribution = await prisma.review.groupBy({
    by: ['rating'],
    where: { bookId },
    _count: { rating: true },
  });

  const starDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  distribution.forEach((item) => {
    starDistribution[item.rating] = item._count.rating;
  });

  return {
    avgRating: book.avgRating,
    ratingCount: book.ratingCount,
    distribution: starDistribution,
  };
}
