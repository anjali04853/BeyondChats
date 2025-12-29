import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

// In production (Docker), database is at /app/backend/database.sqlite
// In development, it's at ./database.sqlite (relative to backend folder)
const dbPath = process.env.NODE_ENV === 'production'
  ? path.join(__dirname, '../database.sqlite')
  : './database.sqlite';

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || `sqlite:${dbPath}`,
};
