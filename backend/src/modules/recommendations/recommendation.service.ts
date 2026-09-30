import prisma from '../../config/database';

export async function getRecommendations(userId: string, limit: number = 10) {
  const [readingHistory, listeningHistory, reviews] = await Promise.all([
    prisma.readingHistory.findMany({
      where: { userId },
      include: {
        book: {
          include: { categories: { select: { categoryId: true } } },
        },
      },
    }),
    prisma.listeningHistory.findMany({
      where: { userId },
      include: {
        book: {
          include: { categories: { select: { categoryId: true } } },
        },
      },
    }),
    prisma.review.findMany({
      where: { userId },
      include: {
        book: {
          include: { categories: { select: { categoryId: true } } },
        },
      },
    }),
  ]);

  const categoryScores: Record<string, number> = {};
  const now = Date.now();

  for (const entry of readingHistory) {
    const daysSinceAccess =
      (now - entry.lastAccessedAt.getTime()) / (1000 * 60 * 60 * 24);
    const recencyWeight = Math.max(0.1, 1 - daysSinceAccess / 90);
    const progressWeight = entry.progressPercent / 100;

    for (const cat of entry.book.categories) {
      categoryScores[cat.categoryId] =
        (categoryScores[cat.categoryId] || 0) + recencyWeight * progressWeight;
    }
  }

  for (const entry of listeningHistory) {
    const daysSinceAccess =
      (now - entry.lastAccessedAt.getTime()) / (1000 * 60 * 60 * 24);
    const recencyWeight = Math.max(0.1, 1 - daysSinceAccess / 90);
    const progressWeight = entry.progressPercent / 100;

    for (const cat of entry.book.categories) {
      categoryScores[cat.categoryId] =
        (categoryScores[cat.categoryId] || 0) + recencyWeight * progressWeight * 1.2;
    }
  }

  for (const review of reviews) {
    const ratingWeight = review.rating / 5;

    for (const cat of review.book.categories) {
      categoryScores[cat.categoryId] =
        (categoryScores[cat.categoryId] || 0) + ratingWeight * 1.5;
    }
  }

  const sortedCategories = Object.entries(categoryScores)
    .sort(([, a], [, b]) => b - a)
    .map(([categoryId]) => categoryId);

  if (sortedCategories.length === 0) {
    return getFallbackRecommendations(limit);
  }

  const topCategoryIds = sortedCategories.slice(0, 5);

  const readBookIds = [
    ...readingHistory.map((h) => h.bookId),
    ...listeningHistory.map((h) => h.bookId),
  ];

  const candidates = await prisma.book.findMany({
    where: {
      status: 'PUBLISHED',
      categories: {
        some: {
          categoryId: { in: topCategoryIds },
        },
      },
      id: { notIn: readBookIds },
    },
    include: {
      authors: { include: { author: { select: { id: true, name: true } } } },
      categories: { include: { category: { select: { id: true, name: true, slug: true } } } },
      audioFiles: { take: 1, include: { chapters: { orderBy: { trackOrder: 'asc' } } } },
      pdfFiles: { take: 1 },
    },
    take: limit * 3,
  });

  const scored = candidates.map((book) => {
    let affinityScore = 0;
    for (const cat of book.categories) {
      affinityScore += categoryScores[cat.categoryId] || 0;
    }

    const ratingScore = book.avgRating > 0 ? book.avgRating / 5 : 0.5;
    const popularityScore = Math.log(book.viewCount + 1) / 10;

    return {
      book,
      score: affinityScore * ratingScore * (1 + popularityScore),
    };
  });

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((s) => s.book);
}

export async function getFallbackRecommendations(limit: number = 10) {
  const featured = await prisma.book.findMany({
    where: { status: 'PUBLISHED', isFeatured: true },
    include: {
      authors: { include: { author: { select: { id: true, name: true } } } },
      categories: { include: { category: { select: { id: true, name: true, slug: true } } } },
      audioFiles: { take: 1, include: { chapters: { orderBy: { trackOrder: 'asc' } } } },
      pdfFiles: { take: 1 },
    },
    take: Math.ceil(limit / 2),
    orderBy: { avgRating: 'desc' },
  });

  const remaining = limit - featured.length;
  if (remaining <= 0) return featured.slice(0, limit);

  const featuredIds = featured.map((b) => b.id);

  const popular = await prisma.book.findMany({
    where: {
      status: 'PUBLISHED',
      id: { notIn: featuredIds },
    },
    include: {
      authors: { include: { author: { select: { id: true, name: true } } } },
      categories: {
        include: { category: { select: { id: true, name: true, slug: true } } },
      },
      audioFiles: { take: 1, include: { chapters: { orderBy: { trackOrder: 'asc' } } } },
      pdfFiles: { take: 1 },
    },
    take: remaining,
    orderBy: { viewCount: 'desc' },
  });

  return [...featured, ...popular];
}
