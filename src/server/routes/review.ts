import { Router } from 'express';
import { SpacedReviewItem } from '../../types';

export const reviewRouter = Router();

let timeOffsetDays = 0;

reviewRouter.get('/due', (_req, res) => {
  const list: SpacedReviewItem[] = [
    {
      topic_id: 'loops',
      dueDaysAgo: Math.max(1, 2 + timeOffsetDays),
      retentionPercent: Math.max(20, 68 - timeOffsetDays * 6),
      dueDate: 'Today',
      status: 'critical',
    },
    {
      topic_id: 'conditionals',
      dueDaysAgo: Math.max(0, 1 + timeOffsetDays),
      retentionPercent: Math.max(30, 82 - timeOffsetDays * 4),
      dueDate: 'Tomorrow',
      status: 'due',
    },
    {
      topic_id: 'variables',
      dueDaysAgo: 0,
      retentionPercent: Math.max(45, 94 - timeOffsetDays * 2),
      dueDate: 'In 3 days',
      status: 'upcoming',
    },
  ];
  res.json(list);
});

reviewRouter.post('/advance-time', (req, res) => {
  const days = Number(req.body.days || 1);
  timeOffsetDays += days;
  res.json({ success: true, newOffsetDays: timeOffsetDays });
});

reviewRouter.post('/dev/advance-time', (req, res) => {
  const days = Number(req.body.days || 1);
  timeOffsetDays += days;
  res.json({ success: true, newOffsetDays: timeOffsetDays });
});
