import { EventEmitter } from 'events';
import { query } from '../db';
import { JobItem, AppInstance, Job } from '../db/types';
import { WixStoresClient } from '../wix/storesClient';
import { OpenAIClient, OptimizeParams } from '../openai/client';
import { updateJobItem } from '../db/jobs';
import { getAppInstance } from '../db/appInstances';
import { getInstanceToken } from '../wix/tokenHelper';
import { openAIRateLimiter } from '../utils/rateLimiter';
import { logger } from '../utils/logger';

/**
 * Event emitter for job notifications
 * Enables immediate processing when jobs are created
 */
const jobEventEmitter = new EventEmitter();
const JOB_CREATED_EVENT = 'job:created';

/**
 * Signal that new jobs have been created and need processing
 * Called from the job creation endpoint
 * Emits event for immediate worker response
 */
export function notifyJobCreated(): void {
  logger.debug('[Worker] Job created event emitted');
  jobEventEmitter.emit(JOB_CREATED_EVENT);
}

/**
 * Claim pending job items for processing with round-robin fairness
 * Uses FOR UPDATE SKIP LOCKED to safely claim items in concurrent environment
 * Implements round-robin across instances to ensure multi-store fairness
 * 
 * @param limit - Maximum number of items to claim (default: 100)
 * @param maxPerInstance - Maximum items per instance in this batch (default: 20)
 * @returns Array of claimed job items with status updated to RUNNING
 */
export async function claimPendingItems(
  limit: number = 100,
  maxPerInstance: number = 20
): Promise<JobItem[]> {
  const result = await query<JobItem>(
    `
    WITH instance_batches AS (
      -- Get pending items grouped by instance with row numbers
      SELECT 
        id,
        instance_id,
        ROW_NUMBER() OVER (PARTITION BY instance_id ORDER BY id) as rn
      FROM job_items
      WHERE status = 'PENDING'
    ),
    selected_items AS (
      -- Select up to maxPerInstance items from each instance
      SELECT id
      FROM instance_batches
      WHERE rn <= $1
      ORDER BY id
      LIMIT $2
      FOR UPDATE SKIP LOCKED
    )
    UPDATE job_items
    SET status = 'RUNNING', updated_at = now()
    WHERE id IN (SELECT id FROM selected_items)
    RETURNING *
    `,
    [maxPerInstance, limit]
  );

  return result.rows;
}

/**
 * Get the instance and job details for a job item
 * 
 * @param item - The job item to process
 * @returns Object containing instance and job data
 */
async function getJobItemContext(item: JobItem): Promise<{
  instance: AppInstance;
  job: Job;
}> {
  // Get the job details
  const jobResult = await query<Job>(
    'SELECT * FROM jobs WHERE id = $1',
    [item.job_id]
  );

  if (jobResult.rows.length === 0) {
    throw new Error(`Job not found: ${item.job_id}`);
  }

  const job = jobResult.rows[0];

  // Get the instance details
  const instance = await getAppInstance(job.instance_id);

  if (!instance) {
    throw new Error(`Instance not found: ${job.instance_id}`);
  }

  return { instance, job };
}

/**
 * Estimate token usage for an OpenAI request
 * Uses rough approximation: ~4 characters per token
 * 
 * @param params - Optimization parameters
 * @returns Estimated total tokens (input + output)
 */
function estimateTokens(params: OptimizeParams): number {
  // Estimate input tokens
  const inputText = 
    params.productTitle + 
    params.beforeValue + 
    params.userPrompt + 
    params.attribute + 
    params.targetLang;
  
  const inputTokens = Math.ceil(inputText.length / 4);
  
  // Add max completion tokens (from OpenAI client config)
  const maxOutputTokens = 1000;
  
  const totalEstimate = inputTokens + maxOutputTokens;
  
  return totalEstimate;
}

/**
 * Extract attribute value from product data
 * Maps to actual Wix product fields
 * 
 * @param product - Wix product object
 * @param attribute - Attribute name (name, description, seoTitle, seoDescription)
 * @returns The current value of the attribute
 */
