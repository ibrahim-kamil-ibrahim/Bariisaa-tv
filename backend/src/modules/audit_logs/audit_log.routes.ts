import { Router } from 'express';
import * as auditLogController from './audit_log.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';

const router: Router = Router();

router.get(
  '/',
  authenticate,
  authorize('audit:read'),
  auditLogController.listAuditLogs
);

export default router;
