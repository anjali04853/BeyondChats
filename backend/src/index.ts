import app from './app';
import { config } from './config';
import { runMigrations } from './db';

const startServer = () => {
  // Run database migrations
  console.log('Running database migrations...');
  runMigrations();
  console.log('Database migrations complete.');

  app.listen(config.port, () => {
    console.log(`Server running on port ${config.port} in ${config.nodeEnv} mode`);
  });
};

startServer();
