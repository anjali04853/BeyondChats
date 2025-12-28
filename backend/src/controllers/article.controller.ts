import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import {
  ArticleModel,
  createArticleSchema,
  updateArticleSchema,
} from '../models/article.model';
import {
  EnhancedArticleModel,
  createEnhancedArticleSchema,
} from '../models/enhanced-article.model';
import { AppError } from '../middleware/errorHandler';

export class ArticleController {
  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedData = createArticleSchema.parse(req.body);
      const article = ArticleModel.create(validatedData);
      res.status(201).json(article);
    } catch (error) {
      if (error instanceof ZodError) {
        const message = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
        next(new AppError(message, 400, 'Validation Error'));
      } else if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
        next(new AppError('Article with this source URL already exists', 400, 'Validation Error'));
      } else {
        next(error);
      }
    }
  }

  static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));
      
      const result = ArticleModel.findAll(page, limit);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        throw new AppError('Invalid article ID', 400, 'Validation Error');
      }
      
      const article = ArticleModel.findById(id);
      
      if (!article) {
        throw new AppError('Article not found', 404, 'Not Found');
      }
      
      res.json(article);
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        throw new AppError('Invalid article ID', 400, 'Validation Error');
      }
      
      const validatedData = updateArticleSchema.parse(req.body);
      
      if (Object.keys(validatedData).length === 0) {
        throw new AppError('No valid fields to update', 400, 'Validation Error');
      }
      
      const article = ArticleModel.update(id, validatedData);
      
      if (!article) {
        throw new AppError('Article not found', 404, 'Not Found');
      }
      
      res.json(article);
    } catch (error) {
      if (error instanceof ZodError) {
        const message = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
        next(new AppError(message, 400, 'Validation Error'));
      } else if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
        next(new AppError('Article with this source URL already exists', 400, 'Validation Error'));
      } else {
        next(error);
      }
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        throw new AppError('Invalid article ID', 400, 'Validation Error');
      }
      
      const deleted = ArticleModel.delete(id);
      
      if (!deleted) {
        throw new AppError('Article not found', 404, 'Not Found');
      }
      
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  static async getEnhanced(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        throw new AppError('Invalid article ID', 400, 'Validation Error');
      }
      
      // Check if original article exists
      if (!ArticleModel.existsById(id)) {
        throw new AppError('Article not found', 404, 'Not Found');
      }
      
      const enhancedArticle = EnhancedArticleModel.findByOriginalArticleId(id);
      
      if (!enhancedArticle) {
        throw new AppError('Enhanced article not found', 404, 'Not Found');
      }
      
      res.json(enhancedArticle);
    } catch (error) {
      next(error);
    }
  }

  static async createEnhanced(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedData = createEnhancedArticleSchema.parse(req.body);
      
      // Check if original article exists
      if (!ArticleModel.existsById(validatedData.original_article_id)) {
        throw new AppError('Original article not found', 404, 'Not Found');
      }
      
      // Check if enhanced article already exists
      if (EnhancedArticleModel.existsByOriginalArticleId(validatedData.original_article_id)) {
        throw new AppError('Enhanced article already exists for this article', 400, 'Validation Error');
      }
      
      const enhancedArticle = EnhancedArticleModel.create(validatedData);
      res.status(201).json(enhancedArticle);
    } catch (error) {
      if (error instanceof ZodError) {
        const message = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
        next(new AppError(message, 400, 'Validation Error'));
      } else {
        next(error);
      }
    }
  }
}
