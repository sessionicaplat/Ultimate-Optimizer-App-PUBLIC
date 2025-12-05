import { query, transaction } from './index';
import { AppInstance } from './types';

/**
 * Create or update an app instance after OAuth
 */
export async function upsertAppInstance(data: {
  instanceId: string;
  siteHost: string;
  siteId?: string | null;
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // seconds
}): Promise<AppInstance> {
  const tokenExpiresAt = new Date(Date.now() + data.expiresIn * 1000);
  const creditsResetOn = getNextMonthFirstDay();

  const result = await query<AppInstance>(
    `
    INSERT INTO app_instances (
      instance_id,
      site_host,
      site_id,
      access_token,
      refresh_token,
      token_expires_at,
      plan_id,
      credits_total,
      credits_used_month,
      credits_reset_on
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    ON CONFLICT (instance_id) 
    DO UPDATE SET
      site_host = EXCLUDED.site_host,
      site_id = COALESCE(EXCLUDED.site_id, app_instances.site_id),
      access_token = EXCLUDED.access_token,
      refresh_token = EXCLUDED.refresh_token,
      token_expires_at = EXCLUDED.token_expires_at,
      updated_at = now()
    RETURNING *
    `,
    [
      data.instanceId,
      data.siteHost,
      data.siteId ?? null,
      data.accessToken,
      data.refreshToken,
      tokenExpiresAt,
      'free',
      200,
      0,
      creditsResetOn,
    ]
  );

  return result.rows[0];
}

/**
 * Get app instance by instance_id
 */
export async function getAppInstance(instanceId: string): Promise<AppInstance | null> {
  const result = await query<AppInstance>(
    'SELECT * FROM app_instances WHERE instance_id = $1',
    [instanceId]
  );

  return result.rows[0] || null;
}

/**
 * Update owner email for an instance
 * This is used to store the site owner's email during provisioning
 */
export async function updateOwnerEmail(
  instanceId: string,
  ownerEmail: string,
  options?: { siteId?: string | null }
): Promise<void> {
  await query(
    `
    UPDATE app_instances
    SET owner_email = $1,
        site_id = COALESCE($3, site_id),
        updated_at = now()
    WHERE instance_id = $2
    `,
    [ownerEmail, instanceId, options?.siteId ?? null]
  );
  
  const siteLog =
    options?.siteId !== undefined ? ` (siteId: ${options.siteId ?? 'null'})` : '';
  console.log(`[AppInstances] Updated owner email for instance ${instanceId}: ${ownerEmail}${siteLog}`);
}


/**
 * Update owner member ID for an instance
 */
export async function updateOwnerMemberId(
  instanceId: string,
  ownerMemberId: string
): Promise<void> {
  await query(
    `
    UPDATE app_instances
    SET owner_member_id = $1,
        updated_at = now()
    WHERE instance_id = $2
    `,
    [ownerMemberId, instanceId]
  );

  console.log(`✅ Updated owner member ID for instance ${instanceId}: ${ownerMemberId}`);
}

export async function updateDefaultWriter(
  instanceId: string,
  data: {
    name?: string | null;
    email?: string | null;
    memberId?: string | null;
  }
): Promise<void> {
  const updates: string[] = [];
  const values: any[] = [instanceId];
  let index = 2;

  if (Object.prototype.hasOwnProperty.call(data, 'name')) {
    updates.push(`default_writer_name = $${index++}`);
    values.push(data.name ?? null);
  }

  if (Object.prototype.hasOwnProperty.call(data, 'email')) {
    updates.push(`default_writer_email = $${index++}`);
    values.push(data.email ?? null);
  }

  if (Object.prototype.hasOwnProperty.call(data, 'memberId')) {
    updates.push(`default_writer_member_id = $${index++}`);
    values.push(data.memberId ?? null);
  }

  if (!updates.length) {
    return;
  }

  updates.push('updated_at = now()');

  await query(
    `
    UPDATE app_instances
    SET ${updates.join(', ')}
    WHERE instance_id = $1
    `,
    values
  );

  console.log(
    `[AppInstances] Updated default writer for ${instanceId}: ${
      data.name ? `name=${data.name} ` : ''
    }${data.memberId ? `memberId=${data.memberId}` : ''}`.trim()
  );
}

/**
 * Update access token for an instance
 */
export async function updateAccessToken(
  instanceId: string,
  accessToken: string,
  refreshToken: string,
  expiresIn: number
): Promise<void> {
  const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000);

  await query(
    `
    UPDATE app_instances
    SET access_token = $1,
        refresh_token = $2,
        token_expires_at = $3,
        updated_at = now()
    WHERE instance_id = $4
    `,
    [accessToken, refreshToken, tokenExpiresAt, instanceId]
  );
}

