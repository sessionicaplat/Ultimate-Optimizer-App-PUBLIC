/**
 * Diagnostic script to check credit assignment issue
 * 
 * This script checks:
 * 1. Plans table data
 * 2. Current instance data (plan_id, credits_total, credits_used_month)
 * 3. Whether credits_total matches the plan's monthly_credits
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function checkCreditsIssue() {
  try {
    console.log('🔍 Checking credit assignment issue...\n');

    // 1. Check plans table
    console.log('📋 Plans Table:');
    const plansResult = await pool.query('SELECT * FROM plans ORDER BY monthly_credits');
    console.table(plansResult.rows);

    // 2. Check all app instances
    console.log('\n👥 App Instances:');
    const instancesResult = await pool.query(`
      SELECT 
        ai.instance_id,
        ai.site_host,
        ai.plan_id,
        ai.credits_total,
        ai.credits_used_month,
        (ai.credits_total - ai.credits_used_month) as credits_remaining,
        p.monthly_credits as plan_monthly_credits,
        CASE 
          WHEN ai.credits_total = p.monthly_credits THEN '✅ Match'
          ELSE '❌ MISMATCH'
        END as status
      FROM app_instances ai
      LEFT JOIN plans p ON ai.plan_id = p.id
      ORDER BY ai.created_at DESC
    `);
    
    if (instancesResult.rows.length === 0) {
      console.log('No instances found');
    } else {
      console.table(instancesResult.rows);
    }

    // 3. Identify mismatches
    const mismatches = instancesResult.rows.filter(
      row => row.credits_total !== row.plan_monthly_credits
    );

    if (mismatches.length > 0) {
      console.log('\n⚠️  CREDIT MISMATCHES FOUND:');
      mismatches.forEach(instance => {
        console.log(`\nInstance: ${instance.instance_id}`);
        console.log(`  Plan: ${instance.plan_id}`);
        console.log(`  Expected Credits: ${instance.plan_monthly_credits}`);
        console.log(`  Actual Credits: ${instance.credits_total}`);
        console.log(`  Difference: ${instance.credits_total - instance.plan_monthly_credits}`);
      });

      console.log('\n💡 ISSUE IDENTIFIED:');
      console.log('The credits_total in app_instances does not match the plan\'s monthly_credits.');
      console.log('\nPossible causes:');
      console.log('1. Webhook not firing when subscription was purchased');
      console.log('2. updateInstancePlan() not being called after subscription');
      console.log('3. Plan ID mismatch between Wix and database');
      console.log('4. Instance was created before subscription was purchased');
    } else {
      console.log('\n✅ All instances have correct credit allocations');
    }

  } catch (error) {
    console.error('Error checking credits:', error);
  } finally {
    await pool.end();
  }
}

checkCreditsIssue();
