import { getDatabase } from './connection';
import * as migration001 from './migrations/001_create_articles';
import * as migration002 from './migrations/002_create_enhanced_articles';

const migrations = [
  { name: '001_create_articles', ...migration001 },
  { name: '002_create_enhanced_articles', ...migration002 },
];

export const runMigrations = (): void => {
  const db = getDatabase();

  // Create migrations tracking table
  db.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const getExecutedMigrations = db.prepare('SELECT name FROM migrations');
  const executedMigrations = new Set(
    (getExecutedMigrations.all() as { name: string }[]).map((row) => row.name)
  );

  const insertMigration = db.prepare('INSERT INTO migrations (name) VALUES (?)');

  for (const migration of migrations) {
    if (!executedMigrations.has(migration.name)) {
      console.log(`Running migration: ${migration.name}`);
      migration.up(db);
      insertMigration.run(migration.name);
      console.log(`Completed migration: ${migration.name}`);
    }
  }
};

export const rollbackMigrations = (): void => {
  const db = getDatabase();

  // Run migrations in reverse order
  for (const migration of [...migrations].reverse()) {
    console.log(`Rolling back migration: ${migration.name}`);
    migration.down(db);
  }

  // Clear migrations table
  db.exec('DELETE FROM migrations');
};
