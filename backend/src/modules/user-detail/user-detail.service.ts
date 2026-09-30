import prisma from '../../config/database';
import { AppError } from '../../middleware/errorHandler';

export async function getUserDetail(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      roles: { include: { role: true } },
      _count: { select: { favorites: true, reviews: true, readingHistory: true, listeningHistory: true, subscriptions: true, payments: true } },
    },
  });
  if (!user) throw new AppError('User not found', 404);

  const [subscription, totalSpent] = await Promise.all([
    prisma.subscription.findFirst({ where: { userId, status: 'ACTIVE' }, include: { plan: true } }),
    prisma.payment.aggregate({ where: { userId, status: 'COMPLETED' }, _sum: { amount: true } }),
  ]);

  return { ...user, activeSubscription: subscription, totalSpent: totalSpent._sum.amount || 0 };
}

export async function getUserActivity(userId: string, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  const [activities, total] = await Promise.all([
    prisma.activityTimeline.findMany({ where: { userId }, skip, take: limit, orderBy: { createdAt: 'desc' } }),
    prisma.activityTimeline.count({ where: { userId } }),
  ]);
  return { activities, total };
}

export async function getLoginHistory(userId: string) {
  return prisma.auditLog.findMany({
    where: { userId, action: { in: ['login', 'logout'] } },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
}

export async function getUserDevices(userId: string) {
  return prisma.device.findMany({ where: { userId }, orderBy: { lastActiveAt: 'desc' } });
}

export async function adminAction(userId: string, action: { type: string; reason?: string }, adminId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError('User not found', 404);

  switch (action.type) {
    case 'suspend':
      return prisma.user.update({ where: { id: userId }, data: { status: 'SUSPENDED' } });
    case 'activate':
      return prisma.user.update({ where: { id: userId }, data: { status: 'ACTIVE' } });
    case 'ban':
      return prisma.user.update({ where: { id: userId }, data: { status: 'BLOCKED' } });
    case 'delete':
      return prisma.user.delete({ where: { id: userId } });
    default:
      throw new AppError('Invalid action', 400);
  }
}
