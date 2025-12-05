-- Add retry logic columns to blog_generations table
-- This allows the worker to automatically retry failed blog generations

ALTER TABLE blog_generations 
ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0;

ALTER TABLE blog_generations 
ADD COLUMN IF NOT EXISTS last_error TEXT;

ALTER TABLE blog_generations 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Create index for faster queries on retry_count
CREATE INDEX IF NOT EXISTS idx_blog_generations_retry_count 
ON blog_generations(retry_count);

-- Create index for faster queries on updated_at
CREATE INDEX IF NOT EXISTS idx_blog_generations_updated_at 
ON blog_generations(updated_at);

COMMENT ON COLUMN blog_generations.retry_count IS 'Number of retry attempts for failed blog generations';
COMMENT ON COLUMN blog_generations.last_error IS 'Last error message if blog generation failed';
COMMENT ON COLUMN blog_generations.updated_at IS 'Timestamp of last update to this record';
