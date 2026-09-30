import { Router } from 'express';
import * as doctorController from './my-doctor.controller';
import { authenticate, optionalAuth } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { auditLog } from '../../middleware/auditLog';
import { validate } from '../../middleware/validate';
import {
  createHealthTipSchema,
  updateHealthTipSchema,
  createDoctorProfileSchema,
  updateDoctorProfileSchema,
} from './my-doctor.validation';

const router: Router = Router();

router.post('/tips',             authenticate, authorize('doctor:create'), auditLog('create', 'health-tip'), validate(createHealthTipSchema), doctorController.createHealthTip);
router.put('/tips/:id',          authenticate, authorize('doctor:update'), auditLog('update', 'health-tip'), validate(updateHealthTipSchema), doctorController.updateHealthTip);
router.delete('/tips/:id',       authenticate, authorize('doctor:delete'), auditLog('delete', 'health-tip'), doctorController.deleteHealthTip);
router.post('/profiles',         authenticate, authorize('doctor:create'), auditLog('create', 'doctor-profile'), validate(createDoctorProfileSchema), doctorController.createDoctorProfile);
router.put('/profiles/:id',      authenticate, authorize('doctor:update'), auditLog('update', 'doctor-profile'), validate(updateDoctorProfileSchema), doctorController.updateDoctorProfile);
router.delete('/profiles/:id',   authenticate, authorize('doctor:delete'), auditLog('delete', 'doctor-profile'), doctorController.deleteDoctorProfile);
router.get('/tips',              optionalAuth, doctorController.listHealthTips);
router.get('/profiles',          optionalAuth, doctorController.listDoctorProfiles);

export default router;
