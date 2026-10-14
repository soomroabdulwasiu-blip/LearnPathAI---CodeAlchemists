import { Router } from 'express';
import { AIProviderFactory } from '../ai/factory';
import { explainConceptService } from '../ai/services/tutorService';
import { explainWeakTopicsService } from '../ai/services/weakTopicsService';
import { generatePracticeQuestionsService } from '../ai/services/questionGenService';
import { explainMistakeService } from '../ai/services/mistakeService';
import { generatePersonalizedStudyPlanService } from '../ai/services/studyPlanService';
import { explainPythonCodeService } from '../ai/services/codeExplainService';
import { db } from '../db/store';
import { optionalAuth, AuthenticatedRequest } from '../middleware/auth';

export const aiRouter = Router();

aiRouter.get('/status', (_req, res) => {
  const { status } = AIProviderFactory.getProvider();
  res.json(status);
});

aiRouter.post('/tutor', async (req, res) => {
  try {
    const { topic_id, question_id, query, code } = req.body;
    const result = await explainConceptService({
      topicId: topic_id,
      questionId: question_id,
      userQuery: query || '',
      contextCode: code,
    });
    res.json(result);
  } catch (err: any) {
    console.error('[/api/ai/tutor] Error:', err);
    res.status(500).json({ error: 'Failed to process AI tutor request', details: err?.message });
  }
});

aiRouter.post('/explain', async (req, res) => {
  try {
    const { question_id, answer } = req.body;
    const result = await explainConceptService({
      questionId: question_id,
      userQuery: answer || 'Explain the concept behind this question',
    });
    res.json({
      text: result.explanation,
      sources: result.sources,
    });
  } catch (err: any) {
    console.error('[/api/ai/explain] Error:', err);
    res.status(500).json({ error: 'Failed to explain concept', details: err?.message });
  }
});

aiRouter.post('/explain-weak-topics', optionalAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId;
    const masteryMap = req.body.masteryMap || (userId ? db.getMastery(userId) : {});
    const result = await explainWeakTopicsService({
      masteryMap,
      topWeakestCount: req.body.topWeakestCount || 3,
    });
    res.json(result);
  } catch (err: any) {
    console.error('[/api/ai/explain-weak-topics] Error:', err);
    res.status(500).json({ error: 'Failed to analyze weak topics', details: err?.message });
  }
});

aiRouter.post('/generate-questions', async (req, res) => {
  try {
    const { topic_id, difficulty, count } = req.body;
    const result = await generatePracticeQuestionsService({
      topicId: topic_id || 'loops',
      difficulty: difficulty || 'intermediate',
      count: count || 2,
    });
    if (result.questions.length > 0) {
      db.addGeneratedQuestions(result.questions);
    }
    res.json(result);
  } catch (err: any) {
    console.error('[/api/ai/generate-questions] Error:', err);
    res.status(500).json({ error: 'Failed to generate questions', details: err?.message });
  }
});

aiRouter.post('/explain-mistake', async (req, res) => {
  try {
    const { question_id, option_index } = req.body;
    if (!question_id || option_index === undefined) {
      return res.status(400).json({ error: 'question_id and option_index are required' });
    }
    const result = await explainMistakeService({
      questionId: question_id,
      selectedOptionIndex: Number(option_index),
    });
    res.json(result);
  } catch (err: any) {
    console.error('[/api/ai/explain-mistake] Error:', err);
    res.status(500).json({ error: 'Failed to explain mistake', details: err?.message });
  }
});

aiRouter.post('/study-plan', optionalAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId;
    const masteryMap = req.body.masteryMap || (userId ? db.getMastery(userId) : {});
    const weeklyHours = req.body.weeklyHours || 5;
    const result = await generatePersonalizedStudyPlanService({
      masteryMap,
      weeklyHours,
    });
    res.json(result);
  } catch (err: any) {
    console.error('[/api/ai/study-plan] Error:', err);
    res.status(500).json({ error: 'Failed to generate study plan', details: err?.message });
  }
});

aiRouter.post('/explain-code', async (req, res) => {
  try {
    const { code, focus_area } = req.body;
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'code string is required' });
    }
    const result = await explainPythonCodeService({
      code,
      focusArea: focus_area,
    });
    res.json(result);
  } catch (err: any) {
    console.error('[/api/ai/explain-code] Error:', err);
    res.status(500).json({ error: 'Failed to explain code', details: err?.message });
  }
});
