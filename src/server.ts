import { guestTrialLimiter } from './middleware/rateLimiter';
import sarvamRoutes from './routes/sarvamRoutes';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { config } from './config';
import voiceRoutes from './routes/voiceRoutes';
import krishnaRoutes from './routes/krishnaRoutes';
import gitaRoutes from './routes/gitaRoutes';

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Health Check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    application: 'Krishna AI Backend',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    sarvamConfigured: !!process.env.SARVAM_API_KEY?.trim(),
    groqConfigured: !!config.groq.apiKey,
    supabaseConfigured: !!config.supabase.url,
  });
});

app.use(['/api/tts', '/api/voice', '/api/krishna'], guestTrialLimiter);
app.use('/api/tts', sarvamRoutes);

// Routes
app.use('/api/voice', voiceRoutes);
app.use('/api/krishna', krishnaRoutes);
app.use('/api/gita', gitaRoutes);

// 404 Handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, error: 'Endpoint not found' });
});

// Global Error Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Server Unhandled Error');
  res.status(500).json({
    success: false,
    error: 'Internal server error occurred.',
  });
});

// Start Server
if (process.env.NODE_ENV !== 'test') {
  app.listen(config.port, '0.0.0.0', () => {
    console.log(`🌸 Krishna AI Backend running on port ${config.port} [${config.nodeEnv}]`);
    console.log(`📖 Bhagavad Gita RAG Engine initialized.`);
  });
}

export default app;

