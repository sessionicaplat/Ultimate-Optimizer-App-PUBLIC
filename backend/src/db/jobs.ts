import { query, transaction } from './index';
import { Job, JobItem, JobStatus } from './types';
import { PoolClient } from 'pg';

/**
 * Create a new job with job items in a transaction
 */
export async function createJob(data: {
  instanceId: string;
  sourceScope: string;
  sourceIds: any;
  attributes: any;
  targetLang: string;
  userPrompt: string;
  productIds: string[];
  selectedAttributes: string[];
}): Promise<Job> {
  return transaction(async (client: PoolClient) => {
    // Create the job
    const jobResult = await client.query<Job>(
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
        data.sourceIds,
        data.attributes,
        data.targetLang,
        data.userPrompt,
        'PENDING' as JobStatus,
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
  });
}

/**
 * Get jobs for an instance with optional status filter
 */
export async function getJobs(
  instanceId: string,
  status?: string
): Promise<Job[]> {
  let queryText = `
    SELECT 
      j.*,
      COUNT(CASE WHEN ji.status = 'DONE' THEN 1 END) as completed_items,
      COUNT(CASE WHEN ji.published = true THEN 1 END) as published_items,
      COUNT(ji.id) as total_items
    FROM jobs j
    LEFT JOIN job_items ji ON j.id = ji.job_id
    WHERE j.instance_id = $1
  `;
  const params: any[] = [instanceId];

  if (status) {
    queryText += ` AND j.status = $2`;
    params.push(status.toUpperCase());
  }

  queryText += ` 
    GROUP BY j.id
    ORDER BY j.created_at DESC
  `;

  const result = await query<Job>(queryText, params);
  return result.rows;
}

/**
 * Get a single job by ID (with instance verification)
 */
export async function getJob(
  jobId: number,
  instanceId: string
): Promise<Job | null> {
  const result = await query<Job>(
    `
    SELECT * FROM jobs
    WHERE id = $1 AND instance_id = $2
    `,
    [jobId, instanceId]
  );

  return result.rows[0] || null;
}

/**
 * Get job items for a job (with instance verification)
 */
export async function getJobItems(
  jobId: number,
  instanceId: string
): Promise<JobItem[]> {
  const result = await query<JobItem>(
    `
    SELECT ji.* FROM job_items ji
    INNER JOIN jobs j ON ji.job_id = j.id
    WHERE ji.job_id = $1 AND j.instance_id = $2
    ORDER BY ji.id
    `,
    [jobId, instanceId]
  );

  return result.rows;
}

/**
 * Get a single job item by ID (with instance verification)
 */
export async function getJobItem(
  itemId: number,
  instanceId: string
): Promise<JobItem | null> {
  const result = await query<JobItem>(
    `
    SELECT ji.* FROM job_items ji
    INNER JOIN jobs j ON ji.job_id = j.id
    WHERE ji.id = $1 AND j.instance_id = $2
    `,
    [itemId, instanceId]
  );

  return result.rows[0] || null;
}

/**
 * Update job item status and values
 */
export async function updateJobItem(
  itemId: number,
  data: {
    beforeValue?: string;
    afterValue?: string;
    status?: string;
    error?: string;
  }
): Promise<void> {
  const updates: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  if (data.beforeValue !== undefined) {
    updates.push(`before_value = $${paramIndex}`);
    params.push(data.beforeValue);
    paramIndex++;
  }

  if (data.afterValue !== undefined) {
    updates.push(`after_value = $${paramIndex}`);
    params.push(data.afterValue);
    paramIndex++;
  }

  if (data.status !== undefined) {
    updates.push(`status = $${paramIndex}`);
    params.push(data.status);
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
    UPDATE job_items
    SET ${updates.join(', ')}
    WHERE id = $${paramIndex}
    `,
    params
  );
}

/**
 * Update job status
 */
export async function updateJobStatus(
  jobId: number,
  status: JobStatus,
  error?: string
): Promise<void> {
  const params: any[] = [status];
  let queryText = `
    UPDATE jobs
    SET status = $1,
  `;

  if (status === 'RUNNING' && !error) {
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
