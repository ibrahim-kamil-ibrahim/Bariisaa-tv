import { Router } from 'express';
import * as bulkController from './bulk-actions.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { auditLog } from '../../middleware/auditLog';

const router: Router = Router();

// Books bulk
router.post('/books', authenticate, authorize('books:update'), auditLog('bulk', 'books'), bulkController.bulkBooks);

// Users bulk
router.post('/users', authenticate, authorize('users:update'), auditLog('bulk', 'users'), bulkController.bulkUsers);

// Payments bulk
router.post('/payments', authenticate, authorize('payments:update'), auditLog('bulk', 'payments'), bulkController.bulkPayments);

// Coupons bulk
router.post('/coupons', authenticate, authorize('coupons:update'), auditLog('bulk', 'coupons'), bulkController.bulkCoupons);

export default router;
