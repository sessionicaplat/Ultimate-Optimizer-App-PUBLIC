import express, { Request, Response } from 'express';
import { AppStrategy, createClient } from '@wix/sdk';
import { appInstances, billing } from '@wix/app-management';
import { updateInstancePlan } from '../db/appInstances';
import { verifyInstance } from '../auth/verifyInstance';

const router = express.Router();

// Load Wix App credentials from environment
const WIX_APP_ID = process.env.WIX_APP_ID || '';
const WIX_PUBLIC_KEY = process.env.WIX_PUBLIC_KEY || '';

// Create Wix SDK client for webhook processing
// Using appInstances and billing modules to handle webhooks
const wixClient = createClient({
  auth: AppStrategy({
    appId: WIX_APP_ID,
    publicKey: WIX_PUBLIC_KEY,
  }),
  modules: { appInstances, billing },
});

/**
 * Webhook Processing Lock System
 * 
 * Prevents race conditions when multiple webhooks fire simultaneously
 * for the same instance (e.g., PaidPlanPurchased + InvoiceStatusUpdated)
 */
const webhookLocks = new Map<string, Promise<void>>();

async function handleWebhookSafely(
  instanceId: string,
  webhookType: string,
  handler: () => Promise<void>
): Promise<void> {
  const lockKey = `webhook_${instanceId}`;
  
  // Wait for any in-progress webhook processing
  if (webhookLocks.has(lockKey)) {
    console.log(`⏳ [${webhookType}] Waiting for in-progress webhook for instance ${instanceId}...`);
    await webhookLocks.get(lockKey);
  }
  
  // Process this webhook with lock
  const promise = (async () => {
    try {
      console.log(`🔒 [${webhookType}] Acquired lock for instance ${instanceId}`);
      await handler();
      console.log(`✅ [${webhookType}] Released lock for instance ${instanceId}`);
    } catch (error) {
      console.error(`❌ [${webhookType}] Error processing webhook:`, error);
      throw error;
    }
  })();
  
  webhookLocks.set(lockKey, promise);
  
  try {
    await promise;
  } finally {
    webhookLocks.delete(lockKey);
  }
}

// Register webhook event handlers

/**
 * Handle Paid Plan Auto Renewal Cancelled
 * 
 * Triggered when a user cancels their subscription or turns off auto-renewal.
 * According to Wix 2025 docs, the user keeps access until the end of the billing cycle.
 */
wixClient.appInstances.onAppInstancePaidPlanAutoRenewalCancelled(async (event) => {
  console.log('🔔 Cancellation webhook received:', {
    type: 'PaidPlanAutoRenewalCancelled',
    instanceId: event.metadata?.instanceId,
    timestamp: new Date().toISOString(),
  });

  try {
    const instanceId = event.metadata?.instanceId;
    if (!instanceId) {
      console.error('Missing instanceId in cancellation webhook');
      return;
    }

    const eventData = event.data as any;
    const vendorProductId = eventData.vendorProductId;
    const subscriptionCancellationType = eventData.subscriptionCancellationType;
    const cancelReason = eventData.cancelReason;
    const userReason = eventData.userReason;
    
    console.log('📋 Cancellation details:', {
      instanceId,
      vendorProductId,
      subscriptionCancellationType, // "AT_END_OF_PERIOD" or "IMMEDIATELY"
      cancelReason,
      userReason,
    });

    // According to Wix docs: "Even after cancellation, the user is still considered 
    // a paid user and retains access to premium features until the current billing 
    // cycle or free trial period ends."
    
    console.log('⏳ User will keep access until end of billing cycle');
    console.log('✅ Cancellation logged - waiting for plan expiration');

    // If cancellation type is "IMMEDIATELY", downgrade now
    // Otherwise, wait for the InvoiceStatusUpdated webhook with REFUNDED/VOIDED
    if (subscriptionCancellationType === 'IMMEDIATELY') {
      console.log('⚡ Immediate cancellation - downgrading now');
      await handleSubscriptionCanceled(instanceId);
    } else {
      console.log('📅 Cancellation at end of period - user keeps access for now');
    }
    
  } catch (error) {
    console.error('Error processing cancellation webhook:', error);
  }
});

/**
 * Handle Paid Plan Purchased
 * 
 * Triggered when a user purchases a paid plan.
 */
