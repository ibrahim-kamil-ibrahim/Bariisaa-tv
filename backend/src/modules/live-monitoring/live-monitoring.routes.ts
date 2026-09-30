import { Router } from 'express';
import * as liveController from './live-monitoring.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';

const router: Router = Router();

router.get('/metrics', authenticate, authorize('reports:read'), liveController.getMetrics);
router.get('/online-users', authenticate, authorize('reports:read'), liveController.getOnlineUsers);
router.post('/metric', authenticate, authorize('reports:create'), liveController.recordMetric);

export default router;