function extractAttributeValue(product: any, attribute: string): string {
  switch (attribute) {
    case 'name':
      // Product name/title
      return product.name || '';
    
    case 'description':
      // Product description from content.sections (V3 structure)
      // The storefront reads from content.sections[0].content.formattedText
      // Try multiple sources in order of preference
      const plainText = product.content?.sections?.[0]?.content?.plainText;
      const formattedText = product.content?.sections?.[0]?.content?.formattedText;
      const legacyDesc = product.description;
      
      // Return plainText if available, otherwise strip HTML from formattedText
      if (plainText) {
        return plainText;
      } else if (formattedText) {
        // Strip HTML tags for plain text version
        return formattedText.replace(/<[^>]*>/g, '');
      } else if (legacyDesc) {
        return typeof legacyDesc === 'string' ? legacyDesc : '';
      }
      return '';
    
    case 'seoTitle':
      // SEO page title from seoData
      return product.seoData?.tags?.title || '';
    
    case 'seoDescription':
      // SEO meta description from seoData
      return product.seoData?.tags?.description || '';
    
    default:
      throw new Error(`Unknown attribute: ${attribute}`);
  }
}

/**
 * Process a single job item
 * Fetches product data, calls OpenAI for optimization, and saves results
 * 
 * @param item - The job item to process
 */
export async function processItem(item: JobItem): Promise<void> {
  try {
    logger.trace(`[Worker] Processing item ${item.id}: ${item.attribute}`);

    // Get instance and job context
    const { instance, job } = await getJobItemContext(item);
    
    // Get fresh access token (automatically refreshes if expired)
    const accessToken = await getInstanceToken(instance.instance_id);
    
    // Create Wix Stores client with cached catalog version
    const wixClient = new WixStoresClient(
      accessToken,
      instance.refresh_token,
      instance.instance_id,
      instance.catalog_version
    );

    // Fetch current product data from Wix
    const product = await wixClient.getProduct(item.product_id);
    logger.trace(`[Worker] Item ${item.id}: ${product.name || 'Unnamed'} - ${item.attribute}`);

    // Extract the current attribute value
    const beforeValue = extractAttributeValue(product, item.attribute);

    // Initialize OpenAI client
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    const openaiClient = new OpenAIClient(openaiApiKey);

    // Prepare optimization parameters
    const optimizeParams: OptimizeParams = {
      productTitle: product.name || 'Untitled Product',
      attribute: item.attribute,
      beforeValue,
      targetLang: job.target_lang,
      userPrompt: job.user_prompt,
    };

    // Estimate tokens for rate limiting
    const estimatedTokens = estimateTokens(optimizeParams);

    // Use rate limiter to control OpenAI API calls
    const afterValue = await openAIRateLimiter.executeWithRateLimit(
      () => openaiClient.optimize(optimizeParams),
      estimatedTokens
    );

    // Save results to database
    await updateJobItem(item.id, {
      beforeValue,
      afterValue,
      status: 'DONE',
    });

    logger.debug(`[Worker] ✅ Item ${item.id} complete`);
  } catch (error: any) {
    logger.error(`[Worker] ❌ Item ${item.id} failed:`, error.message);

    // Save error to database
    try {
      await updateJobItem(item.id, {
        status: 'FAILED',
        error: error.message || 'Unknown error',
      });
    } catch (dbError: any) {
      logger.error(`[Worker] Failed to save error for item ${item.id}:`, dbError);
    }
  }
}

/**
 * Update job statuses based on their items' completion state
 * - Sets job to DONE when all items are complete (includes partial failures)
 * - Sets job to FAILED only when ALL items have failed (no successful items)
 * - Sets started_at when job transitions to RUNNING
 */
