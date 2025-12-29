import { browserService } from './browser.service';
import { config } from '../config';
import { logger } from '../utils/logger';
import { SearchResult, GoogleSearchResult } from '../types';

class GoogleSearchService {
  private readonly maxResults = config.googleSearch.maxResults;
  private readonly excludeDomains = config.googleSearch.excludeDomains;
  private readonly searchDelay = config.googleSearch.searchDelay;

  async searchArticleTitle(title: string): Promise<GoogleSearchResult> {
    const page = await browserService.newPage();
    try {
      const query = encodeURIComponent(title);
      const searchUrl = `https://www.google.com/search?q=${query}`;
      logger.info('GoogleSearchService', 'Searching Google', { title, url: searchUrl });
      await page.goto(searchUrl, { waitUntil: 'networkidle2' });
      await page.waitForSelector('body', { timeout: 10000 });
      await this.delay(this.searchDelay);
      const results = await page.evaluate(() => {
        const searchResults: Array<{ title: string; url: string; snippet?: string }> = [];
        const resultSelectors = ['div.g', '[data-sokoban-container]', '.tF2Cxc'];
        let resultElements: Element[] = [];
        for (const selector of resultSelectors) {
          const found = Array.from(document.querySelectorAll(selector));
          if (found.length > 0) { resultElements = found; break; }
        }
        resultElements.forEach((result) => {
          const linkEl = result.querySelector('a[href^="http"]');
          const titleEl = result.querySelector('h3');
          const snippetEl = result.querySelector('.VwiC3b, .IsZvec, .s3v9rd');
          if (linkEl && titleEl) {
            const url = linkEl.getAttribute('href') || '';
            const title = titleEl.textContent?.trim() || '';
            const snippet = snippetEl?.textContent?.trim();
            if (url && title && !url.includes('google.com')) {
              searchResults.push({ title, url, snippet });
            }
          }
        });
        return searchResults;
      });
      logger.info('GoogleSearchService', 'Search complete', { query: title, resultsFound: results.length });
      return { results, query: title };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('GoogleSearchService', 'Search failed', { title, error: errorMessage });
      return { results: [], query: title };
    } finally {
      await browserService.closePage(page);
    }
  }

  filterBlogResults(results: SearchResult[]): SearchResult[] {
    const filtered = results.filter((result) => {
      const isExcluded = this.excludeDomains.some((domain) => result.url.toLowerCase().includes(domain.toLowerCase()));
      if (isExcluded) return false;
      const url = result.url.toLowerCase();
      const isBlogLike = url.includes('/blog') || url.includes('/article') || url.includes('/post') ||
        url.includes('/news') || url.includes('/story') || url.includes('/guide') ||
        url.includes('/how-to') || url.includes('/what-is') || url.includes('/tips') ||
        (!url.includes('/product') && !url.includes('/pricing') && !url.includes('/login') && !url.includes('/signup') && !url.includes('/cart'));
      return isBlogLike;
    });
    return filtered.slice(0, this.maxResults);
  }

  async searchAndFilter(title: string): Promise<SearchResult[]> {
    const searchResult = await this.searchArticleTitle(title);
    const filtered = this.filterBlogResults(searchResult.results);
    logger.info('GoogleSearchService', 'Filtered results', { query: title, totalResults: searchResult.results.length, filteredResults: filtered.length });
    if (filtered.length === 0) { logger.warn('GoogleSearchService', 'No suitable blog results found', { query: title }); }
    return filtered;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const googleSearchService = new GoogleSearchService();
