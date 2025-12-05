/**
 * Migration: Blog Scheduler and Campaigns Schema
 * Creates tables for scheduled blog posts and campaigns
 */

exports.up = (pgm) => {
  // Create campaigns table
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS blog_campaigns (
      id SERIAL PRIMARY KEY,
      instance_id VARCHAR(255) NOT NULL,
      name VARCHAR(500) NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      archived_at TIMESTAMP,
      CONSTRAINT fk_campaign_instance FOREIGN KEY (instance_id) 
        REFERENCES app_instances(instance_id) ON DELETE CASCADE
    );
  `);

  // Create scheduled blogs table
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS scheduled_blogs (
      id SERIAL PRIMARY KEY,
      campaign_id INTEGER NOT NULL,
      instance_id VARCHAR(255) NOT NULL,
      source_type VARCHAR(50) NOT NULL,
      source_id VARCHAR(255),
      blog_idea JSONB,
      scheduled_date TIMESTAMP NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'SCHEDULED',
      blog_generation_id INTEGER,
      error TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      executed_at TIMESTAMP,
      CONSTRAINT fk_scheduled_campaign FOREIGN KEY (campaign_id) 
        REFERENCES blog_campaigns(id) ON DELETE CASCADE,
      CONSTRAINT fk_scheduled_instance FOREIGN KEY (instance_id) 
        REFERENCES app_instances(instance_id) ON DELETE CASCADE,
      CONSTRAINT fk_scheduled_generation FOREIGN KEY (blog_generation_id) 
        REFERENCES blog_generations(id) ON DELETE SET NULL
    );
  `);

  // Create indexes
  pgm.sql(`
    CREATE INDEX IF NOT EXISTS idx_campaigns_instance ON blog_campaigns(instance_id);
    CREATE INDEX IF NOT EXISTS idx_campaigns_status ON blog_campaigns(status);
    CREATE INDEX IF NOT EXISTS idx_scheduled_campaign ON scheduled_blogs(campaign_id);
    CREATE INDEX IF NOT EXISTS idx_scheduled_instance ON scheduled_blogs(instance_id);
    CREATE INDEX IF NOT EXISTS idx_scheduled_date ON scheduled_blogs(scheduled_date);
    CREATE INDEX IF NOT EXISTS idx_scheduled_status ON scheduled_blogs(status);
  `);
};

exports.down = (pgm) => {
  pgm.sql('DROP TABLE IF EXISTS scheduled_blogs CASCADE;');
  pgm.sql('DROP TABLE IF EXISTS blog_campaigns CASCADE;');
};
