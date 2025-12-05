import { Router, Request, Response } from 'express';
import { verifyInstance } from '../auth/verifyInstance';
import {
  createImageOptimizationJob,
  getImageOptimizationJobs,
  getImageOptimizationJob,
  getImageOptimizationItems,
  getImageOptimizationItem,
} from '../db/imageOptimization';
import { getAppInstance, incrementCreditsUsed } from '../db/appInstances';
import { notifyImageJobCreated } from '../workers/imageOptimizationWorker';

const router = Router();

/**
 * Create a new image optimization job
 */
router.post('/api/image-optimization', verifyInstance, async (req: Request, res: Response) => {
  try {
    const { productId, productName, images } = req.body;
    const { instanceId } = req.wixInstance!;

    // Validate input
    if (!productId || !images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({
        error: 'Invalid request. Required: productId, productName, images array',
      });
    }

    if (images.length > 10) {
      return res.status(400).json({
        error: 'Maximum 10 images can be optimized at once',
      });
    }

    // Validate each image has required fields
    for (const image of images) {
      if (!image.imageId || !image.imageUrl || !image.prompt) {
        return res.status(400).json({
          error: 'Each image must have imageId, imageUrl, and prompt',
        });
      }
    }

    // Check credits - get or create instance
    let instance = await getAppInstance(instanceId);
    if (!instance) {
      // Instance not provisioned yet - provision it now
      console.log(`[ImageOptimization] Instance ${instanceId} not found, provisioning...`);
      
      const { upsertAppInstance } = await import('../db/appInstances');
      const wixInstance = (req as any).wixInstance;
      
      // Get elevated token
      const appId = process.env.WIX_APP_ID;
      const appSecret = process.env.WIX_APP_SECRET;
      const instanceToken = req.headers['x-wix-instance'] as string;

      if (!appId || !appSecret) {
        return res.status(500).json({ error: 'Server configuration error' });
      }

      try {
        const tokenResponse = await fetch('https://www.wixapis.com/oauth2/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            grant_type: 'client_credentials',
            client_id: appId,
            client_secret: appSecret,
            instanceId: instanceId,
          }),
        });

        if (!tokenResponse.ok) {
          console.error('[ImageOptimization] Token elevation failed:', tokenResponse.status);
          return res.status(502).json({ error: 'Failed to provision app instance' });
        }

        const tokenData = await tokenResponse.json() as { access_token: string; expires_in?: number };

        await upsertAppInstance({
          instanceId,
          siteHost: wixInstance?.siteHost || '',
          accessToken: tokenData.access_token,
          refreshToken: instanceToken,
          expiresIn: tokenData.expires_in || 3600,
        });

        // Note: upsertAppInstance already sets default credits (200 for free plan)
        // No need to sync - credits are set correctly on creation

        // Get the newly created instance
        instance = await getAppInstance(instanceId);
        
        if (!instance) {
          return res.status(500).json({ error: 'Failed to create app instance' });
        }
        
        console.log(`[ImageOptimization] Instance ${instanceId} provisioned successfully`);
      } catch (error: any) {
        console.error('[ImageOptimization] Provisioning error:', error);
        return res.status(500).json({ error: 'Failed to provision app instance' });
      }
    }

    const creditsRequired = images.length * 15; // 15 credits per image
    const creditsAvailable = instance.credits_total - instance.credits_used_month;

    if (creditsAvailable < creditsRequired) {
      return res.status(402).json({
        error: 'Insufficient credits',
        required: creditsRequired,
        available: creditsAvailable,
      });
    }

    // Deduct credits
    await incrementCreditsUsed(instanceId, creditsRequired);

    // Create the job
    const job = await createImageOptimizationJob({
      instanceId,
      productId,
      productName: productName || 'Unknown Product',
      images: images.map((img: any) => ({
        imageId: img.imageId,
        imageUrl: img.imageUrl,
        prompt: img.prompt,
      })),
    });

    console.log(`[ImageOptimization] Created job ${job.id} for ${images.length} images`);

    // Notify worker that new jobs are available (event-driven processing)
    notifyImageJobCreated();

    res.status(201).json({
      success: true,
      job: {
        id: job.id,
        productId: job.product_id,
        productName: job.product_name,
        status: job.status,
        totalImages: job.total_images,
        completedImages: job.completed_images,
        failedImages: job.failed_images,
        createdAt: job.created_at,
      },
      creditsUsed: creditsRequired,
      creditsRemaining: creditsAvailable - creditsRequired,
    });
  } catch (error: any) {
    console.error('[ImageOptimization] Error creating job:', error);
    res.status(500).json({ error: error.message || 'Failed to create image optimization job' });
  }
});

