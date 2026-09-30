import prisma from '../../config/database';
import { AppError } from '../../middleware/errorHandler';

export async function create(data: any, createdBy: string) {
  return prisma.cmsPage.create({ data: { ...data, createdBy } });
}

export async function update(id: string, data: any) {
  const page = await prisma.cmsPage.findUnique({ where: { id } });
  if (!page) throw new AppError('Page not found', 404);
  if (data.status === 'published' && !page.publishedAt) data.publishedAt = new Date();
  return prisma.cmsPage.update({ where: { id }, data });
}

export async function deletePage(id: string) {
  const page = await prisma.cmsPage.findUnique({ where: { id } });
  if (!page) throw new AppError('Page not found', 404);
  return prisma.cmsPage.delete({ where: { id } });
}

export async function getBySlug(slug: string) {
  const page = await prisma.cmsPage.findUnique({ where: { slug, status: 'published' } });
  if (!page) throw new AppError('Page not found', 404);
  return page;
}

export async function list(params: { page: number; limit: number; type?: string; status?: string }) {
  const { page, limit, type, status } = params;
  const skip = (page - 1) * limit;
  const where: any = {};
  if (type) where.type = type;
  if (status) where.status = status;

  const [pages, total] = await Promise.all([
    prisma.cmsPage.findMany({ where, skip, take: limit, orderBy: { order: 'asc' } }),
    prisma.cmsPage.count({ where }),
  ]);
  return { pages, total };
}
