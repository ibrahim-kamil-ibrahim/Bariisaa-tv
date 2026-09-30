import prisma from '../../config/database';
import { AppError } from '../../middleware/errorHandler';

interface ListParams { page: number; limit: number; status?: string; userId?: string; }

export async function list(params: ListParams) {
  const { page, limit, status, userId } = params;
  const skip = (page - 1) * limit;
  const where: any = {};
  if (status) where.status = status;
  if (userId) where.userId = userId;

  const [invoices, total] = await Promise.all([
    prisma.invoice.findMany({ where, skip, take: limit, include: { user: { select: { name: true, email: true } }, payment: true }, orderBy: { createdAt: 'desc' } }),
    prisma.invoice.count({ where }),
  ]);
  return { invoices, total };
}

export async function getById(id: string) {
  const invoice = await prisma.invoice.findUnique({ where: { id }, include: { user: { select: { name: true, email: true } }, payment: true } });
  if (!invoice) throw new AppError('Invoice not found', 404);
  return invoice;
}

export async function create(data: any) {
  const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  return prisma.invoice.create({ data: { ...data, invoiceNumber } });
}
