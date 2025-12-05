import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OpenAIClient, OptimizeParams } from './client';

// Create a mock create function that we can control
const mockCreate = vi.fn();

// Mock the OpenAI module
vi.mock('openai', () => {
  return {
    default: class MockOpenAI {
      chat = {
        completions: {
          create: mockCreate,
        },
      };
    },
  };
});

describe('OpenAIClient', () => {
  let client: OpenAIClient;

  beforeEach(() => {
    vi.clearAllMocks();
    client = new OpenAIClient('test-api-key');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockParams: OptimizeParams = {
    productTitle: 'Test Product',
    attribute: 'title',
    beforeValue: 'Old Title',
    targetLang: 'en',
    userPrompt: 'Make it more engaging',
  };

  describe('optimize', () => {
    it('should generate optimized content successfully', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: '  Optimized Title  ',
            },
          },
        ],
      };

      mockCreate.mockResolvedValueOnce(mockResponse);

      const result = await client.optimize(mockParams);

      expect(result).toBe('Optimized Title');
      expect(mockCreate).toHaveBeenCalledWith({
        model: 'gpt-4-turbo',
        messages: [
          {
            role: 'system',
            content: expect.stringContaining('expert e-commerce copywriter'),
          },
          {
            role: 'user',
            content: expect.stringContaining('Test Product'),
          },
        ],
        temperature: 0.6,
        max_tokens: 1000,
      });
    });

    it('should include target language in system prompt', async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: 'Result' } }],
      });

      await client.optimize({ ...mockParams, targetLang: 'es' });

      const systemPrompt = mockCreate.mock.calls[0][0].messages[0].content;
      expect(systemPrompt).toContain('Target language: es');
    });

    it('should include product info and custom prompt in user prompt', async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: 'Result' } }],
      });

      await client.optimize(mockParams);

      const userPrompt = mockCreate.mock.calls[0][0].messages[1].content;
      expect(userPrompt).toContain('Product: Test Product');
      expect(userPrompt).toContain('Field to optimize: title');
      expect(userPrompt).toContain('Old Title');
      expect(userPrompt).toContain('Make it more engaging');
    });

    it('should trim whitespace from response', async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: '\n\n  Result with spaces  \n\n' } }],
      });

      const result = await client.optimize(mockParams);

      expect(result).toBe('Result with spaces');
    });

    it('should throw error if response is empty', async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: null } }],
      });

      await expect(client.optimize(mockParams)).rejects.toThrow(
        'OpenAI returned empty response'
      );
    });

    it('should throw error if choices array is empty', async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [],
      });

      await expect(client.optimize(mockParams)).rejects.toThrow(
        'OpenAI returned empty response'
      );
    });
  });

  describe('retry logic with exponential backoff', () => {
    it('should retry on 429 rate limit error', async () => {
      const rateLimitError = Object.assign(new Error('Rate limit exceeded'), {
        status: 429,
      });

      // First two calls fail with 429, third succeeds
      mockCreate
        .mockRejectedValueOnce(rateLimitError)
        .mockRejectedValueOnce(rateLimitError)
        .mockResolvedValueOnce({
          choices: [{ message: { content: 'Success after retry' } }],
        });

      const result = await client.optimize(mockParams);

      expect(result).toBe('Success after retry');
      expect(mockCreate).toHaveBeenCalledTimes(3);
    });

    it('should retry on 5xx server errors', async () => {
      const serverError = Object.assign(new Error('Internal server error'), {
        status: 500,
      });

      mockCreate
        .mockRejectedValueOnce(serverError)
        .mockResolvedValueOnce({
          choices: [{ message: { content: 'Success after retry' } }],
        });

      const result = await client.optimize(mockParams);

      expect(result).toBe('Success after retry');
      expect(mockCreate).toHaveBeenCalledTimes(2);
    });

    it('should not retry on 4xx client errors (except 429)', async () => {
      const clientError = Object.assign(new Error('Bad request'), {
        status: 400,
      });

      mockCreate.mockRejectedValueOnce(clientError);

      await expect(client.optimize(mockParams)).rejects.toThrow('Bad request');
      expect(mockCreate).toHaveBeenCalledTimes(1);
    });

    it('should throw error after max retries', async () => {
      const rateLimitError = Object.assign(new Error('Rate limit exceeded'), {
        status: 429,
      });

      mockCreate.mockRejectedValue(rateLimitError);

      await expect(client.optimize(mockParams)).rejects.toThrow(
        'Rate limit exceeded'
      );
      expect(mockCreate).toHaveBeenCalledTimes(3);
    });

    it('should use exponential backoff delays', async () => {
      const rateLimitError = Object.assign(new Error('Rate limit'), {
        status: 429,
      });

      const startTime = Date.now();
      
      mockCreate
        .mockRejectedValueOnce(rateLimitError)
        .mockRejectedValueOnce(rateLimitError)
        .mockResolvedValueOnce({
          choices: [{ message: { content: 'Success' } }],
        });

      await client.optimize(mockParams);

      const elapsed = Date.now() - startTime;
      
      // Should have waited approximately 1s + 2s = 3s
      // Allow some tolerance for execution time
      expect(elapsed).toBeGreaterThanOrEqual(2900);
      expect(elapsed).toBeLessThan(4000);
    });
  });
});
