import prisma from '../../config/database';
import { AppError } from '../../middleware/errorHandler';

export async function list(userId: string, type?: string, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  const where: any = { createdBy: userId };
  if (type) where.type = type;

  const [reports, total] = await Promise.all([
    prisma.savedReport.findMany({ where, skip, take: limit, orderBy: { updatedAt: 'desc' } }),
    prisma.savedReport.count({ where }),
  ]);
  return { reports, total };
}

export async function create(userId: string, data: { name: string; type: string; config: any; isPublic?: boolean }) {
  return prisma.savedReport.create({ data: { ...data, createdBy: userId } });
}

export async function update(id: string, userId: string, data: Partial<{ name: string; config: any; isPublic: boolean }>) {
  const report = await prisma.savedReport.findUnique({ where: { id } });
  if (!report || report.createdBy !== userId) throw new AppError('Report not found', 404);
  return prisma.savedReport.update({ where: { id }, data });
}

export async function deleteReport(id: string, userId: string) {
  const report = await prisma.savedReport.findUnique({ where: { id } });
  if (!report || report.createdBy !== userId) throw new AppError('Report not found', 404);
  return prisma.savedReport.delete({ where: { id } });
}

export async function exportData(type: string, fromDate?: string, toDate?: string, format = 'csv') {
  const where: any = {};
  if (fromDate || toDate) {
    where.createdAt = {};
    if (fromDate) where.createdAt.gte = new Date(fromDate);
    if (toDate) where.createdAt.lte = new Date(toDate);
  }

  let data: any[] = [];
  switch (type) {
    case 'users':
      data = await prisma.user.findMany({ where, select: { id: true, name: true, email: true, phone: true, status: true, createdAt: true } });
      break;
    case 'revenue':
      data = await prisma.payment.findMany({ where: { status: 'COMPLETED', ...where }, select: { id: true, amount: true, currency: true, gateway: true, createdAt: true } });
      break;
    case 'subscriptions':
      data = await prisma.subscription.findMany({ where, include: { plan: true, user: { select: { name: true, email: true } } } });
      break;
    default:
      throw new AppError('Invalid report type', 400);
  }

  return { type, format, records: data.length, data };
}
