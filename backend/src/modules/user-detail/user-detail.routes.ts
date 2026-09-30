import { Router } from 'express';
import * as userDetailController from './user-detail.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';

const router: Router = Router();

router.get('/:id', authenticate, authorize('users:read'), userDetailController.getUserDetail);
router.get('/:id/activity', authenticate, authorize('users:read'), userDetailController.getUserActivity);
router.get('/:id/login-history', authenticate, authorize('users:read'), userDetailController.getLoginHistory);
router.get('/:id/devices', authenticate, authorize('users:read'), userDetailController.getUserDevices);
router.post('/:id/action', authenticate, authorize('users:update'), userDetailController.adminAction);

export default router;
