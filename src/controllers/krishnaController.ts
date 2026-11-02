import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { AIService } from '../services/ai/aiService';
import { ChatRequest } from '../types';

export const handleKrishnaChat = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { message, language = 'en', conversationId, history } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Message parameter is required and cannot be empty.',
      });
    }

    if (message.length > 500) {
      return res.status(400).json({
        success: false,
        error: 'Message exceeds maximum length limit of 500 characters.',
      });
    }

    if (history !== undefined && (!Array.isArray(history) || history.length > 6 || history.some(
      (item: any) => !item || !['user', 'assistant'].includes(item.role) || typeof item.text !== 'string' || item.text.length > 16000
    ))) {
      return res.status(400).json({ success: false, error: 'Invalid conversation history.' });
    }

    const payload: ChatRequest = {
      message: message.trim(),
      language: language === 'hi' ? 'hi' : 'en',
      conversationId,
      history,
    };

    const guidance = await AIService.generateGitaGuidance(payload);

    return res.json({
      success: true,
      data: guidance,
    });
  } catch (error: any) {
    const messages: Record<string, string> = {
      AI_NOT_CONFIGURED: 'AI service is not configured on the server.',
      AI_AUTH_ERROR: 'AI provider access failed. Check the server provider configuration.',
      AI_MODEL_UNAVAILABLE: 'The configured AI model is unavailable.',
      AI_RATE_LIMIT: 'AI service is busy or its usage limit was reached. Please try later.',
      AI_TIMEOUT: 'AI response timed out. Please try again.',
      AI_OUTPUT_LIMIT: 'AI response was incomplete. Please try again.',
      AI_INVALID_RESPONSE: 'AI returned an invalid answer format. Please try again.',
      AI_PROVIDER_REQUEST_REJECTED: 'AI provider rejected the request. Check server model configuration.',
      AI_UNAVAILABLE: 'Guidance is temporarily unavailable. Please try again.',
    };
    const code = Object.prototype.hasOwnProperty.call(messages, error?.code) ? error.code : 'AI_UNAVAILABLE';
    return res.status(503).json({ success: false, code, error: messages[code] });
  }
};

export const handleFollowUp = async (req: AuthenticatedRequest, res: Response) => {
  return handleKrishnaChat(req, res);
};

export const handleFeedback = async (req: AuthenticatedRequest, res: Response) => {
  const { rating, feedback, messageId } = req.body;
  // Feedback received
  return res.json({
    success: true,
    message: 'Thank you for your feedback.',
  });
};

