import { Router } from 'express';
import * as reportController from './report-builder.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { auditLog } from '../../middleware/auditLog';

const router: Router = Router();

router.get('/', authenticate, authorize('reports:read'), reportController.listReports);
router.post('/', authenticate, authorize('reports:create'), auditLog('create', 'report'), reportController.createReport);
router.put('/:id', authenticate, authorize('reports:update'), auditLog('update', 'report'), reportController.updateReport);
router.delete('/:id', authenticate, authorize('reports:delete'), auditLog('delete', 'report'), reportController.deleteReport);
router.get('/export/:type', authenticate, authorize('reports:read'), reportController.exportReport);

export default router;
