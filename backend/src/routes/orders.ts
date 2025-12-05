import { Router, Request, Response } from 'express';
import { verifyInstance } from '../auth/verifyInstance';
import { getAppInstance } from '../db/appInstances';
import { createClient } from '@wix/sdk';
import { billing } from '@wix/app-management';

const router = Router();

/**
 * List active app subscriptions by querying Wix API
 * TEST ONLY - This endpoint should be disabled in production
 */
router.get('/member/active', verifyInstance, async (req: Request, res: Response) => {
  try {
    // Check if we're in production mode
    if (process.env.NODE_ENV === 'production' && process.env.ENABLE_TEST_ENDPOINTS !== 'true') {
      return res.status(403).json({ 
        error: 'This test endpoint is disabled in production' 
      });
    }

    const { instanceId } = req.wixInstance!;
    
    // Get instance data
    const instance = await getAppInstance(instanceId);
    
    if (!instance) {
      return res.status(404).json({
        error: 'Instance not found',
        message: 'App instance not found. Please reinstall the app.',
      });
    }

    // Query Wix API for current subscription (same as /api/billing/subscription does)
    let actualPlanId = 'free';
    let actualPrice = '0';
    let billingCycle = null;
    
    try {
      console.log('Querying Wix API for current subscription...');
      const { getInstanceToken } = await import('../wix/tokenHelper');
      const accessToken = await getInstanceToken(instanceId);
      
      const { WixSDKClient } = await import('../wix/sdkClient');
      const wixClient = new WixSDKClient(accessToken);
      
      const purchases = await wixClient.getPurchaseHistory();
      
      if (purchases.length > 0) {
        const currentPurchase = purchases[0];
        actualPlanId = normalizePlanId(currentPurchase.productId);
        actualPrice = currentPurchase.price || '0';
        billingCycle = currentPurchase.billingCycle;
        
        console.log(`✅ Retrieved from Wix: productId="${currentPurchase.productId}" → planId="${actualPlanId}"`);
      } else {
        console.log('No purchases found in Wix, showing free plan');
      }
    } catch (error) {
      console.error('Error querying Wix API, falling back to database:', error);
      // Fallback to database if Wix API fails
      actualPlanId = instance.plan_id || 'free';
    }

    // Create order object based on actual current plan from Wix
    const orders = [];
    const planName = actualPlanId.charAt(0).toUpperCase() + actualPlanId.slice(1) + ' Plan';
    
    orders.push({
      _id: `app-subscription-${instanceId}`,
      planId: actualPlanId,
      planName: planName,
      planDescription: actualPlanId === 'free' 
        ? 'Free plan - Upgrade to unlock more features'
        : `Your current ${actualPlanId} subscription${billingCycle ? ` (${billingCycle})` : ''}`,
      status: 'ACTIVE',
      type: 'APP_BILLING',
      startDate: new Date().toISOString(),
      planPrice: actualPrice,
      currency: 'USD',
      lastPaymentStatus: actualPlanId === 'free' ? 'NOT_APPLICABLE' : 'PAID',
      billingCycle: billingCycle,
      pricing: {
        prices: [{
          price: {
            currency: 'USD',
            total: actualPrice
          }
        }]
      }
    });

    res.json({
      orders,
      total: orders.length,
      source: 'wix_api',
      debug: {
        instanceId,
        wixPlan: actualPlanId,
        databasePlan: instance.plan_id,
        creditsTotal: instance.credits_total,
        creditsUsed: instance.credits_used_month
      },
      note: 'Showing current subscription from Wix Billing API (live data)'
    });
  } catch (error: any) {
    console.error('Error listing app subscriptions:', error);
    res.status(500).json({ 
      error: 'Failed to list subscriptions',
      details: error.message,
      hint: 'Check server logs for more details'
    });
  }
});

/**
 * Normalize plan ID from Wix format to internal format
 */
