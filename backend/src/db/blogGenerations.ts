import { query } from './index';

export interface BlogGeneration {
  id: number;
  instance_id: string;
  status:
    | 'PENDING'
    | 'GENERATING_IDEAS'
    | 'AWAITING_SELECTION'
    | 'GENERATING_CONTENT'
    | 'GENERATING_IMAGE'
    | 'PUBLISHING'
    | 'DONE'
    | 'FAILED';
  source_type: 'product' | 'keyword';
  source_id?: string;
  blog_ideas?: any;
  selected_idea_index?: number | null;
  blog_title?: string;
  blog_content?: string;
  blog_image_url?: string;
  blog_image_prompt?: string;
  draft_post_id?: string;
  published_post_id?: string;
  error?: string;
  created_at: Date;
  started_at?: Date;
  finished_at?: Date;
}

/**
 * Create a new blog generation
 */
export async function createBlogGeneration(data: {
  instanceId: string;
  sourceType: 'product' | 'keyword';
  sourceId?: string;
}): Promise<BlogGeneration> {
  const result = await query<BlogGeneration>(
    `
    INSERT INTO blog_generations (instance_id, source_type, source_id, status)
    VALUES ($1, $2, $3, 'PENDING')
    RETURNING *
    `,
    [data.instanceId, data.sourceType, data.sourceId || null]
  );

  return result.rows[0];
}

/**
 * Get blog generations for an instance
 */
export async function getBlogGenerations(
  instanceId: string,
  status?: string
): Promise<BlogGeneration[]> {
  let queryText = `
    SELECT * FROM blog_generations
    WHERE instance_id = $1
  `;
  const params: any[] = [instanceId];

  if (status) {
    queryText += ` AND status = $2`;
    params.push(status.toUpperCase());
  }

  queryText += ` ORDER BY created_at DESC`;

  const result = await query<BlogGeneration>(queryText, params);
  return result.rows;
}

/**
 * Get a single blog generation by ID
 */
export async function getBlogGeneration(
  id: number,
  instanceId: string
): Promise<BlogGeneration | null> {
  const result = await query<BlogGeneration>(
    `
    SELECT * FROM blog_generations
    WHERE id = $1 AND instance_id = $2
    `,
    [id, instanceId]
  );

  return result.rows[0] || null;
}

/**
 * Update blog generation
 */
export async function updateBlogGeneration(
  id: number,
  data: Partial<BlogGeneration>
): Promise<void> {
  const updates: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  if (data.status) {
    updates.push(`status = $${paramIndex}`);
    params.push(data.status);
    paramIndex++;

    if (data.status === 'GENERATING_IDEAS' && !data.started_at) {
      updates.push(`started_at = NOW()`);
    }

    if (data.status === 'DONE' || data.status === 'FAILED') {
      updates.push(`finished_at = NOW()`);
    }
  }

  if (data.blog_ideas !== undefined) {
    updates.push(`blog_ideas = $${paramIndex}`);
    params.push(JSON.stringify(data.blog_ideas));
    paramIndex++;
  }

  if (data.selected_idea_index !== undefined) {
    updates.push(`selected_idea_index = $${paramIndex}`);
    params.push(data.selected_idea_index);
    paramIndex++;
  }

  if (data.blog_title !== undefined) {
    updates.push(`blog_title = $${paramIndex}`);
    params.push(data.blog_title);
    paramIndex++;
  }

  if (data.blog_content !== undefined) {
    updates.push(`blog_content = $${paramIndex}`);
    params.push(data.blog_content);
    paramIndex++;
  }

  if (data.blog_image_url !== undefined) {
    updates.push(`blog_image_url = $${paramIndex}`);
    params.push(data.blog_image_url);
    paramIndex++;
  }

  if (data.blog_image_prompt !== undefined) {
    updates.push(`blog_image_prompt = $${paramIndex}`);
    params.push(data.blog_image_prompt);
    paramIndex++;
  }

  if (data.draft_post_id !== undefined) {
    updates.push(`draft_post_id = $${paramIndex}`);
    params.push(data.draft_post_id);
    paramIndex++;
  }

  if (data.published_post_id !== undefined) {
    updates.push(`published_post_id = $${paramIndex}`);
    params.push(data.published_post_id);
    paramIndex++;
  }

  if (data.error !== undefined) {
    updates.push(`error = $${paramIndex}`);
    params.push(data.error);
    paramIndex++;
  }

  if (updates.length === 0) {
    return;
  }

  params.push(id);

  await query(
    `
    UPDATE blog_generations
    SET ${updates.join(', ')}
    WHERE id = $${paramIndex}
    `,
    params
  );
}

