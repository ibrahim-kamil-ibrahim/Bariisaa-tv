import { Router } from 'express';
import * as cmsController from './cms.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { auditLog } from '../../middleware/auditLog';
import { validate } from '../../middleware/validate';
import { createCmsPageSchema, updateCmsPageSchema } from './cms.validation';

const router: Router = Router();

router.post('/', authenticate, authorize('cms:create'), auditLog('create', 'cms-page'), validate(createCmsPageSchema), cmsController.createPage);
router.put('/:id', authenticate, authorize('cms:update'), auditLog('update', 'cms-page'), validate(updateCmsPageSchema), cmsController.updatePage);
router.delete('/:id', authenticate, authorize('cms:delete'), auditLog('delete', 'cms-page'), cmsController.deletePage);
router.get('/:slug', cmsController.getPageBySlug);
router.get('/', authenticate, authorize('cms:read'), cmsController.listPages);

export default router;
