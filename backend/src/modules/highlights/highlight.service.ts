import prisma from '../../config/database';
import { AppError } from '../../middleware/errorHandler';

export async function createHighlight(
  userId: string,
  data: {
    bookId: string;
    selectedText: string;
    color: string;
    position: string;
    pageNumber?: number;
  }
) {
  const book = await prisma.book.findUnique({ where: { id: data.bookId } });
  if (!book) {
    throw new AppError('Book not found', 404);
  }

  return prisma.highlight.create({
    data: {
      userId,
      bookId: data.bookId,
      selectedText: data.selectedText,
      color: data.color,
      position: data.position,
      pageNumber: data.pageNumber,
    },
    include: {
      book: {
        select: { id: true, title: true, coverUrl: true },
      },
    },
  });
}

export async function deleteHighlight(highlightId: string, userId: string) {
  const highlight = await prisma.highlight.findFirst({
    where: { id: highlightId, userId },
  });

  if (!highlight) {
    throw new AppError('Highlight not found', 404);
  }

  await prisma.highlight.delete({
    where: { id: highlightId },
  });

  return { message: 'Highlight deleted successfully' };
}

export async function getHighlights(userId: string, bookId: string) {
  return prisma.highlight.findMany({
    where: { userId, bookId },
    include: {
      book: {
        select: { id: true, title: true, coverUrl: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getAllHighlights(userId: string, page: number, limit: number) {
  const skip = (page - 1) * limit;

  const [highlights, total] = await Promise.all([
    prisma.highlight.findMany({
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
    prisma.highlight.count({ where: { userId } }),
  ]);

  return { highlights, total, page, limit };
}
