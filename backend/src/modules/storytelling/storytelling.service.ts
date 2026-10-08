import prisma from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import { uploadFile } from '../../utils/signedUrl';
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
  videoId?: string | null;
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
 *
 * `bypassLocks` is for callers allowed to manage stories (editors/admins): they
 * must see the real audioUrl/videoId, otherwise re-saving a paid story would
 * silently wipe its media links.
 */
async function withStoryLocks<T extends { id: string; accessTier?: string | null; isPremium?: boolean | null; requiredPlanId?: string | null }>(
  stories: T[],
  userId?: string | null,
  bypassLocks = false
) {
  if (bypassLocks) return stories.map((story) => ({ ...story, isLocked: false }));
  const activePlanId = await resolveActivePlanFor(userId, stories);
  return stories.map((story) => {
    const entitled = hasContentAccess(story, activePlanId);
    if (entitled) return { ...story, isLocked: false };
    return {
      ...story,
      isLocked: true,
      audioUrl: null as any,
      // Locked stories must not leak the media handle either — playback is
      // re-checked server-side, but clients should not even see the id.
      videoId: null as any,
    };
  });
}

/** Stories are FREE unless the admin marked them PAID. */
function videoVisibilityFor(accessTier?: string | null): 'PUBLIC' | 'PREMIUM' {
  return accessTier === 'PAID' ? 'PREMIUM' : 'PUBLIC';
}

/**
 * The uploaded video must exist, actually be a video, and have finished
 * uploading before a story may point at it.
 */
async function assertVideoLinkable(videoId: string) {
  const media = await prisma.mediaFile.findUnique({ where: { id: videoId } });
  if (!media || media.deletedAt) throw new AppError('Video not found', 404);
  if (media.type !== 'video') throw new AppError('Selected media is not a video', 400);
  if (media.uploadStatus !== 'COMPLETED') {
    throw new AppError('Video upload has not completed yet', 409);
  }
  return media;
}

/**
 * Detach a media record previously owned by this story (best effort) and keep
 * the video's visibility in sync with the story's access tier.
 */
async function syncVideoOwnership(
  videoId: string,
  storyId: string,
  accessTier?: string | null
) {
  await prisma.mediaFile.updateMany({
    where: { id: videoId },
    data: { storyId, visibility: videoVisibilityFor(accessTier) },
  });
}

/** Detach a media record previously owned by this story (best effort). */
async function unlinkVideoFromStory(videoId: string | null, storyId: string) {
  if (!videoId) return;
  const media = await prisma.mediaFile.findUnique({ where: { id: videoId } });
  if (media && media.storyId === storyId) {
    await prisma.mediaFile.update({
      where: { id: videoId },
      data: { storyId: null },
    });
  }
}

/** Story cover image picked from the admin panel (stored in R2/local). */
export async function uploadStoryCoverFile(file: Express.Multer.File) {
  return uploadFile(file.buffer, file.originalname, file.mimetype, 'story-covers');
}

/** Story narration audio picked from the admin panel. */
export async function uploadStoryAudioFile(file: Express.Multer.File) {
  return uploadFile(file.buffer, file.originalname, file.mimetype, 'story-audio');
}

export async function createStory(data: CreateStoryData) {
  const videoId = data.videoId || null;
  if (videoId) await assertVideoLinkable(videoId);

  const story = await prisma.story.create({ data: { ...data, videoId } });

  if (videoId) await syncVideoOwnership(videoId, story.id, story.accessTier);
  return story;
}

export async function updateStory(id: string, data: Partial<CreateStoryData>) {
  const existing = await prisma.story.findUnique({ where: { id } });
  if (!existing) throw new AppError('Story not found', 404);

  const hasVideoChange = Object.prototype.hasOwnProperty.call(data, 'videoId');
  const videoId = hasVideoChange ? data.videoId || null : existing.videoId;
  if (hasVideoChange && videoId) await assertVideoLinkable(videoId);

  const story = await prisma.story.update({ where: { id }, data: { ...data, videoId } });

  if (hasVideoChange && existing.videoId && existing.videoId !== videoId) {
    await unlinkVideoFromStory(existing.videoId, id);
  }
  // Re-sync ownership/visibility when the link changes or the tier changes.
  if (videoId && (hasVideoChange || data.accessTier !== undefined)) {
    await syncVideoOwnership(videoId, id, story.accessTier);
  }
  return story;
}

export async function deleteStory(id: string) {
  const existing = await prisma.story.findUnique({ where: { id } });
  if (!existing) throw new AppError('Story not found', 404);
  return prisma.story.update({ where: { id }, data: { status: 'ARCHIVED' as any } });
}

export async function getStoryById(id: string, userId?: string | null, bypassLocks = false) {
  const story = await prisma.story.findUnique({ where: { id } });
  if (!story) throw new AppError('Story not found', 404);
  const [locked] = await withStoryLocks([story], userId, bypassLocks);
  return locked;
}

export async function listStories(query: StoryQuery, userId?: string | null, bypassLocks = false) {
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
  return { stories: await withStoryLocks(stories, userId, bypassLocks), total };
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
