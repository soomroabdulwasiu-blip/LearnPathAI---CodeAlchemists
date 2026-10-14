import { Router, Response } from 'express';
import { db } from '../db/store';
import { TopicId, RecentActivityItem } from '../../types';
import { requireAuth, optionalAuth, AuthenticatedRequest } from '../middleware/auth';
import { TOPIC_MAP } from '../../lib/constants';

export const practiceRouter = Router();

practiceRouter.get('/next', optionalAuth, (req: AuthenticatedRequest, res: Response) => {
  const topicId = (req.query.topic_id as TopicId) || 'loops';
  const difficulty = req.query.difficulty as string | undefined;
  const pool = db.getQuestionsByTopic(topicId, difficulty);
  const question = pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : db.getQuestion('var-1');
  res.json(question);
});

practiceRouter.post('/submit', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { question_id, option } = req.body;
  if (!question_id || option === undefined) {
    return res.status(400).json({ error: 'question_id and option are required.' });
  }

  const question = db.getQuestion(question_id);
  if (!question) {
    return res.status(404).json({ error: 'Question not found.' });
  }

  const optionIndex = Number(option);
  const isCorrect = optionIndex === question.correctIndex;
  const userId = req.userId!;

  const evalRes = db.updateTopicMastery(userId, question.topic_id, isCorrect);

  const topicName = TOPIC_MAP[question.topic_id]?.title || question.topic_id;
  const activity: RecentActivityItem = {
    id: `act-${Date.now()}`,
    title: `Practice: ${topicName}`,
    time: 'Just now',
    result: isCorrect ? 'Answered Correctly • Mastery Gain' : 'Answered Incorrectly • Prerequisite Reviewed',
    type: 'practice',
    timestamp: Date.now(),
  };
  db.addRecentActivity(userId, activity);

  res.json({
    correct: isCorrect,
    explanation: question.explanation,
    explanationUrdu: question.explanationUrdu,
    mastery: db.getMastery(userId),
    roadmap: evalRes.roadmap,
    diff: evalRes.roadmap.diff || [],
  });
});
