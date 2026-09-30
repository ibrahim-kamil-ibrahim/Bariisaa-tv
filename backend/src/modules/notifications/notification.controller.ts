import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/authenticate';
import * as notificationService from './notification.service';
import { successResponse, paginatedResponse } from '../../utils/response';

export async function send(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await notificationService.sendNotification(req.body, req.userId!);
    successResponse(res, result, 'Notification sent', 201);
  } catch (error) {
    next(error);
  }
}

export async function getUserNotifications(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const { notifications, total } = await notificationService.getUserNotifications(
      req.userId!,
      page,
      limit
    );
    paginatedResponse(res, notifications, total, page, limit);
  } catch (error) {
    next(error);
  }
}

export async function markAsRead(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await notificationService.markAsRead(req.params.id as string, req.userId!);
    successResponse(res, result, 'Notification marked as read');
  } catch (error) {
    next(error);
  }
}

export async function markAllAsRead(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await notificationService.markAllAsRead(req.userId!);
    successResponse(res, result);
  } catch (error) {
    next(error);
  }
}

export async function getUnreadCount(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await notificationService.getUnreadCount(req.userId!);
    successResponse(res, result);
  } catch (error) {
    next(error);
  }
}

export async function deleteNotification(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await notificationService.deleteNotification(req.params.id as string, req.userId!);
    successResponse(res, result);
  } catch (error) {
    next(error);
  }
}

