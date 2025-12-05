/**
 * Manual worker test - processes pending items once
 * Run with: node backend/test-worker-manually.js
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function testWorker() {
  try {
    console.log('=== Manual Worker Test ===\n');

    // Check for pending items
    const pendingCheck = await pool.query(
      "SELECT COUNT(*) as count FROM job_items WHERE status = 'PENDING'"
    );
    console.log(`Found ${pendingCheck.rows[0].count} pending items\n`);

    if (pendingCheck.rows[0].count === '0') {
      console.log('No pending items to process');
      return;
    }

    // Claim one item
    console.log('Claiming one pending item...');
    const claimResult = await pool.query(
      `
      UPDATE job_items
      SET status = 'RUNNING', updated_at = now()
      WHERE id IN (
        SELECT id FROM job_items
        WHERE status = 'PENDING'
        ORDER BY id
        FOR UPDATE SKIP LOCKED
        LIMIT 1
      )
      RETURNING *
      `
    );

    if (claimResult.rows.length === 0) {
      console.log('Could not claim any items (might be locked)');
      return;
    }

    const item = claimResult.rows[0];
    console.log(`Claimed item ${item.id}:`);
    console.log(`  Job ID: ${item.job_id}`);
    console.log(`  Product: ${item.product_id}`);
    console.log(`  Attribute: ${item.attribute}`);
    console.log(`  Status: ${item.status}\n`);

    // Get job details
    const jobResult = await pool.query(
      'SELECT * FROM jobs WHERE id = $1',
      [item.job_id]
    );

    if (jobResult.rows.length === 0) {
      console.log('ERROR: Job not found!');
      return;
    }

    const job = jobResult.rows[0];
    console.log('Job details:');
    console.log(`  Instance ID: ${job.instance_id}`);
    console.log(`  Target Lang: ${job.target_lang}`);
    console.log(`  User Prompt: ${job.user_prompt}\n`);

    // Get instance details
    const instanceResult = await pool.query(
      'SELECT * FROM app_instances WHERE instance_id = $1',
      [job.instance_id]
    );

    if (instanceResult.rows.length === 0) {
      console.log('ERROR: Instance not found!');
      return;
    }

    const instance = instanceResult.rows[0];
    console.log('Instance details:');
    console.log(`  Instance ID: ${instance.instance_id}`);
    console.log(`  Access Token: ${instance.access_token ? 'Present' : 'Missing'}`);
    console.log(`  Refresh Token: ${instance.refresh_token ? 'Present' : 'Missing'}\n`);

    // Check OpenAI API key
    console.log('Environment check:');
    console.log(`  OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? 'Present' : 'MISSING!'}`);
    console.log(`  WIX_APP_ID: ${process.env.WIX_APP_ID ? 'Present' : 'Missing'}`);
    console.log(`  WIX_APP_SECRET: ${process.env.WIX_APP_SECRET ? 'Present' : 'Missing'}\n`);

    console.log('✅ All data looks good! The worker should be able to process this item.');
    console.log('\nTo actually process it, the worker needs to:');
    console.log('1. Fetch product data from Wix API');
    console.log('2. Extract the current attribute value');
    console.log('3. Call OpenAI to optimize it');
    console.log('4. Save the result back to the database');

  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  } finally {
    await pool.end();
  }
}

testWorker();
