/**
 * Check job items status and errors
 * Run with: node backend/check-job-items.js
 */

const { Pool } = require('pg');
require('dotenv').config();

async function checkJobItems() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  try {
    console.log('Checking job items...\n');

    // Get recent job items with their status
    const result = await pool.query(`
      SELECT 
        ji.id,
        ji.job_id,
        ji.product_id,
        ji.attribute,
        ji.status,
        ji.error,
        ji.before_value,
        ji.after_value,
        ji.created_at,
        ji.updated_at,
        j.instance_id,
        j.user_prompt,
        j.target_lang
      FROM job_items ji
      JOIN jobs j ON ji.job_id = j.id
      ORDER BY ji.created_at DESC
      LIMIT 20
    `);

    console.log(`Found ${result.rows.length} recent job items:\n`);

    for (const item of result.rows) {
      console.log(`Item ID: ${item.id}`);
      console.log(`  Job ID: ${item.job_id}`);
      console.log(`  Product ID: ${item.product_id}`);
      console.log(`  Attribute: ${item.attribute}`);
      console.log(`  Status: ${item.status}`);
      console.log(`  Error: ${item.error || 'None'}`);
      console.log(`  Before Value: ${item.before_value ? item.before_value.substring(0, 50) + '...' : 'None'}`);
      console.log(`  After Value: ${item.after_value ? item.after_value.substring(0, 50) + '...' : 'None'}`);
      console.log(`  Created: ${item.created_at}`);
      console.log(`  Updated: ${item.updated_at}`);
      console.log('---');
    }

    // Check for FAILED items
    const failedResult = await pool.query(`
      SELECT COUNT(*) as count, error
      FROM job_items
      WHERE status = 'FAILED'
      GROUP BY error
      ORDER BY count DESC
    `);

    if (failedResult.rows.length > 0) {
      console.log('\nFailed items by error:');
      for (const row of failedResult.rows) {
        console.log(`  ${row.count}x: ${row.error}`);
      }
    }

    // Check for PENDING items
    const pendingResult = await pool.query(`
      SELECT COUNT(*) as count
      FROM job_items
      WHERE status = 'PENDING'
    `);

    console.log(`\nPending items: ${pendingResult.rows[0].count}`);

    // Check for RUNNING items
    const runningResult = await pool.query(`
      SELECT COUNT(*) as count
      FROM job_items
      WHERE status = 'RUNNING'
    `);

    console.log(`Running items: ${runningResult.rows[0].count}`);

  } catch (error) {
    console.error('Error checking job items:', error);
  } finally {
    await pool.end();
  }
}

checkJobItems();
