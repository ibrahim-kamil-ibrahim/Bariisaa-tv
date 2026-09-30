import { Router } from 'express';
import * as captainController from './my-captain.controller';
import { authenticate, optionalAuth } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { auditLog } from '../../middleware/auditLog';
import { validate } from '../../middleware/validate';
import {
  createAchievementSchema,
  updateAchievementSchema,
  createLeaderboardSchema,
  updateLeaderboardSchema,
} from './my-captain.validation';

const router: Router = Router();

router.post('/achievements',       authenticate, authorize('captain:create'), auditLog('create', 'achievement'), validate(createAchievementSchema), captainController.createAchievement);
router.put('/achievements/:id',    authenticate, authorize('captain:update'), auditLog('update', 'achievement'), validate(updateAchievementSchema), captainController.updateAchievement);
router.delete('/achievements/:id', authenticate, authorize('captain:delete'), auditLog('delete', 'achievement'), captainController.deleteAchievement);
router.post('/leaderboard',        authenticate, authorize('captain:create'), auditLog('create', 'leaderboard'), validate(createLeaderboardSchema), captainController.createLeaderboardEntry);
router.put('/leaderboard/:id',     authenticate, authorize('captain:update'), auditLog('update', 'leaderboard'), validate(updateLeaderboardSchema), captainController.updateLeaderboardEntry);
router.delete('/leaderboard/:id',  authenticate, authorize('captain:delete'), auditLog('delete', 'leaderboard'), captainController.deleteLeaderboardEntry);
router.get('/achievements',        optionalAuth, captainController.listAchievements);
router.get('/leaderboard',         optionalAuth, captainController.listLeaderboard);
router.get('/profile',             authenticate, captainController.getProfile);

export default router;