/**
 * Update catalog version for an instance
 * Gracefully handles case where column doesn't exist yet (during migration)
 */
export async function updateCatalogVersion(
  instanceId: string,
  catalogVersion: 'V1' | 'V3'
): Promise<void> {
  try {
    await query(
      `
      UPDATE app_instances
      SET catalog_version = $1,
          updated_at = now()
      WHERE instance_id = $2
      `,
      [catalogVersion, instanceId]
    );
    
    console.log(`[AppInstances] Updated catalog version for ${instanceId}: ${catalogVersion}`);
  } catch (error: any) {
    // Gracefully handle case where column doesn't exist yet
    if (error.code === '42703') {
      console.warn(`[AppInstances] catalog_version column doesn't exist yet - skipping update. Run migrations.`);
    } else {
      throw error;
    }
  }
}

/**
 * Update instance plan with persistent credit balance
 * 
 * Credit Logic:
 * - UPGRADE FROM FREE: Keep current available + add new plan's monthly credits
 * - UPGRADE BETWEEN PAID: Keep current available + add new plan's monthly credits
 * - DOWNGRADE TO FREE: Reset to 200 credits (free plan amount)
 * - DOWNGRADE BETWEEN PAID: Keep current available credits
 * - Credits persist across plan changes (except downgrade to free)
 * - Monthly reset adds plan's monthly credits to balance
 * 
 * Subscription Tracking:
 * - Sets subscription_start_date when upgrading to first paid plan
 * - Sets next_billing_date to 30 days from subscription start
 * - Clears subscription dates when downgrading to free
 * 
 * Available Credits = credits_total - credits_used_month
 */
