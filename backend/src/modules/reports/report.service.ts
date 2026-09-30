import prisma from '../../config/database';
import PDFDocument from 'pdfkit';

export async function getDashboardStats() {
  const [
    totalUsers,
    activeSubscriptions,
    totalBooks,
    newUsers30d,
  ] = await Promise.all([
    prisma.user.count({ where: { status: 'ACTIVE' } }),
    prisma.subscription.count({ where: { status: 'ACTIVE' } }),
    prisma.book.count({ where: { status: 'PUBLISHED' } }),
    prisma.user.count({
      where: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
    }),
  ]);

  const revenueResult = await prisma.payment.aggregate({
    where: { status: 'COMPLETED' },
    _sum: { amount: true },
  });

  const revenue30dResult = await prisma.payment.aggregate({
    where: {
      status: 'COMPLETED',
      createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    },
    _sum: { amount: true },
  });

  return {
    totalUsers,
    activeSubscriptions,
    totalRevenue: revenueResult._sum.amount || 0,
    totalBooks,
    newUsers30d,
    revenue30d: revenue30dResult._sum.amount || 0,
  };
}

export async function getRevenueReport(startDate: Date, endDate: Date) {
  const payments = await prisma.payment.findMany({
    where: {
      status: 'COMPLETED',
      createdAt: { gte: startDate, lte: endDate },
    },
    include: {
      subscription: {
        include: { plan: true },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  const revenueByDay: Record<string, number> = {};
  const byGateway: Record<string, number> = {};
  const byPlan: Record<string, number> = {};

  for (const payment of payments) {
    const day = payment.createdAt.toISOString().split('T')[0];
    revenueByDay[day] = (revenueByDay[day] || 0) + payment.amount;

    byGateway[payment.gateway] = (byGateway[payment.gateway] || 0) + payment.amount;

    const planName = payment.subscription?.plan?.name || 'Direct';
    byPlan[planName] = (byPlan[planName] || 0) + payment.amount;
  }

  const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);

  return {
    totalRevenue,
    revenueByDay,
    byGateway,
    byPlan,
  };
}

export async function getUserReport(startDate: Date, endDate: Date) {
  const [newSignups, totalUsers, activeUsers] = await Promise.all([
    prisma.user.count({
      where: { createdAt: { gte: startDate, lte: endDate } },
    }),
    prisma.user.count({
      where: { createdAt: { lte: endDate } },
    }),
    prisma.user.count({
      where: {
        status: 'ACTIVE',
        OR: [
          { readingHistory: { some: { lastAccessedAt: { gte: startDate, lte: endDate } } } },
          { listeningHistory: { some: { lastAccessedAt: { gte: startDate, lte: endDate } } } },
        ],
      },
    }),
  ]);

  const cancelledSubs = await prisma.subscription.count({
    where: {
      status: 'CANCELLED',
      updatedAt: { gte: startDate, lte: endDate },
    },
  });

  const churnRate = totalUsers > 0 ? (cancelledSubs / totalUsers) * 100 : 0;

  return {
    newSignups,
    activeUsers,
    churnRate: Math.round(churnRate * 100) / 100,
    cancelledSubscriptions: cancelledSubs,
  };
}

export async function getSubscriptionReport(startDate: Date, endDate: Date) {
  const subscriptions = await prisma.subscription.findMany({
    where: {
      createdAt: { gte: startDate, lte: endDate },
    },
    include: { plan: true },
  });

  const newSubscriptions = subscriptions.filter(
    (s) => !s.paymentId || s.status === 'ACTIVE'
  ).length;

  const renewals = subscriptions.filter((s) => s.autoRenew).length;

  const cancellations = await prisma.subscription.count({
    where: {
      status: 'CANCELLED',
      updatedAt: { gte: startDate, lte: endDate },
    },
  });

  const byPlan: Record<string, number> = {};
  for (const sub of subscriptions) {
    byPlan[sub.plan.name] = (byPlan[sub.plan.name] || 0) + 1;
  }

  return {
    newSubscriptions,
    renewals,
    cancellations,
    byPlan,
  };
}

export async function getEngagementReport(startDate: Date, endDate: Date) {
  const [readingHistory, listeningHistory] = await Promise.all([
    prisma.readingHistory.findMany({
      where: { lastAccessedAt: { gte: startDate, lte: endDate } },
      include: { book: { select: { title: true, pageCount: true } } },
    }),
    prisma.listeningHistory.findMany({
      where: { lastAccessedAt: { gte: startDate, lte: endDate } },
      include: {
        book: {
          select: {
            title: true,
            audioFiles: { select: { durationSeconds: true } },
          },
        },
      },
    }),
  ]);

  const booksRead = readingHistory.filter((r) => r.progressPercent >= 90).length;
  const audiobooksListened = listeningHistory.length;

  const avgReadingProgress =
    readingHistory.length > 0
      ? readingHistory.reduce((sum, r) => sum + r.progressPercent, 0) / readingHistory.length
      : 0;

  const totalListeningSeconds = listeningHistory.reduce(
    (sum, l) => sum + l.lastTimestampSec,
    0
  );
  const avgListeningTimeMin =
    listeningHistory.length > 0
      ? Math.round(totalListeningSeconds / listeningHistory.length / 60)
      : 0;

  return {
    booksRead,
    audiobooksListened,
    avgReadingProgress: Math.round(avgReadingProgress * 100) / 100,
    avgListeningTimeMin,
    totalReadingSessions: readingHistory.length,
    totalListeningSessions: listeningHistory.length,
  };
}

export function exportCsv(
  data: Record<string, any>[],
  headers: { key: string; label: string }[]
): Buffer {
  const headerLine = headers.map((h) => h.label).join(',');
  const rows = data.map((row) =>
    headers
      .map((h) => {
        const val = row[h.key];
        if (val === null || val === undefined) return '';
        const str = String(val);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      })
      .join(',')
  );
  const csv = [headerLine, ...rows].join('\n');
  return Buffer.from(csv, 'utf-8');
}

export function exportPdf(data: Record<string, any>[], title: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(20).text(title, { align: 'center' });
    doc.moveDown(2);

    doc.fontSize(10).text(`Generated: ${new Date().toISOString()}`, { align: 'right' });
    doc.moveDown(2);

    if (data.length === 0) {
      doc.fontSize(12).text('No data available for the selected period.');
      doc.end();
      return;
    }

    const headers = Object.keys(data[0]);
    const colWidth = (doc.page.width - 100) / headers.length;
    const startY = doc.y;

    doc.fontSize(9).font('Helvetica-Bold');
    headers.forEach((header, i) => {
      doc.text(header, 50 + i * colWidth, startY, {
        width: colWidth - 5,
        align: 'left',
      });
    });

    doc.moveDown(1.5);
    doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).stroke();
    doc.moveDown(0.5);

    doc.font('Helvetica').fontSize(8);
    for (const row of data) {
      if (doc.y > doc.page.height - 80) {
        doc.addPage();
        doc.fontSize(9).font('Helvetica-Bold');
        headers.forEach((header, i) => {
          doc.text(header, 50 + i * colWidth, 50, {
            width: colWidth - 5,
            align: 'left',
          });
        });
        doc.moveDown(1.5);
        doc.font('Helvetica').fontSize(8);
      }

      const rowY = doc.y;
      headers.forEach((header, i) => {
        const val = row[header];
        const text = val === null || val === undefined ? '' : String(val);
        doc.text(text.substring(0, 30), 50 + i * colWidth, rowY, {
          width: colWidth - 5,
          align: 'left',
        });
      });
      doc.moveDown(0.8);
    }

    doc.end();
  });
}