wixClient.appInstances.onAppInstancePaidPlanPurchased(async (event) => {
  console.log('💳 Purchase webhook received:', {
    type: 'PaidPlanPurchased',
    instanceId: event.metadata?.instanceId,
    timestamp: new Date().toISOString(),
  });

  const instanceId = event.metadata?.instanceId;
  if (!instanceId) {
    console.error('Missing instanceId in purchase webhook');
    return;
  }

  await handleWebhookSafely(instanceId, 'PaidPlanPurchased', async () => {
    const eventData = event.data as any;
    const vendorProductId = eventData.vendorProductId;
    
    console.log('✅ Payment received for plan:', vendorProductId);
    
    // Query Wix API to get current plan (more reliable than webhook data)
    const planId = await getCurrentPlanFromWix(instanceId);
    
    if (planId) {
      console.log(`Current plan from Wix: ${planId}`);
      await handleSubscriptionActive(instanceId, planId);
    } else {
      console.warn('Could not determine plan from Wix API, keeping current plan');
    }
  });
});

/**
 * Handle Paid Plan Changed
 * 
 * Triggered when a user upgrades or downgrades their plan.
 */
wixClient.appInstances.onAppInstancePaidPlanChanged(async (event) => {
  console.log('🔄 Plan change webhook received:', {
    type: 'PaidPlanChanged',
    instanceId: event.metadata?.instanceId,
    timestamp: new Date().toISOString(),
  });

  const instanceId = event.metadata?.instanceId;
  if (!instanceId) {
    console.error('Missing instanceId in plan change webhook');
    return;
  }

  await handleWebhookSafely(instanceId, 'PaidPlanChanged', async () => {
    const eventData = event.data as any;
    const vendorProductId = eventData.vendorProductId;
    const previousVendorProductId = eventData.previousVendorProductId;
    
    console.log('Plan changed:', {
      from: previousVendorProductId,
      to: vendorProductId,
    });
    
    // Query Wix API to get current plan
    const planId = await getCurrentPlanFromWix(instanceId);
    
    if (planId) {
      console.log(`New plan from Wix: ${planId}`);
      await handleSubscriptionActive(instanceId, planId);
    }
  });
});

/**
 * Handle Invoice Status Updated
 * 
 * Triggered when there is an update to the payment status of an invoice.
 * This is particularly important for usage-based charges and tracking payment failures.
 * 
 * Invoice statuses:
 * - PAID: Invoice has been paid successfully
 * - PAYMENT_FAILED: Payment attempt failed
 * - REFUNDED: Invoice was refunded
 * - VOIDED: Invoice was voided/cancelled
 * - CHARGEDBACK: Payment was charged back
 * - UNKNOWN_INVOICE_STATUS: Status is unknown
 */
wixClient.billing.onPurchasedItemInvoiceStatusUpdated(async (event) => {
  console.log('💰 Invoice status updated webhook received:', {
    type: 'InvoiceStatusUpdated',
    instanceId: event.data?.instanceId,
    invoiceId: event.data?.invoiceId,
    status: event.data?.status,
    recurring: event.data?.recurring,
    timestamp: new Date().toISOString(),
  });

  const instanceId = event.data?.instanceId;
  if (!instanceId) {
    console.error('Missing instanceId in invoice status webhook');
    return;
  }

  await handleWebhookSafely(instanceId, 'InvoiceStatusUpdated', async () => {
    const invoiceId = event.data?.invoiceId;
    const status = event.data?.status;
    const recurring = event.data?.recurring;

    console.log('📋 Invoice details:', {
      instanceId,
      invoiceId,
      status,
      recurring,
    });

    // Handle different invoice statuses
    if (status === 'PAID') {
      console.log('✅ Invoice paid successfully');
      // Query Wix to get current plan and update
      const planId = await getCurrentPlanFromWix(instanceId);
      if (planId) {
        await handleSubscriptionActive(instanceId, planId);
      }
    } else if (status === 'REFUNDED' || status === 'VOIDED') {
      console.log('💔 Invoice refunded/voided - checking if subscription should be downgraded');
      // Check if user still has an active subscription
      const currentPlan = await getCurrentPlanFromWix(instanceId);
      if (currentPlan === 'free' || !currentPlan) {
        await handleSubscriptionCanceled(instanceId);
      } else {
        console.log(`User still has active plan: ${currentPlan}, not downgrading`);
      }
    } else if (status === 'PAYMENT_FAILED') {
      console.log('⚠️ Payment failed - user may lose access soon');
      // Optionally notify user or log for monitoring
      // Don't downgrade immediately - Wix may retry
    } else if (status === 'CHARGEDBACK') {
      console.log('⚠️ Chargeback detected - may need to revoke access');
      // Handle chargeback - may want to downgrade or flag account
    } else {
      console.log('❓ Unknown or unhandled invoice status:', status);
    }
  });
});

