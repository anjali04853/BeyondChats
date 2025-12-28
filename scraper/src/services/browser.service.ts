import puppeteer, { Browser, Page, PuppeteerLaunchOptions } from 'puppeteer';
import { config } from '../config';
import { logger } from '../utils/logger';

class BrowserService {
  private browser: Browser | null = null;

  async launch(): Promise<Browser> {
    if (this.browser) {
      return this.browser;
    }

    const options: PuppeteerLaunchOptions = {
      headless: config.puppeteer.headless,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
      ],
    };

    logger.info('BrowserService', 'Launching browser', { headless: config.puppeteer.headless });

    this.browser = await puppeteer.launch(options);
    return this.browser;
  }

  async newPage(): Promise<Page> {
    const browser = await this.launch();
    const page = await browser.newPage();

    await page.setUserAgent(config.puppeteer.userAgent);
    await page.setDefaultTimeout(config.puppeteer.timeout);
    await page.setViewport({ width: 1920, height: 1080 });

    return page;
  }

  async close(): Promise<void> {
    if (this.browser) {
      logger.info('BrowserService', 'Closing browser');
      await this.browser.close();
      this.browser = null;
    }
  }

  async closePage(page: Page): Promise<void> {
    if (page && !page.isClosed()) {
      await page.close();
    }
  }
}

export const browserService = new BrowserService();
