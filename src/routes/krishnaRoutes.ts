import { Router } from 'express';
import { handleKrishnaChat, handleFollowUp, handleFeedback } from '../controllers/krishnaController';
import { authMiddleware } from '../middleware/auth';
import { apiLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post('/chat', apiLimiter, authMiddleware, handleKrishnaChat);
router.post('/follow-up', apiLimiter, authMiddleware, handleFollowUp);
router.post('/feedback', apiLimiter, authMiddleware, handleFeedback);

export default router;

