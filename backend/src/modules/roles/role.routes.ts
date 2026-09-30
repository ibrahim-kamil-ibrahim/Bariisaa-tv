import { Router } from 'express';
import * as roleController from './role.controller';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { auditLog } from '../../middleware/auditLog';
import { roleSchema } from './role.validation';

const router: Router = Router();

router.get(
  '/',
  authenticate,
  authorize('roles:read'),
  roleController.listRoles
);

router.get(
  '/permissions',
  authenticate,
  authorize('roles:read'),
  roleController.getAllPermissions
);

router.get(
  '/:id',
  authenticate,
  authorize('roles:read'),
  roleController.getRoleById
);

router.post(
  '/',
  authenticate,
  authorize('roles:create'),
  validate(roleSchema),
  auditLog('create', 'role'),
  roleController.createRole
);

router.put(
  '/:id',
  authenticate,
  authorize('roles:update'),
  validate(roleSchema),
  auditLog('update', 'role'),
  roleController.updateRole
);

router.delete(
  '/:id',
  authenticate,
  authorize('roles:delete'),
  auditLog('delete', 'role'),
  roleController.deleteRole
);

export default router;
