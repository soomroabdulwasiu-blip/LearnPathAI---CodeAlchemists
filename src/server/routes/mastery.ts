import { Router, Response } from 'express';
import { db } from '../db/store';
import { TOPICS } from '../../lib/constants';
import { TopicMastery } from '../../types';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';

export const masteryRouter = Router();

masteryRouter.get('/', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;
  const user = db.getUser(userId);
  const masteryMap = db.getMastery(userId);
  const roadmap = db.getRoadmap(userId);
  const hasCalibrated = Boolean(user?.hasCompletedDiagnostic);

  const list: TopicMastery[] = TOPICS.map((topic) => {
    const score = masteryMap[topic.id] ?? 0;
    const item = roadmap.items.find((i) => i.topic_id === topic.id);
    const status = item?.status || 'learn';
    return {
      topic_id: topic.id,
      mastery: hasCalibrated ? score : 0,
      confidence: hasCalibrated ? Number(Math.min(1, Math.max(0.4, Math.abs(score - 50) / 45 + 0.3)).toFixed(2)) : 0,
      status: hasCalibrated ? status : 'learn',
      last_practiced: hasCalibrated ? new Date().toISOString() : null,
      history: [],
    };
  });

  res.json(list);
});