export async function updateJobStatuses(): Promise<void> {
  try {
    // Update jobs to RUNNING if they have any RUNNING items and haven't started yet
    const runningResult = await query(
      `
      UPDATE jobs
      SET status = 'RUNNING', started_at = COALESCE(started_at, now())
      WHERE status = 'PENDING'
      AND EXISTS (
        SELECT 1 FROM job_items
        WHERE job_id = jobs.id
        AND status = 'RUNNING'
      )
      RETURNING id
      `
    );

    if (runningResult.rows.length > 0) {
      logger.debug(`[Worker] ${runningResult.rows.length} job(s) started`);
    }

    // Mark jobs as DONE when all items are complete (no PENDING or RUNNING items)
    const doneResult = await query(
      `
      UPDATE jobs
      SET status = 'DONE', finished_at = now()
      WHERE status IN ('PENDING', 'RUNNING')
      AND NOT EXISTS (
        SELECT 1 FROM job_items
        WHERE job_id = jobs.id
        AND status IN ('PENDING', 'RUNNING')
      )
      AND EXISTS (
        SELECT 1 FROM job_items
        WHERE job_id = jobs.id
      )
      RETURNING id
      `
    );

    if (doneResult.rows.length > 0) {
      logger.info(`[Worker] ✅ ${doneResult.rows.length} job(s) completed`);
    }

    // Mark jobs as FAILED only if ALL items failed (no successful items)
    const failedResult = await query(
      `
      UPDATE jobs
      SET status = 'FAILED', finished_at = now()
      WHERE status IN ('PENDING', 'RUNNING')
      AND NOT EXISTS (
        SELECT 1 FROM job_items
        WHERE job_id = jobs.id
        AND status IN ('PENDING', 'RUNNING')
      )
      AND NOT EXISTS (
        SELECT 1 FROM job_items
        WHERE job_id = jobs.id
        AND status = 'DONE'
      )
      AND EXISTS (
        SELECT 1 FROM job_items
        WHERE job_id = jobs.id
        AND status = 'FAILED'
      )
      RETURNING id
      `
    );

    if (failedResult.rows.length > 0) {
      logger.warn(`[Worker] ⚠️ ${failedResult.rows.length} job(s) completely failed (all items failed)`);
      // Log details only in DEBUG mode
      if (logger.getLevel() >= 3) {
        for (const row of failedResult.rows) {
          const itemsResult = await query(
            `SELECT id, attribute, error FROM job_items WHERE job_id = $1 AND status = 'FAILED'`,
            [row.id]
          );
          logger.debug(`  Job ${row.id}: ${itemsResult.rows.length} failed items`);
        }
      }
    }
  } catch (error: any) {
    logger.error('[Worker] Error updating job statuses:', error.message);
  }
}

/**
 * Check if there are pending jobs in the database
 * Used for initial startup check
 */
