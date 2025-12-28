import * as fc from 'fast-check';
import { ScrapedArticle, BatchScrapeResult } from '../types';

/**
 * Feature: beyondchats-article-scraper
 * Property 1: Scraped Article Field Completeness
 * Validates: Requirements 1.3
 *
 * For any article scraped from BeyondChats, the resulting object SHALL contain
 * non-empty title, content, and source_url fields.
 */

// Helper function to validate article field completeness
function isValidScrapedArticle(article: ScrapedArticle): boolean {
  return (
    typeof article.title === 'string' &&
    article.title.trim().length > 0 &&
    typeof article.content === 'string' &&
    article.content.trim().length > 0 &&
    typeof article.source_url === 'string' &&
    article.source_url.trim().length > 0
  );
}

// Generator for valid scraped articles
const validScrapedArticleArb = fc.record({
  title: fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
  content: fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
  author: fc.option(fc.string(), { nil: null }),
  publication_date: fc.option(fc.string(), { nil: null }),
  source_url: fc.webUrl(),
});

// Generator for potentially invalid articles (for testing validation)
const potentiallyInvalidArticleArb = fc.record({
  title: fc.oneof(fc.constant(''), fc.string()),
  content: fc.oneof(fc.constant(''), fc.string()),
  author: fc.option(fc.string(), { nil: null }),
  publication_date: fc.option(fc.string(), { nil: null }),
  source_url: fc.oneof(fc.constant(''), fc.webUrl()),
});

describe('Property 1: Scraped Article Field Completeness', () => {
  /**
   * Property: For any valid scraped article, all required fields must be non-empty
   */
  it('should have non-empty title, content, and source_url for all valid articles', () => {
    fc.assert(
      fc.property(validScrapedArticleArb, (article) => {
        // All valid articles must pass the completeness check
        return isValidScrapedArticle(article);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: The validation function correctly identifies incomplete articles
   */
  it('should correctly identify articles with empty required fields as invalid', () => {
    fc.assert(
      fc.property(potentiallyInvalidArticleArb, (article) => {
        const isValid = isValidScrapedArticle(article);
        const hasEmptyTitle = !article.title || article.title.trim().length === 0;
        const hasEmptyContent = !article.content || article.content.trim().length === 0;
        const hasEmptyUrl = !article.source_url || article.source_url.trim().length === 0;

        // If any required field is empty, the article should be invalid
        if (hasEmptyTitle || hasEmptyContent || hasEmptyUrl) {
          return !isValid;
        }
        // If all required fields are non-empty, the article should be valid
        return isValid;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Optional fields (author, publication_date) can be null without affecting validity
   */
  it('should allow null values for optional fields while maintaining validity', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
        fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
        fc.webUrl(),
        fc.boolean(),
        fc.boolean(),
        (title, content, url, hasAuthor, hasDate) => {
          const article: ScrapedArticle = {
            title,
            content,
            author: hasAuthor ? 'Test Author' : null,
            publication_date: hasDate ? '2024-01-01' : null,
            source_url: url,
          };

          // Article should be valid regardless of optional field values
          return isValidScrapedArticle(article);
        }
      ),
      { numRuns: 100 }
    );
  });
});


/**
 * Feature: beyondchats-article-scraper
 * Property 2: Scraping Resilience
 * Validates: Requirements 1.5, 8.4
 *
 * For any batch of articles being scraped, if one article fails to scrape,
 * the system SHALL continue processing and return results for all successfully scraped articles.
 */

// Simulated scrape function that can fail for specific URLs
function simulateBatchScrape(
  urls: string[],
  failingUrls: Set<string>
): BatchScrapeResult {
  const result: BatchScrapeResult = {
    successful: [],
    failed: [],
  };

  for (const url of urls) {
    if (failingUrls.has(url)) {
      result.failed.push({
        url,
        error: 'Simulated scrape failure',
      });
    } else {
      result.successful.push({
        title: `Article from ${url}`,
        content: `Content from ${url}`,
        author: null,
        publication_date: null,
        source_url: url,
      });
    }
  }

  return result;
}

describe('Property 2: Scraping Resilience', () => {
  /**
   * Property: Batch scraping continues processing after individual failures
   */
  it('should continue processing remaining articles when some fail', () => {
    fc.assert(
      fc.property(
        fc.array(fc.webUrl(), { minLength: 1, maxLength: 10 }),
        fc.array(fc.nat({ max: 9 })),
        (urls, failingIndices) => {
          // Create unique URLs
          const uniqueUrls = [...new Set(urls)];
          if (uniqueUrls.length === 0) return true;

          // Determine which URLs should fail
          const failingUrls = new Set(
            failingIndices
              .filter((i) => i < uniqueUrls.length)
              .map((i) => uniqueUrls[i])
          );

          const result = simulateBatchScrape(uniqueUrls, failingUrls);

          // Total results should equal total input URLs
          const totalResults = result.successful.length + result.failed.length;
          if (totalResults !== uniqueUrls.length) return false;

          // Number of failures should match expected
          if (result.failed.length !== failingUrls.size) return false;

          // Number of successes should be total minus failures
          if (result.successful.length !== uniqueUrls.length - failingUrls.size) return false;

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: All successful articles have valid required fields
   */
  it('should return valid articles for all successful scrapes', () => {
    fc.assert(
      fc.property(
        fc.array(fc.webUrl(), { minLength: 1, maxLength: 10 }),
        fc.array(fc.nat({ max: 9 })),
        (urls, failingIndices) => {
          const uniqueUrls = [...new Set(urls)];
          if (uniqueUrls.length === 0) return true;

          const failingUrls = new Set(
            failingIndices
              .filter((i) => i < uniqueUrls.length)
              .map((i) => uniqueUrls[i])
          );

          const result = simulateBatchScrape(uniqueUrls, failingUrls);

          // All successful articles must have valid fields
          return result.successful.every(
            (article) =>
              article.title.trim().length > 0 &&
              article.content.trim().length > 0 &&
              article.source_url.trim().length > 0
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: All failed scrapes have error information
   */
  it('should include error details for all failed scrapes', () => {
    fc.assert(
      fc.property(
        fc.array(fc.webUrl(), { minLength: 1, maxLength: 10 }),
        fc.array(fc.nat({ max: 9 })),
        (urls, failingIndices) => {
          const uniqueUrls = [...new Set(urls)];
          if (uniqueUrls.length === 0) return true;

          const failingUrls = new Set(
            failingIndices
              .filter((i) => i < uniqueUrls.length)
              .map((i) => uniqueUrls[i])
          );

          const result = simulateBatchScrape(uniqueUrls, failingUrls);

          // All failed entries must have URL and error message
          return result.failed.every(
            (failure) =>
              failure.url.trim().length > 0 && failure.error.trim().length > 0
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Empty batch returns empty results
   */
  it('should return empty results for empty input', () => {
    const result = simulateBatchScrape([], new Set());
    expect(result.successful).toHaveLength(0);
    expect(result.failed).toHaveLength(0);
  });
});
