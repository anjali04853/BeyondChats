import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

// Use persistent disk in production, local in development
const dbPath = process.env.NODE_ENV === 'production' 
  ? '/var/data/database.sqlite'
  : './database.sqlite';

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || `sqlite:${dbPath}`,
};
