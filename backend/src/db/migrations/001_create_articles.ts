import Database from 'better-sqlite3';

export const up = (db: Database.Database): void => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS articles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      author TEXT,
      publication_date TEXT,
      source_url TEXT NOT NULL UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_articles_source_url ON articles(source_url);
    CREATE INDEX IF NOT EXISTS idx_articles_created_at ON articles(created_at);
  `);
};

export const down = (db: Database.Database): void => {
  db.exec(`
    DROP INDEX IF EXISTS idx_articles_created_at;
    DROP INDEX IF EXISTS idx_articles_source_url;
    DROP TABLE IF EXISTS articles;
  `);
};
