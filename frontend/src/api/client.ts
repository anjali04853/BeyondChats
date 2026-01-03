import axios from 'axios';
import { Article, EnhancedArticle, ArticlesResponse } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const articlesApi = {
  getAll: async (page = 1, limit = 10): Promise<ArticlesResponse> => {
    const response = await apiClient.get<{ articles: Article[]; pagination: ArticlesResponse['pagination'] }>('/articles', {
      params: { page, limit },
    });
    return { data: response.data.articles, pagination: response.data.pagination };
  },

  getById: async (id: number): Promise<Article> => {
    const response = await apiClient.get<Article>(`/articles/${id}`);
    return response.data;
  },

  getEnhanced: async (id: number): Promise<EnhancedArticle | null> => {
    try {
      const response = await apiClient.get<EnhancedArticle>(`/articles/${id}/enhanced`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },
};

export default apiClient;