/**
 * Wix Billing Webhook Handler
 * 
 * This endpoint receives webhook events from Wix and processes them
 * using the Wix SDK's webhook processing system.
 * 
 * The SDK automatically routes events to the appropriate handlers:
 * - PaidPlanAutoRenewalCancelled → onAppInstancePaidPlanAutoRenewalCancelled
 * - PaidPlanPurchased → onAppInstancePaidPlanPurchased
 * - PaidPlanChanged → onAppInstancePaidPlanChanged
 * - InvoiceStatusUpdated → onPurchasedItemInvoiceStatusUpdated
 * 
 * Requirements: 10.1, 10.2, 10.3, 10.4
 */
router.post('/api/webhooks/billing', express.text({ type: '*/*' }), async (req: Request, res: Response) => {
  try {
    console.log('Webhook request received:', {
      contentType: req.headers['content-type'],
      bodyType: typeof req.body,
      timestamp: new Date().toISOString(),
    });

    // Process the webhook using Wix SDK
    // The SDK handles signature verification and event routing automatically
    await wixClient.webhooks.process(req.body);

    res.status(200).send();
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).send(`Webhook error: ${error instanceof Error ? error.message : error}`);
  }
});

/**
 * Query Wix Billing API to get the current subscription plan
 * This is necessary because the webhook doesn't include plan information
 */
async function getCurrentPlanFromWix(instanceId: string): Promise<string | null> {
  try {
    console.log(`Fetching current plan from Wix for instance: ${instanceId}`);
    
    // Get instance token for API call
    const { getInstanceToken } = await import('../wix/tokenHelper');
    const accessToken = await getInstanceToken(instanceId);
    
    // Create SDK client and get purchase history
    const { WixSDKClient } = await import('../wix/sdkClient');
    const wixClient = new WixSDKClient(accessToken);
    
    const purchases = await wixClient.getPurchaseHistory();
    
    if (purchases.length > 0) {
      const currentPurchase = purchases[0];
      const productId = currentPurchase.productId;
      const planId = normalizePlanId(productId);
      
      console.log(`✅ Retrieved plan from Wix: productId="${productId}" → planId="${planId}"`);
      return planId;
    }
    
    console.log('No purchases found in Wix API, defaulting to free');
    return 'free';
  } catch (error) {
    console.error('Error fetching plan from Wix API:', error);
    return null;
  }
}

/**
 * Handle active subscription (PAID invoice)
 */
async function handleSubscriptionActive(instanceId: string, planId: string): Promise<void> {
  const normalizedPlanId = normalizePlanId(planId);
  
  console.log('Updating instance plan:', {
    instanceId,
    planId: normalizedPlanId,
  });

  await updateInstancePlan(instanceId, normalizedPlanId);
  
  console.log('Instance plan updated successfully');
}

/**
 * Handle subscription canceled/expired event
 * Downgrade to free plan
 */
async function handleSubscriptionCanceled(instanceId: string): Promise<void> {
  console.log('💔 Subscription canceled/expired, downgrading to free:', {
    instanceId,
  });

  // Check current plan from Wix to confirm it's actually free now
  const currentPlan = await getCurrentPlanFromWix(instanceId);
  
  if (currentPlan === 'free' || !currentPlan) {
    console.log('✅ Confirmed: User has no active paid plan, downgrading to free');
    await updateInstancePlan(instanceId, 'free');
    console.log('Instance downgraded to free plan');
  } else {
    console.log(`⚠️ User still has active plan: ${currentPlan}, not downgrading yet`);
  }
}

/**
 * Extract plan ID from purchased item
 * Maps Wix plan names/IDs to our internal plan IDs
 */
function extractPlanId(purchasedItem: any): string | null {
  if (!purchasedItem) {
    return null;
  }

  // Try to extract plan ID from various possible fields
  const planName = purchasedItem.name || purchasedItem.planName || purchasedItem.id || '';
  
  // Normalize and map to our plan IDs
  return normalizePlanId(planName);
}

