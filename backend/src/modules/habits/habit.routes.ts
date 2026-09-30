import { Router } from 'express';
import * as habitController from './habit.controller';
import { authenticate, optionalAuth } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { auditLog } from '../../middleware/auditLog';
import { validate } from '../../middleware/validate';
import { createHabitSchema, updateHabitSchema } from './habit.validation';

const router: Router = Router();

router.post('/',           authenticate, authorize('habits:create'), auditLog('create', 'habits'), validate(createHabitSchema), habitController.createHabit);
router.put('/:id',         authenticate, authorize('habits:update'), auditLog('update', 'habits'), validate(updateHabitSchema), habitController.updateHabit);
router.delete('/:id',      authenticate, authorize('habits:delete'), auditLog('delete', 'habits'), habitController.deleteHabit);
router.get('/my/stats',    authenticate, habitController.getMyStats);
router.get('/my/progress', authenticate, habitController.getMyProgress);
router.post('/:id/complete', authenticate, auditLog('complete', 'habits'), habitController.completeHabit);
router.get('/:id',         optionalAuth, habitController.getHabitById);
router.get('/',            optionalAuth, habitController.listHabits);

export default router;
