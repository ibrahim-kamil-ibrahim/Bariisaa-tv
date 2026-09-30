import { Router } from 'express';
import * as notificationController from './notification.controller';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { auditLog } from '../../middleware/auditLog';
import { sendNotificationSchema } from './notification.validation';

const router: Router = Router();

router.post(
  '/send',
  authenticate,
  authorize('notifications:create'),
  auditLog('create', 'notification'),
  validate(sendNotificationSchema),
  notificationController.send
);

router.get('/', authenticate, notificationController.getUserNotifications);

router.put('/read-all', authenticate, notificationController.markAllAsRead);

router.get('/unread-count', authenticate, notificationController.getUnreadCount);

router.put('/:id/read', authenticate, notificationController.markAsRead);

router.delete('/:id', authenticate, notificationController.deleteNotification);

export default router;