export async function updateInstancePlan(
  instanceId: string,
  planId: string
): Promise<void> {
  // Get plan details
  const planResult = await query(
    'SELECT monthly_credits FROM plans WHERE id = $1',
    [planId]
  );

  if (planResult.rows.length === 0) {
    throw new Error(`Plan not found: ${planId}`);
  }

  const newPlanMonthlyCredits = planResult.rows[0].monthly_credits;

  // Get current instance data
  const instanceResult = await query<AppInstance>(
    'SELECT plan_id, credits_total, credits_used_month, subscription_start_date FROM app_instances WHERE instance_id = $1',
    [instanceId]
  );

  if (instanceResult.rows.length === 0) {
    throw new Error(`Instance not found: ${instanceId}`);
  }

  const currentInstance = instanceResult.rows[0];
  
  // Calculate current available credits
  const currentAvailableCredits = currentInstance.credits_total - currentInstance.credits_used_month;
  
  // Determine if this is an upgrade or downgrade
  const oldPlanResult = await query(
    'SELECT monthly_credits FROM plans WHERE id = $1',
    [currentInstance.plan_id]
  );
  const oldPlanMonthlyCredits = oldPlanResult.rows[0]?.monthly_credits || 0;
  
  const isUpgrade = newPlanMonthlyCredits > oldPlanMonthlyCredits;
  const isDowngrade = newPlanMonthlyCredits < oldPlanMonthlyCredits;
  const isUpgradingToFirstPaidPlan = currentInstance.plan_id === 'free' && planId !== 'free';
  const isDowngradingToFree = currentInstance.plan_id !== 'free' && planId === 'free';
  const isSamePlan = currentInstance.plan_id === planId;
  
  let newCreditsTotal: number;
  let newCreditsUsed: number;
  let subscriptionStartDate: Date | null = currentInstance.subscription_start_date || null;
  let nextBillingDate: Date | null = null;
  
  // Fix for users with paid plans but missing next_billing_date
  // Calculate it from subscription_start_date if available
  if (planId !== 'free' && subscriptionStartDate && !currentInstance.next_billing_date) {
    const startTime = subscriptionStartDate.getTime();
    const now = Date.now();
    const daysSinceStart = Math.floor((now - startTime) / (24 * 60 * 60 * 1000));
    const cyclesPassed = Math.floor(daysSinceStart / 30);
    nextBillingDate = new Date(startTime + (cyclesPassed + 1) * 30 * 24 * 60 * 60 * 1000);
    
    console.log(`🔧 Calculated missing next_billing_date from subscription_start_date:`);
    console.log(`   Subscription started: ${subscriptionStartDate.toISOString()}`);
    console.log(`   Days since start: ${daysSinceStart}`);
    console.log(`   Cycles passed: ${cyclesPassed}`);
    console.log(`   Next billing date: ${nextBillingDate.toISOString()}`);
  }
  
  if (isSamePlan) {
    // SAME PLAN: Keep everything as is - no changes needed
    // This prevents credit resets when syncing the same plan
    newCreditsTotal = currentInstance.credits_total;
    newCreditsUsed = currentInstance.credits_used_month;
    nextBillingDate = currentInstance.next_billing_date || null;
    console.log(`↔️  SAME PLAN: ${planId} - No changes`);
    console.log(`   Preserving credits: ${currentAvailableCredits} available (${currentInstance.credits_total} total - ${currentInstance.credits_used_month} used)`);
    
  } else if (isDowngradingToFree) {
    // DOWNGRADE TO FREE: Reset to 200 credits (only when coming FROM a paid plan)
    newCreditsTotal = 200;
    newCreditsUsed = 0;
    subscriptionStartDate = null;
    nextBillingDate = null;
    console.log(`📉 DOWNGRADE TO FREE: ${currentInstance.plan_id} → ${planId}`);
    console.log(`   Resetting to 200 credits (free plan amount)`);
    
  } else if (isUpgradingToFirstPaidPlan) {
    // UPGRADE FROM FREE: Keep available + add new plan credits
    newCreditsTotal = currentAvailableCredits + newPlanMonthlyCredits;
    newCreditsUsed = 0;
    subscriptionStartDate = new Date();
    nextBillingDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
    console.log(`📈 UPGRADE FROM FREE: ${currentInstance.plan_id} → ${planId}`);
    console.log(`   Available: ${currentAvailableCredits} + New: ${newPlanMonthlyCredits} = Total: ${newCreditsTotal}`);
    console.log(`   Subscription starts: ${subscriptionStartDate.toISOString()}`);
    console.log(`   Next billing: ${nextBillingDate.toISOString()}`);
    
  } else if (isUpgrade) {
    // UPGRADE BETWEEN PAID PLANS: Add new plan's credits to current available
    newCreditsTotal = currentAvailableCredits + newPlanMonthlyCredits;
    newCreditsUsed = 0;
    // Keep existing subscription dates
    if (subscriptionStartDate) {
      nextBillingDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }
    console.log(`📈 UPGRADE: ${currentInstance.plan_id} → ${planId}`);
    console.log(`   Available: ${currentAvailableCredits} + New: ${newPlanMonthlyCredits} = Total: ${newCreditsTotal}`);
    
  } else if (isDowngrade) {
    // DOWNGRADE BETWEEN PAID PLANS: Keep current available credits
    newCreditsTotal = currentAvailableCredits;
    newCreditsUsed = 0;
    // Keep existing subscription dates
    if (subscriptionStartDate) {
      nextBillingDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }
    console.log(`📉 DOWNGRADE: ${currentInstance.plan_id} → ${planId}`);
    console.log(`   Keeping available credits: ${currentAvailableCredits}`);
    
  } else {
    // FALLBACK: Should not reach here, but keep current state if we do
    newCreditsTotal = currentInstance.credits_total;
    newCreditsUsed = currentInstance.credits_used_month;
    nextBillingDate = currentInstance.next_billing_date || null;
    console.log(`⚠️  UNEXPECTED CASE: ${currentInstance.plan_id} → ${planId}`);
    console.log(`   Preserving current state as fallback`);
  }
  
  console.log('Updating instance plan:', {
    instanceId,
    oldPlan: currentInstance.plan_id,
    newPlan: planId,
    oldCreditsTotal: currentInstance.credits_total,
    oldCreditsUsed: currentInstance.credits_used_month,
    oldAvailable: currentAvailableCredits,
    newCreditsTotal,
    newCreditsUsed,
    newAvailable: newCreditsTotal - newCreditsUsed,
    subscriptionStartDate: subscriptionStartDate?.toISOString() || 'null',
    nextBillingDate: nextBillingDate?.toISOString() || 'null',
  });

  // Update plan, credits, and subscription tracking
  await query(
    `
    UPDATE app_instances
    SET plan_id = $1,
        credits_total = $2,
        credits_used_month = $3,
        subscription_start_date = $4,
        next_billing_date = $5,
        updated_at = now()
    WHERE instance_id = $6
    `,
    [planId, newCreditsTotal, newCreditsUsed, subscriptionStartDate, nextBillingDate, instanceId]
  );
  
  console.log(`✅ Instance plan updated: ${planId} with ${newCreditsTotal - newCreditsUsed} available credits`);
}

/**
 * Increment credits used for an instance
 */
