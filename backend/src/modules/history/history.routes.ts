import { Router } from 'express';
import * as historyController from './history.controller';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/authenticate';
import {
  updateReadingProgressSchema,
  updateListeningProgressSchema,
} from './history.validation';

const router: Router = Router();

router.put(
  '/reading/progress',
  authenticate,
  validate(updateReadingProgressSchema),
  historyController.updateReadingProgress
);

router.put(
  '/listening/progress',
  authenticate,
  validate(updateListeningProgressSchema),
  historyController.updateListeningProgress
);

router.get('/reading/continue', authenticate, historyController.getContinueReading);

router.get('/listening/continue', authenticate, historyController.getContinueListening);

router.get('/reading', authenticate, historyController.getReadingHistory);

router.get('/listening', authenticate, historyController.getListeningHistory);

router.delete('/reading/all', authenticate, historyController.clearAllReadingHistory);

router.delete('/listening/all', authenticate, historyController.clearAllListeningHistory);

router.delete('/reading/:id', authenticate, historyController.deleteReadingHistory);

router.delete('/listening/:id', authenticate, historyController.deleteListeningHistory);

export default router;
