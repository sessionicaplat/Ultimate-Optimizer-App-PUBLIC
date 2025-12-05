/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  // Create blog_generations table
  pgm.createTable('blog_generations', {
    id: { type: 'bigserial', primaryKey: true },
    instance_id: {
      type: 'text',
      notNull: true,
      references: 'app_instances(instance_id)',
      onDelete: 'CASCADE'
    },
    status: { type: 'text', notNull: true, default: 'PENDING' },
    source_type: { type: 'text', notNull: true },
    source_id: { type: 'text' },
    blog_ideas: { type: 'jsonb' },
    selected_idea_index: { type: 'integer' },
    blog_title: { type: 'text' },
    blog_content: { type: 'text' },
    blog_image_url: { type: 'text' },
    blog_image_prompt: { type: 'text' },
    draft_post_id: { type: 'text' },
    published_post_id: { type: 'text' },
    error: { type: 'text' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    started_at: { type: 'timestamptz' },
    finished_at: { type: 'timestamptz' }
  });

  // Create indexes
  pgm.createIndex('blog_generations', 'instance_id', { 
    name: 'idx_blog_generations_instance' 
  });
  pgm.createIndex('blog_generations', 'status', { 
    name: 'idx_blog_generations_status' 
  });
  pgm.createIndex('blog_generations', 'created_at', { 
    name: 'idx_blog_generations_created',
    method: 'btree',
    order: 'DESC'
  });
};

exports.down = (pgm) => {
  pgm.dropTable('blog_generations');
};
