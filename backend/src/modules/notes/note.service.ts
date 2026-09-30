import prisma from '../../config/database';
import { AppError } from '../../middleware/errorHandler';

export async function createNote(
  userId: string,
  data: {
    bookId: string;
    content: string;
    position: string;
    pageNumber?: number;
  }
) {
  const book = await prisma.book.findUnique({ where: { id: data.bookId } });
  if (!book) {
    throw new AppError('Book not found', 404);
  }

  return prisma.note.create({
    data: {
      userId,
      bookId: data.bookId,
      content: data.content,
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

export async function updateNote(
  noteId: string,
  userId: string,
  data: {
    content?: string;
    position?: string;
    pageNumber?: number;
  }
) {
  const note = await prisma.note.findFirst({
    where: { id: noteId, userId },
  });

  if (!note) {
    throw new AppError('Note not found', 404);
  }

  return prisma.note.update({
    where: { id: noteId },
    data,
    include: {
      book: {
        select: { id: true, title: true, coverUrl: true },
      },
    },
  });
}

export async function deleteNote(noteId: string, userId: string) {
  const note = await prisma.note.findFirst({
    where: { id: noteId, userId },
  });

  if (!note) {
    throw new AppError('Note not found', 404);
  }

  await prisma.note.delete({
    where: { id: noteId },
  });

  return { message: 'Note deleted successfully' };
}

export async function getNotes(userId: string, bookId: string) {
  return prisma.note.findMany({
    where: { userId, bookId },
    include: {
      book: {
        select: { id: true, title: true, coverUrl: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getAllNotes(userId: string, page: number, limit: number) {
  const skip = (page - 1) * limit;

  const [notes, total] = await Promise.all([
    prisma.note.findMany({
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
    prisma.note.count({ where: { userId } }),
  ]);

  return { notes, total, page, limit };
}
