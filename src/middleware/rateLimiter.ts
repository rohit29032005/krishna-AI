import rateLimit from 'express-rate-limit';
import { config } from '../config';

export const apiLimiter = rateLimit({
  // Shared guest budget on hosted trials: independent of proxy/IP headers.
  ...(config.nodeEnv === 'production' ? {keyGenerator: () => 'guest-trial'} : {}),
  windowMs: 60 * 1000, // 1 minute
  max: config.limits.maxRequestsPerMinute,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Rate limit exceeded. Please wait a moment before asking another question.',
  },
});


// Anonymous trial has one shared allowance across chat, transcription and TTS.
// Memory-only: resets on server restart. It is not a lifetime billing cap.
const requestedLimit = Number(process.env.MAX_GUEST_REQUESTS_PER_HOUR || 120);
export const guestTrialLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: Number.isSafeInteger(requestedLimit) && requestedLimit > 0 ? requestedLimit : 120,
  keyGenerator: () => 'guest-trial',
  skip: () => config.nodeEnv !== 'production',
  standardHeaders: true,
  legacyHeaders: false,
  message: {success:false, code:'TRIAL_RATE_LIMIT', error:'Trial usage limit reached. Please try again later.'},
});