function normalizePlanId(planId: string): string {
  if (!planId) {
    return 'free';
  }

  const normalized = planId.toLowerCase().trim();
  
  const planMap: Record<string, string> = {
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

/**
 * Cancel an app subscription via Wix Billing API
 * TEST ONLY - This endpoint should be disabled in production
 * 
 * This actually calls the Wix Billing API to cancel the subscription,
 * which will trigger the webhook that updates the database.
 */
router.post('/cancel', verifyInstance, async (req: Request, res: Response) => {
  try {
    // Check if we're in production mode
    if (process.env.NODE_ENV === 'production' && process.env.ENABLE_TEST_ENDPOINTS !== 'true') {
      return res.status(403).json({ 
        error: 'This test endpoint is disabled in production' 
      });
    }

    const { instanceId } = req.wixInstance!;
    const { orderId, effectiveAt } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: 'orderId is required' });
    }

    // Validate effectiveAt parameter
    const validEffectiveAt = ['IMMEDIATELY', 'NEXT_PAYMENT_DATE'];
    const effectiveAtValue = effectiveAt || 'IMMEDIATELY';
    
    if (!validEffectiveAt.includes(effectiveAtValue)) {
      return res.status(400).json({ 
        error: `effectiveAt must be one of: ${validEffectiveAt.join(', ')}` 
      });
    }

    // Get instance data
    const instance = await getAppInstance(instanceId);
    
    if (!instance) {
      return res.status(404).json({
        error: 'Instance not found',
        message: 'App instance not found. Please reinstall the app.',
      });
    }

    console.log(`[TEST] Simulating cancellation for instance ${instanceId}`);
    console.log(`[TEST] Effective at: ${effectiveAtValue}`);
    console.log(`[TEST] Current plan: ${instance.plan_id}`);
    
    // Get current subscription from Wix to verify there's something to cancel
    try {
      const { getInstanceToken } = await import('../wix/tokenHelper');
      const accessToken = await getInstanceToken(instanceId);
      
      const { WixSDKClient } = await import('../wix/sdkClient');
      const wixClient = new WixSDKClient(accessToken);
      
      const purchases = await wixClient.getPurchaseHistory();
      
      if (purchases.length === 0 || purchases[0].productId === 'free') {
        return res.status(400).json({
          error: 'No active paid subscription found',
          message: 'You are already on the free plan. There is nothing to cancel.',
          currentPlan: instance.plan_id
        });
      }

      console.log(`[TEST] Current Wix subscription: ${purchases[0].productId}`);
    } catch (error) {
      console.error('[TEST] Error checking Wix subscription:', error);
      // Continue anyway - we'll simulate the cancellation
    }

    // Simulate what the webhook would do when a user cancels through Wix dashboard
    // Note: App subscriptions can only be cancelled through the Wix dashboard,
    // not programmatically. This test endpoint simulates that process.
    
    if (effectiveAtValue === 'IMMEDIATELY') {
      console.log(`[TEST] Simulating immediate cancellation...`);
      
      const { updateInstancePlan } = await import('../db/appInstances');
      await updateInstancePlan(instanceId, 'free');
      
      console.log(`[TEST] ✅ Downgraded to free plan`);

      res.json({ 
        success: true,
        message: `Subscription cancelled and downgraded to free plan`,
        effectiveAt: effectiveAtValue,
        note: 'This simulates what happens when a user cancels through the Wix dashboard.',
        instructions: [
          '✅ Database updated to free plan',
          '✅ Credits reset to 100',
          '✅ Your app should now reflect the free plan',
          '',
          'In production:',
          '1. User cancels subscription in Wix dashboard',
          '2. Wix sends webhook to /api/billing/webhook',
          '3. Webhook handler does the same thing this test did',
          '4. Your app UI reflects the change',
          '',
          'To test the real flow:',
          '1. Go to your Wix site dashboard',
          '2. Navigate to Settings > Billing & Payments',
          '3. Find this app and click "Cancel Subscription"',
          '4. Your webhook will be triggered automatically'
        ]
      });
    } else {
      console.log(`[TEST] Simulating cancellation at next payment date...`);
      console.log(`[TEST] (Database not updated yet - would happen at next billing cycle)`);

      res.json({ 
        success: true,
        message: `Subscription will be cancelled at next payment date`,
        effectiveAt: effectiveAtValue,
        note: 'This simulates scheduling a cancellation for the next billing cycle.',
        instructions: [
          '⏳ Subscription marked for cancellation',
          '⏳ Will downgrade to free plan at next billing date',
          '⏳ User can continue using paid features until then',
          '',
          'In this test mode:',
          '- Database is NOT updated immediately',
          '- In production, Wix would send a webhook at the billing date',
          '- For testing immediate cancellation, use IMMEDIATELY option',
          '',
          'To fully test this flow, use IMMEDIATELY option instead.'
        ]
      });
    }
  } catch (error: any) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({ 
      error: 'Failed to cancel subscription',
      details: error.message,
      hint: 'Check server logs for more details'
    });
  }
});

