import Database from 'better-sqlite3';

export const up = (db: Database.Database): void => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS enhanced_articles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      original_article_id INTEGER NOT NULL UNIQUE,
      enhanced_content TEXT NOT NULL,
      reference_urls TEXT NOT NULL,
      enhancement_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (original_article_id) REFERENCES articles(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_enhanced_articles_original_id ON enhanced_articles(original_article_id);
  `);
};

export const down = (db: Database.Database): void => {
  db.exec(`
    DROP INDEX IF EXISTS idx_enhanced_articles_original_id;
    DROP TABLE IF EXISTS enhanced_articles;
  `);
};
