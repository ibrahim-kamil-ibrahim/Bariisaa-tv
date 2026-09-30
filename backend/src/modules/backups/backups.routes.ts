import { Router } from 'express';
import * as backupController from './backups.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { auditLog } from '../../middleware/auditLog';

const router: Router = Router();

router.post('/', authenticate, authorize('settings:create'), auditLog('create', 'backup'), backupController.createBackup);
router.get('/', authenticate, authorize('settings:read'), backupController.listBackups);
router.post('/:id/restore', authenticate, authorize('settings:update'), auditLog('restore', 'backup'), backupController.restoreBackup);
router.delete('/:id', authenticate, authorize('settings:delete'), auditLog('delete', 'backup'), backupController.deleteBackup);

export default router;
