import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/authenticate';
import * as messagingService from './messaging.service';
import { successResponse, paginatedResponse } from '../../utils/response';

export async function getConversations(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await messagingService.getConversations(req.userId!, page, limit);
    paginatedResponse(res, result.conversations, result.total, result.page, result.limit, 'Conversations retrieved');
  } catch (error) {
    next(error);
  }
}

export async function getOrCreateConversation(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { userId: otherUserId } = req.body;
    if (!otherUserId) {
      return res.status(400).json({ success: false, message: 'userId is required' });
    }
    const conversation = await messagingService.getOrCreateConversation(req.userId!, otherUserId);
    successResponse(res, conversation, 'Conversation retrieved');
  } catch (error) {
    next(error);
  }
}

export async function getMessages(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const conversationId = req.params.conversationId as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const result = await messagingService.getMessages(req.userId!, conversationId, page, limit);
    paginatedResponse(res, result.messages, result.total, result.page, result.limit, 'Messages retrieved');
  } catch (error) {
    next(error);
  }
}

export async function sendMessage(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { receiverId, content } = req.body;
    if (!receiverId || !content) {
      return res.status(400).json({ success: false, message: 'receiverId and content are required' });
    }
    const message = await messagingService.sendMessage(req.userId!, receiverId, content);
    successResponse(res, message, 'Message sent', 201);
  } catch (error) {
    next(error);
  }
}

export async function markAsRead(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const conversationId = req.params.conversationId as string;
    await messagingService.markAsRead(req.userId!, conversationId);
    successResponse(res, null, 'Marked as read');
  } catch (error) {
    next(error);
  }
}

export async function getUnreadCount(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await messagingService.getUnreadCount(req.userId!);
    successResponse(res, result, 'Unread count retrieved');
  } catch (error) {
    next(error);
  }
}

export async function searchUsers(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const query = req.query.q as string || '';
    const limit = parseInt(req.query.limit as string) || 20;
    const users = await messagingService.searchUsers(req.userId!, query, limit);
    successResponse(res, users, 'Users found');
  } catch (error) {
    next(error);
  }
}
