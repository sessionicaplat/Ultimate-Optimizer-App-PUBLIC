# OpenAI Integration

This module provides integration with OpenAI's GPT-4 Turbo model for product content optimization.

## OpenAIClient

The `OpenAIClient` class handles communication with the OpenAI API, including automatic retry logic with exponential backoff.

### Usage

```typescript
import { OpenAIClient } from './openai';

// Initialize the client with your API key
const client = new OpenAIClient(process.env.OPENAI_API_KEY!);

// Optimize product content
const optimizedContent = await client.optimize({
  productTitle: 'Wireless Bluetooth Headphones',
  attribute: 'description',
  beforeValue: 'Good headphones with bluetooth',
  targetLang: 'en',
  userPrompt: 'Make it more professional and highlight key features',
});

console.log(optimizedContent);
// Output: "Premium wireless Bluetooth headphones featuring advanced noise cancellation..."
```

### Features

- **GPT-4 Turbo Model**: Uses the latest GPT-4 Turbo model for high-quality content generation
- **Automatic Retry**: Retries up to 3 times on rate limit (429) or server errors (5xx)
- **Exponential Backoff**: Uses 1s, 2s, 4s delays between retries
- **Error Handling**: Throws descriptive errors for non-retryable failures
- **Content Trimming**: Automatically trims whitespace from generated content

### Configuration

The client requires an OpenAI API key to be set in the environment:

```bash
OPENAI_API_KEY=sk-...
```

### API Reference

#### `optimize(params: OptimizeParams): Promise<string>`

Generates optimized product content using OpenAI.

**Parameters:**

- `productTitle` (string): The name of the product being optimized
- `attribute` (string): The attribute being optimized (e.g., 'title', 'description', 'seo', 'metadata')
- `beforeValue` (string): The current/original value of the attribute
- `targetLang` (string): Target language code (e.g., 'en', 'es', 'fr')
- `userPrompt` (string): Custom instructions from the user

**Returns:** Promise that resolves to the optimized content string

**Throws:** Error if the API call fails after all retries or if the response is empty

### Error Handling

The client handles different types of errors:

- **Rate Limit (429)**: Automatically retries with exponential backoff
- **Server Errors (5xx)**: Automatically retries with exponential backoff
- **Client Errors (4xx)**: Throws immediately without retry
- **Empty Response**: Throws error if OpenAI returns no content

### Testing

Run the test suite:

```bash
npm test -- openai/client.test.ts
```

The tests cover:
- Successful content generation
- Prompt construction
- Whitespace trimming
- Error handling
- Retry logic with exponential backoff
