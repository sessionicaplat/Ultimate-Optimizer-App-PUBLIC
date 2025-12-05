import { Router, Request, Response } from 'express';
import { verifyInstance } from '../auth/verifyInstance';
import { getAppInstance } from '../db/appInstances';

const router = Router();

/**
 * GET /api/me
 * Returns instance information and credit balance
 */
router.get('/api/me', verifyInstance, async (req: Request, res: Response) => {
  try {
    const { instanceId } = req.wixInstance!;

    // Disable caching to ensure users always get fresh credit data
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    // Fetch instance data from database
    const instance = await getAppInstance(instanceId);

    if (!instance) {
      return res.status(404).json({ error: 'Instance not found' });
    }

    // Calculate remaining credits
    const creditsRemaining = instance.credits_total - instance.credits_used_month;

    // Determine the correct reset date:
    // - For paid subscriptions: use next_billing_date (30-day cycle from subscription start)
    // - For free plan: use credits_reset_on (calendar month)
    let resetDate: string;
    
    if (instance.next_billing_date) {
      // Use existing next_billing_date
      resetDate = instance.next_billing_date.toISOString();
    } else if (instance.plan_id !== 'free' && instance.subscription_start_date) {
      // Calculate next_billing_date from subscription_start_date for paid plans
      const startTime = instance.subscription_start_date.getTime();
      const now = Date.now();
      const daysSinceStart = Math.floor((now - startTime) / (24 * 60 * 60 * 1000));
      const cyclesPassed = Math.floor(daysSinceStart / 30);
      const nextCycleStart = new Date(startTime + (cyclesPassed + 1) * 30 * 24 * 60 * 60 * 1000);
      resetDate = nextCycleStart.toISOString();
      
      console.log(`🔧 [/api/me] Calculated next_billing_date on-the-fly for ${instanceId}:`);
      console.log(`   Subscription started: ${instance.subscription_start_date.toISOString()}`);
      console.log(`   Calculated next billing: ${resetDate}`);
    } else {
      // Fall back to calendar month for free plan
      resetDate = instance.credits_reset_on.toISOString();
    }

    // Return instance info and credit data
    res.json({
      instanceId: instance.instance_id,
      siteHost: instance.site_host,
      planId: instance.plan_id,
      creditsTotal: instance.credits_total,
      creditsUsedMonth: instance.credits_used_month,
      creditsRemaining,
      creditsResetOn: resetDate,
    });
  } catch (error) {
    console.error('Error fetching instance info:', error);
    res.status(500).json({ error: 'Failed to fetch instance information' });
  }
});

export default router;
