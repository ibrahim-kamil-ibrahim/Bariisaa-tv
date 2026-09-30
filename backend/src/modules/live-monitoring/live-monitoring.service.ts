import prisma from '../../config/database';

export async function getMetrics(metric?: string, hours = 24) {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);
  const where: any = { timestamp: { gte: since } };
  if (metric) where.metric = metric;

  const metrics = await prisma.liveMetric.findMany({ where, orderBy: { timestamp: 'asc' } });
  const grouped: Record<string, { values: { timestamp: Date; value: number }[]; current: number }> = {};

  metrics.forEach(m => {
    if (!grouped[m.metric]) grouped[m.metric] = { values: [], current: m.value };
    grouped[m.metric].values.push({ timestamp: m.timestamp, value: m.value });
    grouped[m.metric].current = m.value;
  });

  return grouped;
}

export async function getOnlineUsers() {
  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
  const count = await prisma.user.count({ where: { updatedAt: { gte: fiveMinAgo } } });
  return { online: count, timestamp: new Date() };
}

export async function recordMetric(data: { metric: string; value: number }) {
  return prisma.liveMetric.create({ data });
}