export async function incrementCreditsUsed(
  instanceId: string,
  amount: number
): Promise<void> {
  await query(
    `
    UPDATE app_instances
    SET credits_used_month = credits_used_month + $1,
        updated_at = now()
    WHERE instance_id = $2
    `,
    [amount, instanceId]
  );
}

/**
 * Add monthly credits to instances where billing cycle has passed
 * 
 * This adds the plan's monthly credits to the available balance,
 * rather than resetting to a fixed amount.
 * 
 * Uses next_billing_date for paid subscriptions (30-day cycles from subscription start)
 * Falls back to credits_reset_on for free plans (calendar month)
 * 
 * Returns the number of instances that received credits
 */
export async function resetMonthlyCredits(): Promise<number> {
  const result = await query(
    `
    UPDATE app_instances ai
    SET credits_total = ai.credits_total - ai.credits_used_month + p.monthly_credits,
        credits_used_month = 0,
        next_billing_date = CASE 
          WHEN ai.next_billing_date IS NOT NULL 
          THEN ai.next_billing_date + INTERVAL '30 days'
          ELSE NULL
        END,
        credits_reset_on = CASE
          WHEN ai.next_billing_date IS NULL
          THEN (DATE_TRUNC('month', ai.credits_reset_on) + INTERVAL '1 month')::date
          ELSE ai.credits_reset_on
        END,
        updated_at = now()
    FROM plans p
    WHERE ai.plan_id = p.id
      AND (
        (ai.next_billing_date IS NOT NULL AND ai.next_billing_date <= now())
        OR (ai.next_billing_date IS NULL AND ai.credits_reset_on <= CURRENT_DATE)
      )
    RETURNING ai.instance_id, ai.plan_id, 
              (ai.credits_total - ai.credits_used_month) as old_available,
              p.monthly_credits as added,
              (ai.credits_total - ai.credits_used_month + p.monthly_credits) as new_total,
              ai.next_billing_date
    `
  );

  if (result.rows.length > 0) {
    console.log(`✅ Added monthly credits to ${result.rows.length} instance(s):`);
    result.rows.forEach(row => {
      const billingType = row.next_billing_date ? 'subscription cycle' : 'calendar month';
      console.log(`  - ${row.instance_id} (${row.plan_id}, ${billingType}): ${row.old_available} + ${row.added} = ${row.new_total} available`);
    });
  }

  return result.rows.length;
}

/**
 * ⚠️ DANGER: This function DESTROYS accumulated credits!
 * 
 * This function resets credits_total to the plan's base monthly_credits amount,
 * which removes any accumulated/rolled-over credits.
 * 
 * ❌ DO NOT USE - This function is deprecated and will throw an error
 * ❌ Causes credit loss for users who have accumulated credits
 * ❌ Was the root cause of the "credit reset on server restart" bug
 * 
 * For normal credit management, use:
 * - updateInstancePlan() - Preserves accumulated credits
 * - /api/billing/sync-credits endpoint - Safe manual sync
 * 
 * @deprecated This function destroys accumulated credits and should never be used
 * @throws {Error} Always throws an error to prevent accidental use
 */
export async function syncInstanceCredits(instanceId: string): Promise<void> {
  throw new Error(
    'syncInstanceCredits() is deprecated and dangerous! ' +
    'It destroys accumulated credits. Use updateInstancePlan() instead.'
  );
}

/**
 * ⚠️ DANGER: This function DESTROYS accumulated credits for ALL users!
 * 
 * This function resets credits_total to the plan's base monthly_credits amount
 * for ALL instances in the database, removing any accumulated/rolled-over credits.
 * 
 * ❌ DO NOT USE - This function is deprecated and will throw an error
 * ❌ Causes credit loss for ALL users who have accumulated credits
 * ❌ Was called by the credit sync scheduler every 6 hours and on server restart
 * ❌ Root cause of the "credit reset on server restart" bug
 * 
 * The webhook system (backend/src/routes/billing.ts) already handles
 * credit updates correctly using updateInstancePlan(). This function
 * was added to "fix" missed webhooks, but it caused more problems than it solved.
 * 
 * @deprecated This function destroys accumulated credits and should never be used
 * @throws {Error} Always throws an error to prevent accidental use
 */
export async function syncAllInstanceCredits(): Promise<number> {
  throw new Error(
    'syncAllInstanceCredits() is deprecated and extremely dangerous! ' +
    'It destroys accumulated credits for ALL users. ' +
    'The webhook system already handles credit updates correctly.'
  );
}

/**
 * Get the first day of next month
 */
function getNextMonthFirstDay(): Date {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return nextMonth;
}
