/**
 * Quick fix script to update the plan_id in the database
 * Run this once to fix the current incorrect 'free' plan
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function fixPlan() {
  const instanceId = '08df22f0-4e31-4c46-8ada-6fe6f0e52c07';
  const correctPlan = 'starter';
  const correctCredits = 1000;

  try {
    console.log('Fixing plan in database...');
    console.log(`Instance ID: ${instanceId}`);
    console.log(`Setting plan to: ${correctPlan}`);
    console.log(`Setting credits to: ${correctCredits}`);

    const result = await pool.query(
      `UPDATE app_instances
       SET plan_id = $1,
           credits_total = $2,
           credits_used_month = 0,
           updated_at = now()
       WHERE instance_id = $3
       RETURNING instance_id, plan_id, credits_total`,
      [correctPlan, correctCredits, instanceId]
    );

    if (result.rows.length > 0) {
      console.log('✅ Database updated successfully:');
      console.log(result.rows[0]);
    } else {
      console.log('❌ Instance not found in database');
    }
  } catch (error) {
    console.error('❌ Error updating database:', error);
  } finally {
    await pool.end();
  }
}

fixPlan();
