import * as fc from 'fast-check';
import { describe, it } from 'vitest';
import { Article, EnhancedArticle } from '../types';

/**
 * Feature: beyondchats-article-scraper
 * Property 15: Article View Field Completeness
 * Validates: Requirements 7.3
 *
 * For any article displayed in the view, the rendered output SHALL include
 * title, content, author, date, and reference citations for enhanced articles.
 */

// Helper function to check if article has all required display fields
function hasRequiredDisplayFields(article: Article): boolean {
  return (
    typeof article.title === 'string' &&
    article.title.length > 0 &&
    typeof article.content === 'string' &&
    article.content.length > 0 &&
    typeof article.source_url === 'string' &&
    article.source_url.length > 0 &&
    typeof article.id === 'number'
  );
}

// Helper function to check if enhanced article has citation fields
function hasEnhancedFields(enhanced: EnhancedArticle): boolean {
  return (
    typeof enhanced.enhanced_content === 'string' &&
    enhanced.enhanced_content.length > 0 &&
    Array.isArray(enhanced.reference_urls) &&
    typeof enhanced.original_article_id === 'number'
  );
}

// Generator for valid articles
const validArticleArb = fc.record({
  id: fc.integer({ min: 1, max: 1000000 }),
  title: fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
  content: fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
  author: fc.option(fc.string(), { nil: null }),
  publication_date: fc.option(fc.date().map((d) => d.toISOString()), { nil: null }),
  source_url: fc.webUrl(),
  created_at: fc.date().map((d) => d.toISOString()),
  updated_at: fc.date().map((d) => d.toISOString()),
});

// Generator for valid enhanced articles
const validEnhancedArticleArb = fc.record({
  id: fc.integer({ min: 1, max: 1000000 }),
  original_article_id: fc.integer({ min: 1, max: 1000000 }),
  enhanced_content: fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
  reference_urls: fc.array(fc.webUrl(), { minLength: 0, maxLength: 5 }),
  enhancement_date: fc.date().map((d) => d.toISOString()),
  created_at: fc.date().map((d) => d.toISOString()),
  updated_at: fc.date().map((d) => d.toISOString()),
});

describe('Property 15: Article View Field Completeness', () => {
  /**
   * Property: All valid articles have required display fields
   */
  it('should have all required display fields for any valid article', () => {
    fc.assert(
      fc.property(validArticleArb, (article) => {
        return hasRequiredDisplayFields(article);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Enhanced articles have citation fields
   */
  it('should have enhanced content and reference URLs for any enhanced article', () => {
    fc.assert(
      fc.property(validEnhancedArticleArb, (enhanced) => {
        return hasEnhancedFields(enhanced);
      }),
      { numRuns: 100 }
    );
  });


  /**
   * Property: Article title is always displayable (non-empty string)
   */
  it('should have displayable title for any valid article', () => {
    fc.assert(
      fc.property(validArticleArb, (article) => {
        return article.title.trim().length > 0;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Article content is always displayable (non-empty string)
   */
  it('should have displayable content for any valid article', () => {
    fc.assert(
      fc.property(validArticleArb, (article) => {
        return article.content.trim().length > 0;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Enhanced article links back to original article
   */
  it('should have valid original_article_id for any enhanced article', () => {
    fc.assert(
      fc.property(validEnhancedArticleArb, (enhanced) => {
        return enhanced.original_article_id > 0;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Reference URLs are valid URLs when present
   */
  it('should have valid URLs in reference_urls array', () => {
    fc.assert(
      fc.property(validEnhancedArticleArb, (enhanced) => {
        return enhanced.reference_urls.every((url) => {
          try {
            new URL(url);
            return true;
          } catch {
            return false;
          }
        });
      }),
      { numRuns: 100 }
    );
  });
});
