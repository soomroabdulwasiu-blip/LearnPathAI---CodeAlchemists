import { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../lib/firebase-admin.ts';
import { DecodedIdToken } from 'firebase-admin/auth';
import { verifyToken } from '../server/db/store.ts';

export interface AuthRequest extends Request {
  user?: DecodedIdToken;
  userId?: string;
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing token' });
  }

  const token = authHeader.split('Bearer ')[1].trim();
  try {
    // 1. Try Firebase verification first
    const decodedToken = await adminAuth.verifyIdToken(token);
    req.user = decodedToken;
    req.userId = decodedToken.uid;
    return next();
  } catch (error) {
    // 2. Fallback to application session token
    const localUserId = verifyToken(token);
    if (localUserId) {
      req.userId = localUserId;
      return next();
    }
    console.error('Error verifying auth token:', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};
