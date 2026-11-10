import express from 'express';
import {
  getConversations,
  createConversation,
  createGroup,
  joinGroupByCode,
  getMessages,
  sendMessage,
  deleteConversation,
} from '../controllers/chatController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect); // All chat/conversation routes are protected

router.get('/conversations', getConversations);
router.post('/conversations', createConversation);
router.post('/conversations/group', createGroup);
router.post('/conversations/join-group', joinGroupByCode);
router.delete('/conversations/:id', deleteConversation);
router.get('/messages/:conversationId', getMessages);
router.post('/messages', sendMessage);

export default router;