/**
 * Get all image optimization jobs for the current instance
 */
router.get('/api/image-optimization/jobs', verifyInstance, async (req: Request, res: Response) => {
  try {
    const { instanceId } = req.wixInstance!;
    const status = req.query.status as string | undefined;

    const jobs = await getImageOptimizationJobs(instanceId, status);

    res.json({
      jobs: jobs.map(job => ({
        id: job.id,
        productId: job.product_id,
        productName: job.product_name,
        status: job.status,
        totalImages: job.total_images,
        completedImages: job.completed_images,
        failedImages: job.failed_images,
        createdAt: job.created_at,
        startedAt: job.started_at,
        finishedAt: job.finished_at,
        error: job.error,
      })),
    });
  } catch (error: any) {
    console.error('[ImageOptimization] Error fetching jobs:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch image optimization jobs' });
  }
});

/**
 * Get a specific image optimization job with its items
 */
router.get('/api/image-optimization/jobs/:jobId', verifyInstance, async (req: Request, res: Response) => {
  try {
    const { instanceId } = req.wixInstance!;
    const jobId = parseInt(req.params.jobId);

    if (isNaN(jobId)) {
      return res.status(400).json({ error: 'Invalid job ID' });
    }

    const job = await getImageOptimizationJob(jobId, instanceId);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const items = await getImageOptimizationItems(jobId, instanceId);

    res.json({
      job: {
        id: job.id,
        productId: job.product_id,
        productName: job.product_name,
        status: job.status,
        totalImages: job.total_images,
        completedImages: job.completed_images,
        failedImages: job.failed_images,
        createdAt: job.created_at,
        startedAt: job.started_at,
        finishedAt: job.finished_at,
        error: job.error,
      },
      items: items.map(item => ({
        id: item.id,
        imageId: item.image_id,
        imageUrl: item.image_url,
        prompt: item.prompt,
        status: item.status,
        optimizedImageUrl: item.optimized_image_url,
        error: item.error,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      })),
    });
  } catch (error: any) {
    console.error('[ImageOptimization] Error fetching job:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch image optimization job' });
  }
});

/**
 * Publish an optimized image to the product's media gallery
 */
router.post('/api/image-optimization/publish/:itemId', verifyInstance, async (req: Request, res: Response) => {
  let job: any = null;
  
  try {
    const { instanceId } = req.wixInstance!;
    const itemId = parseInt(req.params.itemId);

    if (isNaN(itemId)) {
      return res.status(400).json({ error: 'Invalid item ID' });
    }

    // Get the item
    const item = await getImageOptimizationItem(itemId, instanceId);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Verify item is completed and has an optimized image
    if (item.status !== 'DONE' || !item.optimized_image_url) {
      return res.status(400).json({ error: 'Item is not completed or has no optimized image' });
    }

    // Get the job to find the product ID
    job = await getImageOptimizationJob(item.job_id, instanceId);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    console.log(`[ImageOptimization] Publishing item ${itemId} to product ${job.product_id}`);
    console.log(`[ImageOptimization] Optimized image URL: ${item.optimized_image_url}`);

    // Get app instance for access token
    const instance = await getAppInstance(instanceId);
    if (!instance) {
      return res.status(404).json({ error: 'App instance not found' });
    }

    // Import WixSDKClient
    const { WixSDKClient } = await import('../wix/sdkClient');
    const wixClient = new WixSDKClient(instance.access_token);

    // Update product media using the SDK client method
    const updatedProduct = await wixClient.updateProductMedia(
      job.product_id,
      item.optimized_image_url,
      `Optimized: ${item.prompt}`
    );

    console.log(`[ImageOptimization] ✅ Published optimized image for item ${itemId} to product ${job.product_id}`);

    res.json({
      success: true,
      message: 'Image published to product gallery',
      product: updatedProduct,
    });
  } catch (error: any) {
    console.error('[ImageOptimization] Error publishing image:', error);
    
    // Provide user-friendly error messages
    let errorMessage = 'Failed to publish image to product gallery';
    let statusCode = 500;
    
    if (error.message?.includes('Product not found')) {
      errorMessage = 'Product not found in your Wix store. It may have been deleted.';
      statusCode = 404;
    } else if (error.message?.includes('revision')) {
      errorMessage = 'Product was modified. Please try again.';
      statusCode = 409;
    } else if (error.message?.includes('access')) {
      errorMessage = 'Access denied. Please reconnect your Wix account.';
      statusCode = 403;
    }
    
    res.status(statusCode).json({ 
      error: errorMessage,
      details: error.message || error.toString(),
      productId: job?.product_id,
    });
  }
});

export default router;
