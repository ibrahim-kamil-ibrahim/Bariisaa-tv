import { Router } from 'express';
import * as userController from './user.controller';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { auditLog } from '../../middleware/auditLog';
import { uploadImage } from '../../middleware/upload';
import { updateProfileSchema } from './user.validation';

const router: Router = Router();

router.get('/profile', authenticate, userController.getProfile);
router.put('/profile', authenticate, validate(updateProfileSchema), userController.updateProfile);
router.put('/avatar', authenticate, uploadImage as any, userController.updateAvatar);
router.get('/devices', authenticate, userController.getDevices);
router.delete('/devices/:id', authenticate, userController.removeDevice);

router.post('/bulk-delete', authenticate, authorize('users:delete'), auditLog('bulk_delete', 'user'), userController.bulkDelete);
router.post('/bulk-status', authenticate, authorize('users:update'), auditLog('bulk_update_status', 'user'), userController.bulkUpdateStatus);

router.get('/', authenticate, authorize('users:read'), userController.listUsers);
router.get('/:id', authenticate, authorize('users:read'), userController.getUserById);
router.patch('/:id/status', authenticate, authorize('users:update'), auditLog('update_status', 'user'), userController.updateUserStatus);
router.delete('/:id', authenticate, authorize('users:delete'), auditLog('delete_user', 'user'), userController.deleteUser);
router.post('/:id/reset-password', authenticate, authorize('users:update'), auditLog('reset_password', 'user'), userController.adminResetPassword);

export default router;
