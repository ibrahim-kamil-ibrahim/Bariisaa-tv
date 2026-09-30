import { Router } from 'express';
import * as reportController from './report.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';

const router: Router = Router();

router.get(
  '/dashboard',
  authenticate,
  authorize('reports:read'),
  reportController.getDashboardStats
);

router.get(
  '/revenue',
  authenticate,
  authorize('reports:read'),
  reportController.getRevenueReport
);

router.get(
  '/users',
  authenticate,
  authorize('reports:read'),
  reportController.getUserReport
);

router.get(
  '/subscriptions',
  authenticate,
  authorize('reports:read'),
  reportController.getSubscriptionReport
);

router.get(
  '/engagement',
  authenticate,
  authorize('reports:read'),
  reportController.getEngagementReport
);

router.get(
  '/export/revenue',
  authenticate,
  authorize('reports:read'),
  reportController.exportRevenue
);

router.get(
  '/export/users',
  authenticate,
  authorize('reports:read'),
  reportController.exportUsers
);

export default router;
