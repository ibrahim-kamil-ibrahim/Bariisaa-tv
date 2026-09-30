import { Router } from 'express';
import * as activityController from './activity-timeline.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';

const router: Router = Router();

router.get('/', authenticate, authorize('audit:read'), activityController.listActivities);
router.get('/stats', authenticate, authorize('audit:read'), activityController.getActivityStats);

export default router;
