import { Router } from 'express';
import * as favoriteController from './favorite.controller';
import { validate } from '../../middleware/validate';
import { toggleFavoriteSchema } from './favorite.validation';
import { authenticate } from '../../middleware/authenticate';

const router: Router = Router();

router.post('/toggle', authenticate, validate(toggleFavoriteSchema), favoriteController.toggleFavorite);
router.get('/check/:bookId', authenticate, favoriteController.isFavorite);
router.get('/', authenticate, favoriteController.getFavorites);

export default router;
