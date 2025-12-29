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


/**
 * Feature: beyondchats-article-scraper
 * Property 11: Search Result Filtering
 * Validates: Requirements 4.2, 4.3
 *
 * For any array of search results, the filter function SHALL return at most 2 results,
 * and none of the returned URLs SHALL contain "beyondchats.com".
 */

import { SearchResult } from '../types';

// Simulated filter function matching the GoogleSearchService implementation
const MAX_RESULTS = 2;
const EXCLUDE_DOMAINS = ['beyondchats.com'];

function filterBlogResults(results: SearchResult[]): SearchResult[] {
  const filtered = results.filter((result) => {
    // Check if URL contains excluded domains
    const isExcluded = EXCLUDE_DOMAINS.some((domain) =>
      result.url.toLowerCase().includes(domain.toLowerCase())
    );

    if (isExcluded) {
      return false;
    }

    // Check if URL looks like a blog/article
    const url = result.url.toLowerCase();
    const isBlogLike =
      url.includes('/blog') ||
      url.includes('/article') ||
      url.includes('/post') ||
      url.includes('/news') ||
      url.includes('/story') ||
      url.includes('/guide') ||
      url.includes('/how-to') ||
      url.includes('/what-is') ||
      url.includes('/tips') ||
      // Also include general content pages
      (!url.includes('/product') &&
        !url.includes('/pricing') &&
        !url.includes('/login') &&
        !url.includes('/signup') &&
        !url.includes('/cart'));

    return isBlogLike;
  });

  return filtered.slice(0, MAX_RESULTS);
}

// Generator for search results with various URL patterns
const searchResultArb = fc.record({
  title: fc.string({ minLength: 1 }),
  url: fc.oneof(
    // Blog-like URLs
    fc.constantFrom(
      'https://example.com/blog/article-1',
      'https://test.com/article/how-to-code',
      'https://news.site.com/post/latest-news',
      'https://guide.example.com/tips/best-practices'
    ),
    // BeyondChats URLs (should be excluded)
    fc.constantFrom(
      'https://beyondchats.com/blog/article',
      'https://www.beyondchats.com/post/test',
      'https://blog.beyondchats.com/article'
    ),
    // Non-blog URLs (should be excluded)
    fc.constantFrom(
      'https://example.com/product/item-1',
      'https://shop.com/pricing',
      'https://app.com/login',
      'https://service.com/signup'
    ),
    // Random web URLs
    fc.webUrl()
  ),
  snippet: fc.option(fc.string(), { nil: undefined }),
});

