import OpenAI from 'openai';
import { config } from '../config';
import { logger } from '../utils/logger';
import { ReferenceContent, EnhancedContent } from '../types';

class LLMEnhancerService {
  private client: OpenAI;
  private readonly maxRetries = config.openai.maxRetries;
  private readonly model = config.openai.model;

  constructor() {
    this.client = new OpenAI({
      apiKey: config.openai.apiKey,
    });
  }

  /**
   * Enhance an article using LLM with reference articles
   * Requirements: 6.1, 6.2, 6.3
   */
  async enhanceArticle(
    original: { title: string; content: string },
    references: ReferenceContent[]
  ): Promise<EnhancedContent> {
    const prompt = this.buildEnhancementPrompt(original, references);
    
    logger.info('LLMEnhancerService', 'Enhancing article', {
      title: original.title,
      referenceCount: references.length,
    });

    const enhancedContent = await this.callWithRetry(prompt);
    const contentWithCitations = this.formatWithCitations(enhancedContent, references);

    return {
      enhanced_content: contentWithCitations,
      reference_urls: references.map((r) => r.source_url),
    };
  }

  /**
   * Build the enhancement prompt
   * Requirements: 6.1, 6.2, 6.3
   */
  private buildEnhancementPrompt(
    original: { title: string; content: string },
    references: ReferenceContent[]
  ): string {
    let prompt = `You are a content enhancement specialist. Your task is to improve the following article while maintaining its original topic and message.

## Original Article
Title: ${original.title}

Content:
${original.content}

`;

    if (references.length > 0) {
      prompt += `## Reference Articles for Context
The following articles cover similar topics and can provide additional insights:

`;
      references.forEach((ref, index) => {
        prompt += `### Reference ${index + 1}: ${ref.title}
${ref.content.substring(0, 2000)}${ref.content.length > 2000 ? '...' : ''}

`;
      });
    }

    prompt += `## Instructions
1. Improve the article's structure and formatting
2. Enhance clarity and readability
3. Incorporate relevant insights from the reference articles where appropriate
4. Maintain the original article's core message and topic
5. Use proper headings, bullet points, and paragraphs for better organization
6. Keep the tone professional and engaging

Please provide the enhanced article content only, without any meta-commentary.`;

    return prompt;
  }


  /**
   * Call OpenAI API with retry logic
   * Requirements: 6.6
   */
  private async callWithRetry(prompt: string): Promise<string> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        logger.info('LLMEnhancerService', 'API call attempt', { attempt, maxRetries: this.maxRetries });

        const response = await this.client.chat.completions.create({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: 'You are a professional content editor who enhances articles while preserving their original meaning.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 4000,
        });

        const content = response.choices[0]?.message?.content;
        if (!content) {
          throw new Error('Empty response from OpenAI API');
        }

        logger.info('LLMEnhancerService', 'API call successful', { attempt });
        return content;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        logger.warn('LLMEnhancerService', 'API call failed', {
          attempt,
          error: lastError.message,
        });

        if (attempt < this.maxRetries) {
          // Exponential backoff: 1s, 2s, 4s
          const delay = Math.pow(2, attempt - 1) * 1000;
          logger.info('LLMEnhancerService', 'Retrying after delay', { delay });
          await this.delay(delay);
        }
      }
    }

    logger.error('LLMEnhancerService', 'All retry attempts exhausted', {
      error: lastError?.message,
    });
    throw lastError || new Error('LLM API call failed after all retries');
  }

  /**
   * Format enhanced content with citations at the bottom
   * Requirements: 6.4
   */
  formatWithCitations(content: string, references: ReferenceContent[]): string {
    if (references.length === 0) {
      return content;
    }

    let formattedContent = content.trim();
    formattedContent += '\n\n---\n\n## References\n\n';

    references.forEach((ref, index) => {
      formattedContent += `${index + 1}. [${ref.title}](${ref.source_url})\n`;
    });

    return formattedContent;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const llmEnhancerService = new LLMEnhancerService();
