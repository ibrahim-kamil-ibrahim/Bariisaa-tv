import { Router } from 'express';
import * as storytellingController from './storytelling.controller';
import { authenticate, optionalAuth } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { auditLog } from '../../middleware/auditLog';
import { validate } from '../../middleware/validate';
import { createStorySchema, updateStorySchema } from './storytelling.validation';

const router: Router = Router();

router.post('/',           authenticate, authorize('storytelling:create'), auditLog('create', 'story'), validate(createStorySchema), storytellingController.createStory);
router.put('/:id',         authenticate, authorize('storytelling:update'), auditLog('update', 'story'), validate(updateStorySchema), storytellingController.updateStory);
router.delete('/:id',      authenticate, authorize('storytelling:delete'), auditLog('delete', 'story'), storytellingController.deleteStory);
router.get('/featured',    optionalAuth, storytellingController.getFeaturedStories);
router.get('/categories',  optionalAuth, storytellingController.getCategories);
router.get('/:id',         optionalAuth, storytellingController.getStoryById);
router.get('/',            optionalAuth, storytellingController.listStories);

export default router;
