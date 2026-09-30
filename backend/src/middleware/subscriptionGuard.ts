import { Response, NextFunction } from 'express';
import { AuthRequest } from './authenticate';
import { errorResponse } from '../utils/response';
import prisma from '../config/database';

/** Content rows that carry an access tier (Book / Story / MusicTrack). */
export interface AccessControlled {
  accessTier?: string | null;
  isPremium?: boolean | null;
  requiredPlanId?: string | null;
}

/**
 * True when content is open to everyone.
 * `accessTier` is canonical; `isPremium` is the legacy fallback for old rows.
 */
export function isFreeContent(content: AccessControlled): boolean {
  if (content.accessTier) return content.accessTier === 'FREE';
  return !content.isPremium;
}

/** Fetch the caller's active plan id in one query (null when anonymous / no sub). */
export async function getActivePlanId(userId?: string | null): Promise<string | null> {
  if (!userId) return null;
  const sub = await prisma.subscription.findFirst({
    where: { userId, status: 'ACTIVE', endDate: { gte: new Date() } },
    select: { planId: true },
    orderBy: { endDate: 'desc' },
  });
  return sub?.planId ?? null;
}

/**
 * Server-side entitlement decision — never trust the client's `isLocked` flag:
 * - FREE content → always allowed
 * - PAID content → requires an active, unexpired subscription
 * - plan-pinned content (`requiredPlanId`) → the active plan must match
 */
export function hasContentAccess(content: AccessControlled, activePlanId: string | null): boolean {
  if (isFreeContent(content)) return true;
  if (!activePlanId) return false;
  if (content.requiredPlanId) return content.requiredPlanId === activePlanId;
  return true;
}

/** Annotate content rows with `isLocked` for the given active plan. */
export function withLockFlag<T extends AccessControlled & { id: string }>(
  items: T[],
  activePlanId: string | null
): Array<T & { isLocked: boolean }> {
  return items.map((item) => ({ ...item, isLocked: !hasContentAccess(item, activePlanId) }));
}

/**
 * Resolve the active plan once per request, but only when at least one item
 * in the batch is paid — skips a DB query for all-free lists.
 */
export async function resolveActivePlanFor(
  userId: string | undefined | null,
  items: AccessControlled[]
): Promise<string | null> {
  const needsEntitlement = items.some((item) => !isFreeContent(item));
  if (!needsEntitlement) return null;
  return getActivePlanId(userId);
}

/**
 * Route guard: requires an authenticated user with an ACTIVE, unexpired subscription.
 * Mount AFTER `authenticate` on any route that hands out paid media URLs.
 */
export async function subscriptionGuard(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.userId) {
    return errorResponse(res, 'Authentication required', 401);
  }
  const activePlanId = await getActivePlanId(req.userId);
  if (!activePlanId) {
    return errorResponse(res, 'Active subscription required', 403);
  }
  next();
}
