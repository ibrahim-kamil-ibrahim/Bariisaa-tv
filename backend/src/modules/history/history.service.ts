import prisma from '../../config/database';
import { AppError } from '../../middleware/errorHandler';

export async function updateReadingProgress(
  userId: string,
  data: { bookId: string; lastPosition?: string; progressPercent?: number }
) {
  const record = await prisma.readingHistory.upsert({
    where: { userId_bookId: { userId, bookId: data.bookId } },
    update: {
      lastPosition: data.lastPosition,
      progressPercent: data.progressPercent,
      lastAccessedAt: new Date(),
    },
    create: {
      userId,
      bookId: data.bookId,
      lastPosition: data.lastPosition,
      progressPercent: data.progressPercent || 0,
      lastAccessedAt: new Date(),
    },
  });

  return record;
}

export async function updateListeningProgress(
  userId: string,
  data: { bookId: string; lastTimestampSec: number; progressPercent?: number }
) {
  const record = await prisma.listeningHistory.upsert({
    where: { userId_bookId: { userId, bookId: data.bookId } },
    update: {
      lastTimestampSec: data.lastTimestampSec,
      progressPercent: data.progressPercent,
      lastAccessedAt: new Date(),
    },
    create: {
      userId,
      bookId: data.bookId,
      lastTimestampSec: data.lastTimestampSec,
      progressPercent: data.progressPercent || 0,
      lastAccessedAt: new Date(),
    },
  });

  return record;
}

export async function getReadingHistory(userId: string, page: number, limit: number) {
  const skip = (page - 1) * limit;

  const [history, total] = await Promise.all([
    prisma.readingHistory.findMany({
      where: { userId },
      include: {
        book: {
          select: {
            id: true,
            title: true,
            coverUrl: true,
            thumbnailUrl: true,
            avgRating: true,
            authors: { include: { author: { select: { id: true, name: true } } } },
          },
        },
      },
      orderBy: { lastAccessedAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.readingHistory.count({ where: { userId } }),
  ]);

  return { history, total };
}

export async function getListeningHistory(userId: string, page: number, limit: number) {
  const skip = (page - 1) * limit;

  const [history, total] = await Promise.all([
    prisma.listeningHistory.findMany({
      where: { userId },
      include: {
        book: {
          select: {
            id: true,
            title: true,
            coverUrl: true,
            thumbnailUrl: true,
            avgRating: true,
            authors: { include: { author: { select: { id: true, name: true } } } },
            audioFiles: { select: { id: true, durationSeconds: true } },
          },
        },
      },
      orderBy: { lastAccessedAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.listeningHistory.count({ where: { userId } }),
  ]);

  return { history, total };
}

export async function getContinueReading(userId: string, limit: number = 5) {
  const history = await prisma.readingHistory.findMany({
    where: { userId, progressPercent: { lt: 100 } },
    include: {
      book: {
        select: {
          id: true,
          title: true,
          coverUrl: true,
          thumbnailUrl: true,
          avgRating: true,
          authors: { include: { author: { select: { id: true, name: true } } } },
        },
      },
    },
    orderBy: { lastAccessedAt: 'desc' },
    take: limit,
  });

  return history;
}

export async function getContinueListening(userId: string, limit: number = 5) {
  const history = await prisma.listeningHistory.findMany({
    where: { userId, progressPercent: { lt: 100 } },
    include: {
      book: {
        select: {
          id: true,
          title: true,
          coverUrl: true,
          thumbnailUrl: true,
          avgRating: true,
          authors: { include: { author: { select: { id: true, name: true } } } },
          audioFiles: { select: { id: true, durationSeconds: true } },
        },
      },
    },
    orderBy: { lastAccessedAt: 'desc' },
    take: limit,
  });

  return history;
}

export async function deleteReadingHistory(userId: string, historyId: string) {
  const record = await prisma.readingHistory.findFirst({
    where: { id: historyId, userId },
  });

  if (!record) throw new AppError('Reading history not found', 404);

  await prisma.readingHistory.delete({ where: { id: historyId } });

  return { message: 'Reading history deleted' };
}

export async function deleteListeningHistory(userId: string, historyId: string) {
  const record = await prisma.listeningHistory.findFirst({
    where: { id: historyId, userId },
  });

  if (!record) throw new AppError('Listening history not found', 404);

  await prisma.listeningHistory.delete({ where: { id: historyId } });

  return { message: 'Listening history deleted' };
}

export async function clearAllReadingHistory(userId: string) {
  await prisma.readingHistory.deleteMany({ where: { userId } });

  return { message: 'All reading history cleared' };
}

export async function clearAllListeningHistory(userId: string) {
  await prisma.listeningHistory.deleteMany({ where: { userId } });

  return { message: 'All listening history cleared' };
}
