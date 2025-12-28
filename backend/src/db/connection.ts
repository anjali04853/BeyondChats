import Database from 'better-sqlite3';
import path from 'path';
import { config } from '../config';

let db: Database.Database | null = null;

export const getDatabase = (): Database.Database => {
  if (!db) {
    const dbPath = config.databaseUrl.replace('sqlite:', '');
    const absolutePath = path.isAbsolute(dbPath) ? dbPath : path.join(process.cwd(), dbPath);
    db = new Database(absolutePath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
};

export const closeDatabase = (): void => {
  if (db) {
    db.close();
    db = null;
  }
};

// For testing purposes - allows setting a custom database instance
export const setDatabase = (database: Database.Database | null): void => {
  db = database;
};
