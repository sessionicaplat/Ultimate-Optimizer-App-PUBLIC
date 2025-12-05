import { Router, Request, Response } from 'express';
import { verifyInstance } from '../auth/verifyInstance';
import { getAppInstance, incrementCreditsUsed } from '../db/appInstances';
import { createJob, getJobs, getJob, getJobItems } from '../db/jobs';
import { transaction, query } from '../db/index';
import { PoolClient } from 'pg';
import { notifyJobCreated } from '../workers/jobWorker';
import { WixStoresClient } from '../wix/storesClient';
import { getInstanceToken } from '../wix/tokenHelper';

const router = Router();

/**
 * POST /api/jobs
 * Create a new optimization job
 */
router.post('/api/jobs', verifyInstance, async (req: Request, res: Response) => {
  try {
    const { instanceId } = req.wixInstance!;
    const { sourceScope, sourceIds, attributes, targetLang, userPrompt } = req.body;

    // Validate request body
    if (!sourceScope || !sourceIds || !attributes || !targetLang || !userPrompt) {
      res.status(400).json({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        message: 'Missing required fields: sourceScope, sourceIds, attributes, targetLang, userPrompt'
      });
      return;
    }

    if (!Array.isArray(sourceIds) || sourceIds.length === 0) {
      res.status(400).json({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        message: 'sourceIds must be a non-empty array'
      });
      return;
    }

    if (typeof attributes !== 'object' || attributes === null) {
      res.status(400).json({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        message: 'attributes must be an object'
      });
      return;
    }

    // Get instance and check credit balance
    const instance = await getAppInstance(instanceId);
    
    if (!instance) {
      res.status(404).json({
        error: 'Instance not found',
        code: 'INSTANCE_NOT_FOUND',
        message: 'App instance not found. Please reinstall the app.'
      });
      return;
    }

    // Extract product IDs based on source scope
    let productIds: string[] = [];
    
    if (sourceScope === 'products') {
      // Direct product selection
      productIds = Array.from(
        new Set(
          sourceIds.filter((id: any): id is string => typeof id === 'string')
        )
      );
    } else if (sourceScope === 'collections') {
      const collectionIds = new Set<string>();
      const productIdSet = new Set<string>();

      for (const source of sourceIds) {
        if (typeof source === 'string') {
          collectionIds.add(source);
        } else if (source && typeof source === 'object') {
          if (typeof source.collectionId === 'string') {
            collectionIds.add(source.collectionId);
          }
          if (Array.isArray(source.productIds)) {
            source.productIds.forEach((id: any) => {
              if (typeof id === 'string') {
                productIdSet.add(id);
              }
            });
          }
        }
      }

      if (collectionIds.size === 0) {
        res.status(400).json({
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          message: 'At least one collection must be provided when sourceScope is "collections"'
        });
        return;
      }

      if (!instance.refresh_token) {
        res.status(400).json({
          error: 'Invalid instance tokens',
          code: 'INVALID_TOKENS',
          message: 'App instance does not have valid refresh tokens. Please reinstall the app.'
        });
        return;
      }

      try {
        const accessToken = await getInstanceToken(instanceId);
        const client = new WixStoresClient(
          accessToken,
          instance.refresh_token,
          instance.instance_id,
          instance.catalog_version
        );

        const collectionIdList = Array.from(collectionIds);
        const collectionBatches = await Promise.all(
          collectionIdList.map((collectionId) =>
            client.getProductIdsByCollection(collectionId)
          )
        );

        collectionBatches.forEach((ids) => {
          ids.forEach((id) => productIdSet.add(id));
        });
      } catch (error: any) {
        console.error('Failed to fetch products for collections:', error);
        res.status(error.status || 502).json({
          error: 'Failed to fetch collection products',
          code: 'COLLECTION_PRODUCT_FETCH_FAILED',
          message:
            error.message ||
            'Unable to fetch products for the selected collections from Wix.'
        });
        return;
      }

      productIds = Array.from(productIdSet);
    } else {
      res.status(400).json({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        message: 'sourceScope must be either "products" or "collections"'
      });
      return;
    }

    if (productIds.length === 0) {
      res.status(400).json({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        message: 'No products found in the selection'
      });
      return;
    }

    // Get selected attributes
    const selectedAttributes = Object.keys(attributes).filter(
      (key) => attributes[key] === true
    );

    if (selectedAttributes.length === 0) {
      res.status(400).json({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        message: 'At least one attribute must be selected'
      });
      return;
    }

    // Calculate required credits
    const productCount = productIds.length;
    const attributeCount = selectedAttributes.length;
    const requiredCredits = productCount * attributeCount;

    const remainingCredits = instance.credits_total - instance.credits_used_month;

    if (remainingCredits < requiredCredits) {
      res.status(402).json({
        error: 'Insufficient credits',
        code: 'INSUFFICIENT_CREDITS',
        message: `You need ${requiredCredits} credits but only have ${remainingCredits} remaining.`,
        required: requiredCredits,
        remaining: remainingCredits,
        creditsTotal: instance.credits_total,
        creditsUsed: instance.credits_used_month
      });
      return;
    }

    // Create job and increment credits in a transaction
    const job = await transaction(async (client: PoolClient) => {
      // Create the job with job items
      const newJob = await createJobInTransaction(client, {
        instanceId,
        sourceScope,
        sourceIds,
        attributes,
        targetLang,
        userPrompt,
        productIds,
        selectedAttributes,
      });

      // Increment credits used
      await client.query(
        `
        UPDATE app_instances
        SET credits_used_month = credits_used_month + $1,
            updated_at = now()
        WHERE instance_id = $2
        `,
        [requiredCredits, instanceId]
      );

      return newJob;
    });

    console.log(`[Jobs API] Job ${job.id} created: ${productCount} products × ${attributeCount} attributes = ${requiredCredits} credits`);

    // Notify worker that new jobs are available
    notifyJobCreated();

    res.status(201).json({
      jobId: job.id,
      status: job.status,
      requiredCredits,
      remainingCredits: remainingCredits - requiredCredits,
      productCount,
      attributeCount,
      totalItems: productCount * attributeCount
    });
  } catch (error: any) {
    console.error('Error creating job:', error);
    
    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred while creating the job',
      details: error.message
    });
  }
});