async function checkForPendingJobs(): Promise<boolean> {
  try {
    const result = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM job_items WHERE status = 'PENDING' LIMIT 1`
    );
    const count = parseInt(result.rows[0]?.count || '0');
    return count > 0;
  } catch (error: any) {
    console.error('[Worker] Error checking for pending jobs:', error.message);
    return false;
  }
}

/**
 * Hybrid event-driven worker with continuous processing
 * - Processes jobs immediately when created (< 100ms latency)
 * - Continues processing batches without delay when busy
 * - Falls back to polling every 5 seconds for safety
 */
export function startWorker(): void {
  logger.info('[Worker] Starting hybrid event-driven job worker...');
  
  // Check for required environment variables
  if (!process.env.OPENAI_API_KEY) {
    logger.error('[Worker] WARNING: OPENAI_API_KEY not set! Worker will fail to process items.');
  } else {
    logger.info('[Worker] OpenAI API key is configured');
  }

  // State management
  let isProcessing = false;
  let hasMoreWork = false;
  let cycleCount = 0;
  let lastHeartbeat = Date.now();

  /**
   * Main processing function
   * Processes jobs in a continuous loop while work exists
   */
  async function processJobs(): Promise<void> {
    // Prevent concurrent processing
    if (isProcessing) {
      console.log('[Worker] Already processing, marking hasMoreWork=true');
      hasMoreWork = true;
      return;
    }

    isProcessing = true;
    const startTime = Date.now();

    try {
      // Continuous processing loop
      do {
        hasMoreWork = false;
        cycleCount++;

        // Heartbeat logging every 30 seconds (INFO level)
        const now = Date.now();
        if (now - lastHeartbeat > 30000) {
          const stats = openAIRateLimiter.getStats();
          logger.info(
            `[Worker] Heartbeat - cycle ${cycleCount} | ` +
            `Queue: ${stats.queueLength} | ` +
            `RPM: ${stats.requestsInLastMinute}/${stats.maxRPM} (${stats.rpmUsagePercent}%) | ` +
            `TPM: ${Math.round(stats.tokensInCurrentWindow/1000)}K/${Math.round(stats.maxTPM/1000)}K (${stats.tpmUsagePercent}%)`
          );
          lastHeartbeat = now;
        }

        // Claim items with round-robin fairness
        const items = await claimPendingItems(100, 20);

        if (items.length === 0) {
          logger.debug('[Worker] No pending items, going idle');
          break; // Exit loop, no more work
        }

        // Count instances for summary
        const instanceCounts = items.reduce((acc, item) => {
          acc[item.instance_id] = (acc[item.instance_id] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        const uniqueInstances = Object.keys(instanceCounts).length;
        
        // Consolidated log: single line summary
        logger.info(
          `[Worker] Processing batch: ${items.length} items from ${uniqueInstances} store(s)`
        );
        
        // Detailed instance distribution only in DEBUG mode
        if (logger.getLevel() >= 3) {
          if (uniqueInstances <= 5) {
            Object.entries(instanceCounts).forEach(([instanceId, count]) => {
              logger.debug(`  Store ${instanceId.substring(0, 8)}...: ${count} items`);
            });
          } else {
            const topInstances = Object.entries(instanceCounts)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 3);
            topInstances.forEach(([instanceId, count]) => {
              logger.debug(`  Store ${instanceId.substring(0, 8)}...: ${count} items`);
            });
            logger.debug(`  ... and ${uniqueInstances - 3} more stores`);
          }
        }

        // Process all items concurrently - rate limiter handles throttling
        await Promise.all(items.map(item => processItem(item)));

        // Update job statuses
        await updateJobStatuses();

        const elapsed = Date.now() - startTime;
        logger.info(`[Worker] Batch complete: ${items.length} items in ${Math.round(elapsed/1000)}s`);

        // If batch was full, more items likely exist
        if (items.length === 100) {
          logger.debug('[Worker] Full batch, checking for more items');
          hasMoreWork = true;
        }

      } while (hasMoreWork);

    } catch (error: any) {
      logger.error('[Worker] Error processing jobs:', error.message);
    } finally {
      isProcessing = false;

      // If work arrived during processing, trigger another cycle immediately
      if (hasMoreWork) {
        logger.debug('[Worker] More work detected, processing immediately');
        setImmediate(() => processJobs());
      }
    }
  }

  // Event-driven: Process immediately when jobs are created
  jobEventEmitter.on(JOB_CREATED_EVENT, () => {
    logger.info('[Worker] Job created, processing immediately');
    processJobs();
  });

  // Fallback polling: Check every 5 seconds in case events are missed
  const fallbackInterval = setInterval(() => {
    if (!isProcessing) {
      logger.debug('[Worker] Fallback check');
      processJobs();
    }
  }, 5000);

  // Initial check on startup
  logger.info('[Worker] Checking for pending jobs on startup...');
  checkForPendingJobs().then((hasPending) => {
    if (hasPending) {
      logger.info('[Worker] Found pending jobs, processing immediately');
      processJobs();
    } else {
      logger.info('[Worker] No pending jobs, waiting for events');
    }
  });

  // Handle graceful shutdown
  const shutdown = () => {
    logger.info('[Worker] Shutting down gracefully...');
    clearInterval(fallbackInterval);
    jobEventEmitter.removeAllListeners();
    
    // Wait for current processing to complete
    const checkShutdown = setInterval(() => {
      if (!isProcessing) {
        clearInterval(checkShutdown);
        logger.info('[Worker] Shutdown complete');
        process.exit(0);
      } else {
        logger.info('[Worker] Waiting for current batch to complete...');
      }
    }, 1000);
    
    // Force exit after 30 seconds
    setTimeout(() => {
      logger.warn('[Worker] Force shutdown after timeout');
      process.exit(1);
    }, 30000);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  logger.info('[Worker] Hybrid event-driven worker started');
  logger.info('[Worker] - Event-driven: Immediate processing');
  logger.info('[Worker] - Continuous: No batch delays');
  logger.info('[Worker] - Fallback: 5s polling');
}
