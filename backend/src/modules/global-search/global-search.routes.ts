import { Router } from 'express';
import * as globalSearchController from './global-search.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';

const router: Router = Router();

router.get('/', authenticate, authorize('reports:read'), globalSearchController.globalSearch);
router.get('/suggestions', authenticate, globalSearchController.getSuggestions);

export default router;