/**
 * Helper function to create job within a transaction
 */
async function createJobInTransaction(
  client: PoolClient,
  data: {
    instanceId: string;
    sourceScope: string;
    sourceIds: any;
    attributes: any;
    targetLang: string;
    userPrompt: string;
    productIds: string[];
    selectedAttributes: string[];
  }
) {
  // Create the job
  const jobResult = await client.query(
    `
    INSERT INTO jobs (
      instance_id,
      source_scope,
      source_ids,
      attributes,
      target_lang,
      user_prompt,
      status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
    `,
    [
      data.instanceId,
      data.sourceScope,
      JSON.stringify(data.sourceIds),
      JSON.stringify(data.attributes),
      data.targetLang,
      data.userPrompt,
      'PENDING',
    ]
  );

  const job = jobResult.rows[0];

  // Create job items for each product-attribute combination
  const jobItemsValues: string[] = [];
  const jobItemsParams: any[] = [];
  let paramIndex = 1;

  for (const productId of data.productIds) {
    for (const attribute of data.selectedAttributes) {
      jobItemsValues.push(
        `($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3})`
      );
      jobItemsParams.push(job.id, data.instanceId, productId, attribute);
      paramIndex += 4;
    }
  }

  if (jobItemsValues.length > 0) {
    await client.query(
      `
      INSERT INTO job_items (job_id, instance_id, product_id, attribute)
      VALUES ${jobItemsValues.join(', ')}
      `,
      jobItemsParams
    );
  }

  return job;
}

/**
 * GET /api/jobs
 * Get all jobs for the authenticated instance
 */
