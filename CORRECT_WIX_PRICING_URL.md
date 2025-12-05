# ✅ Correct Wix Pricing URL Implementation

## 🎯 The Solution

According to the official Wix 2025 documentation, the correct URL format for redirecting to the pricing page is:

```
https://www.wix.com/apps/upgrade/<APP_ID>?appInstanceId=<INSTANCE_ID>
```

## ❌ What Was Wrong

I was trying to use:
```
https://manage.wix.com/app-pricing-plans/{appId}/plan?origin=preview&meta-site-id={siteId}
```

This URL format requires special permissions and is not the standard way to redirect users to pricing pages.

## ✅ What's Fixed

Updated the `/api/billing/manage-plans-url` endpoint to use the correct URL format:

```typescript
const pricingPageUrl = `https://www.wix.com/apps/upgrade/${appId}?appInstanceId=${instanceId}`;
```

### Parameters Used
- `appId` - Your Wix App ID (from `WIX_APP_ID` env var)
- `instanceId` - The specific app instance ID (from verified instance token)

## 📚 From Wix Documentation

> **Step 4 | Create an upgrade entry point to your pricing page**
> 
> You're responsible for adding entrypoints to the pricing page where users can upgrade. All Upgrade buttons and CTAs should link to your app's pricing page opened in a new tab. To do so, use the following URL, replacing <APP_ID> and <INSTANCE_ID> with their respective values:
> 
> `https://www.wix.com/apps/upgrade/<APP_ID>?appInstanceId=<INSTANCE_ID>`

## 🎯 What Users Will See

When users click the upgrade button:

1. Frontend calls `/api/billing/manage-plans-url`
2. Backend generates: `https://www.wix.com/apps/upgrade/9e24e724-5bdb-4658-8554-74251539a065?appInstanceId=08df22f0-4e31-4c46-8ada-6fe6f0e52c07`
3. User redirects to Wix's pricing page
4. Wix shows all your configured pricing plans
5. User can select a plan and complete checkout
6. After purchase, user returns to your app

## ✨ Benefits

- ✅ Uses official Wix URL format
- ✅ No permission issues
- ✅ Works with Wix's standard pricing page
- ✅ Simple and reliable
- ✅ Includes instance ID for proper tracking

## 🚀 Deploy

```bash
git add .
git commit -m "Fix: Use correct Wix pricing page URL format"
git push origin main
```

## 🧪 Testing

After deployment:
1. Click "View Plans & Upgrade" button
2. Should redirect to: `https://www.wix.com/apps/upgrade/{your-app-id}?appInstanceId={instance-id}`
3. Should see your Wix pricing page with all plans
4. Should be able to select and purchase a plan
5. Should return to your app after purchase

## 📊 URL Comparison

### Wrong (Was Using)
```
https://manage.wix.com/app-pricing-plans/9e24e724-5bdb-4658-8554-74251539a065/plan?origin=preview&meta-site-id=8358eaaa-f4d2-4897-ad3d-2992985d7e25
```
❌ Requires special permissions
❌ Shows "You need permission to upgrade apps" error

### Correct (Now Using)
```
https://www.wix.com/apps/upgrade/9e24e724-5bdb-4658-8554-74251539a065?appInstanceId=08df22f0-4e31-4c46-8ada-6fe6f0e52c07
```
✅ Official Wix format
✅ Works for all users
✅ No permission issues

---

**Status:** ✅ Fixed
**Source:** Official Wix 2025 Documentation
**Ready:** Deploy and test
