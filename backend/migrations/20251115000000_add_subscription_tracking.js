/* eslint-disable camelcase */

/**
 * Migration: Add Subscription Tracking Columns
 * 
 * Adds columns to track subscription billing cycles:
 * - subscription_start_date: When the user first subscribed to a paid plan
 * - next_billing_date: When the next billing cycle occurs (30 days from start)
 * 
 * This enables proper credit addition based on subscription cycles
 * rather than calendar months.
 */

exports.shorthands = undefined;

exports.up = (pgm) => {
  // Add subscription tracking columns
  pgm.addColumns('app_instances', {
    subscription_start_date: {
      type: 'timestamptz',
      notNull: false,
      comment: 'Date when user first subscribed to a paid plan'
    },
    next_billing_date: {
      type: 'timestamptz',
      notNull: false,
      comment: 'Date when next billing cycle occurs (30 days from subscription start)'
    }
  });

  // Create index for efficient billing cycle queries
  pgm.createIndex('app_instances', 'next_billing_date', {
    name: 'idx_app_instances_next_billing',
    where: 'next_billing_date IS NOT NULL'
  });

  console.log('✅ Added subscription tracking columns to app_instances');
};

exports.down = (pgm) => {
  // Drop index
  pgm.dropIndex('app_instances', 'next_billing_date', {
    name: 'idx_app_instances_next_billing'
  });

  // Drop columns
  pgm.dropColumns('app_instances', ['subscription_start_date', 'next_billing_date']);
};
