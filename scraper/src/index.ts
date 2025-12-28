import { beyondChatsScraper } from './services/beyondchats-scraper.service';
import { apiService } from './services/api.service';
import { browserService } from './services/browser.service';
import { logger } from './utils/logger';

/**
 * Main scraper workflow:
 * 1. Scrape the 5 oldest articles from BeyondChats blog
 * 2. Store them via the backend API
 */
async function main(): Promise<void> {
  logger.info('Scraper', 'Starting BeyondChats article scraper');

  try {
    // Step 1: Scrape articles from BeyondChats
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

    // Step 2: Store scraped articles via API
    logger.info('Scraper', 'Phase 2: Storing articles via backend API');
    const storeResult = await apiService.storeArticles(scrapeResult.successful);

    logger.info('Scraper', 'Storage complete', {
      stored: storeResult.successful.length,
      failed: storeResult.failed.length,
    });

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
