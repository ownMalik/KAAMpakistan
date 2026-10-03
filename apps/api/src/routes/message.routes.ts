import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.ts';
import { getConversationMessages, sendMessage } from '../controllers/message.controller.ts';

const router = Router();

router.get('/:conversationId', authenticate, getConversationMessages);
router.post('/', authenticate, sendMessage);

export default router;
