export interface Article {
  id: number;
  title: string;
  content: string;
  author: string | null;
  publication_date: string | null;
  source_url: string;
  created_at: string;
  updated_at: string;
}

export interface EnhancedArticle {
  id: number;
  original_article_id: number;
  enhanced_content: string;
  reference_urls: string[];
  enhancement_date: string;
  created_at: string;
  updated_at: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ArticlesResponse {
  data: Article[];
  pagination: PaginationMeta;
}
