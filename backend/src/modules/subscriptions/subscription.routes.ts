import { Router } from 'express';
import * as subscriptionController from './subscription.controller';
import { validate } from '../../middleware/validate';
import { subscribeSchema, adminPlanSchema } from './subscription.validation';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { auditLog } from '../../middleware/auditLog';

const router: Router = Router();

router.get('/plans', subscriptionController.getPlans);
router.get('/plans/all', authenticate, authorize('subscriptions:read'), subscriptionController.getPlansAll);
router.get('/plans/:id', subscriptionController.getPlanById);

router.post(
  '/plans',
  authenticate,
  authorize('subscriptions:create'),
  validate(adminPlanSchema),
  auditLog('create', 'subscription_plan'),
  subscriptionController.createPlan
);

router.put(
  '/plans/:id',
  authenticate,
  authorize('subscriptions:update'),
  validate(adminPlanSchema),
  auditLog('update', 'subscription_plan'),
  subscriptionController.updatePlan
);

router.patch(
  '/plans/:id',
  authenticate,
  authorize('subscriptions:update'),
  auditLog('update', 'subscription_plan'),
  subscriptionController.updatePlan
);

router.delete(
  '/plans/:id',
  authenticate,
  authorize('subscriptions:delete'),
  auditLog('delete', 'subscription_plan'),
  subscriptionController.deletePlan
);

router.post(
  '/subscribe',
  authenticate,
  validate(subscribeSchema),
  auditLog('subscribe', 'subscription'),
  subscriptionController.subscribe
);

router.post('/cancel', authenticate, subscriptionController.cancelSubscription);
router.get('/me', authenticate, subscriptionController.getMySubscription);
router.get('/current', authenticate, subscriptionController.getUserSubscription);
router.get('/history', authenticate, subscriptionController.getSubscriptionHistory);

export default router;
