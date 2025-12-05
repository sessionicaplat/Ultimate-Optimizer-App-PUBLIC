import { Router, Request, Response } from 'express';
import { verifyInstance } from '../auth/verifyInstance';
import { getAppInstance } from '../db/appInstances';
import {
  createBlogGeneration,
  getBlogGenerations,
  getBlogGeneration,
  updateBlogGeneration,
  getPendingBlogGenerationsCount,
} from '../db/blogGenerations';
import { notifyBlogGenerationCreated } from '../workers/blogGenerationWorker';
import { BlogOpenAIClient, type BlogIdea } from '../openai/blogClient';
import { createWixClient } from '../wix/sdkClient';
import { getInstanceToken } from '../wix/tokenHelper';

const router = Router();

/**
 * POST /api/blog-generation
 * Create a new blog generation request
 */
router.post('/api/blog-generation', verifyInstance, async (req: Request, res: Response) => {
  try {
    const { instanceId } = req.wixInstance!;
    const { sourceType, sourceId, sourceData, selectedIdea } = req.body;

    // Check queue size to prevent overload
    const QUEUE_SIZE_LIMIT = 10000;
    const queueSize = await getPendingBlogGenerationsCount();
    
    if (queueSize >= QUEUE_SIZE_LIMIT) {
      res.status(503).json({
        error: 'Service busy',
        message: 'Too many pending blog generations. Please try again later.',
        queueSize,
        estimatedWaitMinutes: Math.ceil(queueSize / 50) // 50 per minute capacity
      });
      return;
    }

    // Validate request
    if (!sourceType || !['product', 'keyword'].includes(sourceType)) {
      res.status(400).json({
        error: 'Validation failed',
        message: 'sourceType must be either "product" or "keyword"'
      });
      return;
    }

    if (sourceType === 'product' && !sourceId) {
      res.status(400).json({
        error: 'Validation failed',
        message: 'sourceId is required for product source type'
      });
      return;
    }

    let initialIdea: BlogIdea | null = null;
    if (selectedIdea) {
      const validationError = validateSelectedIdea(selectedIdea);
      if (validationError) {
        res.status(400).json({
          error: 'Validation failed',
          message: validationError,
        });
        return;
      }
      initialIdea = normalizeSelectedIdea(selectedIdea);
    }

    // Check credits (25 credits per blog generation)
    const BLOG_GENERATION_CREDITS = 25;
    const instance = await getAppInstance(instanceId);
    
    if (!instance) {
      res.status(404).json({
        error: 'Instance not found',
        message: 'App instance not found'
      });
      return;
    }

    const remainingCredits = instance.credits_total - instance.credits_used_month;

    if (remainingCredits < BLOG_GENERATION_CREDITS) {
      res.status(402).json({
        error: 'Insufficient credits',
        message: `You need ${BLOG_GENERATION_CREDITS} credits but only have ${remainingCredits} remaining.`,
        required: BLOG_GENERATION_CREDITS,
        remaining: remainingCredits
      });
      return;
    }

    // Create blog generation
    const blogGeneration = await createBlogGeneration({
      instanceId,
      sourceType,
      sourceId,
    });

    if (initialIdea) {
      await updateBlogGeneration(blogGeneration.id, {
        blog_ideas: [initialIdea],
        selected_idea_index: 0,
      });
    }

    console.log(`[Blog Generation] Created: ${blogGeneration.id} for instance ${instanceId}`);

    // Notify worker
    notifyBlogGenerationCreated();

    res.status(201).json({
      id: blogGeneration.id,
      status: blogGeneration.status,
      requiredCredits: BLOG_GENERATION_CREDITS,
      remainingCredits: remainingCredits - BLOG_GENERATION_CREDITS,
    });
  } catch (error: any) {
    console.error('[Blog Generation] Error creating:', error);
    
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to create blog generation',
      details: error.message
    });
  }
});

/**
 * POST /api/blog-generation/ideas
 * Generate preview blog ideas without creating a job
 */
