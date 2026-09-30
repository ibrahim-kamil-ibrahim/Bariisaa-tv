import { Router } from 'express';
import * as contentAccessController from './content-access.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { auditLog } from '../../middleware/auditLog';
import { setContentAccessSchema } from './content-access.validation';

const router: Router = Router();

// PATCH /admin/content/:id/access — admin sets accessTier / requiredPlanId
// Accepts any of the per-module update permissions (or super_admin).
router.patch(
  '/:id/access',
  authenticate,
  authorize('books:update', 'music:update', 'storytelling:update'),
  validate(setContentAccessSchema),
  auditLog('update', 'content_access'),
  contentAccessController.setContentAccess
);

export default router;
