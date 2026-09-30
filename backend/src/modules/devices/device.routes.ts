import { Router } from 'express';
import * as deviceController from './device.controller';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/authenticate';
import { registerDeviceSchema } from './device.validation';

const router: Router = Router();

router.post(
  '/register',
  authenticate,
  validate(registerDeviceSchema),
  deviceController.registerDevice
);

router.get('/', authenticate, deviceController.listDevices);

router.delete('/:id', authenticate, deviceController.removeDevice);

router.patch('/:deviceUid/fcm-token', authenticate, deviceController.updateFcmToken);

export default router;
