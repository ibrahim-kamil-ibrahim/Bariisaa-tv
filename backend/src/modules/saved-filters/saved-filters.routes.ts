import { Router } from 'express';
import * as savedFilterController from './saved-filters.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { auditLog } from '../../middleware/auditLog';
import { validate } from '../../middleware/validate';
import { createSavedFilterSchema, updateSavedFilterSchema } from './saved-filters.validation';

const router: Router = Router();

router.post('/', authenticate, authorize('filters:create'), auditLog('create', 'filter'), validate(createSavedFilterSchema), savedFilterController.createFilter);
router.put('/:id', authenticate, authorize('filters:update'), auditLog('update', 'filter'), validate(updateSavedFilterSchema), savedFilterController.updateFilter);
router.delete('/:id', authenticate, authorize('filters:delete'), auditLog('delete', 'filter'), savedFilterController.deleteFilter);
router.get('/:id', authenticate, savedFilterController.getFilter);
router.get('/', authenticate, savedFilterController.listFilters);

export default router;
