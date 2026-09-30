import prisma from '../../config/database';
import { AppError } from '../../middleware/errorHandler';

export async function createFolder(data: { name: string; parentId?: string }, createdBy: string) {
  return prisma.mediaFolder.create({ data: { ...data, createdBy } });
}

export async function updateFolder(id: string, data: { name?: string; parentId?: string }) {
  const folder = await prisma.mediaFolder.findUnique({ where: { id } });
  if (!folder) throw new AppError('Folder not found', 404);
  return prisma.mediaFolder.update({ where: { id }, data });
}

export async function deleteFolder(id: string) {
  const folder = await prisma.mediaFolder.findUnique({ where: { id }, include: { _count: { select: { files: true, children: true } } } });
  if (!folder) throw new AppError('Folder not found', 404);
  if (folder._count.files > 0 || folder._count.children > 0) throw new AppError('Folder is not empty', 400);
  return prisma.mediaFolder.delete({ where: { id } });
}

export async function listFolders(parentId?: string) {
  return prisma.mediaFolder.findMany({
    where: { parentId: parentId || null },
    include: { _count: { select: { files: true, children: true } } },
    orderBy: { name: 'asc' },
  });
}

export async function uploadFile(data: any, createdBy: string) {
  return prisma.mediaFile.create({ data: { ...data, createdBy } });
}

export async function updateFile(id: string, data: { name?: string; folderId?: string; tags?: string[]; isPublic?: boolean }) {
  const file = await prisma.mediaFile.findUnique({ where: { id } });
  if (!file) throw new AppError('File not found', 404);
  return prisma.mediaFile.update({ where: { id }, data });
}

export async function deleteFile(id: string) {
  // Soft delete
  return prisma.mediaFile.update({ where: { id }, data: { deletedAt: new Date() } });
}

export async function restoreFile(id: string) {
  return prisma.mediaFile.update({ where: { id }, data: { deletedAt: null } });
}

export async function getFile(id: string) {
  const file = await prisma.mediaFile.findUnique({ where: { id } });
  if (!file) throw new AppError('File not found', 404);
  return file;
}

export async function listFiles(params: { page: number; limit: number; type?: string; folderId?: string; deleted?: boolean }) {
  const { page, limit, type, folderId, deleted } = params;
  const skip = (page - 1) * limit;
  const where: any = {};
  if (type) where.type = type;
  if (folderId) where.folderId = folderId;
  if (deleted) where.deletedAt = { not: null };
  else where.deletedAt = null;

  const [files, total] = await Promise.all([
    prisma.mediaFile.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
    prisma.mediaFile.count({ where }),
  ]);
  return { files, total };
}

export async function getStats() {
  const [totalFiles, totalSize, typeBreakdown, folderCount, recycleBinCount] = await Promise.all([
    prisma.mediaFile.count({ where: { deletedAt: null } }),
    prisma.mediaFile.aggregate({ where: { deletedAt: null }, _sum: { size: true } }),
    prisma.mediaFile.groupBy({ by: ['type'], where: { deletedAt: null }, _count: { id: true }, orderBy: { _count: { id: 'desc' } } }),
    prisma.mediaFolder.count(),
    prisma.mediaFile.count({ where: { deletedAt: { not: null } } }),
  ]);

  return {
    totalFiles,
    totalSize: totalSize._sum.size || 0,
    typeBreakdown,
    folderCount,
    recycleBinCount,
  };
}