/**
 * Get pending blog generations with multi-store fairness
 * Uses round-robin distribution to ensure fair processing across instances
 * 
 * @param limit - Maximum total items to return (default: 100)
 * @param maxPerInstance - Maximum items per instance (default: 20)
 */
export async function getPendingBlogGenerations(
  limit: number = 100,
  maxPerInstance: number = 20
): Promise<BlogGeneration[]> {
  const result = await query<BlogGeneration>(
    `
    WITH instance_batches AS (
      SELECT 
        *,
        ROW_NUMBER() OVER (PARTITION BY instance_id ORDER BY created_at ASC) as rn
      FROM blog_generations
      WHERE status = 'PENDING'
    )
    SELECT *
    FROM instance_batches
    WHERE rn <= $1
    ORDER BY created_at ASC
    LIMIT $2
    `,
    [maxPerInstance, limit]
  );

  return result.rows;
}

/**
 * Get blog generations by status with multi-store fairness
 * Allows processing blogs at specific stages in parallel
 * 
 * @param status - Status to filter by
 * @param limit - Maximum total items to return (default: 100)
 * @param maxPerInstance - Maximum items per instance (default: 20)
 */
export async function getBlogGenerationsByStatus(
  status: BlogGeneration['status'],
  limit: number = 100,
  maxPerInstance: number = 20
): Promise<BlogGeneration[]> {
  const result = await query<BlogGeneration>(
    `
    WITH instance_batches AS (
      SELECT 
        *,
        ROW_NUMBER() OVER (PARTITION BY instance_id ORDER BY created_at ASC) as rn
      FROM blog_generations
      WHERE status = $1
    )
    SELECT *
    FROM instance_batches
    WHERE rn <= $2
    ORDER BY created_at ASC
    LIMIT $3
    `,
    [status, maxPerInstance, limit]
  );

  return result.rows;
}

/**
 * Get count of pending blog generations
 */
export async function getPendingBlogGenerationsCount(): Promise<number> {
  const result = await query<{ count: string }>(
    `SELECT COUNT(*) as count FROM blog_generations WHERE status = 'PENDING'`
  );
  return parseInt(result.rows[0]?.count || '0', 10);
}

/**
 * Get all blogs that need processing (any stage except DONE, FAILED, AWAITING_SELECTION)
 * Uses round-robin distribution for fairness
 * Prioritizes blogs with fewer retry attempts
 * 
 * @param limit - Maximum total items to return (default: 1000)
 * @param maxPerInstance - Maximum items per instance (default: 50)
 */
export async function getAllBlogsNeedingProcessing(
  limit: number = 1000,
  maxPerInstance: number = 50
): Promise<BlogGeneration[]> {
  const result = await query<BlogGeneration>(
    `
    WITH instance_batches AS (
      SELECT 
        *,
        ROW_NUMBER() OVER (
          PARTITION BY instance_id 
          ORDER BY 
            COALESCE(retry_count, 0) ASC,  -- Prioritize blogs with fewer retries
            created_at ASC                  -- Then by creation time
        ) as rn
      FROM blog_generations
      WHERE status IN ('PENDING', 'GENERATING_IDEAS', 'GENERATING_CONTENT', 'GENERATING_IMAGE', 'PUBLISHING')
        AND COALESCE(retry_count, 0) < 3  -- Exclude blogs that have exceeded max retries
    )
    SELECT *
    FROM instance_batches
    WHERE rn <= $1
    ORDER BY 
      COALESCE(retry_count, 0) ASC,  -- Process blogs with fewer retries first
      created_at ASC
    LIMIT $2
    `,
    [maxPerInstance, limit]
  );

  return result.rows;
}
