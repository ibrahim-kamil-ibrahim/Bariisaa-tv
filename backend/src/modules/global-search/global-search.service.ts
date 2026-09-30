import prisma from '../../config/database';

export async function search(query: string, type?: string, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  const results: any = {};

  if (!type || type === 'books') {
    const [books, total] = await Promise.all([
      prisma.book.findMany({
        where: { title: { contains: query, mode: 'insensitive' }, status: { not: 'ARCHIVED' } },
        skip, take: limit,
        select: { id: true, title: true, coverUrl: true, status: true, createdAt: true },
        orderBy: { title: 'asc' },
      }),
      prisma.book.count({ where: { title: { contains: query, mode: 'insensitive' }, status: { not: 'ARCHIVED' } } }),
    ]);
    results.books = { items: books, total };
  }

  if (!type || type === 'users') {
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: { OR: [{ name: { contains: query, mode: 'insensitive' } }, { email: { contains: query, mode: 'insensitive' } }, { phone: { contains: query, mode: 'insensitive' } }] },
        skip, take: limit,
        select: { id: true, name: true, avatarUrl: true, roles: { select: { role: { select: { name: true } } } } },
        orderBy: { name: 'asc' },
      }),
      prisma.user.count({
        where: { OR: [{ name: { contains: query, mode: 'insensitive' } }, { email: { contains: query, mode: 'insensitive' } }, { phone: { contains: query, mode: 'insensitive' } }] },
      }),
    ]);
    results.users = { items: users, total };
  }

  if (!type || type === 'authors') {
    const [authors, total] = await Promise.all([
      prisma.author.findMany({
        where: { name: { contains: query, mode: 'insensitive' } },
        skip, take: limit,
        include: { _count: { select: { books: true } } },
        orderBy: { name: 'asc' },
      }),
      prisma.author.count({ where: { name: { contains: query, mode: 'insensitive' } } }),
    ]);
    results.authors = { items: authors, total };
  }

  if (!type || type === 'payments') {
    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where: { gatewayTransactionId: { contains: query, mode: 'insensitive' } },
        skip, take: limit,
        include: { user: { select: { name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.payment.count({ where: { gatewayTransactionId: { contains: query, mode: 'insensitive' } } }),
    ]);
    results.payments = { items: payments, total };
  }

  if (!type || type === 'categories') {
    const [categories, total] = await Promise.all([
      prisma.category.findMany({
        where: { name: { contains: query, mode: 'insensitive' } },
        skip, take: limit,
        orderBy: { name: 'asc' },
      }),
      prisma.category.count({ where: { name: { contains: query, mode: 'insensitive' } } }),
    ]);
    results.categories = { items: categories, total };
  }

  if (!type || type === 'coupons') {
    const [coupons, total] = await Promise.all([
      prisma.coupon.findMany({
        where: { code: { contains: query, mode: 'insensitive' } },
        skip, take: limit,
        orderBy: { code: 'asc' },
      }),
      prisma.coupon.count({ where: { code: { contains: query, mode: 'insensitive' } } }),
    ]);
    results.coupons = { items: coupons, total };
  }

  return results;
}

export async function getSuggestions(query: string) {
  const [books, users, authors, categories] = await Promise.all([
    prisma.book.findMany({ where: { title: { contains: query, mode: 'insensitive' }, status: 'PUBLISHED' }, take: 5, select: { id: true, title: true, coverUrl: true } }),
    prisma.user.findMany({ where: { name: { contains: query, mode: 'insensitive' } }, take: 5, select: { id: true, name: true, avatarUrl: true } }),
    prisma.author.findMany({ where: { name: { contains: query, mode: 'insensitive' } }, take: 5, select: { id: true, name: true, photoUrl: true } }),
    prisma.category.findMany({ where: { name: { contains: query, mode: 'insensitive' } }, take: 5, select: { id: true, name: true } }),
  ]);

  return { books, users, authors, categories };
}