router.get('/api/jobs', verifyInstance, async (req: Request, res: Response) => {
  try {
    const { instanceId } = req.wixInstance!;
    const status = req.query.status as string | undefined;

    const jobs = await getJobs(instanceId, status);

    // Calculate progress for each job
    const jobsWithProgress = await Promise.all(
      jobs.map(async (job) => {
        const items = await getJobItems(job.id, instanceId);
        const totalItems = items.length;
        const completedItems = items.filter(
          (item) => item.status === 'DONE' || item.status === 'FAILED'
        ).length;
        const progress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

        // Count products and attributes
        const productIds = new Set(items.map((item) => item.product_id));
        const attributes = new Set(items.map((item) => item.attribute));

        return {
          id: job.id,
          status: job.status,
          sourceScope: job.source_scope,
          productCount: productIds.size,
          attributeCount: attributes.size,
          totalItems,
          completedItems,
          progress,
          createdAt: job.created_at,
          startedAt: job.started_at,
          finishedAt: job.finished_at,
          error: job.error,
        };
      })
    );

    res.json({ jobs: jobsWithProgress });
  } catch (error: any) {
    console.error('Error fetching jobs:', error);
    
    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred while fetching jobs'
    });
  }
});

/**
 * GET /api/jobs/:id
 * Get a single job by ID
 */
router.get('/api/jobs/:id', verifyInstance, async (req: Request, res: Response) => {
  try {
    const { instanceId } = req.wixInstance!;
    const jobId = parseInt(req.params.id, 10);

    if (isNaN(jobId)) {
      res.status(400).json({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        message: 'Invalid job ID'
      });
      return;
    }

    const job = await getJob(jobId, instanceId);

    if (!job) {
      res.status(404).json({
        error: 'Job not found',
        code: 'JOB_NOT_FOUND',
        message: 'The requested job was not found'
      });
      return;
    }

    res.json({
      id: job.id,
      status: job.status,
      sourceScope: job.source_scope,
      sourceIds: job.source_ids,
      attributes: job.attributes,
      targetLang: job.target_lang,
      userPrompt: job.user_prompt,
      createdAt: job.created_at,
      startedAt: job.started_at,
      finishedAt: job.finished_at,
      error: job.error,
    });
  } catch (error: any) {
    console.error('Error fetching job:', error);
    
    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred while fetching the job'
    });
  }
});

/**
 * GET /api/jobs/:id/items
 * Get all items for a job with published status
 */
router.get('/api/jobs/:id/items', verifyInstance, async (req: Request, res: Response) => {
  try {
    const { instanceId } = req.wixInstance!;
    const jobId = parseInt(req.params.id, 10);

    if (isNaN(jobId)) {
      res.status(400).json({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        message: 'Invalid job ID'
      });
      return;
    }

    // Verify job exists and belongs to instance
    const job = await getJob(jobId, instanceId);

    if (!job) {
      res.status(404).json({
        error: 'Job not found',
        code: 'JOB_NOT_FOUND',
        message: 'The requested job was not found'
      });
      return;
    }

    const items = await getJobItems(jobId, instanceId);

    // Check which items have been published
    const itemIds = items.map(item => item.id);
    const publishedResult = await query(
      `
      SELECT job_item_id AS id
      FROM publish_logs
      WHERE job_item_id = ANY($1)
        AND instance_id = $2
        AND job_item_id IS NOT NULL
      `,
      [itemIds, instanceId]
    );

    const publishedItemIds = new Set(publishedResult.rows.map((row: any) => row.id));

    res.json({
      items: items.map((item) => ({
        id: item.id,
        jobId: item.job_id,
        productId: item.product_id,
        attribute: item.attribute,
        beforeValue: item.before_value,
        afterValue: item.after_value,
        status: item.status,
        error: item.error,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        published: publishedItemIds.has(item.id),
      })),
    });
  } catch (error: any) {
    console.error('Error fetching job items:', error);
    
    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred while fetching job items'
    });
  }
});

export default router;
