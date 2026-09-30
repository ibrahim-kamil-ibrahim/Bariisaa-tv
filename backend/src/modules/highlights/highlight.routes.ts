import { Router } from 'express';
import * as highlightController from './highlight.controller';
import { validate } from '../../middleware/validate';
import { createHighlightSchema } from './highlight.validation';
import { authenticate } from '../../middleware/authenticate';

const router: Router = Router();

router.post('/', authenticate, validate(createHighlightSchema), highlightController.create);
router.delete('/:id', authenticate, highlightController.remove);
router.get('/book/:bookId', authenticate, highlightController.getHighlights);
router.get('/', authenticate, highlightController.getAllHighlights);

export default router;
