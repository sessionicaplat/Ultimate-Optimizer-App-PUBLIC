import OpenAI from 'openai';

export interface OptimizeParams {
  productTitle: string;
  attribute: string;
  beforeValue: string;
  targetLang: string;
  userPrompt: string;
}

export class OpenAIClient {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  /**
   * Optimize product content using OpenAI GPT-4 Turbo
   * @param params - Optimization parameters including product info and prompts
   * @returns Optimized content string
   */
  async optimize(params: OptimizeParams): Promise<string> {
    const systemPrompt = this.buildSystemPrompt(params.targetLang);
    const userPrompt = this.buildUserPrompt(params);

    const response = await this.retryWithBackoff(async () => {
      return this.client.chat.completions.create({
        model: 'gpt-5-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 1,
        max_completion_tokens: 1000,
      });
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('OpenAI returned empty response');
    }

    // Remove surrounding quotes that AI sometimes adds
    let cleanedContent = content.trim();
    
    // Remove leading and trailing quotes (both single and double)
    if ((cleanedContent.startsWith('"') && cleanedContent.endsWith('"')) ||
        (cleanedContent.startsWith("'") && cleanedContent.endsWith("'"))) {
      cleanedContent = cleanedContent.slice(1, -1).trim();
    }

    return cleanedContent;
  }

  /**
   * Build system prompt with target language and instructions
   */
  private buildSystemPrompt(targetLang: string): string {
    return `You are an expert e-commerce copywriter. 
Optimize only the requested field for the product.
Target language: ${targetLang}
Maintain brand tone and accuracy.
Return only the optimized text without quotes or explanations.
Do not wrap the output in quotation marks.`;
  }

  /**
   * Build user prompt with product info and custom prompt
   */
  private buildUserPrompt(params: OptimizeParams): string {
    return `Product: ${params.productTitle}
Field to optimize: ${params.attribute}
Current value:
"""
${params.beforeValue}
"""

Additional instructions:
"""
${params.userPrompt}
"""

Provide the optimized ${params.attribute}:`;
  }

  /**
   * Retry function with exponential backoff
   * Retries up to 3 times on rate limit (429) or 5xx errors
   * Uses exponential backoff: 1s, 2s, 4s
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

        // Check if error is retryable (429 or 5xx)
        const isRetryable = 
          err.status === 429 || 
          (err.status >= 500 && err.status < 600);

        // If not retryable or last attempt, throw immediately
        if (!isRetryable || attempt === maxRetries - 1) {
          throw err;
        }

        // Calculate exponential backoff delay: 1s, 2s, 4s
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
}