/**
 * Get Wix Checkout URL for a specific plan (Self-Hosted Billing)
 * 
 * This endpoint generates a checkout URL for a specific plan using the Wix Billing API.
 * The user will be redirected to Wix's secure checkout page, then back to the app.
 * 
 * This is the recommended approach for self-hosted apps with external pricing pages.
 * 
 * Requirements: 9.2, External Pricing Page Setup
 */
router.post('/api/billing/checkout-url', verifyInstance, async (req: Request, res: Response) => {
  try {
    const { planId } = req.body;
    const { instanceId } = req.wixInstance!;
    
    if (!planId || typeof planId !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid planId parameter' });
    }

    // Validate plan ID
    const validPlans = ['free', 'starter', 'pro', 'scale'];
    if (!validPlans.includes(planId)) {
      return res.status(400).json({ error: 'Invalid plan ID' });
    }

    // Can't "checkout" the free plan
    if (planId === 'free') {
      return res.status(400).json({ 
        error: 'Cannot checkout free plan',
        message: 'The free plan does not require checkout'
      });
    }

    // Map internal plan IDs to Wix product IDs
    const planToProductId: Record<string, string> = {
      starter: process.env.WIX_PRODUCT_ID_STARTER || 'starter',
      pro: process.env.WIX_PRODUCT_ID_PRO || 'pro',
      scale: process.env.WIX_PRODUCT_ID_SCALE || 'scale',
    };

    const productId = planToProductId[planId];
    
    console.log('🔍 Product ID mapping:', {
      planId,
      productId,
      envVarName: `WIX_PRODUCT_ID_${planId.toUpperCase()}`,
      envVarValue: process.env[`WIX_PRODUCT_ID_${planId.toUpperCase()}`] || 'NOT SET',
    });
    
    if (!productId || productId === '') {
      console.error('❌ Product ID not configured for plan:', planId);
      return res.status(400).json({
        error: 'Plan not available',
        message: `The ${planId} plan is not yet configured in Wix.`,
        suggestion: `Set environment variable WIX_PRODUCT_ID_${planId.toUpperCase()}`,
      });
    }
    
    console.log('Generating checkout URL:', {
      planId,
      productId,
      instanceId,
    });

    // Get instance token for API call
    const { getInstanceToken } = await import('../wix/tokenHelper');
    const accessToken = await getInstanceToken(instanceId);

    // Create SDK client and get checkout URL
    const { WixSDKClient } = await import('../wix/sdkClient');
    const wixClient = new WixSDKClient(accessToken);

    const appId = process.env.WIX_APP_ID;
    // Redirect back to billing page with payment success indicator
    const successUrl = `https://www.wix.com/my-account/app/${appId}/${instanceId}?payment=success&plan=${planId}`;

    // Try to get checkout URL with retry logic
    let checkoutUrl: string;
    let attempts = 0;
    const maxAttempts = 2;
    
    while (attempts < maxAttempts) {
      attempts++;
      
      try {
        console.log(`Attempt ${attempts}/${maxAttempts} to get checkout URL...`);
        
        const result = await wixClient.getCheckoutUrl(productId, {
          successUrl,
          billingCycle: 'MONTHLY',
        });
        
        checkoutUrl = result.checkoutUrl;
        break;
      } catch (error: any) {
        console.error(`Attempt ${attempts} failed:`, error.message);
        
        if (attempts >= maxAttempts) {
          // All attempts failed - return helpful error
          throw error;
        }
        
        // Wait 2 seconds before retry
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    console.log('✅ Checkout URL generated:', {
      planId,
      productId,
      url: checkoutUrl!,
      attempts,
    });

    res.json({ 
      url: checkoutUrl!,
      planId,
      productId,
    });
  } catch (error: any) {
    console.error('Error generating checkout URL:', error);
    
    // Timeout errors or Wix internal API errors
    if (error.message?.includes('timeout') || 
        error.status === 504 || 
        error.message?.includes('deadline exceeded') ||
        error.message?.includes('ListPremiumProductCatalogPrices')) {
      return res.status(503).json({ 
        error: 'Wix API temporarily unavailable',
        code: 'WIX_API_TIMEOUT',
        message: 'Wix billing service is experiencing high load. This is a temporary issue on Wix\'s side.',
        details: error.message,
        suggestions: [
          'Wait 30-60 seconds and try again',
          'Wix API is experiencing performance issues',
          'This is not an issue with your app configuration',
          'If the issue persists, check https://status.wix.com',
        ],
        retryAfter: 60, // Suggest retry after 60 seconds
      });
    }
    
    // Authentication errors
    if (error.status === 401 || error.message?.includes('Unauthorized')) {
      return res.status(401).json({
        error: 'Authentication failed',
        code: 'AUTH_ERROR',
        message: 'Token expired or invalid',
        details: error.message,
      });
    }
    
    // Not found errors
    if (error.status === 404 || error.message?.includes('not found')) {
      return res.status(404).json({
        error: 'Plan not found',
        code: 'PLAN_NOT_FOUND',
        message: 'The requested pricing plan does not exist in Wix',
        details: error.message,
      });
    }
    
    // Generic error
    res.status(500).json({ 
      error: 'Failed to generate checkout URL',
      code: 'INTERNAL_ERROR',
      details: error.message,
    });
  }
});

/**
 * Get Wix Pricing Page URL (Legacy - for Wix-hosted pricing)
 * 
 * This endpoint generates a URL that redirects the user to Wix's hosted
 * pricing page where they can see all plans and upgrade.
 * 
 * Note: This is now deprecated in favor of self-hosted billing with checkout-url endpoint.
 * 
 * @deprecated Use self-hosted pricing page with /api/billing/checkout-url instead
 */
router.get('/api/billing/manage-plans-url', verifyInstance, async (req: Request, res: Response) => {
  try {
    const { instanceId } = req.wixInstance!;
    const appId = process.env.WIX_APP_ID;
    
    // Validate required values
    if (!appId) {
      console.error('❌ WIX_APP_ID environment variable is not set!');
      return res.status(500).json({ 
        error: 'Server configuration error',
        code: 'CONFIG_ERROR',
        details: 'WIX_APP_ID not configured',
      });
    }
    
    if (!instanceId) {
      console.error('❌ Instance ID is missing from request!');
      return res.status(400).json({ 
        error: 'Invalid request',
        code: 'MISSING_INSTANCE_ID',
        details: 'Instance ID is required',
      });
    }
    
    // Construct the Wix pricing page URL according to official 2025 docs
    // Format: https://www.wix.com/apps/upgrade/<APP_ID>?appInstanceId=<INSTANCE_ID>
    const pricingPageUrl = `https://www.wix.com/apps/upgrade/${appId}?appInstanceId=${instanceId}`;
    
    console.log('✅ Wix Pricing Page URL Generated (2025 Format):', {
      appId,
      instanceId,
      url: pricingPageUrl,
      format: 'https://www.wix.com/apps/upgrade/<APP_ID>?appInstanceId=<INSTANCE_ID>',
      timestamp: new Date().toISOString(),
    });
    
    res.json({ 
      url: pricingPageUrl,
      appId,
      instanceId,
    });
  } catch (error: any) {
    console.error('❌ Error generating pricing page URL:', error);
    
    // PRIORITY 4 FIX: Specific error handling
    if (error.message?.includes('Instance not found')) {
      return res.status(404).json({ 
        error: 'Instance not found',
        code: 'INSTANCE_NOT_FOUND',
        details: 'Please reinstall the app',
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to generate pricing page URL',
      code: 'INTERNAL_ERROR',
      details: error.message,
    });
  }
});

/**
 * Get Wix Billing checkout URL for plan upgrade
 * 
 * This endpoint generates a URL that redirects the user to Wix's billing
 * checkout page where they can upgrade their plan.
 * 
 * Uses the Wix SDK to call the real Billing API.
 * 
 * Requirements: 9.2
 */
router.get('/api/billing/upgrade-url', verifyInstance, async (req: Request, res: Response) => {
  try {
    const { planId } = req.query;
    const { instanceId } = req.wixInstance!;
    
    if (!planId || typeof planId !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid planId parameter' });
    }

    // Validate plan ID
    const validPlans = ['free', 'starter', 'pro', 'scale'];
    if (!validPlans.includes(planId)) {
      return res.status(400).json({ error: 'Invalid plan ID' });
    }

    // Map internal plan IDs to Wix product IDs
    // These should match the product IDs configured in Wix Developer Dashboard
    const planToProductId: Record<string, string> = {
      free: process.env.WIX_PRODUCT_ID_FREE || '',
      starter: process.env.WIX_PRODUCT_ID_STARTER || 'starter', // Known to work
      pro: process.env.WIX_PRODUCT_ID_PRO || '',
      scale: process.env.WIX_PRODUCT_ID_SCALE || '',
    };

    const productId = planToProductId[planId];
    
    // Check if product ID is configured
    if (!productId || productId === '') {
      console.error('Product ID not configured for plan:', planId);
      return res.status(400).json({
        error: 'Plan not available',
        message: `The ${planId} plan is not yet configured in Wix.`,
        details: 'This plan needs to be created in the Wix Developer Dashboard first.',
        instructions: [
          '1. Go to dev.wix.com',
          '2. Select your app',
          '3. Go to Pricing & Plans section',
          '4. Create a new pricing plan',
          `5. Set the plan ID to "${planId}"`,
          '6. Configure pricing and features',
          '7. Publish the plan',
          `8. Add WIX_PRODUCT_ID_${planId.toUpperCase()}=<plan-id> to environment variables`
        ]
      });
    }
    
    console.log('Generating checkout URL:', {
      planId,
      productId,
      instanceId,
    });

    // Get instance token for API call (site-specific)
    const { getInstanceToken } = await import('../wix/tokenHelper');
    const accessToken = await getInstanceToken(instanceId);

    // Create SDK client and get checkout URL
    const { WixSDKClient } = await import('../wix/sdkClient');
    const wixClient = new WixSDKClient(accessToken);

    const appId = process.env.WIX_APP_ID;
    // Redirect back to the app's billing page after successful payment
    // Format: https://www.wix.com/my-account/app/{appId}/{instanceId}?page=billing
    const successUrl = `https://www.wix.com/my-account/app/${appId}/${instanceId}`;

    const result = await wixClient.getCheckoutUrl(productId, {
      successUrl,
      billingCycle: 'MONTHLY',
      // Note: testCheckout is not supported for all apps
      // Remove or set to false if you get "doesn't support test flow" error
    });

    console.log('✅ Checkout URL generated:', {
      planId,
      productId,
      url: result.checkoutUrl,
    });

    res.json({ 
      url: result.checkoutUrl,
      planId,
      productId,
    });
  } catch (error: any) {
    console.error('Error generating upgrade URL:', error);
    
    // PRIORITY 4 FIX: Enhanced error handling with specific codes
    
    // Timeout errors
    if (error.message?.includes('timeout') || error.status === 504 || error.message?.includes('deadline exceeded')) {
      return res.status(504).json({ 
        error: 'Wix API timeout',
        code: 'TIMEOUT',
        message: 'The Wix billing service is taking too long to respond. This usually means the plan is not configured.',
        details: error.message,
        suggestion: 'Please ensure this pricing plan is created and published in your Wix Developer Dashboard.',
      });
    }
    
    // Authentication errors
    if (error.status === 401 || error.message?.includes('Unauthorized')) {
      return res.status(401).json({
        error: 'Authentication failed',
        code: 'AUTH_ERROR',
        message: 'Token expired or invalid',
        details: error.message,
        suggestion: 'Please refresh the page and try again',
      });
    }
    
    // Permission errors
    if (error.status === 403 || error.message?.includes('Forbidden')) {
      return res.status(403).json({
        error: 'Permission denied',
        code: 'PERMISSION_ERROR',
        message: 'App does not have permission to access billing',
        details: error.message,
        suggestion: 'Check app permissions in Wix Developer Dashboard',
      });
    }
    
    // Not found errors (plan doesn't exist)
    if (error.status === 404 || error.message?.includes('not found')) {
      return res.status(404).json({
        error: 'Plan not found',
        code: 'PLAN_NOT_FOUND',
        message: 'The requested pricing plan does not exist',
        details: error.message,
        suggestion: 'Verify the plan ID is correct and the plan is published',
      });
    }
    
    // Rate limiting
    if (error.status === 429 || error.message?.includes('rate limit')) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        code: 'RATE_LIMIT',
        message: 'Too many requests to Wix API',
        details: error.message,
        suggestion: 'Please wait a moment and try again',
      });
    }
    
    // Generic error
    res.status(500).json({ 
      error: 'Failed to generate upgrade URL',
      code: 'INTERNAL_ERROR',
      details: error.message,
    });
  }
});

