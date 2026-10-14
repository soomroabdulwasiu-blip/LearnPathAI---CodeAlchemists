import { Router, Response } from 'express';
import { db } from '../db/store';
import { TOPICS } from '../../lib/constants';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';

export const instructorRouter = Router();

instructorRouter.get('/classes', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  res.json(db.getClasses(req.userId));
});

instructorRouter.post('/classes', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { name } = req.body;
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({ error: 'Class name is required.' });
  }
  const newClass = db.createClass(name.trim(), req.userId);
  res.status(201).json(newClass);
});

instructorRouter.get('/classes/:id/heatmap', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const cls = db.getClass(req.params.id);
  if (!cls) {
    return res.status(404).json({ error: 'Class not found.' });
  }
  const students = db.getStudentsInClass(cls.code);
  res.json({
    students,
    topics: TOPICS.map((t) => t.id),
  });
});

instructorRouter.get('/students/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = db.getUser(req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'Student not found.' });
  }
  res.json(user);
});
