import { Router } from 'express';
import * as paymentController from './payment.controller';
import { validate } from '../../middleware/validate';
import { validateCouponSchema } from './payment.validation';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';

const router: Router = Router();

router.post(
  '/validate-coupon',
  authenticate,
  validate(validateCouponSchema),
  paymentController.validateCoupon
);

router.post(
  '/webhooks/stripe',
  paymentController.handleStripeWebhook
);

router.post('/webhooks/chapa', paymentController.handleChapaWebhook);
router.post('/webhooks/telebirr', paymentController.handleTelebirrCallback);

router.get('/admin/all', authenticate, authorize('payments:read'), paymentController.getAllPayments);
router.post('/admin/refund', authenticate, authorize('payments:update'), paymentController.refundPaymentHandler);
router.get('/', authenticate, paymentController.getPaymentHistory);
router.get('/:id', authenticate, paymentController.getPaymentById);

export default router;
