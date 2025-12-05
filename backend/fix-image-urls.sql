-- Fix image optimization URLs by removing surrounding quotes
-- Run this in Render's PostgreSQL console or via psql

-- First, let's see what we're fixing
SELECT 
  id, 
  LEFT(optimized_image_url, 80) as url_preview,
  LENGTH(optimized_image_url) as url_length
FROM image_optimization_items
WHERE optimized_image_url IS NOT NULL
  AND (optimized_image_url LIKE '"%"' OR optimized_image_url LIKE '''%''');

-- Now fix them
UPDATE image_optimization_items
SET optimized_image_url = TRIM(BOTH '"' FROM TRIM(BOTH '''' FROM optimized_image_url))
WHERE optimized_image_url IS NOT NULL
  AND (optimized_image_url LIKE '"%"' OR optimized_image_url LIKE '''%''');

-- Verify the fix
SELECT 
  id, 
  LEFT(optimized_image_url, 80) as url_preview,
  LENGTH(optimized_image_url) as url_length
FROM image_optimization_items
WHERE optimized_image_url IS NOT NULL
ORDER BY id DESC
LIMIT 5;
