import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/authenticate';
import * as habitService from './habit.service';
import { successResponse, paginatedResponse } from '../../utils/response';

export async function createHabit(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await habitService.createHabit(req.body);
    successResponse(res, data, 'Habit created', 201);
  } catch (error) { next(error); }
}

export async function updateHabit(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await habitService.updateHabit(req.params.id as string, req.body);
    successResponse(res, data, 'Habit updated');
  } catch (error) { next(error); }
}

export async function deleteHabit(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await habitService.deleteHabit(req.params.id as string);
    successResponse(res, null, 'Habit deleted');
  } catch (error) { next(error); }
}

export async function getHabitById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await habitService.getHabitById(req.params.id as string);
    successResponse(res, data, 'Habit retrieved');
  } catch (error) { next(error); }
}

export async function listHabits(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { habits, total } = await habitService.listHabits(req.query as any);
    paginatedResponse(res, habits, total, (req.query as any).page, (req.query as any).limit, 'Habits retrieved');
  } catch (error) { next(error); }
}

export async function completeHabit(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await habitService.completeHabit(req.userId!, req.params.id as string, req.body.date);
    successResponse(res, data, 'Habit completed');
  } catch (error) { next(error); }
}

export async function getMyStats(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await habitService.getUserStats(req.userId!);
    successResponse(res, data, 'Stats retrieved');
  } catch (error) { next(error); }
}

export async function getMyProgress(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await habitService.getUserProgress(req.userId!, req.query as any);
    paginatedResponse(res, data.progress, data.total, (req.query as any).page, (req.query as any).limit, 'Progress retrieved');
  } catch (error) { next(error); }
}
