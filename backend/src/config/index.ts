import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

// Absolute path to the database.sqlite in the backend root
const dbPath = path.resolve(__dirname, '../../database.sqlite');

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || `sqlite:${dbPath}`,
};
