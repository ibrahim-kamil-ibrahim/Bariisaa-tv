import { Router } from 'express';
import * as settingsController from './settings.controller';
import { validate } from '../../middleware/validate';
import { updateSettingSchema, updateSettingsSchema } from './settings.validation';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';

const router: Router = Router();

router.get('/', authenticate, authorize('settings:read'), settingsController.getAllSettings);
router.put('/:key', authenticate, authorize('settings:update'), validate(updateSettingSchema), settingsController.updateSetting);
router.put('/', authenticate, authorize('settings:update'), validate(updateSettingsSchema), settingsController.updateSettings);

export default router;
