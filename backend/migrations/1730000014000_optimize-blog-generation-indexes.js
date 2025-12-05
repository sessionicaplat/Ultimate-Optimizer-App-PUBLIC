/**
 * Migration: Optimize blog generation indexes for high-concurrency processing
 * 
 * Adds optimized indexes to support:
 * - Fast pending blog queries with multi-store fairness
 * - Efficient status-based filtering
 * - Quick instance-based lookups
 */

exports.up = (pgm) => {
  // Drop old index if it exists
  pgm.sql(`
    DROP INDEX IF EXISTS idx_blog_generations_status;
  `);

  // Create composite index for pending blog queries (status + created_at)
  // This supports the round-robin fairness query efficiently
  pgm.createIndex('blog_generations', ['status', 'created_at'], {
    name: 'idx_blog_generations_pending',
    where: "status = 'PENDING'",
    method: 'btree',
  });

  // Create composite index for instance + status queries
  // Supports multi-store fairness and per-instance filtering
  pgm.createIndex('blog_generations', ['instance_id', 'status', 'created_at'], {
    name: 'idx_blog_generations_instance_status',
    method: 'btree',
  });

  // Create index for scheduled blog lookups
  pgm.createIndex('scheduled_blogs', ['blog_generation_id'], {
    name: 'idx_scheduled_blogs_generation',
    where: 'blog_generation_id IS NOT NULL',
  });

  console.log('[Migration] Blog generation indexes optimized for high concurrency');
};

exports.down = (pgm) => {
  pgm.dropIndex('blog_generations', ['status', 'created_at'], {
    name: 'idx_blog_generations_pending',
    ifExists: true,
  });

  pgm.dropIndex('blog_generations', ['instance_id', 'status', 'created_at'], {
    name: 'idx_blog_generations_instance_status',
    ifExists: true,
  });

  pgm.dropIndex('scheduled_blogs', ['blog_generation_id'], {
    name: 'idx_scheduled_blogs_generation',
    ifExists: true,
  });

  // Recreate original index
  pgm.createIndex('blog_generations', 'status', {
    name: 'idx_blog_generations_status',
  });
};
