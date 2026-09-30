import prisma from '../../config/database';
import { AppError } from '../../middleware/errorHandler';

export async function create(userId: string, data: { name: string; module: string; filters: any; isPublic?: boolean }) {
  return prisma.savedFilter.create({ data: { ...data, userId } });
}

export async function update(id: string, userId: string, data: Partial<{ name: string; filters: any; isPublic: boolean }>) {
  const existing = await prisma.savedFilter.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) throw new AppError('Filter not found', 404);
  return prisma.savedFilter.update({ where: { id }, data });
}

export async function deleteFilter(id: string, userId: string) {
  const existing = await prisma.savedFilter.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) throw new AppError('Filter not found', 404);
  return prisma.savedFilter.delete({ where: { id } });
}

export async function getById(id: string, userId: string) {
  const filter = await prisma.savedFilter.findUnique({ where: { id } });
  if (!filter || filter.userId !== userId) throw new AppError('Filter not found', 404);
  return filter;
}

export async function list(userId: string, module?: string, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  const where: any = { userId };
  if (module) where.module = module;

  const [filters, total] = await Promise.all([
    prisma.savedFilter.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
    prisma.savedFilter.count({ where }),
  ]);
  return { filters, total };
}
