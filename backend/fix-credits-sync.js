/**
 * Fix script to sync credits_total with plan's monthly_credits
 * 
 * This script:
 * 1. Identifies instances where credits_total doesn't match plan's monthly_credits
 * 2. Updates credits_total to match the plan (preserving credits_used_month)
 * 3. Logs all changes made
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function fixCreditsSync() {
  try {
    console.log('🔧 Starting credit sync fix...\n');

    // Find instances with mismatched credits
    const mismatches = await pool.query(`
      SELECT 
        ai.instance_id,
        ai.site_host,
        ai.plan_id,
        ai.credits_total as current_credits,
        ai.credits_used_month,
        p.monthly_credits as correct_credits
      FROM app_instances ai
      LEFT JOIN plans p ON ai.plan_id = p.id
      WHERE ai.credits_total != p.monthly_credits
    `);

    if (mismatches.rows.length === 0) {
      console.log('✅ No mismatches found. All instances have correct credit allocations.');
      return;
    }

    console.log(`Found ${mismatches.rows.length} instance(s) with incorrect credits:\n`);
    console.table(mismatches.rows);

    console.log('\n🔄 Updating credits...\n');

    for (const instance of mismatches.rows) {
      console.log(`Updating instance: ${instance.instance_id}`);
      console.log(`  Plan: ${instance.plan_id}`);
      console.log(`  Current credits_total: ${instance.current_credits}`);
      console.log(`  Correct credits_total: ${instance.correct_credits}`);
      console.log(`  Credits used: ${instance.credits_used_month}`);

      await pool.query(
        `UPDATE app_instances 
         SET credits_total = $1, 
             updated_at = now()
         WHERE instance_id = $2`,
        [instance.correct_credits, instance.instance_id]
      );

      console.log(`  ✅ Updated to ${instance.correct_credits} credits\n`);
    }

    console.log('✅ Credit sync completed successfully!');

    // Verify the fix
    console.log('\n🔍 Verifying fix...');
    const verification = await pool.query(`
      SELECT 
        COUNT(*) as total_instances,
        COUNT(CASE WHEN ai.credits_total = p.monthly_credits THEN 1 END) as correct_instances,
        COUNT(CASE WHEN ai.credits_total != p.monthly_credits THEN 1 END) as incorrect_instances
      FROM app_instances ai
      LEFT JOIN plans p ON ai.plan_id = p.id
    `);

    console.table(verification.rows);

  } catch (error) {
    console.error('❌ Error fixing credits:', error);
  } finally {
    await pool.end();
  }
}

fixCreditsSync();
