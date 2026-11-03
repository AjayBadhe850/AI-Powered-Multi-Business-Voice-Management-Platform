import { Router } from 'express';
import * as voiceController from '../controllers/voice.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticateToken);

router.post('/process', voiceController.processVoice);
router.get('/history', voiceController.getVoiceHistory);

export default router;
