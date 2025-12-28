import { z } from 'zod';
import { getDatabase } from '../db';

// Validation schemas
export const createEnhancedArticleSchema = z.object({
  original_article_id: z.number().int().positive('Original article ID must be a positive integer'),
  enhanced_content: z.string().min(1, 'Enhanced content is required'),
  reference_urls: z.array(z.string().url()).min(0),
});

export type CreateEnhancedArticleInput = z.infer<typeof createEnhancedArticleSchema>;

export interface EnhancedArticle {
  id: number;
  original_article_id: number;
  enhanced_content: string;
  reference_urls: string[];
  enhancement_date: string;
  created_at: string;
  updated_at: string;
}

interface EnhancedArticleRow {
  id: number;
  original_article_id: number;
  enhanced_content: string;
  reference_urls: string;
  enhancement_date: string;
  created_at: string;
  updated_at: string;
}

export class EnhancedArticleModel {
  private static parseRow(row: EnhancedArticleRow): EnhancedArticle {
    return {
      ...row,
      reference_urls: JSON.parse(row.reference_urls),
    };
  }

  static create(data: CreateEnhancedArticleInput): EnhancedArticle {
    const db = getDatabase();
    const now = new Date().toISOString();
    
    const stmt = db.prepare(`
      INSERT INTO enhanced_articles (original_article_id, enhanced_content, reference_urls, enhancement_date, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      data.original_article_id,
      data.enhanced_content,
      JSON.stringify(data.reference_urls),
      now,
      now,
      now
    );
    
    return this.findById(result.lastInsertRowid as number)!;
  }

  static findById(id: number): EnhancedArticle | null {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM enhanced_articles WHERE id = ?');
    const row = stmt.get(id) as EnhancedArticleRow | undefined;
    return row ? this.parseRow(row) : null;
  }

  static findByOriginalArticleId(originalArticleId: number): EnhancedArticle | null {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM enhanced_articles WHERE original_article_id = ?');
    const row = stmt.get(originalArticleId) as EnhancedArticleRow | undefined;
    return row ? this.parseRow(row) : null;
  }

  static existsByOriginalArticleId(originalArticleId: number): boolean {
    const db = getDatabase();
    const stmt = db.prepare('SELECT 1 FROM enhanced_articles WHERE original_article_id = ?');
    return stmt.get(originalArticleId) !== undefined;
  }
}
