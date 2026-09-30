import prisma from '../../config/database';
import { AppError } from '../../middleware/errorHandler';

export async function bulkBooks(ids: string[], action: string, data?: any) {
  let count = 0;
  const updateData: any = {};

  switch (action) {
    case 'publish':
      updateData.status = 'PUBLISHED';
      break;
    case 'unpublish':
      updateData.status = 'DRAFT';
      break;
    case 'archive':
      updateData.status = 'ARCHIVED';
      break;
    case 'delete':
      return { count: (await prisma.book.deleteMany({ where: { id: { in: ids } } })).count };
    case 'export': {
      const books = await prisma.book.findMany({ where: { id: { in: ids } }, select: { id: true, title: true, status: true, createdAt: true } });
      return { count: books.length, data: books };
    }
    default:
      throw new AppError('Invalid action', 400);
  }

  const result = await prisma.book.updateMany({ where: { id: { in: ids } }, data: updateData });
  count = result.count;
  return { count };
}

export async function bulkUsers(ids: string[], action: string, data?: any) {
  let count = 0;
  const updateData: any = {};

  switch (action) {
    case 'suspend':
      updateData.status = 'SUSPENDED';
      break;
    case 'ban':
      updateData.status = 'BLOCKED';
      break;
    case 'activate':
      updateData.status = 'ACTIVE';
      break;
    case 'delete':
      return { count: (await prisma.user.deleteMany({ where: { id: { in: ids } } })).count };
    case 'changeRole':
      if (!data?.roleId) throw new AppError('roleId required', 400);
      await prisma.userRole.deleteMany({ where: { userId: { in: ids } } });
      await prisma.userRole.createMany({ data: ids.map(userId => ({ userId, roleId: data.roleId })) });
      return { count: ids.length };
    case 'sendNotification':
      // Create notification for selected users
      await prisma.notification.create({
        data: { title: data.title || 'Notification', body: data.body || '', type: data.type || 'ANNOUNCEMENT', targetType: 'SPECIFIC_USERS', targetIds: ids },
      });
      return { count: ids.length };
    default:
      throw new AppError('Invalid action', 400);
  }

  const result = await prisma.user.updateMany({ where: { id: { in: ids } }, data: updateData });
  count = result.count;
  return { count };
}

export async function bulkPayments(ids: string[], action: string, data?: any) {
  let count = 0;

  switch (action) {
    case 'refund': {
      const result = await prisma.payment.updateMany({ where: { id: { in: ids }, status: 'COMPLETED' }, data: { status: 'REFUNDED' } });
      count = result.count;
      break;
    }
      break;
    case 'export': {
      const payments = await prisma.payment.findMany({ where: { id: { in: ids } }, include: { user: { select: { name: true, email: true } } } });
      return { count: payments.length, data: payments };
    }
    default:
      throw new AppError('Invalid action', 400);
  }

  return { count };
}

export async function bulkCoupons(ids: string[], action: string, data?: any) {
  let count = 0;
  const updateData: any = {};

  switch (action) {
    case 'enable':
      updateData.isActive = true;
      break;
    case 'disable':
      updateData.isActive = false;
      break;
    case 'delete':
      return { count: (await prisma.coupon.deleteMany({ where: { id: { in: ids } } })).count };
    default:
      throw new AppError('Invalid action', 400);
  }

  const result = await prisma.coupon.updateMany({ where: { id: { in: ids } }, data: updateData });
  count = result.count;
  return { count };
}
