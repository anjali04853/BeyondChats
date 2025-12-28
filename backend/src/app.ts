import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import { errorHandler } from './middleware/errorHandler';
import { articleRoutes, enhancedArticleRoutes } from './routes';

const app: Application = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/articles', articleRoutes);
app.use('/api/enhanced-articles', enhancedArticleRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

export default app;