/**
 * Get current subscription/purchase history
 * 
 * This endpoint fetches the site's purchase history from Wix Billing API
 * to show the current subscription status.
 * 
 * PRIORITY 4 FIX: Added specific error handling and timeout
 * 
 * Requirements: 9.1
 */
router.get('/api/billing/subscription', verifyInstance, async (req: Request, res: Response) => {
  try {
    const { instanceId } = req.wixInstance!;
    console.log('Fetching subscription data for instance:', instanceId);

    // PRIORITY 4 FIX: Add timeout wrapper
    const timeoutMs = 12000; // 12 seconds (allows 10s for API + 2s buffer)
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Subscription fetch timeout')), timeoutMs)
    );

    const fetchPromise = (async () => {
      // Get instance token for API call (site-specific)
      const { getInstanceToken } = await import('../wix/tokenHelper');
      const accessToken = await getInstanceToken(instanceId);

      // Create SDK client and get purchase history
      const { WixSDKClient } = await import('../wix/sdkClient');
      const wixClient = new WixSDKClient(accessToken);

      const purchases = await wixClient.getPurchaseHistory();

      // Get the most recent purchase
      const currentPurchase = purchases.length > 0 ? purchases[0] : null;

      if (!currentPurchase) {
        console.log('No purchases found - user on free plan');
        return {
          planId: 'free',
          planName: 'Free',
          status: 'active',
          billingCycle: null,
          price: 0,
          currency: 'USD',
        };
      }

      // Map Wix product ID back to our plan ID
      const productId = currentPurchase.productId;
      const planId = normalizePlanId(productId);

      console.log('✅ Subscription data retrieved:', {
        productId,
        planId,
        billingCycle: currentPurchase.billingCycle,
        price: currentPurchase.price,
      });

      return {
        planId,
        planName: getPlanName(planId),
        status: 'active',
        billingCycle: currentPurchase.billingCycle,
        price: parseFloat(currentPurchase.price || '0'),
        currency: currentPurchase.currency || 'USD',
        dateCreated: currentPurchase.dateCreated,
      };
    })();

    const result = await Promise.race([fetchPromise, timeoutPromise]);
    res.json(result);
  } catch (error: any) {
    console.error('Error fetching subscription data:', error);
    
    // PRIORITY 4 FIX: Specific error handling
    if (error.message?.includes('timeout')) {
      console.error('⏱️ Subscription fetch timeout - returning cached free plan');
      return res.json({
        planId: 'free',
        planName: 'Free',
        status: 'active',
        billingCycle: null,
        price: 0,
        currency: 'USD',
        error: 'Request timeout - showing free plan',
        code: 'TIMEOUT',
      });
    }
    
    if (error.status === 401 || error.message?.includes('Unauthorized')) {
      console.error('🔒 Authentication error - token may be expired');
      return res.status(401).json({
        error: 'Authentication failed',
        code: 'AUTH_ERROR',
        details: 'Please refresh the page',
      });
    }
    
    // Generic fallback
    res.json({
      planId: 'free',
      planName: 'Free',
      status: 'active',
      billingCycle: null,
      price: 0,
      currency: 'USD',
      error: 'Failed to fetch subscription data',
      code: 'FETCH_ERROR',
    });
  }
});

