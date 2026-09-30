import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/authenticate';
import * as storytellingService from './storytelling.service';
import { successResponse, paginatedResponse } from '../../utils/response';

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

export async function deleteStory(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await storytellingService.deleteStory(req.params.id as string);
    successResponse(res, null, 'Story deleted');
  } catch (error) { next(error); }
}

export async function getStoryById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await storytellingService.getStoryById(req.params.id as string, req.userId);
    await storytellingService.incrementViewCount(req.params.id as string);
    successResponse(res, data, 'Story retrieved');
  } catch (error) { next(error); }
}

export async function listStories(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { stories, total } = await storytellingService.listStories(req.query as any, req.userId);
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
