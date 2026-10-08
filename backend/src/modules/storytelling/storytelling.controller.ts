import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/authenticate';
import { AppError } from '../../middleware/errorHandler';
import * as storytellingService from './storytelling.service';
import { successResponse, paginatedResponse } from '../../utils/response';

/**
 * Editors/admins manage stories, so they must always see the real media links
 * (a locked row would make them wipe audioUrl/videoId on every save).
 */
const canManageStories = (req: AuthRequest) =>
  (req.userRoles || []).includes('super_admin') ||
  (req.userPermissions || []).includes('storytelling:update');

export async function createStory(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await storytellingService.createStory(req.body);
    successResponse(res, data, 'Story created', 201);
  } catch (error) { next(error); }
}

export async function updateStory(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await storytellingService.updateStory(req.params.id as string, req.body);
    successResponse(res, data, 'Story updated');
  } catch (error) { next(error); }
}

export async function uploadStoryCover(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.file) throw new AppError('No cover file uploaded', 400);
    const coverUrl = await storytellingService.uploadStoryCoverFile(req.file);
    successResponse(res, { coverUrl }, 'Cover uploaded', 201);
  } catch (error) { next(error); }
}

export async function uploadStoryAudio(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.file) throw new AppError('No audio file uploaded', 400);
    const audioUrl = await storytellingService.uploadStoryAudioFile(req.file);
    successResponse(res, { audioUrl }, 'Audio uploaded', 201);
  } catch (error) { next(error); }
}

export async function deleteStory(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await storytellingService.deleteStory(req.params.id as string);
    successResponse(res, null, 'Story deleted');
  } catch (error) { next(error); }
}

export async function getStoryById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await storytellingService.getStoryById(
      req.params.id as string,
      req.userId,
      canManageStories(req)
    );
    await storytellingService.incrementViewCount(req.params.id as string);
    successResponse(res, data, 'Story retrieved');
  } catch (error) { next(error); }
}

export async function listStories(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { stories, total } = await storytellingService.listStories(
      req.query as any,
      req.userId,
      canManageStories(req)
    );
    paginatedResponse(res, stories, total, (req.query as any).page, (req.query as any).limit, 'Stories retrieved');
  } catch (error) { next(error); }
}

export async function getFeaturedStories(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const data = await storytellingService.getFeaturedStories(limit, req.userId);
    successResponse(res, data, 'Featured stories retrieved');
  } catch (error) { next(error); }
}

export async function getCategories(_req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await storytellingService.getStoryCategories();
    successResponse(res, data, 'Story categories retrieved');
  } catch (error) { next(error); }
}
