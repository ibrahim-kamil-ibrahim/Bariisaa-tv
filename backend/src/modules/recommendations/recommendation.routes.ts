import { Router } from 'express';
import * as recommendationController from './recommendation.controller';
import { authenticate } from '../../middleware/authenticate';
import { validate } from '../../middleware/validate';
import { recommendationQuerySchema } from './recommendation.validation';

const router: Router = Router();

router.get('/', validate(recommendationQuerySchema, 'query'), recommendationController.getRecommendations);

router.get('/fallback', validate(recommendationQuerySchema, 'query'), recommendationController.getFallbackRecommendations);

export default router;
