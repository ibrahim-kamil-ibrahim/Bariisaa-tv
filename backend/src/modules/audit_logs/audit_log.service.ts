import prisma from '../../config/database';

export interface AuditLogQuery {
  action?: string;
  resource?: string;
  userId?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
}

export async function listAuditLogs(query: AuditLogQuery) {
  const page = query.page || 1;
  const limit = query.limit || 20;

  const where: Record<string, unknown> = {};

  if (query.action) {
    where.action = { equals: query.action, mode: 'insensitive' };
  }

  if (query.resource) {
    where.resource = { equals: query.resource, mode: 'insensitive' };
  }

  if (query.userId) {
    where.userId = query.userId;
  }

  if (query.fromDate || query.toDate) {
    where.createdAt = {};
    if (query.fromDate) {
      (where.createdAt as Record<string, unknown>).gte = new Date(query.fromDate);
    }
    if (query.toDate) {
      const to = new Date(query.toDate);
      to.setHours(23, 59, 59, 999);
      (where.createdAt as Record<string, unknown>).lte = to;
    }
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    }),
    prisma.auditLog.count({ where }),
  ]);

  const formatted = logs.map((log) => ({
    id: log.id,
    userId: log.userId,
    user: log.user,
    action: log.action,
    resource: log.resource,
    resourceId: log.resourceId,
    details: log.details,
    ip: log.ipAddress,
    ipAddress: log.ipAddress,
    userAgent: log.userAgent,
    createdAt: log.createdAt.toISOString(),
  }));

  return {
    auditLogs: formatted,
    logs: formatted,
    total,
    page,
    limit,
  };
}
