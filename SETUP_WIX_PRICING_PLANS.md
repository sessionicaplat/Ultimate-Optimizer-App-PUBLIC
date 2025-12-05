# Setup Wix Pricing Plans

## Current Issue

You're getting timeout errors when trying to upgrade to Pro or Scale plans because **these plans don't exist in your Wix Developer Dashboard yet**.

```
Error: deadline exceeded while waiting for a response from the server
```

This happens when Wix tries to look up a pricing plan that doesn't exist.

## What's Currently Working

✅ **Starter Plan** - Configured and working
❌ **Pro Plan** - Not configured (causes timeout)
❌ **Scale Plan** - Not configured (causes timeout)

## How to Fix

### Step 1: Go to Wix Developer Dashboard

1. Navigate to https://dev.wix.com
2. Sign in with your Wix account
3. Select your app: **Ultimate Optimizer App**

### Step 2: Create Pricing Plans

1. In the left sidebar, click **"Pricing & Plans"** or **"Monetization"**
2. Click **"Add Pricing Plan"** or **"Create Plan"**

### Step 3: Configure Pro Plan

Create a plan with these settings:

**Basic Info**:
- **Plan Name**: Pro Plan
- **Plan ID**: `pro` (important - must match exactly)
- **Description**: Advanced features for growing businesses

**Pricing**:
- **Price**: $49.99/month (or your desired price)
- **Billing Cycle**: Monthly
- **Currency**: USD

**Features** (what users get):
- 5,000 credits per month
- Advanced AI optimization
- Priority support
- Bulk processing
- Custom templates

**Save and Publish** the plan

### Step 4: Configure Scale Plan

Create another plan with these settings:

**Basic Info**:
- **Plan Name**: Scale Plan
- **Plan ID**: `scale` (important - must match exactly)
- **Description**: Enterprise features for large businesses

**Pricing**:
- **Price**: $99.99/month (or your desired price)
- **Billing Cycle**: Monthly
- **Currency**: USD

**Features** (what users get):
- 10,000 credits per month
- All Pro features
- Dedicated support
- API access
- White-label options

**Save and Publish** the plan

### Step 5: Get Product IDs

After creating each plan:

1. Click on the plan in your dashboard
2. Look for the **Product ID** or **Plan ID**
3. Copy it (it might look like: `pro-plan-abc123` or just `pro`)

### Step 6: Update Environment Variables

Add these to your Render environment variables:

```
WIX_PRODUCT_ID_PRO=<your-pro-plan-id>
WIX_PRODUCT_ID_SCALE=<your-scale-plan-id>
```

**How to add in Render**:
1. Go to https://dashboard.render.com
2. Select your service
3. Go to **Environment** tab
4. Click **Add Environment Variable**
5. Add each variable
6. Click **Save Changes**
7. Render will automatically redeploy

### Step 7: Update Database

Make sure your `plans` table has the correct credits:

```sql
-- Check current plans
SELECT * FROM plans;

-- Update if needed
UPDATE plans SET monthly_credits = 5000 WHERE id = 'pro';
UPDATE plans SET monthly_credits = 10000 WHERE id = 'scale';
```

## Alternative: Use Starter Plan Only

If you don't want to create Pro and Scale plans yet, you can:

### Option 1: Hide Unavailable Plans

Update your frontend to only show the Starter plan:

```typescript
// In BillingCredits.tsx
const availablePlans = [
  { id: 'free', name: 'Free', credits: 100, price: 0 },
  { id: 'starter', name: 'Starter', credits: 1000, price: 9.99 },
  // Comment out until configured:
  // { id: 'pro', name: 'Pro', credits: 5000, price: 49.99 },
  // { id: 'scale', name: 'Scale', credits: 10000, price: 99.99 },
];
```

### Option 2: Show "Coming Soon"

Add a badge to unavailable plans:

```typescript
{plan.id === 'pro' || plan.id === 'scale' ? (
  <span className="coming-soon-badge">Coming Soon</span>
) : (
  <button onClick={() => handleUpgrade(plan.id)}>
    Upgrade
  </button>
)}
```

## Verification

After setting up the plans:

1. **Test in Wix Dashboard**:
   - Go to your test site
   - Open your app
   - Try to upgrade to Pro
   - Should redirect to Wix checkout

2. **Check Logs**:
   ```
   ✅ Checkout URL generated: {
     planId: 'pro',
     productId: 'pro-plan-abc123',
     url: 'https://www.wix.com/...'
   }
   ```

3. **Test Upgrade Flow**:
   - Click upgrade button
   - Should open Wix checkout page
   - Complete payment (use test mode)
   - Should redirect back to your app
   - Credits should update

## Troubleshooting

### "Plan not available" Error

**Cause**: Product ID not in environment variables

**Fix**:
1. Check Render environment variables
2. Ensure `WIX_PRODUCT_ID_PRO` and `WIX_PRODUCT_ID_SCALE` are set
3. Redeploy if needed

### Timeout Error (504)

**Cause**: Plan doesn't exist in Wix

**Fix**:
1. Go to Wix Developer Dashboard
2. Create the pricing plan
3. Publish it
4. Wait a few minutes for Wix to sync

### Wrong Credits After Upgrade

**Cause**: Database `plans` table not updated

**Fix**:
```sql
UPDATE plans 
SET monthly_credits = 5000 
WHERE id = 'pro';
```

### Checkout URL Opens But Shows Error

**Cause**: Plan not published or pricing not set

**Fix**:
1. Go to Wix Developer Dashboard
2. Edit the plan
3. Ensure it's **Published** (not draft)
4. Verify pricing is set

## Quick Start (Minimum Setup)

If you just want to get it working quickly:

1. **Create Pro Plan in Wix**:
   - Name: Pro
   - ID: `pro`
   - Price: $49.99/month
   - Publish it

2. **Add to Render**:
   ```
   WIX_PRODUCT_ID_PRO=pro
   ```

3. **Test**:
   - Try upgrading to Pro
   - Should work now!

4. **Repeat for Scale** when ready

## Summary

The timeout errors happen because:
- ❌ Pro and Scale plans don't exist in Wix
- ❌ Wix API can't find them
- ❌ Request times out

To fix:
- ✅ Create plans in Wix Developer Dashboard
- ✅ Add product IDs to environment variables
- ✅ Update database if needed
- ✅ Test upgrade flow

Once configured, upgrades will work smoothly!
