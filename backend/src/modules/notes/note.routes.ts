import { Router } from 'express';
import * as noteController from './note.controller';
import { validate } from '../../middleware/validate';
import { createNoteSchema, updateNoteSchema } from './note.validation';
import { authenticate } from '../../middleware/authenticate';

const router: Router = Router();

router.post('/', authenticate, validate(createNoteSchema), noteController.create);
router.put('/:id', authenticate, validate(updateNoteSchema), noteController.update);
router.delete('/:id', authenticate, noteController.remove);
router.get('/book/:bookId', authenticate, noteController.getNotes);
router.get('/', authenticate, noteController.getAllNotes);

export default router;
