import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // API Configuration
  apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:3001/api',

  // Puppeteer Configuration
  puppeteer: {
    headless: process.env.PUPPETEER_HEADLESS !== 'false',
    timeout: parseInt(process.env.PUPPETEER_TIMEOUT || '30000', 10),
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  },

  // BeyondChats Configuration
  beyondChats: {
    baseUrl: 'https://beyondchats.com',
    blogsUrl: 'https://beyondchats.com/blogs/',
    articlesToScrape: 5,
  },

  // Google Search Configuration
  googleSearch: {
    maxResults: 2,
    excludeDomains: ['beyondchats.com'],
    searchDelay: 2000, // Delay between searches to avoid rate limiting
  },

  // LLM Configuration (supports OpenAI or Groq)
  llm: {
    provider: process.env.LLM_PROVIDER || 'groq', // 'openai' or 'groq'
    apiKey: process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY || '',
    model: process.env.LLM_MODEL || 'llama-3.1-8b-instant',
    maxRetries: 3,
  },

  // OpenAI Configuration (legacy)
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
    maxRetries: 3,
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
};
