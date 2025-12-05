/* eslint-disable camelcase */

/**
 * Migration: Add 'PROCESSING' status to item_status enum
 * 
 * This enables two-phase async processing for image optimization:
 * - PENDING: Item waiting to be processed
 * - RUNNING: Prediction being created
 * - PROCESSING: Prediction created, waiting for result
 * - DONE: Completed successfully
 * - FAILED: Failed with error
 */

exports.shorthands = undefined;

exports.up = (pgm) => {
  console.log('Adding PROCESSING status to item_status enum...');
  
  // Add 'PROCESSING' to the item_status enum
  pgm.sql(`
    ALTER TYPE item_status ADD VALUE IF NOT EXISTS 'PROCESSING' AFTER 'RUNNING';
  `);

  console.log('✓ Migration completed: PROCESSING status added to item_status enum');
};

exports.down = (pgm) => {
  // Note: PostgreSQL doesn't support removing enum values directly
  // You would need to recreate the enum type if rollback is needed
  console.log('⚠️  Warning: Cannot remove enum value in PostgreSQL');
  console.log('⚠️  Manual intervention required if rollback is needed');
};