/**
 * Normalize plan ID from Wix format to our internal format
 * Handles various possible formats from Wix
 */
function normalizePlanId(planId: string): string {
  if (!planId) {
    return 'free';
  }

  const normalized = planId.toLowerCase().trim();
  
  // Map common variations
  const planMap: Record<string, string> = {
    'free': 'free',
    'starter': 'starter',
    'pro': 'pro',
    'scale': 'scale',
  };
  
  // Check if the normalized string contains any of our plan names
  for (const [key, value] of Object.entries(planMap)) {
    if (normalized.includes(key)) {
      return value;
    }
  }
  
  return planMap[normalized] || 'free';
}

/**
 * Get display name for plan ID
 */
function getPlanName(planId: string): string {
  const planNames: Record<string, string> = {
    free: 'Free',
    starter: 'Starter',
    pro: 'Pro',
    scale: 'Scale',
  };
  
  return planNames[planId] || 'Free';
}

/**
 * Manual sync endpoint to fix credit mismatches
 * 
 * This endpoint queries Wix for the actual subscription,
 * then updates the database plan and credits accordingly.
 * Useful if webhook delivery failed or credits got out of sync.
 * 
 * PRIORITY 4 FIX: Added timeout and better error handling
 * 
 * Requirements: Bug fix for credit assignment
 */
