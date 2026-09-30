import prisma from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import {
  getActivePlanId,
  hasContentAccess,
  resolveActivePlanFor,
} from '../../middleware/subscriptionGuard';

interface CreateStoryData {
  title: string;
  description?: string;
  coverUrl?: string;
  audioUrl?: string;
  category?: string;
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  isFeatured?: boolean;
  tags?: string;
  accessTier?: 'FREE' | 'PAID';
  requiredPlanId?: string | null;
}

interface StoryQuery {
  page?: number;
  limit?: number;
  category?: string;
  status?: string;
  search?: string;
  accessTier?: 'FREE' | 'PAID';
}

/**
 * Annotate stories with `isLocked`. Locked stories also get their audio URL
 * stripped so clients can never bypass the paywall by streaming the raw URL.
 * `isLocked` is advisory — entitlement is re-derived server-side where needed.
 */
async function withStoryLocks<T extends { id: string; accessTier?: string | null; isPremium?: boolean | null; requiredPlanId?: string | null }>(
  stories: T[],
  userId?: string | null
) {
  const activePlanId = await resolveActivePlanFor(userId, stories);
  return stories.map((story) => {
    const entitled = hasContentAccess(story, activePlanId);
    if (entitled) return { ...story, isLocked: false };
    return { ...story, isLocked: true, audioUrl: null as any };
  });
}

export async function createStory(data: CreateStoryData) {
  return prisma.story.create({ data });
}

export async function updateStory(id: string, data: Partial<CreateStoryData>) {
  const existing = await prisma.story.findUnique({ where: { id } });
  if (!existing) throw new AppError('Story not found', 404);
  return prisma.story.update({ where: { id }, data });
}

export async function deleteStory(id: string) {
  const existing = await prisma.story.findUnique({ where: { id } });
  if (!existing) throw new AppError('Story not found', 404);
  return prisma.story.update({ where: { id }, data: { status: 'ARCHIVED' as any } });
}

export async function getStoryById(id: string, userId?: string | null) {
  const story = await prisma.story.findUnique({ where: { id } });
  if (!story) throw new AppError('Story not found', 404);
  const [locked] = await withStoryLocks([story], userId);
  return locked;
}

export async function listStories(query: StoryQuery, userId?: string | null) {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 20;
  const skip = (page - 1) * limit;

  const where: any = { NOT: { status: 'ARCHIVED' } };
  if (query.category) where.category = query.category;
  if (query.status) where.status = query.status;
  if (query.search) where.title = { contains: query.search, mode: 'insensitive' };
  if (query.accessTier) where.accessTier = query.accessTier;

  const [stories, total] = await Promise.all([
    prisma.story.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
    prisma.story.count({ where }),
  ]);
  return { stories: await withStoryLocks(stories, userId), total };
}

export async function getFeaturedStories(limit = 10, userId?: string | null) {
  const stories = await prisma.story.findMany({
    where: { status: 'PUBLISHED', isFeatured: true },
    take: limit,
    orderBy: { viewCount: 'desc' },
  });
  return withStoryLocks(stories, userId);
}

export async function incrementViewCount(id: string) {
  return prisma.story.update({ where: { id }, data: { viewCount: { increment: 1 } } });
}

/** Distinct categories present on non-archived stories, as `{ name }` objects. */
export async function getStoryCategories() {
  const rows = await prisma.story.findMany({
    where: { NOT: { status: 'ARCHIVED' } },
    select: { category: true },
    distinct: ['category'],
  });
  return rows
    .map((r) => ({ name: r.category }))
    .filter((c) => c.name && c.name.trim() !== '');
}
