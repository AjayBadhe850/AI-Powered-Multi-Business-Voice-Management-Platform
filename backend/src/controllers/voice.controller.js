import * as conversationService from '../services/conversation.service.js';
import prisma from '../config/db.js';
import { successResponse, errorResponse } from '../utils/responseFormatter.js';

export const processVoice = async (req, res, next) => {
  try {
    const { query } = req.body;
    if (!query) {
      return errorResponse(res, 'Voice query or text input is required', 400);
    }

    const result = await conversationService.processVoiceQuery(req.user.id, query);
    return successResponse(res, result, 'Voice query processed successfully');
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
