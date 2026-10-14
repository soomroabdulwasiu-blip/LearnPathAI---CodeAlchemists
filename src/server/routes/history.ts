import { Router, Response } from 'express';
import { db } from '../db/store';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';

export const historyRouter = Router();

historyRouter.get('/', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const history = db.getQuizHistory(req.userId!);
  res.json(history);
});

historyRouter.get('/activities', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const activities = db.getRecentActivities(req.userId!);
  res.json(activities);
});
