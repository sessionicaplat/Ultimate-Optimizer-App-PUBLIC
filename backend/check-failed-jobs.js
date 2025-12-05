// Quick script to check failed job details
require('dotenv').config();
const { query } = require('./src/db');

async function checkFailedJobs() {
  try {
    console.log('Checking for failed jobs...\n');
    
    const result = await query(
      `SELECT j.id, j.status, j.created_at, 
              ji.id as item_id, ji.attribute, ji.status as item_status, ji.error
       FROM jobs j
       LEFT JOIN job_items ji ON j.id = ji.job_id
       WHERE j.status = 'FAILED' OR ji.status = 'FAILED'
       ORDER BY j.created_at DESC
       LIMIT 20`
    );

    if (result.rows.length === 0) {
      console.log('No failed jobs found.');
      return;
    }

    console.log(`Found ${result.rows.length} failed items:\n`);
    
    for (const row of result.rows) {
      console.log(`Job ${row.id} - Item ${row.item_id}`);
      console.log(`  Attribute: ${row.attribute}`);
      console.log(`  Status: ${row.item_status}`);
      console.log(`  Error: ${row.error || 'No error message'}`);
      console.log('');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkFailedJobs();
