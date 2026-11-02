import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { TranscriptionService } from '../services/voice/transcriptionService';
import { SupportedLanguage } from '../types';

export const transcribeAudio = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No audio file uploaded' });
    }

    const language: SupportedLanguage = req.body.language === 'hi' ? 'hi' : 'en';
    const filePath = req.file.path;

    const transcribedText = await TranscriptionService.transcribe(filePath, language);

    return res.json({
      success: true,
      text: transcribedText,
      language,
    });
  } catch (error: any) {
    return res.status(503).json({
      success: false,
      error: 'Speech could not be transcribed. Please try again or type your question.',
    });
  }
};

