/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  // Create image_optimization_jobs table
  pgm.createTable('image_optimization_jobs', {
    id: { type: 'bigserial', primaryKey: true },
    instance_id: {
      type: 'text',
      notNull: true,
      references: 'app_instances(instance_id)',
      onDelete: 'CASCADE'
    },
    product_id: { type: 'text', notNull: true },
    product_name: { type: 'text', notNull: true },
    status: { type: 'job_status', notNull: true, default: 'PENDING' },
    total_images: { type: 'integer', notNull: true },
    completed_images: { type: 'integer', notNull: true, default: 0 },
    failed_images: { type: 'integer', notNull: true, default: 0 },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    started_at: { type: 'timestamptz' },
    finished_at: { type: 'timestamptz' },
    error: { type: 'text' }
  });

  // Create image_optimization_items table
  pgm.createTable('image_optimization_items', {
    id: { type: 'bigserial', primaryKey: true },
    job_id: {
      type: 'bigint',
      notNull: true,
      references: 'image_optimization_jobs(id)',
      onDelete: 'CASCADE'
    },
    image_id: { type: 'text', notNull: true },
    image_url: { type: 'text', notNull: true },
    prompt: { type: 'text', notNull: true },
    status: { type: 'item_status', notNull: true, default: 'PENDING' },
    replicate_prediction_id: { type: 'text' },
    optimized_image_url: { type: 'text' },
    error: { type: 'text' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') }
  });

  // Create indexes
  pgm.createIndex('image_optimization_jobs', ['instance_id', 'status'], { 
    name: 'idx_image_opt_jobs_instance_status' 
  });
  pgm.createIndex('image_optimization_jobs', 'created_at', { 
    name: 'idx_image_opt_jobs_created_at',
    method: 'btree',
    order: 'DESC'
  });
  pgm.createIndex('image_optimization_items', 'job_id', { 
    name: 'idx_image_opt_items_job_id' 
  });
  pgm.createIndex('image_optimization_items', 'status', { 
    name: 'idx_image_opt_items_status',
    where: "status IN ('PENDING', 'RUNNING')"
  });
};

exports.down = (pgm) => {
  pgm.dropTable('image_optimization_items');
  pgm.dropTable('image_optimization_jobs');
};
