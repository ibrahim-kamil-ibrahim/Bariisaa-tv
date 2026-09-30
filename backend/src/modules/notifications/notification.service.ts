import prisma from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import { sendPushToDevices } from '../../utils/push';

export async function sendNotification(
  data: {
    title: string;
    body: string;
    type: string;
    targetType: string;
    targetIds?: string[];
  },
  createdBy: string
) {
  const notification = await prisma.notification.create({
    data: {
      title: data.title,
      body: data.body,
      type: data.type as any,
      targetType: data.targetType as any,
      targetIds: data.targetIds || undefined,
      createdBy,
    },
  });

  let targetUserIds: string[] = [];

  if (data.targetType === 'ALL') {
    const users = await prisma.user.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true },
    });
    targetUserIds = users.map((u) => u.id);
  } else if (data.targetType === 'SUBSCRIBED') {
    const subs = await prisma.subscription.findMany({
      where: { status: 'ACTIVE' },
      select: { userId: true },
      distinct: ['userId'],
    });
    targetUserIds = subs.map((s) => s.userId);
  } else if (data.targetType === 'SPECIFIC_USERS') {
    targetUserIds = data.targetIds || [];
  }

  if (targetUserIds.length > 0) {
    const batchSize = 1000;
    for (let i = 0; i < targetUserIds.length; i += batchSize) {
      const batch = targetUserIds.slice(i, i + batchSize);
      await prisma.userNotification.createMany({
        data: batch.map((userId) => ({
          notificationId: notification.id,
          userId,
        })),
      });
    }

    const devices = await prisma.device.findMany({
      where: {
        userId: { in: targetUserIds },
        fcmToken: { not: null },
      },
      select: { fcmToken: true },
    });

    const fcmTokens = devices
      .map((d) => d.fcmToken)
      .filter((t): t is string => t !== null);

    if (fcmTokens.length > 0) {
      await sendPushToDevices(fcmTokens, {
        title: data.title,
        body: data.body,
        data: { notificationId: notification.id, type: data.type },
      });
    }
  }

  const updated = await prisma.notification.update({
    where: { id: notification.id },
    data: { sentAt: new Date() },
  });

  return updated;
}

export async function getUserNotifications(userId: string, page: number, limit: number) {
  const skip = (page - 1) * limit;

  const [notifications, total] = await Promise.all([
    prisma.userNotification.findMany({
      where: { userId },
      include: {
        notification: {
          select: {
            id: true,
            title: true,
            body: true,
            type: true,
            data: true,
            sentAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.userNotification.count({ where: { userId } }),
  ]);

  return { notifications, total };
}

export async function markAsRead(userNotificationId: string, userId: string) {
  const un = await prisma.userNotification.findFirst({
    where: { id: userNotificationId, userId },
  });

  if (!un) throw new AppError('Notification not found', 404);

  const updated = await prisma.userNotification.update({
    where: { id: userNotificationId },
    data: { isRead: true, readAt: new Date() },
  });

  return updated;
}

export async function markAllAsRead(userId: string) {
  await prisma.userNotification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true, readAt: new Date() },
  });

  return { message: 'All notifications marked as read' };
}

export async function getUnreadCount(userId: string) {
  const count = await prisma.userNotification.count({
    where: { userId, isRead: false },
  });

  return { count };
}

export async function deleteNotification(userNotificationId: string, userId: string) {
  const un = await prisma.userNotification.findFirst({
    where: { id: userNotificationId, userId },
  });

  if (!un) throw new AppError('Notification not found', 404);

  await prisma.userNotification.delete({
    where: { id: userNotificationId },
  });

  return { message: 'Notification deleted' };
}
