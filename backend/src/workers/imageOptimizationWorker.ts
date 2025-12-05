import { EventEmitter } from 'events';
import {
  getPendingImageOptimizationItems,
  getProcessingImageOptimizationItems,
  updateImageOptimizationItem,
  updateImageOptimizationJobStatus,
  updateImageOptimizationJobProgress,
  getImageOptimizationJob,
  getImageOptimizationItems,
} from '../db/imageOptimization';
import { optimizeImageAsync, getPrediction } from '../replicate/client';
import { replicateRateLimiter } from '../utils/replicateRateLimiter';
import { logger } from '../utils/logger';
import { r2Client } from '../utils/r2Client';

/**
 * Event emitter for job notifications
 * Enables immediate processing when jobs are created
 */
const jobEventEmitter = new EventEmitter();
const JOB_CREATED_EVENT = 'imageJob:created';

/**
 * Signal that new image jobs have been created and need processing
 * Called from the job creation endpoint
 */
export function notifyImageJobCreated(): void {
  logger.debug('[ImageOptWorker] Image job created event emitted');
  jobEventEmitter.emit(JOB_CREATED_EVENT);
}

let isProcessingCreation = false;
let isProcessingPolling = false;
let creationInterval: NodeJS.Timeout | null = null;
let pollingInterval: NodeJS.Timeout | null = null;
let cycleCount = 0;
let lastHeartbeat = Date.now();

/**
 * Update job status based on its items
 */
async function updateJobStatus(jobId: number, instanceId: string): Promise<void> {
  try {
    const job = await getImageOptimizationJob(jobId, instanceId);
    if (!job) return;

    const items = await getImageOptimizationItems(jobId, instanceId);

    const completedCount = items.filter(item => item.status === 'DONE').length;
    const failedCount = items.filter(item => item.status === 'FAILED').length;
    const runningCount = items.filter(item => item.status === 'RUNNING').length;

    // Update progress counters
    await updateImageOptimizationJobProgress(jobId, completedCount, failedCount);

    // Determine job status
    if (completedCount + failedCount === items.length) {
      // All items processed
      if (failedCount === items.length) {
        await updateImageOptimizationJobStatus(jobId, 'FAILED', 'All images failed to optimize');
      } else {
        await updateImageOptimizationJobStatus(jobId, 'DONE');
      }
    } else if (runningCount > 0 || (completedCount + failedCount > 0)) {
      // Some items are being processed or have been processed
      await updateImageOptimizationJobStatus(jobId, 'RUNNING');
    }
  } catch (error: any) {
    logger.error(`[ImageOptWorker] Error updating job status for job ${jobId}:`, error.message);
  }
}

/**
 * PHASE 1: Create predictions asynchronously
 * Claims pending items and creates Replicate predictions without waiting
 */
async function createPredictions(): Promise<void> {
  if (isProcessingCreation) {
    logger.debug('[ImageOptWorker] Already creating predictions, skipping...');
    return;
  }

  isProcessingCreation = true;

  try {
    cycleCount++;

    // Heartbeat logging every 30 seconds
    const now = Date.now();
    if (now - lastHeartbeat > 30000) {
      const stats = replicateRateLimiter.getStats();
      logger.info(
        `[ImageOptWorker] Heartbeat - cycle ${cycleCount} | ` +
        `Queue: ${stats.queueLength} | ` +
        `RPM: ${stats.requestsInLastMinute}/${stats.maxRPM} (${stats.rpmUsagePercent}%)`
      );
      lastHeartbeat = now;
    }

    // Get pending items with round-robin fairness (100 items, max 20 per store)
    const pendingItems = await getPendingImageOptimizationItems(100, 20);

    if (pendingItems.length === 0) {
      logger.debug('[ImageOptWorker] No pending items');
      return;
    }

    // Count instances for summary
    const instanceCounts = pendingItems.reduce((acc, item) => {
      // Get instance_id from job (need to query)
      return acc;
    }, {} as Record<string, number>);

    logger.info(`[ImageOptWorker] Creating predictions for ${pendingItems.length} items`);

    // Process all items concurrently - rate limiter handles throttling
    await Promise.all(
      pendingItems.map(item => createPredictionForItem(item))
    );

    logger.info(`[ImageOptWorker] Prediction creation batch complete: ${pendingItems.length} items`);
  } catch (error: any) {
    logger.error('[ImageOptWorker] Error creating predictions:', error.message);
  } finally {
    isProcessingCreation = false;
  }
}

/**
 * Create a prediction for a single item
 */
async function createPredictionForItem(item: any): Promise<void> {
  try {
    logger.trace(`[ImageOptWorker] Creating prediction for item ${item.id}`);

    // Update status to RUNNING
    await updateImageOptimizationItem(item.id, {
      status: 'RUNNING',
    });

    // Create prediction with rate limiting (returns immediately)
    const predictionId = await replicateRateLimiter.executeWithRateLimit(
      () => optimizeImageAsync(item.image_url, item.prompt)
    );

    // Update item with prediction ID and status
    // Note: Using 'RUNNING' until migration adds 'PROCESSING' to enum
    await updateImageOptimizationItem(item.id, {
      status: 'RUNNING',
      replicatePredictionId: predictionId,
    });

    logger.debug(`[ImageOptWorker] ✅ Prediction created for item ${item.id}: ${predictionId}`);
  } catch (error: any) {
    logger.error(`[ImageOptWorker] ❌ Failed to create prediction for item ${item.id}:`, error.message);

    // Update item with error
    await updateImageOptimizationItem(item.id, {
      status: 'FAILED',
      error: error.message || 'Failed to create prediction',
    });
  }
}

