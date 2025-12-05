/**
 * Quick diagnostic script to check worker status
 * Run with: node backend/check-worker-status.js
 */

const { Pool } = require('pg');

async function checkWorkerStatus() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('=== Worker Status Diagnostic ===\n');

    // Check for pending jobs
    const pendingJobs = await pool.query(
      "SELECT COUNT(*) as count FROM jobs WHERE status = 'PENDING'"
    );
    console.log(`Pending jobs: ${pendingJobs.rows[0].count}`);

    // Check for running jobs
    const runningJobs = await pool.query(
      "SELECT COUNT(*) as count FROM jobs WHERE status = 'RUNNING'"
    );
    console.log(`Running jobs: ${runningJobs.rows[0].count}`);

    // Check for pending items
    const pendingItems = await pool.query(
      "SELECT COUNT(*) as count FROM job_items WHERE status = 'PENDING'"
    );
    console.log(`Pending items: ${pendingItems.rows[0].count}`);

    // Check for running items
    const runningItems = await pool.query(
      "SELECT COUNT(*) as count FROM job_items WHERE status = 'RUNNING'"
    );
    console.log(`Running items: ${runningItems.rows[0].count}`);

    // Check for done items
    const doneItems = await pool.query(
      "SELECT COUNT(*) as count FROM job_items WHERE status = 'DONE'"
    );
    console.log(`Done items: ${doneItems.rows[0].count}`);

    // Check for failed items
    const failedItems = await pool.query(
      "SELECT COUNT(*) as count FROM job_items WHERE status = 'FAILED'"
    );
    console.log(`Failed items: ${failedItems.rows[0].count}`);

    // Show recent job items with details
    console.log('\n=== Recent Job Items ===');
    const recentItems = await pool.query(
      `SELECT id, job_id, product_id, attribute, status, error, created_at, updated_at
       FROM job_items
       ORDER BY created_at DESC
       LIMIT 5`
    );
    
    recentItems.rows.forEach(item => {
      console.log(`\nItem ${item.id}:`);
      console.log(`  Job ID: ${item.job_id}`);
      console.log(`  Product: ${item.product_id}`);
      console.log(`  Attribute: ${item.attribute}`);
      console.log(`  Status: ${item.status}`);
      console.log(`  Error: ${item.error || 'none'}`);
      console.log(`  Created: ${item.created_at}`);
      console.log(`  Updated: ${item.updated_at}`);
    });

    // Check environment variables
    console.log('\n=== Environment Check ===');
    console.log(`OPENAI_API_KEY set: ${process.env.OPENAI_API_KEY ? 'YES' : 'NO'}`);
    console.log(`DATABASE_URL set: ${process.env.DATABASE_URL ? 'YES' : 'NO'}`);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkWorkerStatus();
