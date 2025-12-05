# How to Get Wix Product IDs

## The Issue

The upgrade button is failing with a 504 timeout because the product IDs (`'pro'`, `'scale'`) don't exist in your Wix app configuration. Only `'starter'` works because you already purchased it.

## Solution: Add Real Wix Product IDs

### Step 1: Get Product IDs from Wix

1. Go to [Wix Developers Dashboard](https://dev.wix.com/)
2. Sign in and select your app
3. Navigate to **Monetization** → **Plans** (or **Billing**)
4. You should see your plans listed
5. For each plan, find the **Product ID** field
   - It's a UUID format like: `e8f429d4-0a6a-468f-8044-87f519a53202`
6. Copy the Product ID for each plan

### Step 2: Add to Render Environment Variables

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Select your **backend** service
3. Click **Environment** tab
4. Add these variables (one at a time):

```bash
# Key: WIX_PRODUCT_ID_STARTER
# Value: <paste-the-uuid-from-wix>

# Key: WIX_PRODUCT_ID_PRO  
# Value: <paste-the-uuid-from-wix>

# Key: WIX_PRODUCT_ID_SCALE
# Value: <paste-the-uuid-from-wix>
```

5. Click **Save Changes**
6. Render will automatically redeploy (~2 minutes)

### Step 3: Test

After deployment:
1. Try clicking "Upgrade" on Pro plan
2. Should now redirect to Wix checkout
3. No more timeout errors

## Current Status

**Working:**
- ✅ Starter plan (product ID: `'starter'`)

**Not Working (Need Product IDs):**
- ❌ Pro plan (returns 400 error until product ID added)
- ❌ Scale plan (returns 400 error until product ID added)
- ❌ Free plan (optional, usually doesn't need checkout)

## Temporary Workaround

Until you add the real product IDs, the upgrade buttons for Pro and Scale will show a user-friendly error:

```json
{
  "error": "Plan not available",
  "message": "The pro plan is not yet configured. Please contact support."
}
```

This prevents the 504 timeout and gives users a clear message.

## What If I Don't Have Plans in Wix Yet?

If you haven't created plans in Wix Developer Dashboard:

### Option A: Create Plans in Wix (Recommended)

1. Go to Wix Developers Dashboard
2. Navigate to **Monetization**
3. Click **Enable App Billing** (if not already enabled)
4. Create plans:
   - **Starter**: $9/month
   - **Pro**: $19/month
   - **Scale**: $49/month
5. Copy the Product IDs
6. Add to Render environment variables

### Option B: Use Starter for All (Temporary)

If you just want to test, you can temporarily use the starter product ID for all plans:

```bash
WIX_PRODUCT_ID_STARTER=starter
WIX_PRODUCT_ID_PRO=starter
WIX_PRODUCT_ID_SCALE=starter
```

**Warning**: This will make all upgrade buttons go to the Starter plan checkout. Only use for testing!

## Checking Your Current Product IDs

You can check what product IDs are currently configured by looking at your Render environment variables:

1. Render Dashboard → Your Service → Environment
2. Look for variables starting with `WIX_PRODUCT_ID_`
3. If they're not there, you need to add them

## Example: Complete Setup

Let's say Wix gives you these product IDs:

```
Starter: abc123-def456-ghi789
Pro: xyz789-uvw456-rst123  
Scale: mno456-jkl123-pqr789
```

Add to Render:

```bash
WIX_PRODUCT_ID_STARTER=abc123-def456-ghi789
WIX_PRODUCT_ID_PRO=xyz789-uvw456-rst123
WIX_PRODUCT_ID_SCALE=mno456-jkl123-pqr789
```

Save, wait for redeploy, then test!

## Troubleshooting

### "I can't find Product IDs in Wix Dashboard"

**Possible reasons:**
1. App billing not enabled yet
2. No plans created yet
3. Looking in wrong section

**Solution:**
- Make sure you're in **Monetization** or **Billing** section
- If no plans exist, create them first
- Product ID should be visible next to each plan

### "Starter works but Pro/Scale don't"

**This is expected!** You need to add the Pro and Scale product IDs to Render environment variables.

### "All plans show 'not configured' error"

**Check:**
1. Environment variables are set in Render
2. Variable names are exactly: `WIX_PRODUCT_ID_STARTER`, `WIX_PRODUCT_ID_PRO`, `WIX_PRODUCT_ID_SCALE`
3. Values are the actual UUIDs from Wix (no quotes, no brackets)
4. Render has redeployed after adding variables

## Summary

**Current Issue**: Product IDs for Pro and Scale plans are not configured

**Quick Fix**: Add real Wix product IDs to Render environment variables

**Time Required**: ~5 minutes to get IDs + 2 minutes for Render redeploy

**Result**: All upgrade buttons will work correctly

---

**Need help?** Check the Wix documentation: [App Billing Setup](https://dev.wix.com/docs/build-apps/developer-tools/app-billing)
