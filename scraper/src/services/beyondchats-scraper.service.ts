import { browserService } from './browser.service';
import { config } from '../config';
import { logger } from '../utils/logger';
import { ScrapedArticle, ArticleLink, ScrapeResult, BatchScrapeResult } from '../types';

class BeyondChatsScraper {
  private readonly blogsUrl = config.beyondChats.blogsUrl;
  private readonly articlesToScrape = config.beyondChats.articlesToScrape;

  async getLastPageUrl(): Promise<string> {
    const page = await browserService.newPage();
    try {
      logger.info('BeyondChatsScraper', 'Navigating to blogs page', { url: this.blogsUrl });
      await page.goto(this.blogsUrl, { waitUntil: 'networkidle2' });
      await page.waitForSelector('body', { timeout: 10000 });
      const lastPageUrl = await page.evaluate(() => {
        const paginationSelectors = ['.pagination', '.wp-pagenavi', '.page-numbers', 'nav[aria-label*="pagination"]', '.nav-links', '[class*="pagination"]'];
        let paginationContainer: Element | null = null;
        for (const selector of paginationSelectors) { paginationContainer = document.querySelector(selector); if (paginationContainer) break; }
        if (!paginationContainer) {
          const allLinks = Array.from(document.querySelectorAll('a'));
          const pageLinks = allLinks.filter((link) => { const href = link.getAttribute('href') || ''; return href.includes('/page/') || href.includes('?page=') || href.includes('paged='); });
          if (pageLinks.length > 0) {
            let maxPage = 1; let maxPageUrl = '';
            pageLinks.forEach((link) => { const href = link.getAttribute('href') || ''; const pageMatch = href.match(/\/page\/(\d+)/); if (pageMatch) { const pageNum = parseInt(pageMatch[1], 10); if (pageNum > maxPage) { maxPage = pageNum; maxPageUrl = href; } } });
            if (maxPageUrl) return maxPageUrl;
          }
          return null;
        }
        const pageLinks = paginationContainer.querySelectorAll('a');
        let maxPage = 1; let maxPageUrl = '';
        pageLinks.forEach((link) => { const href = link.getAttribute('href') || ''; const text = link.textContent?.trim() || ''; if (text.toLowerCase().includes('last') || text === '>>' || text === '\u00BB') { maxPageUrl = href; maxPage = Infinity; return; } const pageMatch = href.match(/\/page\/(\d+)/); if (pageMatch) { const pageNum = parseInt(pageMatch[1], 10); if (pageNum > maxPage) { maxPage = pageNum; maxPageUrl = href; } } const numText = parseInt(text, 10); if (!isNaN(numText) && numText > maxPage) { maxPage = numText; maxPageUrl = href; } });
        return maxPageUrl || null;
      });
      if (!lastPageUrl) { logger.warn('BeyondChatsScraper', 'No pagination found, using current page as last page'); return this.blogsUrl; }
      const absoluteUrl = lastPageUrl.startsWith('http') ? lastPageUrl : new URL(lastPageUrl, config.beyondChats.baseUrl).href;
      logger.info('BeyondChatsScraper', 'Found last page URL', { url: absoluteUrl });
      return absoluteUrl;
    } catch (error) { const errorMessage = error instanceof Error ? error.message : 'Unknown error'; logger.error('BeyondChatsScraper', 'Failed to get last page URL', { error: errorMessage }); throw error; } finally { await browserService.closePage(page); }
  }

  async extractArticleLinks(pageUrl: string, count: number = this.articlesToScrape): Promise<ArticleLink[]> {
    const page = await browserService.newPage();
    try {
      logger.info('BeyondChatsScraper', 'Extracting article links from page', { url: pageUrl, count });
      await page.goto(pageUrl, { waitUntil: 'networkidle2' });
      await page.waitForSelector('body', { timeout: 10000 });
      const articleLinks = await page.evaluate(() => {
        const articleSelectors = ['article', '.post', '.blog-post', '.entry', '[class*="article"]', '[class*="post"]', '.card'];
        let articles: Element[] = [];
        for (const selector of articleSelectors) { const found = Array.from(document.querySelectorAll(selector)); if (found.length > 0) { articles = found; break; } }
        if (articles.length === 0) {
          const mainContent = document.querySelector('main, .main, #main, .content, #content');
          if (mainContent) { const links = Array.from(mainContent.querySelectorAll('a')); return links.filter((link) => { const href = link.getAttribute('href') || ''; return href.includes('/blog/') || href.includes('/blogs/') || href.includes('/article/') || href.includes('/post/'); }).map((link) => ({ url: link.getAttribute('href') || '', title: link.textContent?.trim() || undefined })); }
        }
        return articles.map((article) => { const link = article.querySelector('a[href]'); const titleEl = article.querySelector('h1, h2, h3, .title, [class*="title"]'); return { url: link?.getAttribute('href') || '', title: titleEl?.textContent?.trim() || link?.textContent?.trim() || undefined }; });
      });
      const validLinks = articleLinks.filter((link) => link.url && link.url.length > 0).map((link) => ({ ...link, url: link.url.startsWith('http') ? link.url : new URL(link.url, config.beyondChats.baseUrl).href }));
      const oldestArticles = validLinks.slice(-count);
      logger.info('BeyondChatsScraper', 'Extracted article links', { total: validLinks.length, selected: oldestArticles.length });
      return oldestArticles;
    } catch (error) { const errorMessage = error instanceof Error ? error.message : 'Unknown error'; logger.error('BeyondChatsScraper', 'Failed to extract article links', { error: errorMessage }); throw error; } finally { await browserService.closePage(page); }
  }

