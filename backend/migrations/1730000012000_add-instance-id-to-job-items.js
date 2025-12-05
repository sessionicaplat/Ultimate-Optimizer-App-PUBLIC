/* eslint-disable camelcase */

/**
 * Migration: Add instance_id to job_items for multi-store fairness
 * 
 * This enables:
 * - Round-robin processing across different Wix stores
 * - Prevents large jobs from one store blocking small jobs from another
 * - Faster queries without JOIN to jobs table
 */

exports.shorthands = undefined;

exports.up = (pgm) => {
  console.log('Adding instance_id column to job_items...');
  
  // Step 1: Add instance_id column (nullable initially)
  pgm.addColumn('job_items', {
    instance_id: {
      type: 'text',
      notNull: false,
    },
  });

  // Step 2: Backfill instance_id from jobs table
  pgm.sql(`
    UPDATE job_items
    SET instance_id = jobs.instance_id
    FROM jobs
    WHERE job_items.job_id = jobs.id
  `);

  // Step 3: Make instance_id NOT NULL after backfill
  pgm.alterColumn('job_items', 'instance_id', {
    notNull: true,
  });

  // Step 4: Add foreign key constraint
  pgm.addConstraint('job_items', 'fk_job_items_instance', {
    foreignKeys: {
      columns: 'instance_id',
      references: 'app_instances(instance_id)',
      onDelete: 'CASCADE',
    },
  });

  // Step 5: Create composite index for round-robin claiming
  // This index supports: WHERE instance_id = X AND status = 'PENDING' ORDER BY id
  pgm.createIndex('job_items', ['instance_id', 'status', 'id'], {
    name: 'idx_job_items_instance_status_id',
    where: "status IN ('PENDING', 'RUNNING')",
  });

  // Step 6: Create composite index for efficient status + id queries
  // This improves the claim query performance
  pgm.createIndex('job_items', ['status', 'id'], {
    name: 'idx_job_items_status_id',
    where: "status = 'PENDING'",
  });

  console.log('✓ Migration completed: instance_id added to job_items');
};

exports.down = (pgm) => {
  // Drop indexes first
  pgm.dropIndex('job_items', ['status', 'id'], {
    name: 'idx_job_items_status_id',
  });

  pgm.dropIndex('job_items', ['instance_id', 'status', 'id'], {
    name: 'idx_job_items_instance_status_id',
  });

  // Drop foreign key constraint
  pgm.dropConstraint('job_items', 'fk_job_items_instance');

  // Drop column
  pgm.dropColumn('job_items', 'instance_id');

  console.log('✓ Rollback completed: instance_id removed from job_items');
};
