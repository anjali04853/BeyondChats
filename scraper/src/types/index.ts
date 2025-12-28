export interface ScrapedArticle {
  title: string;
  content: string;
  author: string | null;
  publication_date: string | null;
  source_url: string;
}

export interface ReferenceContent {
  title: string;
  content: string;
  source_url: string;
}

export interface EnhancedContent {
  enhanced_content: string;
  reference_urls: string[];
}

export interface ArticleLink {
  url: string;
  title?: string;
}

export interface ScrapeResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface BatchScrapeResult {
  successful: ScrapedArticle[];
  failed: Array<{ url: string; error: string }>;
}

export interface SearchResult {
  title: string;
  url: string;
  snippet?: string;
}

export interface GoogleSearchResult {
  results: SearchResult[];
  query: string;
}
