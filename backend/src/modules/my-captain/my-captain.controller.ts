import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/authenticate';
import * as captainService from './my-captain.service';
import { successResponse } from '../../utils/response';

export async function createAchievement(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await captainService.createAchievement(req.body);
    successResponse(res, data, 'Achievement created', 201);
  } catch (error) { next(error); }
}

export async function updateAchievement(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await captainService.updateAchievement(req.params.id as string, req.body);
    successResponse(res, data, 'Achievement updated');
  } catch (error) { next(error); }
}

export async function deleteAchievement(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await captainService.deleteAchievement(req.params.id as string);
    successResponse(res, null, 'Achievement deleted');
  } catch (error) { next(error); }
}

export async function createLeaderboardEntry(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await captainService.createLeaderboardEntry(req.body);
    successResponse(res, data, 'Leaderboard entry created', 201);
  } catch (error) { next(error); }
}

export async function updateLeaderboardEntry(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await captainService.updateLeaderboardEntry(req.params.id as string, req.body);
    successResponse(res, data, 'Leaderboard entry updated');
  } catch (error) { next(error); }
}

export async function deleteLeaderboardEntry(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await captainService.deleteLeaderboardEntry(req.params.id as string);
    successResponse(res, null, 'Leaderboard entry deleted');
  } catch (error) { next(error); }
}

export async function listAchievements(_req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await captainService.listAchievements();
    successResponse(res, data, 'Achievements retrieved');
  } catch (error) { next(error); }
}

export async function listLeaderboard(_req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await captainService.listLeaderboard();
    successResponse(res, data, 'Leaderboard retrieved');
  } catch (error) { next(error); }
}

export async function getProfile(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await captainService.getCaptainProfile(req.userId!);
    successResponse(res, data, 'Captain profile retrieved');
  } catch (error) { next(error); }
}
