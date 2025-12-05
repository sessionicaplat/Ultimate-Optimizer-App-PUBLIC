/**
 * Test worker processing manually
 * This script will check for pending items and try to process one
 */

const { Pool } = require('pg');
require('dotenv').config();

async function testWorkerProcess() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  try {
    console.log('=== Testing Worker Process ===\n');

    // Check for pending items
    console.log('1. Checking for PENDING items...');
    const pendingResult = await pool.query(`
      SELECT * FROM job_items
      WHERE status = 'PENDING'
      ORDER BY id
      LIMIT 5
    `);

    console.log(`Found ${pendingResult.rows.length} pending items\n`);

    if (pendingResult.rows.length === 0) {
      console.log('No pending items to process');
      return;
    }

    // Show first pending item details
    const item = pendingResult.rows[0];
    console.log('First pending item:');
    console.log(`  ID: ${item.id}`);
    console.log(`  Job ID: ${item.job_id}`);
    console.log(`  Product ID: ${item.product_id}`);
    console.log(`  Attribute: ${item.attribute}`);
    console.log(`  Status: ${item.status}\n`);

    // Get job details
    console.log('2. Getting job details...');
    const jobResult = await pool.query(`
      SELECT * FROM jobs WHERE id = $1
    `, [item.job_id]);

    if (jobResult.rows.length === 0) {
      console.log('ERROR: Job not found!');
      return;
    }

    const job = jobResult.rows[0];
    console.log(`Job ${job.id}:`);
    console.log(`  Instance ID: ${job.instance_id}`);
    console.log(`  Target Lang: ${job.target_lang}`);
    console.log(`  User Prompt: ${job.user_prompt}`);
    console.log(`  Status: ${job.status}\n`);

    // Get instance details
    console.log('3. Getting instance details...');
    const instanceResult = await pool.query(`
      SELECT * FROM app_instances WHERE instance_id = $1
    `, [job.instance_id]);

    if (instanceResult.rows.length === 0) {
      console.log('ERROR: Instance not found!');
      return;
    }

    const instance = instanceResult.rows[0];
    console.log(`Instance ${instance.instance_id}:`);
    console.log(`  Has access token: ${!!instance.access_token}`);
    console.log(`  Has refresh token: ${!!instance.refresh_token}`);
    console.log(`  Token expires: ${instance.token_expires_at}\n`);

    // Check environment variables
    console.log('4. Checking environment variables...');
    console.log(`  OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? 'SET' : 'NOT SET'}`);
    console.log(`  WIX_APP_ID: ${process.env.WIX_APP_ID ? 'SET' : 'NOT SET'}`);
    console.log(`  WIX_APP_SECRET: ${process.env.WIX_APP_SECRET ? 'SET' : 'NOT SET'}\n`);

    console.log('=== Test Complete ===');
    console.log('\nIf all checks passed, the worker should be able to process this item.');
    console.log('Check Render logs for [Worker] messages to see if worker is running.');

  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await pool.end();
  }
}

testWorkerProcess();