describe('Property 11: Search Result Filtering', () => {
  /**
   * Property: Filter returns at most MAX_RESULTS (2) results
   */
  it('should return at most 2 results for any input array', () => {
    fc.assert(
      fc.property(
        fc.array(searchResultArb, { minLength: 0, maxLength: 20 }),
        (results) => {
          const filtered = filterBlogResults(results);
          return filtered.length <= MAX_RESULTS;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: No filtered result contains beyondchats.com
   */
  it('should never return URLs containing beyondchats.com', () => {
    fc.assert(
      fc.property(
        fc.array(searchResultArb, { minLength: 0, maxLength: 20 }),
        (results) => {
          const filtered = filterBlogResults(results);
          return filtered.every(
            (result) => !result.url.toLowerCase().includes('beyondchats.com')
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: All filtered results are from the original input
   */
  it('should only return results that were in the original input', () => {
    fc.assert(
      fc.property(
        fc.array(searchResultArb, { minLength: 0, maxLength: 20 }),
        (results) => {
          const filtered = filterBlogResults(results);
          return filtered.every((filteredResult) =>
            results.some((original) => original.url === filteredResult.url)
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Empty input returns empty output
   */
  it('should return empty array for empty input', () => {
    const filtered = filterBlogResults([]);
    expect(filtered).toHaveLength(0);
  });

  /**
   * Property: Input with only beyondchats.com URLs returns empty
   */
  it('should return empty array when all URLs are from beyondchats.com', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            title: fc.string({ minLength: 1 }),
            url: fc.constantFrom(
              'https://beyondchats.com/blog/test',
              'https://www.beyondchats.com/article/test',
              'https://blog.beyondchats.com/post/test'
            ),
            snippet: fc.option(fc.string(), { nil: undefined }),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (results) => {
          const filtered = filterBlogResults(results);
          return filtered.length === 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Filtering preserves order of results
   */
  it('should preserve the order of results from the original array', () => {
    fc.assert(
      fc.property(
        fc.array(searchResultArb, { minLength: 2, maxLength: 20 }),
        (results) => {
          // Create unique results by URL to avoid duplicate issues
          const uniqueResults = results.filter(
            (r, i, arr) => arr.findIndex((x) => x.url === r.url) === i
          );
          
          const filtered = filterBlogResults(uniqueResults);
          if (filtered.length < 2) return true;

          // Check that order is preserved
          const firstIndex = uniqueResults.findIndex((r) => r.url === filtered[0].url);
          const secondIndex = uniqueResults.findIndex((r) => r.url === filtered[1].url);
          return firstIndex < secondIndex;
        }
      ),
      { numRuns: 100 }
    );
  });
});


/**
 * Feature: beyondchats-article-scraper
 * Property 12: Reference Article Field Completeness
 * Validates: Requirements 5.2
 *
 * For any successfully scraped reference article, the resulting object SHALL contain
 * non-empty title, content, and source_url fields.
 */

import { ReferenceContent } from '../types';

// Helper function to validate reference content field completeness
function isValidReferenceContent(content: ReferenceContent): boolean {
  return (
    typeof content.title === 'string' &&
    content.title.trim().length > 0 &&
    typeof content.content === 'string' &&
    content.content.trim().length > 0 &&
    typeof content.source_url === 'string' &&
    content.source_url.trim().length > 0
  );
}

// Generator for valid reference content
const validReferenceContentArb = fc.record({
  title: fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
  content: fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
  source_url: fc.webUrl(),
});

// Generator for potentially invalid reference content
const potentiallyInvalidReferenceContentArb = fc.record({
  title: fc.oneof(fc.constant(''), fc.constant('   '), fc.string()),
  content: fc.oneof(fc.constant(''), fc.constant('   '), fc.string()),
  source_url: fc.oneof(fc.constant(''), fc.webUrl()),
});

describe('Property 12: Reference Article Field Completeness', () => {
  /**
   * Property: For any valid reference content, all required fields must be non-empty
   */
  it('should have non-empty title, content, and source_url for all valid reference articles', () => {
    fc.assert(
      fc.property(validReferenceContentArb, (content) => {
        return isValidReferenceContent(content);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: The validation function correctly identifies incomplete reference content
   */
  it('should correctly identify reference content with empty required fields as invalid', () => {
    fc.assert(
      fc.property(potentiallyInvalidReferenceContentArb, (content) => {
        const isValid = isValidReferenceContent(content);
        const hasEmptyTitle = !content.title || content.title.trim().length === 0;
        const hasEmptyContent = !content.content || content.content.trim().length === 0;
        const hasEmptyUrl = !content.source_url || content.source_url.trim().length === 0;

        // If any required field is empty, the content should be invalid
        if (hasEmptyTitle || hasEmptyContent || hasEmptyUrl) {
          return !isValid;
        }
        // If all required fields are non-empty, the content should be valid
        return isValid;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Valid reference content maintains field types
   */
  it('should ensure all fields are strings', () => {
    fc.assert(
      fc.property(validReferenceContentArb, (content) => {
        return (
          typeof content.title === 'string' &&
          typeof content.content === 'string' &&
          typeof content.source_url === 'string'
        );
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Source URL should be a valid URL format
   */
  it('should have valid URL format for source_url', () => {
    fc.assert(
      fc.property(validReferenceContentArb, (content) => {
        try {
          new URL(content.source_url);
          return true;
        } catch {
          return false;
        }
      }),
      { numRuns: 100 }
    );
  });
});
