import { Router } from 'express';
import * as categoryController from './category.controller';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { auditLog } from '../../middleware/auditLog';
import { uploadImage } from '../../middleware/upload';
import { createCategorySchema, updateCategorySchema } from './category.validation';

const router: Router = Router();

router.get('/explore', categoryController.listExploreCategories);
router.post('/', authenticate, authorize('categories:create'), auditLog('create', 'category'), uploadImage, validate(createCategorySchema), categoryController.createCategory);
router.put('/:id', authenticate, authorize('categories:update'), auditLog('update', 'category'), uploadImage, validate(updateCategorySchema), categoryController.updateCategory);
router.delete('/:id', authenticate, authorize('categories:delete'), auditLog('delete', 'category'), categoryController.deleteCategory);
router.get('/:id', categoryController.getCategoryById);
router.get('/', categoryController.listCategories);

export default router;
