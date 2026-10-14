import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

dotenv.config();

import { authRouter } from './src/server/routes/auth';
import { diagnosticRouter } from './src/server/routes/diagnostic';
import { masteryRouter } from './src/server/routes/mastery';
import { roadmapRouter } from './src/server/routes/roadmap';
import { practiceRouter } from './src/server/routes/practice';
import { reviewRouter } from './src/server/routes/review';
import { instructorRouter } from './src/server/routes/instructor';
import { historyRouter } from './src/server/routes/history';
import { aiRouter } from './src/server/routes/ai';
import { pythonRouter } from './src/server/routes/pythonRunner';
import { adminRouter } from './src/server/routes/admin';
import { AIProviderFactory } from './src/server/ai/factory';

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    const { status } = AIProviderFactory.getProvider();
    res.json({
      status: 'healthy',
      app: 'LearnPath AI',
      ai: {
        provider: status.provider,
        model: status.model,
        state: status.status,
      },
      timestamp: new Date().toISOString(),
    });
  });

  // Mount API Routers
  app.use('/api/auth', authRouter);
  app.use('/api/diagnostic', diagnosticRouter);
  app.use('/api/mastery', masteryRouter);
  app.use('/api/roadmap', roadmapRouter);
  app.use('/api/practice', practiceRouter);
  app.use('/api/review', reviewRouter);
  app.use('/api/dev', reviewRouter);
  app.use('/api/instructor', instructorRouter);
  app.use('/api/history', historyRouter);
  app.use('/api/ai', aiRouter);
  app.use('/api/tutor', aiRouter);
  app.use('/api/python', pythonRouter);
  app.use('/api/code', pythonRouter);
  app.use('/api/admin', adminRouter);

  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve('dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    const { status } = AIProviderFactory.getProvider();
    console.log(`[LearnPath AI] Server running at http://localhost:${PORT}`);
    console.log(`[LearnPath AI] AI Provider: ${status.provider} (${status.model}) - Status: ${status.status}`);
  });
}

startServer().catch((err) => {
  console.error('[LearnPath AI] Failed to start server:', err);
  process.exit(1);
});
