import { query, transaction } from './index';
import { PoolClient } from 'pg';
import { JobStatus, ItemStatus } from './types';

export interface ImageOptimizationJob {
  id: number;
  instance_id: string;
  product_id: string;
  product_name: string;
  status: JobStatus;
  total_images: number;
  completed_images: number;
  failed_images: number;
  created_at: Date;
  started_at?: Date;
  finished_at?: Date;
  error?: string;
}

export interface ImageOptimizationItem {
  id: number;
  job_id: number;
  image_id: string;
  image_url: string;
  prompt: string;
  status: ItemStatus;
  replicate_prediction_id?: string;
  optimized_image_url?: string;
  error?: string;
  created_at: Date;
  updated_at: Date;
}

/**
 * Create a new image optimization job with items
 */
export async function createImageOptimizationJob(data: {
  instanceId: string;
  productId: string;
  productName: string;
  images: Array<{
    imageId: string;
    imageUrl: string;
    prompt: string;
  }>;
}): Promise<ImageOptimizationJob> {
  return transaction(async (client: PoolClient) => {
    // Create the job
    const jobResult = await client.query<ImageOptimizationJob>(
      `
      INSERT INTO image_optimization_jobs (
        instance_id,
        product_id,
        product_name,
        status,
        total_images
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *
      `,
      [
        data.instanceId,
        data.productId,
        data.productName,
        'PENDING' as JobStatus,
        data.images.length,
      ]
    );

    const job = jobResult.rows[0];

    // Create job items
    if (data.images.length > 0) {
      const itemsValues: string[] = [];
      const itemsParams: any[] = [];
      let paramIndex = 1;

      for (const image of data.images) {
        itemsValues.push(
          `($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3})`
        );
        itemsParams.push(job.id, image.imageId, image.imageUrl, image.prompt);
        paramIndex += 4;
      }

      await client.query(
        `
        INSERT INTO image_optimization_items (job_id, image_id, image_url, prompt)
        VALUES ${itemsValues.join(', ')}
        `,
        itemsParams
      );
    }

    return job;
  });
}

/**
 * Get image optimization jobs for an instance
 */
export async function getImageOptimizationJobs(
  instanceId: string,
  status?: string
): Promise<ImageOptimizationJob[]> {
  let queryText = `
    SELECT * FROM image_optimization_jobs
    WHERE instance_id = $1
  `;
  const params: any[] = [instanceId];

  if (status) {
    // Handle comma-separated status values (e.g., "PENDING,RUNNING")
    const statuses = status.split(',').map(s => s.trim().toUpperCase());
    const placeholders = statuses.map((_, i) => `$${i + 2}`).join(', ');
    queryText += ` AND status IN (${placeholders})`;
    params.push(...statuses);
  }

  queryText += ` ORDER BY created_at DESC`;

  const result = await query<ImageOptimizationJob>(queryText, params);
  return result.rows;
}

/**
 * Get a single image optimization job
 */
export async function getImageOptimizationJob(
  jobId: number,
  instanceId?: string
): Promise<ImageOptimizationJob | null> {
  let queryText = `SELECT * FROM image_optimization_jobs WHERE id = $1`;
  const params: any[] = [jobId];

  if (instanceId) {
    queryText += ` AND instance_id = $2`;
    params.push(instanceId);
  }

  const result = await query<ImageOptimizationJob>(queryText, params);

  return result.rows[0] || null;
}

/**
 * Get items for an image optimization job
 */
export async function getImageOptimizationItems(
  jobId: number,
  instanceId: string
): Promise<ImageOptimizationItem[]> {
  const result = await query<ImageOptimizationItem>(
    `
    SELECT ioi.* FROM image_optimization_items ioi
    INNER JOIN image_optimization_jobs ioj ON ioi.job_id = ioj.id
    WHERE ioi.job_id = $1 AND ioj.instance_id = $2
    ORDER BY ioi.id
    `,
    [jobId, instanceId]
  );

  return result.rows;
}

/**
 * Get a single image optimization item by ID
 */
export async function getImageOptimizationItem(
  itemId: number,
  instanceId: string
): Promise<ImageOptimizationItem | null> {
  const result = await query<ImageOptimizationItem>(
    `
    SELECT ioi.* FROM image_optimization_items ioi
    INNER JOIN image_optimization_jobs ioj ON ioi.job_id = ioj.id
    WHERE ioi.id = $1 AND ioj.instance_id = $2
    `,
    [itemId, instanceId]
  );

  return result.rows[0] || null;
}

/**
 * Update image optimization item
 */
