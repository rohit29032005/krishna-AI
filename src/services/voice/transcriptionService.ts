import fs from 'fs';
import Groq from 'groq-sdk';
import { config } from '../../config';
import { SupportedLanguage } from '../../types';

export class VoiceTranscriptionService {
  private groq: Groq | null = null;
  private model: string;

  constructor() {
    this.model = config.groq.transcriptionModel;
    if (config.groq.apiKey) {
      this.groq = new Groq({ apiKey: config.groq.apiKey, timeout: 20000, maxRetries: 0 });
    }
  }

  async transcribe(filePath: string, language: SupportedLanguage = 'hi'): Promise<string> {
    try {
      if (!fs.existsSync(filePath)) {
        throw new Error('Audio file does not exist');
      }

      if (this.groq) {
        // Groq Whisper API
        const translation = await this.groq.audio.transcriptions.create({
          file: fs.createReadStream(filePath),
          model: this.model,
          language: language === 'hi' ? 'hi' : 'en',
          temperature: 0.2,
        });

        const text = translation.text?.trim();
        if (!text) throw new Error('No speech recognized');
        return text;
      }

      throw new Error('Speech transcription is unavailable');
    } finally {
      // Privacy safeguard: Delete audio file immediately after processing
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (err) {
        console.warn('Failed to delete temporary audio file:', err);
      }
    }
  }
}

export const TranscriptionService = new VoiceTranscriptionService();

