import { query } from './index';
import { PublishLog } from './types';

/**
 * Create a publish log entry
 */
export async function createPublishLog(data: {
  instanceId: string;
  productId: string;
  attribute: string;
  appliedValue: string;
  jobItemId?: number;
}): Promise<PublishLog> {
  const result = await query<PublishLog>(
    `
    INSERT INTO publish_logs (
      instance_id,
      product_id,
      attribute,
      applied_value,
      job_item_id
    ) VALUES ($1, $2, $3, $4, $5)
    RETURNING *
    `,
    [
      data.instanceId,
      data.productId,
      data.attribute,
      data.appliedValue,
      data.jobItemId ?? null,
    ]
  );

  return result.rows[0];
}

/**
 * Get publish logs for an instance
 */
export async function getPublishLogs(
  instanceId: string,
  limit: number = 100
): Promise<PublishLog[]> {
  const result = await query<PublishLog>(
    `
    SELECT * FROM publish_logs
    WHERE instance_id = $1
    ORDER BY applied_at DESC
    LIMIT $2
    `,
    [instanceId, limit]
  );

  return result.rows;
}

/**
 * Get publish logs for a specific product
 */
export async function getPublishLogsByProduct(
  instanceId: string,
  productId: string
): Promise<PublishLog[]> {
  const result = await query<PublishLog>(
    `
    SELECT * FROM publish_logs
    WHERE instance_id = $1 AND product_id = $2
    ORDER BY applied_at DESC
    `,
    [instanceId, productId]
  );

  return result.rows;
}
