import { Request, Response, NextFunction } from 'express';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  isGuest?: boolean;
}

export const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // Free-first principle: Allow guest access for basic reading, browsing and questioning
    req.userId = 'guest_' + (req.ip || 'anonymous');
    req.isGuest = true;
    return next();
  }

  const token = authHeader.split('Bearer ')[1];

  // If Firebase Admin credentials are configured, verify ID token
  // For now, attach user id or guest id cleanly
  req.userId = token === 'guest' ? 'guest_' + req.ip : 'user_' + token.slice(0, 12);
  req.isGuest = token === 'guest';
  next();
};

