import app from './app';
import { config } from './config';
import { runMigrations } from './db';
import { seedArticles } from './db/seed';

const startServer = () => {
  console.log('🚀 Starting backend server...');
  console.log('📍 PORT:', config.port);
  console.log('📍 NODE_ENV:', config.nodeEnv);

  // Run database migrations
  console.log('Running database migrations...');
  runMigrations();
  console.log('Database migrations complete.');

  // Seed database with initial articles
  seedArticles();

  app.listen(config.port, '0.0.0.0', () => {
    console.log(`✅ Backend server is running on port ${config.port}`);
  });
};

startServer();
