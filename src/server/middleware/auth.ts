import { Request, Response, NextFunction } from 'express';
import { verifyToken, db } from '../db/store';

export interface AuthenticatedRequest extends Request {
  userId?: string;
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.userId) {
    return res.status(401).json({ error: 'Authentication required.' });
  }
  const user = db.getUser(req.userId);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied: Admin privileges required.' });
  }
  next();
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Please sign in.' });
  }

  const token = authHeader.substring(7).trim();
  const userId = verifyToken(token);
  if (!userId || !db.getUser(userId)) {
    return res.status(401).json({ error: 'Invalid or expired session. Please sign in again.' });
  }

  req.userId = userId;
  next();
}

export function optionalAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    const userId = verifyToken(token);
    if (userId && db.getUser(userId)) {
      req.userId = userId;
    }
  }
  next();
}
