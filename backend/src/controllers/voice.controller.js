import * as conversationService from '../services/conversation.service.js';
import prisma from '../config/db.js';
import { successResponse, errorResponse } from '../utils/responseFormatter.js';
import { synthesizeSpeech } from '../services/tts.service.js';

export const processVoice = async (req, res, next) => {
  try {
    const { query } = req.body;
    if (!query) {
      return errorResponse(res, 'Voice query or text input is required', 400);
    }

    const startTime = Date.now();
    const result = await conversationService.processVoiceQuery(req.user.id, query);
    result.timingMs = Date.now() - startTime;

    return successResponse(res, result, 'Voice query processed successfully');
  } catch (err) {
    next(err);
  }
};

export const streamTtsAudio = async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text || typeof text !== 'string' || text.trim() === '') {
      return res.status(400).json({ success: false, message: 'Text is required for TTS' });
    }

    const tts = await synthesizeSpeech(text);
    if (!tts.available || !tts.audioBuffer) {
      return res.status(200).json({ success: true, available: false, fallback: 'browser' });
    }

    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': tts.audioBuffer.length,
      'X-TTS-Cached': tts.cached ? '1' : '0',
    });
    return res.end(tts.audioBuffer);
  } catch (err) {
    next(err);
  }
};

export const getVoiceHistory = async (req, res, next) => {
  try {
    const history = await prisma.voiceConversation.findMany({
      where: { userId: req.user.id },
      include: { business: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return successResponse(res, history, 'Voice conversation history retrieved');
  } catch (err) {
    next(err);
  }
};
