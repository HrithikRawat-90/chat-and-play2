import express from 'express';
import { getMessageSuggestion, getAiStatus } from '../controllers/aiController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect); // All AI routes are protected

router.post('/suggest', getMessageSuggestion);
router.get('/status', getAiStatus);

export default router;
