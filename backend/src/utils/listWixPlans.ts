/**
 * Helper script to list all Wix pricing plans for your app
 * 
 * Run this to get the actual product IDs from Wix:
 * npx ts-node src/utils/listWixPlans.ts
 */

import { createClient } from '@wix/sdk';
import { AppStrategy } from '@wix/sdk';
import { appPlans } from '@wix/app-management';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function listWixPlans() {
  const WIX_APP_ID = process.env.WIX_APP_ID;
  const WIX_PUBLIC_KEY = process.env.WIX_PUBLIC_KEY;

  if (!WIX_APP_ID || !WIX_PUBLIC_KEY) {
    console.error('❌ Missing WIX_APP_ID or WIX_PUBLIC_KEY in environment variables');
    process.exit(1);
  }

  console.log('🔍 Fetching pricing plans from Wix...\n');

  try {
    // Create Wix SDK client
    const wixClient = createClient({
      auth: AppStrategy({
        appId: WIX_APP_ID,
        publicKey: WIX_PUBLIC_KEY,
      }),
      modules: { appPlans },
    });

    // List all plans for this app
    const response = await wixClient.appPlans.listAppPlansByAppId([WIX_APP_ID]);

    if (!response.appPlans || response.appPlans.length === 0) {
      console.log('⚠️  No pricing plans found for this app');
      console.log('');
      console.log('Please create pricing plans in Wix Developer Dashboard:');
      console.log('https://dev.wix.com → Your App → Pricing & Plans');
      return;
    }

    console.log(`✅ Found ${response.appPlans.length} pricing plan(s):\n`);

    // Display each plan
    response.appPlans.forEach((appPlan: any, index: number) => {
      const plans = appPlan.plans || [];
      if (plans.length === 0) return;

      plans.forEach((plan: any) => {
        console.log(`Plan ${index + 1}:`);
        console.log(`  Name: ${plan.name || 'Unnamed'}`);
        console.log(`  ID: ${plan._id}`);
        console.log(`  Slug: ${plan.slug || 'N/A'}`);
        console.log(`  Visible: ${plan.visible ? 'Yes' : 'No'}`);
        
        if (plan.pricing) {
          const price = plan.pricing.price;
          if (price) {
            console.log(`  Price: ${price.value} ${price.currency}`);
          }
          if (plan.pricing.subscription) {
            const freq = plan.pricing.subscription.cycleDuration;
            console.log(`  Frequency: ${freq?.count} ${freq?.unit}`);
          }
        }
        
        console.log('');
      });
    });

    console.log('📋 Environment Variables to Set:\n');
    
    response.appPlans.forEach((appPlan: any) => {
      const plans = appPlan.plans || [];
      plans.forEach((plan: any) => {
        if (!plan || !plan._id) return;

        const name = plan.name?.toUpperCase().replace(/\s+/g, '_') || 'UNKNOWN';
        console.log(`WIX_PRODUCT_ID_${name}=${plan._id}`);
      });
    });

    console.log('');
    console.log('💡 Copy these to your Render environment variables!');

  } catch (error: any) {
    console.error('❌ Error fetching plans:', error.message || error);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

// Run the script
listWixPlans().catch(console.error);
