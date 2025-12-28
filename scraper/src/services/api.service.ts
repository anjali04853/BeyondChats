import axios, { AxiosInstance, AxiosError } from 'axios';
import { config } from '../config';
import { logger } from '../utils/logger';
import { ScrapedArticle } from '../types';

interface ApiArticle {
  id: number;
  title: string;
  content: string;
  author: string | null;
  publication_date: string | null;
  source_url: string;
  created_at: string;
  updated_at: string;
}

interface ApiError {
  error: string;
  message: string;
}

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: config.apiBaseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Store a scraped article via the backend API
   * @param article The scraped article to store
   * @returns The created article from the API
   */
  async storeArticle(article: ScrapedArticle): Promise<ApiArticle | null> {
    try {
      logger.info('ApiService', 'Storing article via API', {
        title: article.title.substring(0, 50),
        url: article.source_url,
      });

      const response = await this.client.post<ApiArticle>('/articles', {
        title: article.title,
        content: article.content,
        author: article.author,
        publication_date: article.publication_date,
        source_url: article.source_url,
      });

      logger.info('ApiService', 'Article stored successfully', {
        id: response.data.id,
        title: response.data.title.substring(0, 50),
      });

      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<ApiError>;
      const errorMessage = axiosError.response?.data?.message || axiosError.message || 'Unknown error';

      logger.error('ApiService', 'Failed to store article', {
        url: article.source_url,
        error: errorMessage,
        status: axiosError.response?.status,
      });

      return null;
    }
  }

  /**
   * Store multiple scraped articles via the backend API
   * @param articles Array of scraped articles to store
   * @returns Object with successful and failed article storage results
   */
  async storeArticles(articles: ScrapedArticle[]): Promise<{
    successful: ApiArticle[];
    failed: Array<{ article: ScrapedArticle; error: string }>;
  }> {
    const result = {
      successful: [] as ApiArticle[],
      failed: [] as Array<{ article: ScrapedArticle; error: string }>,
    };

    logger.info('ApiService', 'Storing batch of articles', { count: articles.length });

    for (const article of articles) {
      try {
        const stored = await this.storeArticle(article);
        if (stored) {
          result.successful.push(stored);
        } else {
          result.failed.push({
            article,
            error: 'Failed to store article',
          });
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error('ApiService', 'Article storage failed, continuing with next', {
          url: article.source_url,
          error: errorMessage,
        });
        result.failed.push({
          article,
          error: errorMessage,
        });
      }
    }

    logger.info('ApiService', 'Batch storage complete', {
      successful: result.successful.length,
      failed: result.failed.length,
    });

    return result;
  }

  /**
   * Check if an article already exists by source URL
   * @param sourceUrl The source URL to check
   * @returns True if article exists, false otherwise
   */
  async articleExists(sourceUrl: string): Promise<boolean> {
    try {
      const response = await this.client.get<{ data: ApiArticle[] }>('/articles', {
        params: { source_url: sourceUrl },
      });

      return response.data.data && response.data.data.length > 0;
    } catch (error) {
      logger.warn('ApiService', 'Failed to check article existence', {
        url: sourceUrl,
      });
      return false;
    }
  }
}

export const apiService = new ApiService();