/**
 * PHASE 2: Poll predictions for results
 * Checks status of processing items and updates when complete
 */
async function pollPredictions(): Promise<void> {
  if (isProcessingPolling) {
    logger.debug('[ImageOptWorker] Already polling predictions, skipping...');
    return;
  }

  isProcessingPolling = true;

  try {
    // Get items that are currently processing (have prediction IDs)
    const processingItems = await getProcessingImageOptimizationItems(50);

    if (processingItems.length === 0) {
      logger.debug('[ImageOptWorker] No processing items to poll');
      return;
    }

    logger.debug(`[ImageOptWorker] Polling ${processingItems.length} predictions`);

    // Check all predictions concurrently - rate limiter handles throttling
    await Promise.all(
      processingItems.map(item => pollPredictionForItem(item))
    );

    logger.debug(`[ImageOptWorker] Polling batch complete: ${processingItems.length} items checked`);
  } catch (error: any) {
    logger.error('[ImageOptWorker] Error polling predictions:', error.message);
  } finally {
    isProcessingPolling = false;
  }
}

/**
 * Poll a prediction for a single item
 */
async function pollPredictionForItem(item: any): Promise<void> {
  try {
    if (!item.replicate_prediction_id) {
      logger.warn(`[ImageOptWorker] Item ${item.id} has no prediction ID`);
      return;
    }

    // Get prediction status with rate limiting
    const result = await replicateRateLimiter.executeWithRateLimit(
      () => getPrediction(item.replicate_prediction_id)
    );

    if (result.status === 'succeeded') {
      let finalImageUrl = result.output;

      // Upload to R2 for permanent storage (if enabled)
      if (r2Client.isEnabled() && result.output) {
        try {
          logger.debug(`[ImageOptWorker] Uploading item ${item.id} to R2...`);

          // Get job details for storage key generation
          const job = await getImageOptimizationJob(item.job_id);
          if (job) {
            // Determine file extension
            const extension = r2Client.getExtension(result.output);
            
            // Generate storage key: instances/{instanceId}/jobs/{jobId}/image-{itemId}.jpg
            const storageKey = r2Client.generateKey(
              job.instance_id,
              item.job_id,
              item.id,
              extension
            );

            // Upload to R2
            const r2Url = await r2Client.uploadFromUrl(result.output, storageKey);
            
            // Use R2 URL instead of Replicate URL
            finalImageUrl = r2Url;
            
            logger.info(`[ImageOptWorker] ✅ Item ${item.id} uploaded to R2: ${storageKey}`);
          }
        } catch (r2Error: any) {
          // R2 upload failed - fall back to Replicate URL
          logger.error(`[ImageOptWorker] R2 upload failed for item ${item.id}, using Replicate URL:`, r2Error.message);
          // Continue with Replicate URL (temporary but better than failing)
        }
      }

      // Prediction complete - update item with final URL
      await updateImageOptimizationItem(item.id, {
        status: 'DONE',
        optimizedImageUrl: finalImageUrl,
      });

      logger.debug(`[ImageOptWorker] ✅ Item ${item.id} completed`);

      // Update job status
      const job = await getImageOptimizationJob(item.job_id);
      if (job) {
        await updateJobStatus(item.job_id, job.instance_id);
      }
    } else if (result.status === 'failed' || result.status === 'canceled') {
      // Prediction failed
      await updateImageOptimizationItem(item.id, {
        status: 'FAILED',
        error: result.error || `Prediction ${result.status}`,
      });

      logger.error(`[ImageOptWorker] ❌ Item ${item.id} failed: ${result.error || result.status}`);

      // Update job status
      const job = await getImageOptimizationJob(item.job_id);
      if (job) {
        await updateJobStatus(item.job_id, job.instance_id);
      }
    } else {
      // Still processing (starting, processing)
      logger.trace(`[ImageOptWorker] Item ${item.id} still ${result.status}`);
    }
  } catch (error: any) {
    logger.error(`[ImageOptWorker] Error polling item ${item.id}:`, error.message);
  }
}

/**
 * Start the image optimization worker with two-phase processing
 */
export function startImageOptimizationWorker(): void {
  if (creationInterval || pollingInterval) {
    logger.info('[ImageOptWorker] Worker already running');
    return;
  }

  logger.info('[ImageOptWorker] Starting two-phase image optimization worker...');
  logger.info('[ImageOptWorker] - Phase 1: Create predictions (every 5s)');
  logger.info('[ImageOptWorker] - Phase 2: Poll predictions (every 3s)');

  // Event-driven: Process immediately when jobs are created
  jobEventEmitter.on(JOB_CREATED_EVENT, () => {
    logger.info('[ImageOptWorker] Image job created, processing immediately');
    createPredictions();
  });

  // Phase 1: Create predictions every 5 seconds
  createPredictions(); // Initial run
  creationInterval = setInterval(() => {
    createPredictions();
  }, 5000);

  // Phase 2: Poll predictions every 3 seconds
  setTimeout(() => {
    pollPredictions(); // Initial run after 2s delay
    pollingInterval = setInterval(() => {
      pollPredictions();
    }, 3000);
  }, 2000);

  logger.info('[ImageOptWorker] Worker started successfully');
}

/**
 * Stop the image optimization worker
 */
export function stopImageOptimizationWorker(): void {
  if (creationInterval) {
    clearInterval(creationInterval);
    creationInterval = null;
  }
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
  }
  jobEventEmitter.removeAllListeners();
  logger.info('[ImageOptWorker] Worker stopped');
}
