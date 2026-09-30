import { Router } from 'express';
import * as authorController from './author.controller';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { auditLog } from '../../middleware/auditLog';
import { createAuthorSchema, updateAuthorSchema } from './author.validation';
import { uploadImage } from '../../middleware/upload';

const router: Router = Router();

router.post('/', authenticate, authorize('authors:create'), auditLog('create', 'author'), validate(createAuthorSchema), authorController.createAuthor);
router.put('/:id', authenticate, authorize('authors:update'), auditLog('update', 'author'), validate(updateAuthorSchema), authorController.updateAuthor);
router.delete('/:id', authenticate, authorize('authors:delete'), auditLog('delete', 'author'), authorController.deleteAuthor);
router.put('/:id/photo', authenticate, authorize('authors:update'), uploadImage, authorController.uploadAuthorPhoto);
router.get('/:id', authorController.getAuthorById);
router.get('/', authorController.listAuthors);

export default router;
