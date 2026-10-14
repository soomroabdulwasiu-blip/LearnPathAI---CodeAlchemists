import { Router, Response } from 'express';
import { db } from '../db/store';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';

export const roadmapRouter = Router();

roadmapRouter.get('/', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const rm = db.getRoadmap(req.userId!);
  res.json(rm);
});
