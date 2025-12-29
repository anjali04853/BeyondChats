import { browserService } from './browser.service';
import { logger } from '../utils/logger';
import { ReferenceContent, ScrapeResult } from '../types';

class ReferenceScraperService {
  /**
   * Scrape main content from a reference URL
   */
  async scrapeContent(url: string): Promise<ScrapeResult<ReferenceContent>> {
    const page = await browserService.newPage();
    try {
      logger.info('ReferenceScraperService', 'Scraping reference article', { url });
      
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      await page.waitForSelector('body', { timeout: 10000 });

      const content = await page.evaluate((sourceUrl: string) => {
        // Title extraction - try multiple selectors
        const titleSelectors = [
          'h1',
          '.entry-title',
          '.post-title',
          '.article-title',
          '[class*="title"]',
          'article h1',
          '.blog-title',
          'header h1',
          '[itemprop="headline"]',
        ];
        
        let title = '';
        for (const selector of titleSelectors) {
          const el = document.querySelector(selector);
          if (el?.textContent?.trim()) {
            title = el.textContent.trim();
            break;
          }
        }

        // Content extraction - try multiple selectors
        const contentSelectors = [
          'article',
          '.entry-content',
          '.post-content',
          '.article-content',
          '.blog-content',
          '[class*="content"]',
          '.prose',
          'main',
          '.main-content',
          '[itemprop="articleBody"]',
        ];
        
        let articleContent = '';
        for (const selector of contentSelectors) {
          const el = document.querySelector(selector);
          if (el) {
            // Get text content, removing script and style elements
            const clone = el.cloneNode(true) as Element;
            clone.querySelectorAll('script, style, nav, header, footer, aside').forEach(e => e.remove());
            const text = clone.textContent?.trim() || '';
            
            if (text.length > 200) {
              articleContent = text;
              break;
            }
          }
        }

        // Fallback: get body text if no content found
        if (!articleContent) {
          const body = document.body.cloneNode(true) as Element;
          body.querySelectorAll('script, style, nav, header, footer, aside').forEach(e => e.remove());
          articleContent = body.textContent?.trim() || '';
        }

        return {
          title,
          content: articleContent,
          source_url: sourceUrl,
        };
      }, url);

      // Validate required fields
      if (!content.title || !content.content) {
        logger.warn('ReferenceScraperService', 'Missing required fields', { 
          url, 
          hasTitle: !!content.title, 
          hasContent: !!content.content 
        });
        return { 
          success: false, 
          error: 'Missing required fields: title or content' 
        };
      }

      // Truncate content if too long (to avoid token limits later)
      const maxContentLength = 10000;
      if (content.content.length > maxContentLength) {
        content.content = content.content.substring(0, maxContentLength) + '...';
      }

      logger.info('ReferenceScraperService', 'Successfully scraped reference', {
        url,
        titleLength: content.title.length,
        contentLength: content.content.length,
      });

      return { success: true, data: content };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('ReferenceScraperService', 'Failed to scrape reference', { 
        url, 
        error: errorMessage 
      });
      return { success: false, error: errorMessage };
    } finally {
      await browserService.closePage(page);
    }
  }

  /**
   * Scrape multiple reference URLs, returning successful results
   */
  async scrapeMultiple(urls: string[]): Promise<ReferenceContent[]> {
    const results: ReferenceContent[] = [];
    
    logger.info('ReferenceScraperService', 'Scraping multiple references', { 
      count: urls.length 
    });

    for (const url of urls) {
      try {
        const result = await this.scrapeContent(url);
        if (result.success && result.data) {
          results.push(result.data);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error('ReferenceScraperService', 'Reference scrape failed, continuing', {
          url,
          error: errorMessage,
        });
        // Continue with next URL
      }
    }

    logger.info('ReferenceScraperService', 'Multiple scrape complete', {
      attempted: urls.length,
      successful: results.length,
    });

    return results;
  }
}

export const referenceScraperService = new ReferenceScraperService();
