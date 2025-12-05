import { query } from './index';

export interface BlogCampaign {
  id: number;
  instance_id: string;
  name: string;
  status: 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
  created_at: Date;
  updated_at: Date;
  archived_at?: Date;
}

export interface ScheduledBlog {
  id: number;
  campaign_id: number;
  instance_id: string;
  source_type: 'product' | 'keyword';
  source_id?: string;
  blog_idea?: any;
  scheduled_date: Date;
  status: 'SCHEDULED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  blog_generation_id?: number;
  error?: string;
  created_at: Date;
  executed_at?: Date;
}

/**
 * Create a new campaign
 */
export async function createCampaign(data: {
  instanceId: string;
  name: string;
}): Promise<BlogCampaign> {
  const result = await query<BlogCampaign>(
    `INSERT INTO blog_campaigns (instance_id, name, status)
     VALUES ($1, $2, 'ACTIVE')
     RETURNING *`,
    [data.instanceId, data.name]
  );
  return result.rows[0];
}

/**
 * Get campaigns for an instance
 */
export async function getCampaigns(
  instanceId: string,
  includeArchived: boolean = false
): Promise<BlogCampaign[]> {
  const whereClause = includeArchived
    ? 'WHERE instance_id = $1'
    : 'WHERE instance_id = $1 AND status != $2';
  
  const params = includeArchived ? [instanceId] : [instanceId, 'ARCHIVED'];

  const result = await query<BlogCampaign>(
    `SELECT * FROM blog_campaigns ${whereClause} ORDER BY created_at DESC`,
    params
  );
  return result.rows;
}

/**
 * Get a single campaign
 */
export async function getCampaign(
  id: number,
  instanceId: string
): Promise<BlogCampaign | null> {
  const result = await query<BlogCampaign>(
    `SELECT * FROM blog_campaigns WHERE id = $1 AND instance_id = $2`,
    [id, instanceId]
  );
  return result.rows[0] || null;
}

/**
 * Update campaign
 */
export async function updateCampaign(
  id: number,
  data: Partial<BlogCampaign>
): Promise<void> {
  const updates: string[] = ['updated_at = NOW()'];
  const params: any[] = [];
  let paramIndex = 1;

  if (data.name) {
    updates.push(`name = $${paramIndex}`);
    params.push(data.name);
    paramIndex++;
  }

  if (data.status) {
    updates.push(`status = $${paramIndex}`);
    params.push(data.status);
    paramIndex++;

    if (data.status === 'ARCHIVED') {
      updates.push('archived_at = NOW()');
    }
  }

  params.push(id);

  await query(
    `UPDATE blog_campaigns SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
    params
  );
}

/**
 * Delete campaign
 */
export async function deleteCampaign(id: number): Promise<void> {
  await query('DELETE FROM blog_campaigns WHERE id = $1', [id]);
}

/**
 * Create scheduled blog
 */
export async function createScheduledBlog(data: {
  campaignId: number;
  instanceId: string;
  sourceType: 'product' | 'keyword';
  sourceId?: string;
  blogIdea?: any;
  scheduledDate: Date;
}): Promise<ScheduledBlog> {
  const result = await query<ScheduledBlog>(
    `INSERT INTO scheduled_blogs 
     (campaign_id, instance_id, source_type, source_id, blog_idea, scheduled_date, status)
     VALUES ($1, $2, $3, $4, $5, $6, 'SCHEDULED')
     RETURNING *`,
    [
      data.campaignId,
      data.instanceId,
      data.sourceType,
      data.sourceId || null,
      data.blogIdea ? JSON.stringify(data.blogIdea) : null,
      data.scheduledDate,
    ]
  );
  return result.rows[0];
}

/**
 * Get scheduled blogs for a campaign
 */
export async function getScheduledBlogs(
  campaignId: number,
  instanceId: string
): Promise<ScheduledBlog[]> {
  const result = await query<ScheduledBlog>(
    `SELECT * FROM scheduled_blogs 
     WHERE campaign_id = $1 AND instance_id = $2 
     ORDER BY scheduled_date ASC`,
    [campaignId, instanceId]
  );
  return result.rows;
}

/**
 * Get all scheduled blogs for an instance
 */
export async function getAllScheduledBlogs(
  instanceId: string
): Promise<ScheduledBlog[]> {
  const result = await query<ScheduledBlog>(
    `SELECT * FROM scheduled_blogs 
     WHERE instance_id = $1 
     ORDER BY scheduled_date ASC`,
    [instanceId]
  );
  return result.rows;
}

/**
 * Get due scheduled blogs (ready to execute)
 */
export async function getDueScheduledBlogs(): Promise<ScheduledBlog[]> {
  const result = await query<ScheduledBlog>(
    `SELECT * FROM scheduled_blogs 
     WHERE status = 'SCHEDULED' AND scheduled_date <= NOW() AT TIME ZONE 'UTC'
     ORDER BY scheduled_date ASC
     LIMIT 10`
  );
  
  // Log for debugging
  if (result.rows.length > 0) {
    console.log('[Blog Scheduler DB] Due blogs found:', result.rows.map(b => ({
      id: b.id,
      scheduled_date: b.scheduled_date,
      now: new Date().toISOString()
    })));
  }
  
  return result.rows;
}

/**
 * Update scheduled blog
 */
export async function updateScheduledBlog(
  id: number,
  data: Partial<ScheduledBlog>
): Promise<void> {
  const updates: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  if (data.status) {
    updates.push(`status = $${paramIndex}`);
    params.push(data.status);
    paramIndex++;

    if (data.status === 'PROCESSING' || data.status === 'COMPLETED' || data.status === 'FAILED') {
      updates.push('executed_at = NOW()');
    }
  }

  if (data.blog_generation_id !== undefined) {
    updates.push(`blog_generation_id = $${paramIndex}`);
    params.push(data.blog_generation_id);
    paramIndex++;
  }

  if (data.error !== undefined) {
    updates.push(`error = $${paramIndex}`);
    params.push(data.error);
    paramIndex++;
  }

  if (data.scheduled_date) {
    updates.push(`scheduled_date = $${paramIndex}`);
    params.push(data.scheduled_date);
    paramIndex++;
  }

  if (updates.length === 0) return;

  params.push(id);

  await query(
    `UPDATE scheduled_blogs SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
    params
  );
}

/**
 * Delete scheduled blog
 */
export async function deleteScheduledBlog(id: number): Promise<void> {
  await query('DELETE FROM scheduled_blogs WHERE id = $1', [id]);
}

/**
 * Get campaign with scheduled blogs count
 */
export async function getCampaignWithStats(
  id: number,
  instanceId: string
): Promise<any> {
  const result = await query(
    `SELECT 
      c.*,
      COUNT(sb.id) as total_blogs,
      COUNT(CASE WHEN sb.status = 'SCHEDULED' THEN 1 END) as scheduled_count,
      COUNT(CASE WHEN sb.status = 'COMPLETED' THEN 1 END) as completed_count,
      COUNT(CASE WHEN sb.status = 'FAILED' THEN 1 END) as failed_count
     FROM blog_campaigns c
     LEFT JOIN scheduled_blogs sb ON c.id = sb.campaign_id
     WHERE c.id = $1 AND c.instance_id = $2
     GROUP BY c.id`,
    [id, instanceId]
  );
  return result.rows[0] || null;
}
