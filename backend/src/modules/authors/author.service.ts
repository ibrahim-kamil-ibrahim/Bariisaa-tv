import prisma from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import { uploadFile } from '../../utils/signedUrl';

export async function createAuthor(data: { name: string; bio?: string; photoUrl?: string }) {
  const author = await prisma.author.create({
    data,
    include: {
      _count: { select: { books: true } },
    },
  });

  return author;
}

export async function updateAuthor(id: string, data: { name?: string; bio?: string; photoUrl?: string }) {
  const existing = await prisma.author.findUnique({ where: { id } });
  if (!existing) throw new AppError('Author not found', 404);

  const author = await prisma.author.update({
    where: { id },
    data,
    include: {
      _count: { select: { books: true } },
    },
  });

  return author;
}

export async function deleteAuthor(id: string) {
  const existing = await prisma.author.findUnique({
    where: { id },
    include: { _count: { select: { books: true, musicTracks: true } } },
  });

  if (!existing) throw new AppError('Author not found', 404);
  if (existing._count.books > 0) {
    throw new AppError('Cannot delete author with assigned books', 409);
  }
  if (existing._count.musicTracks > 0) {
    throw new AppError('Cannot delete author with assigned music tracks', 409);
  }

  await prisma.author.delete({ where: { id } });

  return { message: 'Author deleted successfully' };
}

export async function uploadAuthorPhoto(authorId: string, file: Express.Multer.File) {
  const existing = await prisma.author.findUnique({ where: { id: authorId } });
  if (!existing) throw new AppError('Author not found', 404);

  const key = await uploadFile(file.buffer, file.originalname, file.mimetype, 'authors');

  const updated = await prisma.author.update({
    where: { id: authorId },
    data: { photoUrl: key },
    select: { id: true, name: true, photoUrl: true },
  });

  return updated;
}

export async function getAuthorById(id: string, page = 1, limit = 20) {
  const author = await prisma.author.findUnique({
    where: { id },
    include: {
      _count: { select: { books: true } },
    },
  });

  if (!author) throw new AppError('Author not found', 404);

  const books = await prisma.book.findMany({
    where: {
      authors: { some: { authorId: id } },
      status: 'PUBLISHED',
    },
    skip: (page - 1) * limit,
    take: limit,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      coverUrl: true,
      avgRating: true,
      ratingCount: true,
      publishDate: true,
    },
  });

  const totalBooks = await prisma.book.count({
    where: {
      authors: { some: { authorId: id } },
      status: 'PUBLISHED',
    },
  });

  return {
    ...author,
    books,
    booksMeta: {
      page,
      limit,
      total: totalBooks,
      totalPages: Math.ceil(totalBooks / limit),
    },
  };
}

export async function listAuthors(page: number, limit: number, search?: string) {
  const where: Record<string, unknown> = {};

  if (search) {
    where.name = { contains: search, mode: 'insensitive' };
  }

  const [authors, total] = await Promise.all([
    prisma.author.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { books: true } },
      },
    }),
    prisma.author.count({ where }),
  ]);

  return { authors, total };
}
