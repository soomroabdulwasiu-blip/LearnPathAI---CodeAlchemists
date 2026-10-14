import { Router, Response } from 'express';
import { db } from '../db/store';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { QuizHistoryItem, RecentActivityItem } from '../../types';

export const diagnosticRouter = Router();

diagnosticRouter.post('/start', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const session = db.createDiagnosticSession(req.userId!);
  const firstQ = db.getQuestion(session.questionIds[0]);
  res.json({
    session_id: session.sessionId,
    total_questions: session.questionIds.length,
    first_question: firstQ,
  });
});

diagnosticRouter.post('/answer', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { session_id, question_id, option } = req.body;
  if (!session_id || !question_id || option === undefined) {
    return res.status(400).json({ error: 'session_id, question_id, and option are required.' });
  }

  const session = db.getDiagnosticSession(session_id);
  const question = db.getQuestion(question_id);
  if (!question) {
    return res.status(404).json({ error: 'Question not found.' });
  }

  const optionIndex = Number(option);
  const isCorrect = optionIndex === question.correctIndex;

  const evalRes = db.updateTopicMastery(req.userId!, question.topic_id, isCorrect);
  let nextQ = null;
  let isCompleted = true;

  if (session) {
    session.answers[question_id] = optionIndex;
    session.currentIndex += 1;
    if (session.currentIndex < session.questionIds.length) {
      const nextId = session.questionIds[session.currentIndex];
      nextQ = db.getQuestion(nextId);
      isCompleted = false;
    } else {
      session.isCompleted = true;
      const totalAnswers = Object.keys(session.answers).length;
      let correctCount = 0;
      for (const qId of Object.keys(session.answers)) {
        const q = db.getQuestion(qId);
        if (q && session.answers[qId] === q.correctIndex) {
          correctCount++;
        }
      }
      const scorePct = totalAnswers > 0 ? Math.round((correctCount / totalAnswers) * 100) : 0;

      const historyItem: QuizHistoryItem = {
        id: `quiz-hist-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        subject: 'Python Fundamentals (Diagnostic Calibration)',
        score: scorePct,
        totalQuestions: totalAnswers,
        correctCount,
        durationMinutes: 8,
        topicBreakdown: db.getMastery(req.userId!),
      };
      db.addQuizHistory(req.userId!, historyItem);

      const activity: RecentActivityItem = {
        id: `act-${Date.now()}`,
        title: 'Completed Diagnostic Assessment',
        time: 'Just now',
        result: `Scored ${scorePct}% • Bayesian Knowledge Graph Calibrated`,
        type: 'diagnostic',
        timestamp: Date.now(),
      };
      db.addRecentActivity(req.userId!, activity);
    }
    db.updateDiagnosticSession(session);
  }

  let diffTier: 'beginner' | 'intermediate' | 'advanced' = 'beginner';
  if (evalRes.newScore > 65) diffTier = 'advanced';
  else if (evalRes.newScore > 40) diffTier = 'intermediate';

  res.json({
    correct: isCorrect,
    explanation: question.explanation,
    explanationUrdu: question.explanationUrdu,
    next_question: nextQ,
    difficulty: diffTier,
    mastery: db.getMastery(req.userId!),
    isCompleted,
  });
});
