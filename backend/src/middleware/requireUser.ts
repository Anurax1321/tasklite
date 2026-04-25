import { Request, Response, NextFunction } from 'express';
import { COOKIE_NAME, verifyToken } from '../auth';
import { findUserById } from '../userStore';

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export function requireUser(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return res.status(401).json({ error: 'not authenticated' });

  const userId = verifyToken(token);
  if (!userId) return res.status(401).json({ error: 'invalid or expired session' });

  if (!findUserById(userId)) return res.status(401).json({ error: 'user no longer exists' });

  req.userId = userId;
  next();
}
