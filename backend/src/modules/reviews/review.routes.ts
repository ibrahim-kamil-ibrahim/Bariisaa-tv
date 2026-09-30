import { Router } from 'express';
import * as reviewController from './review.controller';
import { validate } from '../../middleware/validate';
import { createReviewSchema, updateReviewSchema } from './review.validation';
import { authenticate } from '../../middleware/authenticate';

const router: Router = Router();

router.post('/', authenticate, validate(createReviewSchema), reviewController.create);
router.put('/:id', authenticate, validate(updateReviewSchema), reviewController.update);
router.delete('/:id', authenticate, reviewController.remove);
router.get('/book/:bookId', reviewController.getReviews);
router.get('/book/:bookId/rating', reviewController.getBookRating);

export default router;
