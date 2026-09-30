import prisma from '../../config/database';

interface ListParams {
  page: number;
  limit: number;
  userId?: string;
  module?: string;
  action?: string;
  fromDate?: string;
  toDate?: string;
}

export async function list(params: ListParams) {
  const { page, limit, userId, module, action, fromDate, toDate } = params;
  const skip = (page - 1) * limit;
  const where: any = {};

  if (userId) where.userId = userId;
  if (module) where.module = module;
  if (action) where.action = action;
  if (fromDate || toDate) {
    where.createdAt = {};
    if (fromDate) where.createdAt.gte = new Date(fromDate);
    if (toDate) where.createdAt.lte = new Date(toDate);
  }

  const [activities, total] = await Promise.all([
    prisma.activityTimeline.findMany({
      where, skip, take: limit,
      include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.activityTimeline.count({ where }),
  ]);

  return { activities, total };
}

export async function getStats() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(today); weekAgo.setDate(weekAgo.getDate() - 7);
  const monthAgo = new Date(today); monthAgo.setMonth(monthAgo.getMonth() - 1);

  const [todayCount, weekCount, monthCount, moduleBreakdown] = await Promise.all([
    prisma.activityTimeline.count({ where: { createdAt: { gte: today } } }),
    prisma.activityTimeline.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.activityTimeline.count({ where: { createdAt: { gte: monthAgo } } }),
    prisma.activityTimeline.groupBy({ by: ['module'], _count: { id: true }, orderBy: { _count: { id: 'desc' } }, take: 10 }),
  ]);

  return { todayCount, weekCount, monthCount, moduleBreakdown };
}
