import { beyondChatsScraper } from './services/beyondchats-scraper.service';
import { googleSearchService } from './services/google-search.service';
import { referenceScraperService } from './services/reference-scraper.service';
import { llmEnhancerService } from './services/llm-enhancer.service';
import { apiService } from './services/api.service';
import { browserService } from './services/browser.service';
import { logger } from './utils/logger';
import { config } from './config';

/**
 * Main scraper workflow:
 * 1. Scrape the 5 oldest articles from BeyondChats blog
 * 2. Store them via the backend API
 * 3. For each article, search Google for references
 * 4. Scrape reference articles
 * 5. Enhance articles using LLM
 * 6. Store enhanced articles via API
 */
async function main(): Promise<void> {
  logger.info('Scraper', 'Starting BeyondChats article scraper');

  try {
    // Phase 1: Scrape articles from BeyondChats
    logger.info('Scraper', 'Phase 1: Scraping articles from BeyondChats blog');
    const scrapeResult = await beyondChatsScraper.scrapeOldestArticles();

    logger.info('Scraper', 'Scraping complete', {
      successful: scrapeResult.successful.length,
      failed: scrapeResult.failed.length,
    });

    if (scrapeResult.successful.length === 0) {
      logger.warn('Scraper', 'No articles were successfully scraped');
      return;
    }

    // Phase 2: Store scraped articles via API
    logger.info('Scraper', 'Phase 2: Storing articles via backend API');
    const storeResult = await apiService.storeArticles(scrapeResult.successful);

    logger.info('Scraper', 'Storage complete', {
      stored: storeResult.successful.length,
      failed: storeResult.failed.length,
    });

    // Phase 3: Enhance articles (only if OpenAI API key is configured)
    if (config.openai.apiKey) {
      logger.info('Scraper', 'Phase 3: Enhancing articles with LLM');
      await enhanceArticles(storeResult.successful);
    } else {
      logger.warn('Scraper', 'Skipping LLM enhancement - OPENAI_API_KEY not configured');
    }

    // Summary
    logger.info('Scraper', 'Scraper workflow complete', {
      articlesScraped: scrapeResult.successful.length,
      articlesStored: storeResult.successful.length,
      scrapingFailures: scrapeResult.failed.length,
      storageFailures: storeResult.failed.length,
    });

    // Log any failures for debugging
    if (scrapeResult.failed.length > 0) {
      logger.warn('Scraper', 'Scraping failures', {
        failures: scrapeResult.failed,
      });
    }

    if (storeResult.failed.length > 0) {
      logger.warn('Scraper', 'Storage failures', {
        failures: storeResult.failed.map((f) => ({
          url: f.article.source_url,
          error: f.error,
        })),
      });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Scraper', 'Scraper workflow failed', { error: errorMessage });
    throw error;
  } finally {
    // Clean up browser resources
    await browserService.close();
    logger.info('Scraper', 'Browser closed');
  }
}

/**
 * Enhance stored articles using Google search references and LLM
 * Requirements: 4.1, 4.2, 5.1, 6.1, 6.5
 */
async function enhanceArticles(
  storedArticles: Array<{ id: number; title: string; content: string }>
): Promise<void> {
  let enhancedCount = 0;
  let failedCount = 0;

  for (const article of storedArticles) {
    try {
      logger.info('Scraper', 'Enhancing article', {
        id: article.id,
        title: article.title.substring(0, 50),
      });

      // Step 1: Search Google for reference articles
      const searchResults = await googleSearchService.searchAndFilter(article.title);
      
      if (searchResults.length === 0) {
        logger.warn('Scraper', 'No reference articles found', { title: article.title });
      }

      // Step 2: Scrape reference articles
      const referenceUrls = searchResults.map((r: { url: string }) => r.url);
      const references = await referenceScraperService.scrapeMultiple(referenceUrls);

      logger.info('Scraper', 'Reference scraping complete', {
        searched: searchResults.length,
        scraped: references.length,
      });

      // Step 3: Enhance article using LLM
      const enhancedContent = await llmEnhancerService.enhanceArticle(
        { title: article.title, content: article.content },
        references
      );

      // Step 4: Store enhanced article via API
      const stored = await apiService.storeEnhancedArticle(article.id, enhancedContent);

      if (stored) {
        enhancedCount++;
        logger.info('Scraper', 'Article enhanced successfully', {
          originalId: article.id,
          enhancedId: stored.id,
        });
      } else {
        failedCount++;
        logger.error('Scraper', 'Failed to store enhanced article', {
          originalId: article.id,
        });
      }
    } catch (error) {
      failedCount++;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Scraper', 'Article enhancement failed', {
        id: article.id,
        error: errorMessage,
      });
      // Continue with next article
    }
  }

  logger.info('Scraper', 'Enhancement phase complete', {
    enhanced: enhancedCount,
    failed: failedCount,
  });
}

// Run the scraper
main()
  .then(() => {
    logger.info('Scraper', 'Scraper finished successfully');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('Scraper', 'Scraper failed', { error: error.message });
    process.exit(1);
  });
