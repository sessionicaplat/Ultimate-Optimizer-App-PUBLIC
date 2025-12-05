/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  // Create ENUM types
  pgm.createType('job_status', ['PENDING', 'RUNNING', 'DONE', 'FAILED', 'CANCELED']);
  pgm.createType('item_status', ['PENDING', 'RUNNING', 'DONE', 'FAILED']);

  // Create plans table
  pgm.createTable('plans', {
    id: { type: 'text', primaryKey: true },
    name: { type: 'text', notNull: true },
    price_cents: { type: 'integer', notNull: true },
    monthly_credits: { type: 'integer', notNull: true }
  });

  // Create app_instances table
  pgm.createTable('app_instances', {
    instance_id: { type: 'text', primaryKey: true },
    site_host: { type: 'text', notNull: true },
    access_token: { type: 'text', notNull: true },
    refresh_token: { type: 'text', notNull: true },
    token_expires_at: { type: 'timestamptz', notNull: true },
    plan_id: {
      type: 'text',
      notNull: true,
      default: 'free',
      references: 'plans(id)'
    },
    credits_total: { type: 'integer', notNull: true, default: 200 },
    credits_used_month: { type: 'integer', notNull: true, default: 0 },
    credits_reset_on: {
      type: 'date',
      notNull: true,
      default: pgm.func("(date_trunc('month', now()) + interval '1 month')::date")
    },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') }
  });

  // Create jobs table
  pgm.createTable('jobs', {
    id: { type: 'bigserial', primaryKey: true },
    instance_id: {
      type: 'text',
      notNull: true,
      references: 'app_instances(instance_id)',
      onDelete: 'CASCADE'
    },
    status: { type: 'job_status', notNull: true, default: 'PENDING' },
    source_scope: { type: 'text', notNull: true },
    source_ids: { type: 'jsonb', notNull: true },
    attributes: { type: 'jsonb', notNull: true },
    target_lang: { type: 'text', notNull: true },
    user_prompt: { type: 'text', notNull: true },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    started_at: { type: 'timestamptz' },
    finished_at: { type: 'timestamptz' },
    error: { type: 'text' }
  });

  // Create job_items table
  pgm.createTable('job_items', {
    id: { type: 'bigserial', primaryKey: true },
    job_id: {
      type: 'bigint',
      notNull: true,
      references: 'jobs(id)',
      onDelete: 'CASCADE'
    },
    product_id: { type: 'text', notNull: true },
    attribute: { type: 'text', notNull: true },
    before_value: { type: 'text' },
    after_value: { type: 'text' },
    status: { type: 'item_status', notNull: true, default: 'PENDING' },
    error: { type: 'text' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') }
  });

  // Create publish_logs table
  pgm.createTable('publish_logs', {
    id: { type: 'bigserial', primaryKey: true },
    instance_id: {
      type: 'text',
      notNull: true,
      references: 'app_instances(instance_id)',
      onDelete: 'CASCADE'
    },
    product_id: { type: 'text', notNull: true },
    attribute: { type: 'text', notNull: true },
    applied_value: { type: 'text', notNull: true },
    applied_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') }
  });

  // Create indexes for app_instances
  pgm.createIndex('app_instances', 'site_host', { name: 'idx_app_instances_site_host' });
  pgm.createIndex('app_instances', 'credits_reset_on', { name: 'idx_app_instances_credits_reset' });

  // Create indexes for jobs
  pgm.createIndex('jobs', ['instance_id', 'status'], { name: 'idx_jobs_instance_status' });
  pgm.createIndex('jobs', 'created_at', { 
    name: 'idx_jobs_created_at',
    method: 'btree',
    order: 'DESC'
  });

  // Create indexes for job_items
  pgm.createIndex('job_items', 'job_id', { name: 'idx_job_items_job_id' });
  pgm.createIndex('job_items', 'status', { 
    name: 'idx_job_items_status',
    where: "status IN ('PENDING', 'RUNNING')"
  });
  pgm.createIndex('job_items', 'product_id', { name: 'idx_job_items_product' });

  // Create indexes for publish_logs
  pgm.createIndex('publish_logs', ['instance_id', 'applied_at'], { 
    name: 'idx_publish_logs_instance',
    method: 'btree',
    order: 'DESC'
  });
  pgm.createIndex('publish_logs', 'product_id', { name: 'idx_publish_logs_product' });

  // Seed plans table
  pgm.sql(`
    INSERT INTO plans (id, name, price_cents, monthly_credits) VALUES
      ('free', 'Free', 0, 200),
      ('starter', 'Starter', 900, 1000),
      ('pro', 'Pro', 1900, 5000),
      ('scale', 'Scale', 4900, 25000);
  `);
};

exports.down = (pgm) => {
  // Drop tables in reverse order (respecting foreign key constraints)
  pgm.dropTable('publish_logs');
  pgm.dropTable('job_items');
  pgm.dropTable('jobs');
  pgm.dropTable('app_instances');
  pgm.dropTable('plans');

  // Drop ENUM types
  pgm.dropType('item_status');
  pgm.dropType('job_status');
};
