import { Router } from 'express';
import * as bookmarkController from './bookmark.controller';
import { validate } from '../../middleware/validate';
import { createBookmarkSchema } from './bookmark.validation';
import { authenticate } from '../../middleware/authenticate';

const router: Router = Router();

router.post('/', authenticate, validate(createBookmarkSchema), bookmarkController.create);
router.delete('/:id', authenticate, bookmarkController.remove);
router.get('/book/:bookId', authenticate, bookmarkController.getBookmarks);
router.get('/', authenticate, bookmarkController.getAllBookmarks);

export default router;
