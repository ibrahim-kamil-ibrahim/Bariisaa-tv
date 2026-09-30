import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/authenticate';
import * as historyService from './history.service';
import { successResponse, paginatedResponse } from '../../utils/response';

export async function updateReadingProgress(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await historyService.updateReadingProgress(req.userId!, req.body);
    successResponse(res, result, 'Reading progress updated');
  } catch (error) {
    next(error);
  }
}

export async function updateListeningProgress(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await historyService.updateListeningProgress(req.userId!, req.body);
    successResponse(res, result, 'Listening progress updated');
  } catch (error) {
    next(error);
  }
}

export async function getReadingHistory(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const { history, total } = await historyService.getReadingHistory(
      req.userId!,
      page,
      limit
    );
    paginatedResponse(res, history, total, page, limit);
  } catch (error) {
    next(error);
  }
}

export async function getListeningHistory(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const { history, total } = await historyService.getListeningHistory(
      req.userId!,
      page,
      limit
    );
    paginatedResponse(res, history, total, page, limit);
  } catch (error) {
    next(error);
  }
}

export async function getContinueReading(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const limit = parseInt(req.query.limit as string) || 5;
    const result = await historyService.getContinueReading(req.userId!, limit);
    successResponse(res, result);
  } catch (error) {
    next(error);
  }
}

export async function getContinueListening(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const limit = parseInt(req.query.limit as string) || 5;
    const result = await historyService.getContinueListening(req.userId!, limit);
    successResponse(res, result);
  } catch (error) {
    next(error);
  }
}

export async function deleteReadingHistory(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await historyService.deleteReadingHistory(req.userId!, req.params.id as string);
    successResponse(res, result);
  } catch (error) {
    next(error);
  }
}

export async function deleteListeningHistory(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await historyService.deleteListeningHistory(req.userId!, req.params.id as string);
    successResponse(res, result);
  } catch (error) {
    next(error);
  }
}

export async function clearAllReadingHistory(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await historyService.clearAllReadingHistory(req.userId!);
    successResponse(res, result);
  } catch (error) {
    next(error);
  }
}

export async function clearAllListeningHistory(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const result = await historyService.clearAllListeningHistory(req.userId!);
    successResponse(res, result);
  } catch (error) {
    next(error);
  }
}

