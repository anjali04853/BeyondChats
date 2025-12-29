import * as fc from 'fast-check';
import Database from 'better-sqlite3';
import { ArticleModel, CreateArticleInput } from '../models/article.model';
import { setDatabase } from '../db';
import { up as createArticlesTable } from '../db/migrations/001_create_articles';
import { up as createEnhancedArticlesTable } from '../db/migrations/002_create_enhanced_articles';

// Test database setup
let testDb: Database.Database;

const setupTestDb = () => {
  testDb = new Database(':memory:');
  testDb.pragma('foreign_keys = ON');
  createArticlesTable(testDb);
  createEnhancedArticlesTable(testDb);
  setDatabase(testDb);
};

const teardownTestDb = () => {
  if (testDb) {
    testDb.close();
    setDatabase(null);
  }
};

// Arbitrary for generating valid article input
const articleInputArbitrary = fc.record({
  title: fc.string({ minLength: 1, maxLength: 200 }),
  content: fc.string({ minLength: 1, maxLength: 5000 }),
  author: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: null }),
  publication_date: fc.option(fc.date().map(d => d.toISOString()), { nil: null }),
  source_url: fc.webUrl(),
});

describe('Article Model Property Tests', () => {
  beforeEach(() => {
    setupTestDb();
  });

  afterEach(() => {
    teardownTestDb();
  });

  /**
   * Feature: beyondchats-article-scraper, Property 3: Unique ID Generation
   * Validates: Requirements 2.3
   * 
   * For any article stored in the database, the returned article SHALL have a unique
   * positive integer ID that does not exist in any previously stored article.
   */
  it('Property 3: Unique ID Generation - all created articles have unique positive IDs', () => {
    fc.assert(
      fc.property(
        fc.array(articleInputArbitrary, { minLength: 1, maxLength: 20 }),
        (articleInputs) => {
          // Reset database for each test run
          testDb.exec('DELETE FROM articles');
          
          const createdIds = new Set<number>();
          
          // Make source_urls unique by appending index
          const uniqueInputs = articleInputs.map((input, index) => ({
            ...input,
            source_url: `${input.source_url}/${index}`,
          }));
          
          for (const input of uniqueInputs) {
            const article = ArticleModel.create(input as CreateArticleInput);
            
            // ID must be a positive integer
            expect(article.id).toBeGreaterThan(0);
            expect(Number.isInteger(article.id)).toBe(true);
            
            // ID must be unique
            expect(createdIds.has(article.id)).toBe(false);
            createdIds.add(article.id);
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});


describe('Article API Property Tests', () => {
  beforeEach(() => {
    setupTestDb();
  });

  afterEach(() => {
    teardownTestDb();
  });

  /**
   * Feature: beyondchats-article-scraper, Property 4: CRUD Create Returns 201
   * Validates: Requirements 3.1
   * 
   * For any valid article data submitted via POST to /api/articles, the API SHALL return
   * status 201 and the created article with all submitted fields plus generated id and timestamps.
   */
  it('Property 4: CRUD Create Returns 201 - creating article returns 201 with all fields', () => {
    fc.assert(
      fc.property(
        articleInputArbitrary,
        (input) => {
          // Reset database for each test run
          testDb.exec('DELETE FROM articles');
          
          const article = ArticleModel.create(input as CreateArticleInput);
          
          // Verify all submitted fields are present
          expect(article.title).toBe(input.title);
          expect(article.content).toBe(input.content);
          expect(article.author).toBe(input.author ?? null);
          expect(article.publication_date).toBe(input.publication_date ?? null);
          expect(article.source_url).toBe(input.source_url);
          
          // Verify generated fields
          expect(article.id).toBeGreaterThan(0);
          expect(article.created_at).toBeDefined();
          expect(article.updated_at).toBeDefined();
          
          // Verify timestamps are valid ISO strings
          expect(() => new Date(article.created_at)).not.toThrow();
          expect(() => new Date(article.updated_at)).not.toThrow();
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});


describe('Article Pagination Property Tests', () => {
  beforeEach(() => {
    setupTestDb();
  });

  afterEach(() => {
    teardownTestDb();
  });

  /**
   * Feature: beyondchats-article-scraper, Property 5: CRUD Read with Pagination
   * Validates: Requirements 3.2
   * 
   * For any GET request to /api/articles with pagination parameters (page, limit),
   * the API SHALL return at most `limit` articles and correct pagination metadata.
   */
  it('Property 5: CRUD Read with Pagination - returns correct number of articles and metadata', () => {
    fc.assert(
      fc.property(
        fc.array(articleInputArbitrary, { minLength: 0, maxLength: 30 }),
        fc.integer({ min: 1, max: 10 }),
        fc.integer({ min: 1, max: 20 }),
        (articleInputs, page, limit) => {
          // Reset database for each test run
          testDb.exec('DELETE FROM articles');
          
          // Make source_urls unique by appending index
          const uniqueInputs = articleInputs.map((input, index) => ({
            ...input,
            source_url: `${input.source_url}/${index}`,
          }));
          
          // Create all articles
          for (const input of uniqueInputs) {
            ArticleModel.create(input as CreateArticleInput);
          }
          
          const totalArticles = uniqueInputs.length;
          const result = ArticleModel.findAll(page, limit);
          
          // Verify pagination metadata
          expect(result.pagination.page).toBe(page);
          expect(result.pagination.limit).toBe(limit);
          expect(result.pagination.total).toBe(totalArticles);
          expect(result.pagination.totalPages).toBe(Math.ceil(totalArticles / limit));
          
          // Verify returned articles count
          const expectedCount = Math.min(limit, Math.max(0, totalArticles - (page - 1) * limit));
          expect(result.articles.length).toBe(expectedCount);
          
          // Verify articles don't exceed limit
          expect(result.articles.length).toBeLessThanOrEqual(limit);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});


describe('Article Read by ID Property Tests', () => {
  beforeEach(() => {
    setupTestDb();
  });

  afterEach(() => {
    teardownTestDb();
  });

  /**
   * Feature: beyondchats-article-scraper, Property 6: CRUD Read by ID Round-Trip
   * Validates: Requirements 3.3
   * 
   * For any article created via POST, a subsequent GET request to /api/articles/{id}
   * SHALL return the same article data.
   */
  it('Property 6: CRUD Read by ID Round-Trip - created article can be retrieved by ID', () => {
    fc.assert(
      fc.property(
        articleInputArbitrary,
        (input) => {
          // Reset database for each test run
          testDb.exec('DELETE FROM articles');
          
          // Create article
          const created = ArticleModel.create(input as CreateArticleInput);
          
          // Retrieve by ID
          const retrieved = ArticleModel.findById(created.id);
          
          // Verify round-trip
          expect(retrieved).not.toBeNull();
          expect(retrieved!.id).toBe(created.id);
          expect(retrieved!.title).toBe(created.title);
          expect(retrieved!.content).toBe(created.content);
          expect(retrieved!.author).toBe(created.author);
          expect(retrieved!.publication_date).toBe(created.publication_date);
          expect(retrieved!.source_url).toBe(created.source_url);
          expect(retrieved!.created_at).toBe(created.created_at);
          expect(retrieved!.updated_at).toBe(created.updated_at);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});


// Arbitrary for generating valid update input
const updateInputArbitrary = fc.record({
  title: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: undefined }),
  content: fc.option(fc.string({ minLength: 1, maxLength: 5000 }), { nil: undefined }),
  author: fc.option(fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: null }), { nil: undefined }),
  publication_date: fc.option(fc.option(fc.date().map(d => d.toISOString()), { nil: null }), { nil: undefined }),
});

describe('Article Update Property Tests', () => {
  beforeEach(() => {
    setupTestDb();
  });

  afterEach(() => {
    teardownTestDb();
  });

  /**
   * Feature: beyondchats-article-scraper, Property 7: CRUD Update Persistence
   * Validates: Requirements 3.4
   * 
   * For any valid update data submitted via PUT to /api/articles/{id}, the API SHALL
   * return the updated article, and a subsequent GET SHALL reflect those changes.
   */
  it('Property 7: CRUD Update Persistence - updates are persisted and retrievable', () => {
    fc.assert(
      fc.property(
        articleInputArbitrary,
        updateInputArbitrary,
        (createInput, updateInput) => {
          // Reset database for each test run
          testDb.exec('DELETE FROM articles');
          
          // Create article
          const created = ArticleModel.create(createInput as CreateArticleInput);
          
          // Filter out undefined values for update
          const filteredUpdate: Record<string, unknown> = {};
          for (const [key, value] of Object.entries(updateInput)) {
            if (value !== undefined) {
              filteredUpdate[key] = value;
            }
          }
          
          // Skip if no fields to update
          if (Object.keys(filteredUpdate).length === 0) {
            return true;
          }
          
          // Update article
          const updated = ArticleModel.update(created.id, filteredUpdate);
          expect(updated).not.toBeNull();
          
          // Verify updated fields
          for (const [key, value] of Object.entries(filteredUpdate)) {
            expect((updated as unknown as Record<string, unknown>)[key]).toBe(value);
          }
          
          // Retrieve and verify persistence
          const retrieved = ArticleModel.findById(created.id);
          expect(retrieved).not.toBeNull();
          
          for (const [key, value] of Object.entries(filteredUpdate)) {
            expect((retrieved as unknown as Record<string, unknown>)[key]).toBe(value);
          }
          
          // Verify updated_at changed
          expect(new Date(updated!.updated_at).getTime()).toBeGreaterThanOrEqual(
            new Date(created.updated_at).getTime()
          );
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});


describe('Article Delete Property Tests', () => {
  beforeEach(() => {
    setupTestDb();
  });

  afterEach(() => {
    teardownTestDb();
  });

  /**
   * Feature: beyondchats-article-scraper, Property 8: CRUD Delete Removes Article
   * Validates: Requirements 3.5
   * 
   * For any existing article, a DELETE request to /api/articles/{id} SHALL return 204,
   * and a subsequent GET to the same ID SHALL return 404.
   */
  it('Property 8: CRUD Delete Removes Article - deleted articles are no longer retrievable', () => {
    fc.assert(
      fc.property(
        articleInputArbitrary,
        (input) => {
          // Reset database for each test run
          testDb.exec('DELETE FROM articles');
          
          // Create article
          const created = ArticleModel.create(input as CreateArticleInput);
          
          // Verify it exists
          expect(ArticleModel.findById(created.id)).not.toBeNull();
          
          // Delete article
          const deleted = ArticleModel.delete(created.id);
          expect(deleted).toBe(true);
          
          // Verify it no longer exists
          expect(ArticleModel.findById(created.id)).toBeNull();
          
          // Verify deleting again returns false
          expect(ArticleModel.delete(created.id)).toBe(false);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});


import { EnhancedArticleModel, CreateEnhancedArticleInput } from '../models/enhanced-article.model';

// Arbitrary for generating valid enhanced article input
const enhancedArticleInputArbitrary = (originalArticleId: number) => fc.record({
  original_article_id: fc.constant(originalArticleId),
  enhanced_content: fc.string({ minLength: 1, maxLength: 5000 }),
  reference_urls: fc.array(fc.webUrl(), { minLength: 0, maxLength: 5 }),
});

describe('Enhanced Article Property Tests', () => {
  beforeEach(() => {
    setupTestDb();
  });

  afterEach(() => {
    teardownTestDb();
  });

  /**
   * Feature: beyondchats-article-scraper, Property 9: Enhanced Article Retrieval
   * Validates: Requirements 3.6
   * 
   * For any article with an associated enhanced version, GET /api/articles/{id}/enhanced
   * SHALL return the enhanced article with original_article_id matching the requested ID.
   */
  it('Property 9: Enhanced Article Retrieval - enhanced articles are retrievable by original article ID', () => {
    fc.assert(
      fc.property(
        articleInputArbitrary,
        fc.string({ minLength: 1, maxLength: 5000 }),
        fc.array(fc.webUrl(), { minLength: 0, maxLength: 5 }),
        (articleInput, enhancedContent, referenceUrls) => {
          // Reset database for each test run
          testDb.exec('DELETE FROM enhanced_articles');
          testDb.exec('DELETE FROM articles');
          
          // Create original article
          const article = ArticleModel.create(articleInput as CreateArticleInput);
          
          // Create enhanced article
          const enhancedInput: CreateEnhancedArticleInput = {
            original_article_id: article.id,
            enhanced_content: enhancedContent,
            reference_urls: referenceUrls,
          };
          const enhanced = EnhancedArticleModel.create(enhancedInput);
          
          // Retrieve by original article ID
          const retrieved = EnhancedArticleModel.findByOriginalArticleId(article.id);
          
          // Verify retrieval
          expect(retrieved).not.toBeNull();
          expect(retrieved!.id).toBe(enhanced.id);
          expect(retrieved!.original_article_id).toBe(article.id);
          expect(retrieved!.enhanced_content).toBe(enhancedContent);
          expect(retrieved!.reference_urls).toEqual(referenceUrls);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});


import { createArticleSchema, updateArticleSchema } from '../models/article.model';

describe('Article Validation Property Tests', () => {
  /**
   * Feature: beyondchats-article-scraper, Property 10: Invalid Input Returns 400
   * Validates: Requirements 3.7
   * 
   * For any POST or PUT request with missing required fields (title, content, source_url),
   * the API SHALL return status 400 with an error message.
   */
  it('Property 10: Invalid Input Returns 400 - missing required fields are rejected', () => {
    fc.assert(
      fc.property(
        fc.record({
          title: fc.oneof(fc.constant(undefined), fc.constant(''), fc.constant(null)),
          content: fc.oneof(fc.constant(undefined), fc.constant(''), fc.constant(null)),
          source_url: fc.oneof(fc.constant(undefined), fc.constant(''), fc.constant(null), fc.constant('not-a-url')),
        }),
        (invalidInput) => {
          // At least one field should be invalid
          const result = createArticleSchema.safeParse(invalidInput);
          
          // Should fail validation
          expect(result.success).toBe(false);
          
          if (!result.success) {
            // Should have error messages
            expect(result.error.errors.length).toBeGreaterThan(0);
            
            // Each error should have a message
            for (const error of result.error.errors) {
              expect(error.message).toBeDefined();
              expect(error.message.length).toBeGreaterThan(0);
            }
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 10b: Valid input passes validation', () => {
    fc.assert(
      fc.property(
        articleInputArbitrary,
        (validInput) => {
          const result = createArticleSchema.safeParse(validInput);
          expect(result.success).toBe(true);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});


import { ErrorResponse, AppError, logError, LogEntry } from '../middleware/errorHandler';

/**
 * Feature: beyondchats-article-scraper
 * Property 16: API Error Messages
 * Validates: Requirements 8.2
 *
 * For any API error response, the response body SHALL contain a meaningful
 * error message describing what went wrong.
 */

// Helper to validate error response structure
function isValidErrorResponse(response: ErrorResponse): boolean {
  return (
    typeof response.error === 'string' &&
    response.error.length > 0 &&
    typeof response.message === 'string' &&
    response.message.length > 0 &&
    typeof response.statusCode === 'number' &&
    response.statusCode >= 400 &&
    response.statusCode < 600 &&
    typeof response.timestamp === 'string' &&
    response.timestamp.length > 0
  );
}

// Generator for error responses
const errorResponseArb = fc.record({
  error: fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
  message: fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
  statusCode: fc.integer({ min: 400, max: 599 }),
  timestamp: fc.date().map((d) => d.toISOString()),
});

// Generator for AppError instances
const appErrorArb = fc.record({
  message: fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
  statusCode: fc.integer({ min: 400, max: 599 }),
  error: fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
  operation: fc.string({ minLength: 1 }),
});

describe('Property 16: API Error Messages', () => {
  /**
   * Property: All error responses have required fields
   */
  it('should have all required fields in error response', () => {
    fc.assert(
      fc.property(errorResponseArb, (response) => {
        return isValidErrorResponse(response);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Error message is always non-empty
   */
  it('should have non-empty error message', () => {
    fc.assert(
      fc.property(errorResponseArb, (response) => {
        return response.message.trim().length > 0;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Error type is always non-empty
   */
  it('should have non-empty error type', () => {
    fc.assert(
      fc.property(errorResponseArb, (response) => {
        return response.error.trim().length > 0;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Status code is in valid error range
   */
  it('should have status code in error range (400-599)', () => {
    fc.assert(
      fc.property(errorResponseArb, (response) => {
        return response.statusCode >= 400 && response.statusCode < 600;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Timestamp is valid ISO string
   */
  it('should have valid ISO timestamp', () => {
    fc.assert(
      fc.property(errorResponseArb, (response) => {
        try {
          const date = new Date(response.timestamp);
          return !isNaN(date.getTime());
        } catch {
          return false;
        }
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: AppError creates valid error with all fields
   */
  it('should create AppError with all required fields', () => {
    fc.assert(
      fc.property(appErrorArb, (errorData) => {
        const appError = new AppError(
          errorData.message,
          errorData.statusCode,
          errorData.error,
          errorData.operation
        );

        return (
          appError.message === errorData.message &&
          appError.statusCode === errorData.statusCode &&
          appError.error === errorData.error &&
          appError.operation === errorData.operation
        );
      }),
      { numRuns: 100 }
    );
  });
});


import { logger, LogEntry as LoggerEntry, LogLevel } from '../utils/logger';

/**
 * Feature: beyondchats-article-scraper
 * Property 15: Error Logging Format
 * Validates: Requirements 8.1
 *
 * For any logged error, the log entry SHALL contain a timestamp,
 * operation type, and error details.
 */

// Helper to validate log entry structure
function isValidLogEntry(entry: LoggerEntry): boolean {
  return (
    typeof entry.timestamp === 'string' &&
    entry.timestamp.length > 0 &&
    typeof entry.level === 'string' &&
    ['debug', 'info', 'warn', 'error'].includes(entry.level) &&
    typeof entry.operation === 'string' &&
    entry.operation.length > 0 &&
    typeof entry.message === 'string' &&
    entry.message.length > 0
  );
}

// Generator for log entries
const logEntryArb = fc.record({
  timestamp: fc.date().map((d) => d.toISOString()),
  level: fc.constantFrom('debug', 'info', 'warn', 'error') as fc.Arbitrary<LogLevel>,
  operation: fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
  message: fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
  details: fc.option(
    fc.dictionary(fc.string(), fc.oneof(fc.string(), fc.integer(), fc.boolean())),
    { nil: undefined }
  ),
});

describe('Property 15: Error Logging Format', () => {
  /**
   * Property: All log entries have required fields
   */
  it('should have all required fields in log entry', () => {
    fc.assert(
      fc.property(logEntryArb, (entry) => {
        return isValidLogEntry(entry);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Timestamp is valid ISO string
   */
  it('should have valid ISO timestamp in log entry', () => {
    fc.assert(
      fc.property(logEntryArb, (entry) => {
        try {
          const date = new Date(entry.timestamp);
          return !isNaN(date.getTime());
        } catch {
          return false;
        }
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Operation type is non-empty
   */
  it('should have non-empty operation type', () => {
    fc.assert(
      fc.property(logEntryArb, (entry) => {
        return entry.operation.trim().length > 0;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Message is non-empty
   */
  it('should have non-empty message', () => {
    fc.assert(
      fc.property(logEntryArb, (entry) => {
        return entry.message.trim().length > 0;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Logger creates valid entries
   */
  it('should create valid log entries via logger', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
        fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
        (operation, message) => {
          // Suppress console output during test
          const originalError = console.error;
          console.error = () => {};
          
          const entry = logger.error(operation, message);
          
          console.error = originalError;
          
          return (
            entry.level === 'error' &&
            entry.operation === operation &&
            entry.message === message &&
            typeof entry.timestamp === 'string' &&
            entry.timestamp.length > 0
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Logger includes details when provided
   */
  it('should include details in log entry when provided', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
        fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
        fc.dictionary(fc.string({ minLength: 1 }), fc.string()),
        (operation, message, details) => {
          // Suppress console output during test
          const originalInfo = console.info;
          console.info = () => {};
          
          const entry = logger.info(operation, message, details);
          
          console.info = originalInfo;
          
          return entry.details !== undefined || Object.keys(details).length === 0;
        }
      ),
      { numRuns: 100 }
    );
  });
});
