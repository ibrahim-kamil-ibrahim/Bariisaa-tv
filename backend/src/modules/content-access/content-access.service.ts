import prisma from '../../config/database';
import { AppError } from '../../middleware/errorHandler';

export interface ContentAccessInput {
  accessTier: 'FREE' | 'PAID';
  requiredPlanId?: string | null;
}

/**
 * Set the access tier on a content item (Book / Story / MusicTrack).
 * The content id is looked up across all three tables (cuid ids are globally
 * unique in practice). PAID items may optionally be pinned to a plan via
 * `requiredPlanId`; FREE items always clear any plan pin.
 */
export async function setContentAccess(id: string, input: ContentAccessInput) {
  const accessTier = input.accessTier;
  const requiredPlanId = accessTier === 'PAID' ? (input.requiredPlanId ?? null) : null;

  if (requiredPlanId) {
    const plan = await prisma.subscriptionPlan.findUnique({ where: { id: requiredPlanId } });
    if (!plan) throw new AppError('Subscription plan not found', 404);
    if (!plan.isActive) throw new AppError('Subscription plan is not active', 400);
  }

  const book = await prisma.book.findUnique({ where: { id } });
  if (book) {
    const updated = await prisma.book.update({
      where: { id },
      data: {
        accessTier,
        requiredPlanId,
        // Keep the legacy gating flag in sync so old checks stay correct.
        isPremium: accessTier === 'PAID',
      },
    });
    return { type: 'book' as const, content: updated };
  }

  const story = await prisma.story.findUnique({ where: { id } });
  if (story) {
    const updated = await prisma.story.update({
      where: { id },
      data: { accessTier, requiredPlanId },
    });
    return { type: 'story' as const, content: updated };
  }

  const track = await prisma.musicTrack.findUnique({ where: { id } });
  if (track) {
    const updated = await prisma.musicTrack.update({
      where: { id },
      data: { accessTier, requiredPlanId },
    });
    return { type: 'music' as const, content: updated };
  }

  throw new AppError('Content not found', 404);
}
