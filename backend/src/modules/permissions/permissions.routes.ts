import { Router } from 'express';
import * as permissionsController from './permissions.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { auditLog } from '../../middleware/auditLog';

const router: Router = Router();

router.get('/matrix', authenticate, authorize('roles:read'), permissionsController.getPermissionMatrix);
router.put('/matrix/:roleId', authenticate, authorize('roles:update'), auditLog('update', 'permissions'), permissionsController.updateRolePermissions);
router.get('/resources', authenticate, authorize('roles:read'), permissionsController.getResources);

export default router;
