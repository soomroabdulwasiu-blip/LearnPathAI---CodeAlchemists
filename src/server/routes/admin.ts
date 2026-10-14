import { Router, Response } from 'express';
import { db } from '../db/store';
import { requireAuth, requireAdmin, AuthenticatedRequest } from '../middleware/auth';
import { Question, TopicId, UserRole } from '../../types';

export const adminRouter = Router();

// Protect all admin endpoints with requireAuth and requireAdmin
adminRouter.use(requireAuth);
adminRouter.use(requireAdmin);

// 1. Admin System Stats
adminRouter.get('/stats', (_req: AuthenticatedRequest, res: Response) => {
  try {
    const stats = db.getAdminStats();
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch admin stats' });
  }
});

// 2. Users Management
adminRouter.get('/users', (req: AuthenticatedRequest, res: Response) => {
  try {
    let users = db.getAllUsers();
    const { search, role } = req.query;

    if (role && typeof role === 'string' && role !== 'all') {
      users = users.filter((u) => u.role === role);
    }

    if (search && typeof search === 'string') {
      const q = search.toLowerCase().trim();
      users = users.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.id.toLowerCase().includes(q)
      );
    }

    res.json({ users });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to list users' });
  }
});

adminRouter.post('/users', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, email, role, password, goal, weeklyHours, expRating } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email address is required.' });
    }
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'User name is required.' });
    }

    const validRole: UserRole = role === 'instructor' || role === 'admin' ? role : 'student';

    const user = await db.adminCreateUser({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role: validRole,
      password: password || 'Password123!',
      goal: goal || 'Master Python Fundamentals',
      weeklyHours: typeof weeklyHours === 'number' ? weeklyHours : 5,
      expRating: expRating || 'intermediate',
    });

    res.status(201).json({ user, message: 'User created successfully' });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to create user' });
  }
});

adminRouter.put('/users/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const user = await db.adminUpdateUser(id, updates);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user, message: 'User updated successfully' });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to update user' });
  }
});

adminRouter.delete('/users/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (id === req.userId) {
      return res.status(400).json({ error: 'Cannot delete your own active administrator account.' });
    }

    const success = await db.adminDeleteUser(id);
    if (!success) {
      return res.status(404).json({ error: 'User not found or deletion failed.' });
    }

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to delete user' });
  }
});

adminRouter.post('/users/:id/reset-password', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters.' });
    }

    const success = await db.adminResetPassword(id, newPassword);
    if (!success) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ success: true, message: 'Password reset successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to reset password' });
  }
});

// 3. Question Bank Management
adminRouter.get('/questions', (req: AuthenticatedRequest, res: Response) => {
  try {
    let questions = db.getAllQuestions();
    const { topic, difficulty, search } = req.query;

    if (topic && typeof topic === 'string' && topic !== 'all') {
      questions = questions.filter((q) => q.topic_id === topic);
    }
    if (difficulty && typeof difficulty === 'string' && difficulty !== 'all') {
      questions = questions.filter((q) => q.difficulty === difficulty);
    }
    if (search && typeof search === 'string') {
      const qStr = search.toLowerCase().trim();
      questions = questions.filter(
        (q) =>
          q.question.toLowerCase().includes(qStr) ||
          q.id.toLowerCase().includes(qStr) ||
          (q.explanation && q.explanation.toLowerCase().includes(qStr))
      );
    }

    res.json({ questions });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to list questions' });
  }
});

adminRouter.post('/questions', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { topicId, topic_id, difficulty, question, options, correctIndex, explanation, hint, codeSnippet } = req.body;

    if (!question || !options || !Array.isArray(options) || options.length < 2) {
      return res.status(400).json({ error: 'Question text and at least 2 options are required.' });
    }

    const newQuestion = await db.adminCreateQuestion({
      topic_id: (topic_id || topicId || 'variables') as TopicId,
      difficulty: difficulty || 'beginner',
      question,
      options,
      correctIndex: typeof correctIndex === 'number' ? correctIndex : 0,
      explanation: explanation || '',
      codeSnippet: codeSnippet || undefined,
    });

    res.status(201).json({ question: newQuestion, message: 'Question created successfully' });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to create question' });
  }
});

adminRouter.put('/questions/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const question = await db.adminUpdateQuestion(id, updates);
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    res.json({ question, message: 'Question updated successfully' });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to update question' });
  }
});

adminRouter.delete('/questions/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const success = await db.adminDeleteQuestion(id);
    if (!success) {
      return res.status(404).json({ error: 'Question not found or delete failed.' });
    }

    res.json({ success: true, message: 'Question deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to delete question' });
  }
});

// 4. Class / Cohorts Management
adminRouter.get('/classes', (_req: AuthenticatedRequest, res: Response) => {
  try {
    const classes = db.getClasses();
    res.json({ classes });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch classes' });
  }
});

adminRouter.post('/classes', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, instructorId } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Class name is required' });
    }

    const assignedInstructorId = instructorId || req.userId || 'user-instructor';
    const newClass = await db.createClass(name.trim(), assignedInstructorId);

    res.status(201).json({ class: newClass, message: 'Class created successfully' });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to create class' });
  }
});

adminRouter.put('/classes/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const updated = await db.adminUpdateClass(id, updates);
    if (!updated) {
      return res.status(404).json({ error: 'Class not found' });
    }

    res.json({ class: updated, message: 'Class updated successfully' });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to update class' });
  }
});

adminRouter.delete('/classes/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const success = await db.adminDeleteClass(id);
    if (!success) {
      return res.status(404).json({ error: 'Class not found' });
    }

    res.json({ success: true, message: 'Class deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to delete class' });
  }
});

// 5. Quiz & Assessment Records Management
adminRouter.get('/quizzes', (_req: AuthenticatedRequest, res: Response) => {
  try {
    const quizzes = db.getAllQuizHistories();
    res.json({ quizzes });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch quizzes' });
  }
});

adminRouter.delete('/quizzes/:userId/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId, id } = req.params;
    const success = await db.adminDeleteQuizHistory(userId, id);
    if (!success) {
      return res.status(404).json({ error: 'Quiz record not found' });
    }

    res.json({ success: true, message: 'Quiz record deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to delete quiz record' });
  }
});

// 6. User Mastery Overrides
adminRouter.get('/mastery/:userId', (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const mastery = db.getMastery(userId);
    res.json({ userId, mastery });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch user mastery' });
  }
});

adminRouter.put('/mastery/:userId/:topicId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId, topicId } = req.params;
    const { score } = req.body;

    if (typeof score !== 'number' || score < 0 || score > 100) {
      return res.status(400).json({ error: 'Mastery score must be a number between 0 and 100.' });
    }

    await db.adminSetUserMastery(userId, topicId as TopicId, score);
    res.json({ success: true, userId, topicId, score });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to update user mastery' });
  }
});

// 7. Full Data Export
adminRouter.get('/export', (_req: AuthenticatedRequest, res: Response) => {
  try {
    const exportData = {
      timestamp: new Date().toISOString(),
      stats: db.getAdminStats(),
      users: db.getAllUsers(),
      questions: db.getAllQuestions(),
      classes: db.getClasses(),
      quizzes: db.getAllQuizHistories(),
    };
    res.json(exportData);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to export system data' });
  }
});
