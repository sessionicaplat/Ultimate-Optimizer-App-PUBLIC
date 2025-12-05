import OpenAI from 'openai';
import type { ChatCompletion } from 'openai/resources/chat/completions';

export interface BlogIdea {
  title: string;
  description: string;
  targetAudience: string;
  hook?: string;
  format?: string;
  keywords?: string[];
}

export interface BlogContent {
  title: string;
  content: string;
  imagePrompt: string;
}

export class BlogOpenAIClient {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  /**
   * Generate 5 blog ideas based on source
   */
  async generateBlogIdeas(params: {
    sourceType: 'product' | 'keyword';
    sourceData: string;
  }): Promise<BlogIdea[]> {
    const systemPrompt = `You are an expert content strategist and blog writer. Generate compelling blog post ideas that include positioning details the marketing team can immediately act on.`;

    const userPrompt = params.sourceType === 'product'
      ? `Generate 5 blog post ideas based on this product information:\n\n${params.sourceData}\n\nEach idea should include:\n1. A compelling title\n2. A brief description (2-3 sentences)\n3. The primary target audience\n4. A short hook (why it works for the audience)\n5. A recommended article format (e.g., How-to, Comparison, Listicle)\n6. 3-5 short keyword phrases related to the idea\n\nReturn JSON in the format: {"ideas": [{"title": "...", "description": "...", "targetAudience": "...", "hook": "...", "format": "...", "keywords": ["...", "..."]}]}`
      : `Generate 5 blog post ideas for this topic or keyword:\n\n${params.sourceData}\n\nEach idea should include:\n1. A compelling title\n2. A brief description (2-3 sentences)\n3. The primary target audience\n4. A short hook (why it works for the audience)\n5. A recommended article format (e.g., How-to, Comparison, Listicle)\n6. 3-5 short keyword phrases related to the idea\n\nReturn JSON in the format: {"ideas": [{"title": "...", "description": "...", "targetAudience": "...", "hook": "...", "format": "...", "keywords": ["...", "..."]}]}`;

    const response = await this.retryWithBackoff(async () => {
      return this.client.chat.completions.create({
        model: 'gpt-5-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 1,
        max_completion_tokens: 3000, // Increased from 2000 to handle complex products
        response_format: { type: 'json_object' },
      });
    });

    const content = this.extractContentOrThrow(response, 'blog ideas');
    const parsed = JSON.parse(content);
    return parsed.ideas || parsed;
  }

  /**
   * Generate full blog post content
   */
  async generateBlogPost(params: {
    idea: BlogIdea;
    sourceType: 'product' | 'keyword';
    sourceData: string;
  }): Promise<BlogContent> {
    const systemPrompt = `You are an expert blog writer. Create engaging, SEO-optimized blog posts with proper structure and rich content.`;

    const userPrompt = `Write a complete blog post based on this idea:

Title: ${params.idea.title}
Description: ${params.idea.description}
Target Audience: ${params.idea.targetAudience}

${params.sourceType === 'product' ? `Related Product:\n${params.sourceData}` : `Topic:\n${params.sourceData}`}

Requirements:
1. Create an engaging, SEO-friendly title (can refine the original)
2. Write comprehensive content (800-1500 words) with:
   - Compelling introduction
   - Well-structured body with subheadings
   - Practical tips or insights
   - Strong conclusion with call-to-action
3. Use HTML formatting with proper tags (h2, h3, p, ul, li, strong, em)
4. Generate an image prompt for a featured blog image

Return as JSON with format:
{
  "title": "Final blog title",
  "content": "Full HTML content",
  "imagePrompt": "Detailed prompt for image generation"
}`;

    const response = await this.retryWithBackoff(async () => {
      return this.client.chat.completions.create({
        model: 'gpt-4-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 4000,
        response_format: { type: 'json_object' },
      });
    });

    const content = this.extractContentOrThrow(response, 'blog post');
    return JSON.parse(content);
  }

  /**
   * Retry function with exponential backoff
   */
  private async retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries = 3
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await fn();
      } catch (err: any) {
        lastError = err;

        const isRetryable = 
          err.status === 429 || 
          (err.status >= 500 && err.status < 600);

        if (!isRetryable || attempt === maxRetries - 1) {
          throw err;
        }

        const delayMs = Math.pow(2, attempt) * 1000;
        
        console.warn(
          `OpenAI API error (attempt ${attempt + 1}/${maxRetries}): ${err.message}. ` +
          `Retrying in ${delayMs}ms...`
        );

        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }

    throw lastError || new Error('Max retries exceeded');
  }

  /**
   * Ensure completions contain text content; mark empty payloads as retryable.
   */
  private extractContentOrThrow(
    response: ChatCompletion,
    context: string
  ): string {
    const choice = response?.choices?.[0];
    const content = choice?.message?.content?.trim();

    if (content) {
      return content;
    }

    const finishReason = choice?.finish_reason ?? 'unknown';
    const err: any = new Error(
      `OpenAI returned empty response for ${context} (finish_reason: ${finishReason})`
    );
    err.status = 503;
    err.details = {
      finishReason,
      hasToolCalls: Boolean(choice?.message?.tool_calls?.length),
    };

    // Surface extra info for debugging while still allowing retries.
    console.warn(
      `[BlogOpenAIClient] Empty OpenAI response (${context}). finish_reason=${finishReason}`
    );

    throw err;
  }
}