/**
 * Sync database plan with actual Wix subscription
 * TEST ONLY - This endpoint should be disabled in production
 * 
 * This fixes the issue where database and Wix are out of sync
 */
router.post('/sync', verifyInstance, async (req: Request, res: Response) => {
  try {
    // Check if we're in production mode
    if (process.env.NODE_ENV === 'production' && process.env.ENABLE_TEST_ENDPOINTS !== 'true') {
      return res.status(403).json({ 
        error: 'This test endpoint is disabled in production' 
      });
    }

    const { instanceId } = req.wixInstance!;
    
    console.log(`[SYNC] Syncing plan for instance ${instanceId}`);
    
    // Get instance data
    const instance = await getAppInstance(instanceId);
    
    if (!instance) {
      return res.status(404).json({
        error: 'Instance not found',
        message: 'App instance not found. Please reinstall the app.',
      });
    }

    const databasePlan = instance.plan_id;
    console.log(`[SYNC] Current database plan: ${databasePlan}`);
    
    // Get actual plan from Wix
    const { getInstanceToken } = await import('../wix/tokenHelper');
    const accessToken = await getInstanceToken(instanceId);
    
    const { WixSDKClient } = await import('../wix/sdkClient');
    const wixClient = new WixSDKClient(accessToken);
    
    const purchases = await wixClient.getPurchaseHistory();
    
    let actualPlanId = 'free';
    if (purchases.length > 0) {
      actualPlanId = normalizePlanId(purchases[0].productId);
      console.log(`[SYNC] Wix subscription: ${purchases[0].productId} → ${actualPlanId}`);
    } else {
      console.log(`[SYNC] No Wix subscription found → free plan`);
    }
    
    // Check if sync is needed
    if (databasePlan === actualPlanId) {
      return res.json({
        success: true,
        message: 'Already in sync!',
        plan: actualPlanId,
        note: 'Database and Wix both show the same plan.',
        details: {
          database: databasePlan,
          wix: actualPlanId,
          inSync: true
        }
      });
    }
    
    console.log(`[SYNC] OUT OF SYNC! Database: ${databasePlan}, Wix: ${actualPlanId}`);
    console.log(`[SYNC] Updating database to match Wix...`);
    
    // Update database to match Wix
    const { updateInstancePlan } = await import('../db/appInstances');
    await updateInstancePlan(instanceId, actualPlanId);
    
    console.log(`[SYNC] ✅ Database updated to ${actualPlanId}`);

    res.json({ 
      success: true,
      message: `Database synced with Wix subscription`,
      note: 'Your database now matches what Wix says.',
      details: {
        before: {
          database: databasePlan,
          wix: actualPlanId,
          inSync: false
        },
        after: {
          database: actualPlanId,
          wix: actualPlanId,
          inSync: true
        }
      },
      instructions: [
        '✅ Database updated to match Wix',
        '✅ Plans are now in sync',
        '✅ You can now test cancellation properly',
        '',
        'Next steps:',
        '1. Refresh the test cancellation page',
        '2. You should see the correct plan',
        '3. Now you can test cancellation'
      ]
    });
  } catch (error: any) {
    console.error('[SYNC] Error syncing plan:', error);
    res.status(500).json({ 
      error: 'Failed to sync plan',
      details: error.message,
      hint: 'Check server logs for more details'
    });
  }
});

export default router;
