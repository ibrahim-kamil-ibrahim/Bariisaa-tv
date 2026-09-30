import { Router } from 'express';
import * as couponController from './coupon.controller';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { auditLog } from '../../middleware/auditLog';
import { couponSchema } from './coupon.validation';

const router: Router = Router();

router.get(
  '/',
  authenticate,
  authorize('coupons:read'),
  couponController.listCoupons
);

router.get(
  '/:id',
  authenticate,
  authorize('coupons:read'),
  couponController.getCouponById
);

router.post(
  '/',
  authenticate,
  authorize('coupons:create'),
  validate(couponSchema),
  auditLog('create', 'coupon'),
  couponController.createCoupon
);

router.put(
  '/:id',
  authenticate,
  authorize('coupons:update'),
  validate(couponSchema),
  auditLog('update', 'coupon'),
  couponController.updateCoupon
);

router.delete(
  '/:id',
  authenticate,
  authorize('coupons:delete'),
  auditLog('delete', 'coupon'),
  couponController.deleteCoupon
);

export default router;