  async scrapeArticleContent(articleUrl: string): Promise<ScrapeResult<ScrapedArticle>> {
    const page = await browserService.newPage();
    try {
      logger.info('BeyondChatsScraper', 'Scraping article content', { url: articleUrl });
      await page.goto(articleUrl, { waitUntil: 'networkidle2' });
      await page.waitForSelector('body', { timeout: 10000 });
      const articleData = await page.evaluate((sourceUrl: string) => {
        const titleSelectors = ['h1', '.entry-title', '.post-title', '[class*="title"]', 'article h1', '.blog-title'];
        let title = ''; for (const selector of titleSelectors) { const el = document.querySelector(selector); if (el?.textContent?.trim()) { title = el.textContent.trim(); break; } }
        const contentSelectors = ['.entry-content', '.post-content', '.article-content', '.blog-content', '[class*="content"]', 'article', '.prose'];
        let content = ''; for (const selector of contentSelectors) { const el = document.querySelector(selector); if (el?.textContent?.trim() && el.textContent.trim().length > 100) { content = el.textContent.trim(); break; } }
        const authorSelectors = ['.author', '.author-name', '[class*="author"]', '[rel="author"]', '.byline', '.meta-author'];
        let author: string | null = null; for (const selector of authorSelectors) { const el = document.querySelector(selector); if (el?.textContent?.trim()) { author = el.textContent.trim(); break; } }
        const dateSelectors = ['time[datetime]', '.date', '.published', '.post-date', '[class*="date"]', '.meta-date'];
        let publicationDate: string | null = null; for (const selector of dateSelectors) { const el = document.querySelector(selector); if (el) { const datetime = el.getAttribute('datetime'); if (datetime) { publicationDate = datetime; break; } if (el.textContent?.trim()) { publicationDate = el.textContent.trim(); break; } } }
        return { title, content, author, publication_date: publicationDate, source_url: sourceUrl };
      }, articleUrl);
      if (!articleData.title || !articleData.content) { return { success: false, error: 'Missing required fields: title or content' }; }
      logger.info('BeyondChatsScraper', 'Successfully scraped article', { title: articleData.title.substring(0, 50), contentLength: articleData.content.length });
      return { success: true, data: articleData };
    } catch (error) { const errorMessage = error instanceof Error ? error.message : 'Unknown error'; logger.error('BeyondChatsScraper', 'Failed to scrape article content', { url: articleUrl, error: errorMessage }); return { success: false, error: errorMessage }; } finally { await browserService.closePage(page); }
  }

  async scrapeArticlesBatch(articleLinks: ArticleLink[]): Promise<BatchScrapeResult> {
    const result: BatchScrapeResult = { successful: [], failed: [] };
    logger.info('BeyondChatsScraper', 'Starting batch scrape', { count: articleLinks.length });
    for (const link of articleLinks) {
      try { const scrapeResult = await this.scrapeArticleContent(link.url); if (scrapeResult.success && scrapeResult.data) { result.successful.push(scrapeResult.data); } else { result.failed.push({ url: link.url, error: scrapeResult.error || 'Unknown error' }); } }
      catch (error) { const errorMessage = error instanceof Error ? error.message : 'Unknown error'; logger.error('BeyondChatsScraper', 'Article scrape failed, continuing with next', { url: link.url, error: errorMessage }); result.failed.push({ url: link.url, error: errorMessage }); }
    }
    logger.info('BeyondChatsScraper', 'Batch scrape complete', { successful: result.successful.length, failed: result.failed.length });
    return result;
  }

  async scrapeOldestArticles(): Promise<BatchScrapeResult> {
    try {
      const lastPageUrl = await this.getLastPageUrl();
      const articleLinks = await this.extractArticleLinks(lastPageUrl, this.articlesToScrape);
      if (articleLinks.length === 0) { logger.warn('BeyondChatsScraper', 'No articles found on the last page'); return { successful: [], failed: [] }; }
      return await this.scrapeArticlesBatch(articleLinks);
    } catch (error) { const errorMessage = error instanceof Error ? error.message : 'Unknown error'; logger.error('BeyondChatsScraper', 'Failed to scrape oldest articles', { error: errorMessage }); throw error; }
  }
}

export const beyondChatsScraper = new BeyondChatsScraper();
