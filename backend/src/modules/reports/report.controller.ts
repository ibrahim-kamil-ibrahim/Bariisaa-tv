import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/authenticate';
import * as reportService from './report.service';
import { successResponse } from '../../utils/response';

export async function getDashboardStats(_req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const stats = await reportService.getDashboardStats();
    successResponse(res, stats);
  } catch (error) {
    next(error);
  }
}

export async function getRevenueReport(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const startDate = req.query.startDate
      ? new Date(req.query.startDate as string)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = req.query.endDate
      ? new Date(req.query.endDate as string)
      : new Date();
    const report = await reportService.getRevenueReport(startDate, endDate);
    successResponse(res, report);
  } catch (error) {
    next(error);
  }
}

export async function getUserReport(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const startDate = req.query.startDate
      ? new Date(req.query.startDate as string)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = req.query.endDate
      ? new Date(req.query.endDate as string)
      : new Date();
    const report = await reportService.getUserReport(startDate, endDate);
    successResponse(res, report);
  } catch (error) {
    next(error);
  }
}

export async function getSubscriptionReport(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const startDate = req.query.startDate
      ? new Date(req.query.startDate as string)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = req.query.endDate
      ? new Date(req.query.endDate as string)
      : new Date();
    const report = await reportService.getSubscriptionReport(startDate, endDate);
    successResponse(res, report);
  } catch (error) {
    next(error);
  }
}

export async function getEngagementReport(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const startDate = req.query.startDate
      ? new Date(req.query.startDate as string)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = req.query.endDate
      ? new Date(req.query.endDate as string)
      : new Date();
    const report = await reportService.getEngagementReport(startDate, endDate);
    successResponse(res, report);
  } catch (error) {
    next(error);
  }
}

export async function exportRevenue(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const format = (req.query.format as string) || 'json';
    const startDate = req.query.startDate
      ? new Date(req.query.startDate as string)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = req.query.endDate
      ? new Date(req.query.endDate as string)
      : new Date();

    const report = await reportService.getRevenueReport(startDate, endDate);

    if (format === 'csv') {
      const rows = Object.entries(report.revenueByDay).map(([date, amount]) => ({
        date,
        amount,
      }));
      const buffer = reportService.exportCsv(rows, [
        { key: 'date', label: 'Date' },
        { key: 'amount', label: 'Revenue' },
      ]);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=revenue-report.csv');
      res.send(buffer);
      return;
    }

    if (format === 'pdf') {
      const rows = Object.entries(report.revenueByDay).map(([date, amount]) => ({
        date,
        amount: String(amount),
      }));
      const buffer = await reportService.exportPdf(rows, 'Revenue Report');
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=revenue-report.pdf');
      res.send(buffer);
      return;
    }

    successResponse(res, report);
  } catch (error) {
    next(error);
  }
}

export async function exportUsers(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const format = (req.query.format as string) || 'json';
    const startDate = req.query.startDate
      ? new Date(req.query.startDate as string)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = req.query.endDate
      ? new Date(req.query.endDate as string)
      : new Date();

    const report = await reportService.getUserReport(startDate, endDate);

    if (format === 'csv') {
      const rows = [
        {
          metric: 'New Signups',
          value: String(report.newSignups),
        },
        {
          metric: 'Active Users',
          value: String(report.activeUsers),
        },
        {
          metric: 'Churn Rate (%)',
          value: String(report.churnRate),
        },
        {
          metric: 'Cancelled Subscriptions',
          value: String(report.cancelledSubscriptions),
        },
      ];
      const buffer = reportService.exportCsv(rows, [
        { key: 'metric', label: 'Metric' },
        { key: 'value', label: 'Value' },
      ]);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=user-report.csv');
      res.send(buffer);
      return;
    }

    if (format === 'pdf') {
      const rows = [
        { metric: 'New Signups', value: String(report.newSignups) },
        { metric: 'Active Users', value: String(report.activeUsers) },
        { metric: 'Churn Rate (%)', value: String(report.churnRate) },
        {
          metric: 'Cancelled Subscriptions',
          value: String(report.cancelledSubscriptions),
        },
      ];
      const buffer = await reportService.exportPdf(rows, 'User Report');
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=user-report.pdf');
      res.send(buffer);
      return;
    }

    successResponse(res, report);
  } catch (error) {
    next(error);
  }
}

