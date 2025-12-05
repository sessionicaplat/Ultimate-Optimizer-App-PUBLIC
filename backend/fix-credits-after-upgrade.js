/**
 * Fix credits after upgrade
 * 
 * This script manually syncs your credits with your current Wix subscription
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function fixCredits(instanceId) {
  try {
    console.log(`\n🔧 Fixing credits for instance: ${instanceId}`);
    
    // Get current instance data
    const instanceResult = await pool.query(
      'SELECT * FROM app_instances WHERE instance_id = $1',
      [instanceId]
    );
    
    if (instanceResult.rows.length === 0) {
      console.error('❌ Instance not found');
      return;
    }
    
    const instance = instanceResult.rows[0];
    console.log(`\n📊 Current State:`);
    console.log(`   Database Plan: ${instance.plan_id}`);
    console.log(`   Credits Total: ${instance.credits_total}`);
    console.log(`   Credits Used: ${instance.credits_used_month}`);
    console.log(`   Available: ${instance.credits_total - instance.credits_used_month}`);
    
    // Get actual plan from Wix
    console.log(`\n🔍 Checking Wix API...`);
    const { getInstanceToken } = require('./src/wix/tokenHelper');
    const { WixSDKClient } = require('./src/wix/sdkClient');
    
    const accessToken = await getInstanceToken(instanceId);
    const wixClient = new WixSDKClient(accessToken);
    
    const purchases = await wixClient.getPurchaseHistory();
    
    let actualPlanId = 'free';
    if (purchases.length > 0) {
      const productId = purchases[0].productId;
      actualPlanId = normalizePlanId(productId);
      console.log(`   Wix Subscription: ${productId} → ${actualPlanId}`);
    } else {
      console.log(`   No Wix subscription found → free plan`);
    }
    
    // Get plan's monthly credits
    const planResult = await pool.query(
      'SELECT monthly_credits FROM plans WHERE id = $1',
      [actualPlanId]
    );
    
    if (planResult.rows.length === 0) {
      console.error(`❌ Plan not found in database: ${actualPlanId}`);
      return;
    }
    
    const planMonthlyCredits = planResult.rows[0].monthly_credits;
    console.log(`   Plan Monthly Credits: ${planMonthlyCredits}`);
    
    // Calculate what credits should be
    const currentAvailable = instance.credits_total - instance.credits_used_month;
    
    // If upgrading, add new plan's credits to available balance
    const oldPlanResult = await pool.query(
      'SELECT monthly_credits FROM plans WHERE id = $1',
      [instance.plan_id]
    );
    const oldPlanCredits = oldPlanResult.rows[0]?.monthly_credits || 0;
    
    let newCreditsTotal;
    if (planMonthlyCredits > oldPlanCredits) {
      // Upgrade: add new plan's credits
      newCreditsTotal = currentAvailable + planMonthlyCredits;
      console.log(`\n📈 UPGRADE DETECTED`);
      console.log(`   Current Available: ${currentAvailable}`);
      console.log(`   Adding: ${planMonthlyCredits}`);
      console.log(`   New Total: ${newCreditsTotal}`);
    } else {
      // Same or downgrade: just set to plan's credits
      newCreditsTotal = planMonthlyCredits;
      console.log(`\n↔️  SETTING TO PLAN CREDITS`);
      console.log(`   New Total: ${newCreditsTotal}`);
    }
    
    // Update database
    console.log(`\n💾 Updating database...`);
    await pool.query(
      `UPDATE app_instances
       SET plan_id = $1,
           credits_total = $2,
           credits_used_month = 0,
           updated_at = now()
       WHERE instance_id = $3`,
      [actualPlanId, newCreditsTotal, instanceId]
    );
    
    console.log(`\n✅ FIXED!`);
    console.log(`   Plan: ${actualPlanId}`);
    console.log(`   Total Credits: ${newCreditsTotal}`);
    console.log(`   Used Credits: 0`);
    console.log(`   Available: ${newCreditsTotal}`);
    
  } catch (error) {
    console.error('❌ Error fixing credits:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

function normalizePlanId(planId) {
  if (!planId) return 'free';
  
  const normalized = planId.toLowerCase().trim();
  const planMap = {
    'free': 'free',
    'starter': 'starter',
    'pro': 'pro',
    'scale': 'scale',
  };
  
  for (const [key, value] of Object.entries(planMap)) {
    if (normalized.includes(key)) {
      return value;
    }
  }
  
  return planMap[normalized] || 'free';
}

// Run the script
const instanceId = process.argv[2] || '08df22f0-4e31-4c46-8ada-6fe6f0e52c07';

console.log('🚀 Credit Fix Script');
console.log('===================\n');

fixCredits(instanceId)
  .then(() => {
    console.log('\n✅ Done! Refresh your app to see the updated credits.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Failed:', error.message);
    process.exit(1);
  });