router.post('/api/billing/sync-credits', verifyInstance, async (req: Request, res: Response) => {
  try {
    const { instanceId } = req.wixInstance!;
    console.log('[SYNC] Manual credit sync requested for instance:', instanceId);

    // PRIORITY 4 FIX: Add timeout wrapper (15s for sync operation)
    const timeoutMs = 15000;
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Credit sync timeout')), timeoutMs)
    );

    const syncPromise = (async () => {
      // Get current instance data
      const { getAppInstance } = await import('../db/appInstances');
      const instance = await getAppInstance(instanceId);

      if (!instance) {
        throw new Error('Instance not found');
      }

      const oldPlan = instance.plan_id;
      const oldCreditsTotal = instance.credits_total;
      const oldCreditsUsed = instance.credits_used_month;
      const oldAvailable = oldCreditsTotal - oldCreditsUsed;

      console.log('[SYNC] Current state:', {
        plan: oldPlan,
        total: oldCreditsTotal,
        used: oldCreditsUsed,
        available: oldAvailable,
      });

      // Get actual plan from Wix
      console.log('[SYNC] Querying Wix API...');
      const actualPlanId = await getCurrentPlanFromWix(instanceId);

      if (!actualPlanId) {
        throw new Error('Could not determine current subscription from Wix API');
      }

      console.log('[SYNC] Wix says plan is:', actualPlanId);

      // Always use updateInstancePlan to preserve accumulated credits
      // This handles both plan changes and ensures credits are correct
      if (oldPlan === actualPlanId) {
        console.log('[SYNC] Plan unchanged, verifying credits are correct');
        // Even if plan is the same, updateInstancePlan will preserve accumulated credits
        // and only update if there's a mismatch
        const { updateInstancePlan } = await import('../db/appInstances');
        await updateInstancePlan(instanceId, actualPlanId);
      } else {
        // Plan changed, use the upgrade/downgrade logic
        console.log('[SYNC] Plan changed, updating with proper credit logic');
        const { updateInstancePlan } = await import('../db/appInstances');
        await updateInstancePlan(instanceId, actualPlanId);
      }

      // Fetch updated instance data
      const updatedInstance = await getAppInstance(instanceId);

      if (!updatedInstance) {
        throw new Error('Instance not found after update');
      }

      const newAvailable = updatedInstance.credits_total - updatedInstance.credits_used_month;

      console.log('[SYNC] ✅ Sync complete:', {
        oldPlan,
        newPlan: updatedInstance.plan_id,
        oldAvailable,
        newAvailable,
      });

      return {
        success: true,
        message: 'Credits synced successfully with Wix subscription',
        before: {
          planId: oldPlan,
          creditsTotal: oldCreditsTotal,
          creditsUsed: oldCreditsUsed,
          creditsAvailable: oldAvailable,
        },
        after: {
          planId: updatedInstance.plan_id,
          creditsTotal: updatedInstance.credits_total,
          creditsUsed: updatedInstance.credits_used_month,
          creditsAvailable: newAvailable,
        },
      };
    })();

    const result = await Promise.race([syncPromise, timeoutPromise]);
    res.json(result);
  } catch (error: any) {
    console.error('[SYNC] Error syncing credits:', error);
    
    // PRIORITY 4 FIX: Specific error handling
    if (error.message?.includes('timeout')) {
      return res.status(504).json({ 
        error: 'Sync timeout',
        code: 'TIMEOUT',
        message: 'Credit sync is taking too long',
        details: error.message,
        suggestion: 'Please try again in a moment',
      });
    }
    
    if (error.message?.includes('Instance not found')) {
      return res.status(404).json({ 
        error: 'Instance not found',
        code: 'INSTANCE_NOT_FOUND',
        details: error.message,
      });
    }
    
    if (error.status === 401 || error.message?.includes('Unauthorized')) {
      return res.status(401).json({
        error: 'Authentication failed',
        code: 'AUTH_ERROR',
        details: error.message,
        suggestion: 'Please refresh the page',
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to sync credits',
      code: 'SYNC_ERROR',
      details: error.message,
    });
  }
});

export default router;
