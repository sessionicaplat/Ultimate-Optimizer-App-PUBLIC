/**
 * Sync database plan with actual Wix subscription
 * 
 * This script queries Wix API to get the real subscription
 * and updates the database to match.
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function syncPlanFromWix(instanceId) {
  try {
    console.log(`\n🔄 Syncing plan for instance: ${instanceId}`);
    
    // Get instance from database
    const instanceResult = await pool.query(
      'SELECT * FROM app_instances WHERE instance_id = $1',
      [instanceId]
    );
    
    if (instanceResult.rows.length === 0) {
      console.error('❌ Instance not found in database');
      return;
    }
    
    const instance = instanceResult.rows[0];
    console.log(`📊 Current database plan: ${instance.plan_id}`);
    console.log(`📊 Current database credits: ${instance.credits_total}`);
    
    // Get actual plan from Wix
    const { getInstanceToken } = require('./src/wix/tokenHelper');
    const { WixSDKClient } = require('./src/wix/sdkClient');
    
    const accessToken = await getInstanceToken(instanceId);
    const wixClient = new WixSDKClient(accessToken);
    
    const purchases = await wixClient.getPurchaseHistory();
    
    let actualPlanId = 'free';
    if (purchases.length > 0) {
      const productId = purchases[0].productId;
      actualPlanId = normalizePlanId(productId);
      console.log(`✅ Wix subscription: ${productId} → ${actualPlanId}`);
    } else {
      console.log(`✅ No Wix subscription found → free plan`);
    }
    
    // Check if sync is needed
    if (instance.plan_id === actualPlanId) {
      console.log(`✅ Already in sync! Both show: ${actualPlanId}`);
      return;
    }
    
    console.log(`\n⚠️  OUT OF SYNC!`);
    console.log(`   Database: ${instance.plan_id}`);
    console.log(`   Wix API:  ${actualPlanId}`);
    console.log(`\n🔧 Updating database to match Wix...`);
    
    // Get credits for the plan
    const planResult = await pool.query(
      'SELECT monthly_credits FROM plans WHERE id = $1',
      [actualPlanId]
    );
    
    const newCredits = planResult.rows[0]?.monthly_credits || 100;
    
    // Update database
    await pool.query(
      `UPDATE app_instances
       SET plan_id = $1,
           credits_total = $2,
           credits_used_month = 0,
           updated_at = now()
       WHERE instance_id = $3`,
      [actualPlanId, newCredits, instanceId]
    );
    
    console.log(`✅ Database updated!`);
    console.log(`   New plan: ${actualPlanId}`);
    console.log(`   New credits: ${newCredits}`);
    console.log(`   Credits used: 0 (reset)`);
    
  } catch (error) {
    console.error('❌ Error syncing plan:', error);
    throw error;
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
const instanceId = process.argv[2];

if (!instanceId) {
  console.error('❌ Usage: node sync-plan-from-wix.js <instance-id>');
  console.error('Example: node sync-plan-from-wix.js 08df22f0-4e31-4c46-8ada-6fe6f0e52c07');
  process.exit(1);
}

syncPlanFromWix(instanceId)
  .then(() => {
    console.log('\n✅ Sync complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Sync failed:', error);
    process.exit(1);
  });
