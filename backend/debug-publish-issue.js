/**
 * Debug script to check what's in the image optimization job
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function debugPublishIssue() {
  try {
    console.log('Checking image optimization job 7...\n');

    // Get the job
    const jobResult = await pool.query(
      'SELECT * FROM image_optimization_jobs WHERE id = $1',
      [7]
    );

    if (jobResult.rows.length === 0) {
      console.log('Job 7 not found');
      return;
    }

    const job = jobResult.rows[0];
    console.log('Job details:');
    console.log('- ID:', job.id);
    console.log('- Product ID:', job.product_id);
    console.log('- Product Name:', job.product_name);
    console.log('- Status:', job.status);
    console.log();

    // Get the items
    const itemsResult = await pool.query(
      'SELECT * FROM image_optimization_items WHERE job_id = $1',
      [7]
    );

    console.log(`Found ${itemsResult.rows.length} items:`);
    itemsResult.rows.forEach((item, index) => {
      console.log(`\nItem ${index + 1}:`);
      console.log('- ID:', item.id);
      console.log('- Image ID:', item.image_id);
      console.log('- Status:', item.status);
      console.log('- Optimized URL:', item.optimized_image_url ? 'Yes' : 'No');
      if (item.optimized_image_url) {
        console.log('  URL:', item.optimized_image_url.substring(0, 80) + '...');
      }
    });

    console.log('\n\nNow checking if product exists in Wix...');
    console.log('Product ID to look for:', job.product_id);
    console.log('\nTry running this in your app to verify the product exists:');
    console.log(`  const product = await wixClient.getProduct('${job.product_id}');`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

debugPublishIssue();
