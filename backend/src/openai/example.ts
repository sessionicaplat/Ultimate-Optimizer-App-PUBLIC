/**
 * Example usage of OpenAIClient
 * This file demonstrates how to use the OpenAI integration in the worker process
 */

import { OpenAIClient } from './index';

async function exampleUsage() {
  // Initialize client with API key from environment
  const client = new OpenAIClient(process.env.OPENAI_API_KEY || '');

  try {
    // Example: Optimize a product title
    const optimizedTitle = await client.optimize({
      productTitle: 'Wireless Bluetooth Headphones',
      attribute: 'title',
      beforeValue: 'Bluetooth Headphones',
      targetLang: 'en',
      userPrompt: 'Make it more descriptive and SEO-friendly',
    });

    console.log('Original:', 'Bluetooth Headphones');
    console.log('Optimized:', optimizedTitle);

    // Example: Optimize a product description
    const optimizedDescription = await client.optimize({
      productTitle: 'Wireless Bluetooth Headphones',
      attribute: 'description',
      beforeValue: 'Good quality headphones with bluetooth connectivity.',
      targetLang: 'en',
      userPrompt: 'Highlight premium features and benefits',
    });

    console.log('\nOriginal:', 'Good quality headphones with bluetooth connectivity.');
    console.log('Optimized:', optimizedDescription);

    // Example: Optimize SEO content in Spanish
    const optimizedSEO = await client.optimize({
      productTitle: 'Auriculares Bluetooth Inalámbricos',
      attribute: 'seo',
      beforeValue: 'Auriculares bluetooth',
      targetLang: 'es',
      userPrompt: 'Crear meta descripción optimizada para SEO',
    });

    console.log('\nOriginal:', 'Auriculares bluetooth');
    console.log('Optimized:', optimizedSEO);

  } catch (error) {
    console.error('Error optimizing content:', error);
  }
}

// Uncomment to run the example
// exampleUsage();

export { exampleUsage };