router.post('/api/blog-generation/ideas', verifyInstance, async (req: Request, res: Response) => {
  try {
    const { instanceId } = req.wixInstance!;
    const { sourceType, sourceId, keyword } = req.body;

    if (!sourceType || !['product', 'keyword'].includes(sourceType)) {
      res.status(400).json({
        error: 'Validation failed',
        message: 'sourceType must be either "product" or "keyword"',
      });
      return;
    }

    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      res.status(500).json({
        error: 'OpenAI configuration missing',
        message: 'OPENAI_API_KEY must be configured to generate ideas',
      });
      return;
    }

    let sourceData = '';

    if (sourceType === 'product') {
      if (!sourceId) {
        res.status(400).json({
          error: 'Validation failed',
          message: 'sourceId is required for product source type',
        });
        return;
      }

      const instance = await getAppInstance(instanceId);

      if (!instance) {
        res.status(404).json({
          error: 'Instance not found',
          message: 'App instance not found',
        });
        return;
      }

      if (!instance.access_token || !instance.refresh_token) {
        res.status(400).json({
          error: 'Invalid instance tokens',
          message: 'App instance does not have valid access tokens. Please reinstall the app.',
        });
        return;
      }

      try {
        const accessToken = await getInstanceToken(instanceId);
        const wixClient = createWixClient(accessToken);
        const product = await wixClient.getProduct(sourceId);

        if (!product) {
          res.status(404).json({
            error: 'Product not found',
            message: 'Unable to load product details for idea generation',
          });
          return;
        }

        sourceData = formatProductForIdeas(product);
      } catch (wixError: any) {
        console.error('[Blog Generation] Failed to load product for ideas:', wixError);
        res.status(502).json({
          error: 'Product fetch failed',
          message: wixError.message || 'Unable to fetch product details from Wix',
        });
        return;
      }
    } else {
      const keywordValue = typeof keyword === 'string' ? keyword.trim() : '';

      if (!keywordValue) {
        res.status(400).json({
          error: 'Validation failed',
          message: 'keyword is required when sourceType is "keyword"',
        });
        return;
      }

      sourceData = keywordValue;
    }

    const blogClient = new BlogOpenAIClient(openaiApiKey);
    const ideas = await blogClient.generateBlogIdeas({
      sourceType,
      sourceData,
    });

    res.json({
      ideas,
    });
  } catch (error: any) {
    console.error('[Blog Generation] Error generating quick ideas:', error);

    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to generate blog ideas',
    });
  }
});

/**
 * GET /api/blog-generation
 * Get all blog generations for the authenticated instance
 */
router.get('/api/blog-generation', verifyInstance, async (req: Request, res: Response) => {
  try {
    const { instanceId } = req.wixInstance!;
    const status = req.query.status as string | undefined;

    const generations = await getBlogGenerations(instanceId, status);

    res.json({ generations });
  } catch (error: any) {
    console.error('[Blog Generation] Error fetching:', error);
    
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch blog generations'
    });
  }
});

/**
 * GET /api/blog-generation/:id
 * Get a single blog generation by ID
 */
router.get('/api/blog-generation/:id', verifyInstance, async (req: Request, res: Response) => {
  try {
    const { instanceId } = req.wixInstance!;
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      res.status(400).json({
        error: 'Validation failed',
        message: 'Invalid blog generation ID'
      });
      return;
    }

    const generation = await getBlogGeneration(id, instanceId);

    if (!generation) {
      res.status(404).json({
        error: 'Not found',
        message: 'Blog generation not found'
      });
      return;
    }

    res.json(generation);
  } catch (error: any) {
    console.error('[Blog Generation] Error fetching:', error);
    
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch blog generation'
    });
  }
});

/**
 * POST /api/blog-generation/:id/regenerate-ideas
 * Regenerate blog ideas for an existing generation
 */
router.post('/api/blog-generation/:id/regenerate-ideas', verifyInstance, async (req: Request, res: Response) => {
  try {
    const { instanceId } = req.wixInstance!;
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      res.status(400).json({
        error: 'Validation failed',
        message: 'Invalid blog generation ID'
      });
      return;
    }

    const generation = await getBlogGeneration(id, instanceId);

    if (!generation) {
      res.status(404).json({
        error: 'Not found',
        message: 'Blog generation not found'
      });
      return;
    }

    // Reset to pending and notify worker
    await updateBlogGeneration(id, {
      status: 'PENDING' as any,
      blog_ideas: undefined,
      selected_idea_index: undefined,
      error: undefined,
    });

    notifyBlogGenerationCreated();

    res.json({ message: 'Blog ideas regeneration started' });
  } catch (error: any) {
    console.error('[Blog Generation] Error regenerating ideas:', error);
    
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to regenerate blog ideas'
    });
  }
});

