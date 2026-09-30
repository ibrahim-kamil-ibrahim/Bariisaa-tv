import { Router } from 'express';
import * as messagingController from './messaging.controller';
import { authenticate } from '../../middleware/authenticate';

const router: Router = Router();

router.get('/', authenticate, messagingController.getConversations);
router.post('/conversation', authenticate, messagingController.getOrCreateConversation);
router.get('/unread', authenticate, messagingController.getUnreadCount);
router.get('/users/search', authenticate, messagingController.searchUsers);
router.get('/:conversationId', authenticate, messagingController.getMessages);
router.post('/:conversationId/read', authenticate, messagingController.markAsRead);
router.post('/', authenticate, messagingController.sendMessage);

export default router;