export async function updateImageOptimizationItem(
  itemId: number,
  data: {
    status?: ItemStatus;
    replicatePredictionId?: string;
    optimizedImageUrl?: string;
    error?: string;
  }
): Promise<void> {
  const updates: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  if (data.status !== undefined) {
    updates.push(`status = $${paramIndex}`);
    params.push(data.status);
    paramIndex++;
  }

  if (data.replicatePredictionId !== undefined) {
    updates.push(`replicate_prediction_id = $${paramIndex}`);
    params.push(data.replicatePredictionId);
    paramIndex++;
  }

  if (data.optimizedImageUrl !== undefined) {
    updates.push(`optimized_image_url = $${paramIndex}`);
    params.push(data.optimizedImageUrl);
    paramIndex++;
  }

  if (data.error !== undefined) {
    updates.push(`error = $${paramIndex}`);
    params.push(data.error);
    paramIndex++;
  }

  updates.push(`updated_at = now()`);
  params.push(itemId);

  await query(
    `
    UPDATE image_optimization_items
    SET ${updates.join(', ')}
    WHERE id = $${paramIndex}
    `,
    params
  );
}

/**
 * Update image optimization job status
 */
export async function updateImageOptimizationJobStatus(
  jobId: number,
  status: JobStatus,
  error?: string
): Promise<void> {
  const params: any[] = [status];
  let queryText = `
    UPDATE image_optimization_jobs
    SET status = $1,
  `;

  if (status === 'RUNNING') {
    queryText += ` started_at = COALESCE(started_at, now()),`;
  }

  if (status === 'DONE' || status === 'FAILED' || status === 'CANCELED') {
    queryText += ` finished_at = now(),`;
  }

  if (error) {
    queryText += ` error = $2,`;
    params.push(error);
  }

  queryText = queryText.slice(0, -1); // Remove trailing comma
  queryText += ` WHERE id = $${params.length + 1}`;
  params.push(jobId);

  await query(queryText, params);
}

/**
 * Update job progress counters
 */
export async function updateImageOptimizationJobProgress(
  jobId: number,
  completedImages: number,
  failedImages: number
): Promise<void> {
  await query(
    `
    UPDATE image_optimization_jobs
    SET completed_images = $1,
        failed_images = $2
    WHERE id = $3
    `,
    [completedImages, failedImages, jobId]
  );
}

/**
 * Get pending image optimization items across all jobs with round-robin fairness
 * Ensures fair distribution across multiple stores
 * 
 * @param limit - Maximum number of items to claim (default: 100)
 * @param maxPerInstance - Maximum items per instance in this batch (default: 20)
 * @returns Array of pending items distributed fairly across instances
 */
export async function getPendingImageOptimizationItems(
  limit: number = 100,
  maxPerInstance: number = 20
): Promise<ImageOptimizationItem[]> {
  const result = await query<ImageOptimizationItem>(
    `
    WITH instance_batches AS (
      -- Get pending items grouped by instance with row numbers
      SELECT 
        ioi.id,
        ioj.instance_id,
        ROW_NUMBER() OVER (PARTITION BY ioj.instance_id ORDER BY ioi.id) as rn
      FROM image_optimization_items ioi
      INNER JOIN image_optimization_jobs ioj ON ioi.job_id = ioj.id
      WHERE ioi.status = 'PENDING'
        AND ioj.status IN ('PENDING', 'RUNNING')
    ),
    selected_items AS (
      -- Select up to maxPerInstance items from each instance
      SELECT id
      FROM instance_batches
      WHERE rn <= $1
      ORDER BY id
      LIMIT $2
    )
    SELECT ioi.* FROM image_optimization_items ioi
    WHERE ioi.id IN (SELECT id FROM selected_items)
    ORDER BY ioi.id
    `,
    [maxPerInstance, limit]
  );

  return result.rows;
}

/**
 * Get processing image optimization items (for polling)
 * Note: Using 'RUNNING' status until migration adds 'PROCESSING' to enum
 */
export async function getProcessingImageOptimizationItems(
  limit: number = 50
): Promise<ImageOptimizationItem[]> {
  const result = await query<ImageOptimizationItem>(
    `
    SELECT ioi.* FROM image_optimization_items ioi
    INNER JOIN image_optimization_jobs ioj ON ioi.job_id = ioj.id
    WHERE ioi.status = 'RUNNING'
      AND ioi.replicate_prediction_id IS NOT NULL
      AND ioj.status IN ('PENDING', 'RUNNING')
    ORDER BY ioi.updated_at ASC
    LIMIT $1
    `,
    [limit]
  );

  return result.rows;
}