/**
 * POST /api/blog-generation/:id/select-idea
 * Select a blog idea and start content generation
 */
router.post('/api/blog-generation/:id/select-idea', verifyInstance, async (req: Request, res: Response) => {
  try {
    const { instanceId } = req.wixInstance!;
    const id = parseInt(req.params.id, 10);
    const { ideaIndex } = req.body;

    if (isNaN(id)) {
      res.status(400).json({
        error: 'Validation failed',
        message: 'Invalid blog generation ID'
      });
      return;
    }

    if (typeof ideaIndex !== 'number' || ideaIndex < 0 || ideaIndex > 4) {
      res.status(400).json({
        error: 'Validation failed',
        message: 'ideaIndex must be a number between 0 and 4'
      });
      return;
    }

    const generation = await getBlogGeneration(id, instanceId);

    if (!generation) {
      res.status(404).json({
        error: 'Not found',
        message: 'Blog generation not found'
      });
      return;
    }

    if (!generation.blog_ideas) {
      res.status(400).json({
        error: 'Invalid state',
        message: 'No blog ideas available'
      });
      return;
    }

    // Update selected idea and trigger content generation
    await updateBlogGeneration(id, {
      selected_idea_index: ideaIndex,
      status: 'PENDING' as any, // Set back to PENDING so worker picks it up
    });

    notifyBlogGenerationCreated();

    res.json({ message: 'Blog content generation started' });
  } catch (error: any) {
    console.error('[Blog Generation] Error selecting idea:', error);
    
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to select blog idea'
    });
  }
});

export default router;

function formatProductForIdeas(product: any): string {
  const description = stripHtml(
    product?.description ||
      product?.product?.description ||
      product?.additionalInfoSections?.map((section: any) => section.description).join('\n') ||
      ''
  );

  const highlights: string[] = [];

  if (Array.isArray(product?.collections)) {
    const collectionNames = product.collections
      .map((collection: any) => collection.name)
      .filter(Boolean);
    if (collectionNames.length) {
      highlights.push(`Collections: ${collectionNames.join(', ')}`);
    }
  }

  if (Array.isArray(product?.tags) && product.tags.length) {
    highlights.push(`Tags: ${product.tags.slice(0, 5).join(', ')}`);
  }

  if (product?.price) {
    highlights.push(`Price: ${product.price.currency || ''} ${product.price.price}`);
  } else if (product?.priceData?.price) {
    highlights.push(`Price: ${product.priceData.currency || ''} ${product.priceData.price}`);
  }

  return [
    `Product Name: ${product?.name || product?.product?.name || 'Unnamed product'}`,
    `Description: ${description || 'N/A'}`,
    highlights.length ? highlights.join('\n') : '',
  ]
    .filter(Boolean)
    .join('\n');
}

function stripHtml(value: string): string {
  return value ? value.replace(/<[^>]*>/g, '') : '';
}

function validateSelectedIdea(idea: any): string | null {
  if (!idea || typeof idea !== 'object') {
    return 'selectedIdea must be an object';
  }

  if (!idea.title || typeof idea.title !== 'string') {
    return 'selectedIdea.title is required';
  }

  if (!idea.description || typeof idea.description !== 'string') {
    return 'selectedIdea.description is required';
  }

  return null;
}

function normalizeSelectedIdea(raw: any): BlogIdea {
  const keywords = Array.isArray(raw.keywords)
    ? raw.keywords
        .map((keyword: any) => (typeof keyword === 'string' ? keyword.trim() : ''))
        .filter(Boolean)
        .slice(0, 5)
    : undefined;

  return {
    title: String(raw.title).trim(),
    description: String(raw.description).trim(),
    targetAudience: raw.targetAudience
      ? String(raw.targetAudience).trim()
      : 'General audience',
    hook: raw.hook ? String(raw.hook).trim() : undefined,
    format: raw.format ? String(raw.format).trim() : undefined,
    keywords,
  };
}
