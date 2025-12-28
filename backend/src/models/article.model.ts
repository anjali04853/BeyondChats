import { z } from 'zod';
import { getDatabase } from '../db';

// Validation schemas
export const createArticleSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  author: z.string().nullable().optional(),
  publication_date: z.string().nullable().optional(),
  source_url: z.string().min(1, 'Source URL is required').url('Invalid URL format'),
});

export const updateArticleSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  content: z.string().min(1, 'Content is required').optional(),
  author: z.string().nullable().optional(),
  publication_date: z.string().nullable().optional(),
  source_url: z.string().min(1, 'Source URL is required').url('Invalid URL format').optional(),
});

export type CreateArticleInput = z.infer<typeof createArticleSchema>;
export type UpdateArticleInput = z.infer<typeof updateArticleSchema>;

export interface Article {
  id: number;
  title: string;
  content: string;
  author: string | null;
  publication_date: string | null;
  source_url: string;
  created_at: string;
  updated_at: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedArticles {
  articles: Article[];
  pagination: PaginationMeta;
}

export class ArticleModel {
  static create(data: CreateArticleInput): Article {
    const db = getDatabase();
    const now = new Date().toISOString();
    
    const stmt = db.prepare(`
      INSERT INTO articles (title, content, author, publication_date, source_url, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      data.title,
      data.content,
      data.author ?? null,
      data.publication_date ?? null,
      data.source_url,
      now,
      now
    );
    
    return this.findById(result.lastInsertRowid as number)!;
  }

  static findAll(page: number = 1, limit: number = 10): PaginatedArticles {
    const db = getDatabase();
    const offset = (page - 1) * limit;
    
    const countStmt = db.prepare('SELECT COUNT(*) as total FROM articles');
    const { total } = countStmt.get() as { total: number };
    
    const stmt = db.prepare(`
      SELECT * FROM articles
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `);
    
    const articles = stmt.all(limit, offset) as Article[];
    
    return {
      articles,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static findById(id: number): Article | null {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM articles WHERE id = ?');
    const article = stmt.get(id) as Article | undefined;
    return article ?? null;
  }

  static update(id: number, data: UpdateArticleInput): Article | null {
    const db = getDatabase();
    const existing = this.findById(id);
    
    if (!existing) {
      return null;
    }
    
    const now = new Date().toISOString();
    const updates: string[] = [];
    const values: (string | null)[] = [];
    
    if (data.title !== undefined) {
      updates.push('title = ?');
      values.push(data.title);
    }
    if (data.content !== undefined) {
      updates.push('content = ?');
      values.push(data.content);
    }
    if (data.author !== undefined) {
      updates.push('author = ?');
      values.push(data.author);
    }
    if (data.publication_date !== undefined) {
      updates.push('publication_date = ?');
      values.push(data.publication_date);
    }
    if (data.source_url !== undefined) {
      updates.push('source_url = ?');
      values.push(data.source_url);
    }
    
    updates.push('updated_at = ?');
    values.push(now);
    values.push(id.toString());
    
    const stmt = db.prepare(`
      UPDATE articles
      SET ${updates.join(', ')}
      WHERE id = ?
    `);
    
    stmt.run(...values);
    
    return this.findById(id);
  }

  static delete(id: number): boolean {
    const db = getDatabase();
    const stmt = db.prepare('DELETE FROM articles WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  static existsById(id: number): boolean {
    const db = getDatabase();
    const stmt = db.prepare('SELECT 1 FROM articles WHERE id = ?');
    return stmt.get(id) !== undefined;
  }
}
