# Quick Fix: 403 Error on Orders API

## The Problem
```
Error listing member orders: SDKError: code 403
```

## The Cause
Your Wix app doesn't have Pricing Plans permissions configured.

## The Fix (5 Steps)

### 1. Go to Wix Developers Dashboard
Visit: https://dev.wix.com/

### 2. Select Your App
Find and click on "Ultimate Optimizer"

### 3. Add Permissions
- Go to **Permissions** or **OAuth** section
- Find **"Pricing Plans"**
- Enable:
  - ✅ Read Orders
  - ✅ Manage Orders
- Click **Save**

### 4. Reinstall the App
- Go to your Wix test site
- **Uninstall** Ultimate Optimizer
- **Reinstall** it
- (This updates the OAuth token with new permissions)

### 5. Test Again
- Open the app
- Go to Test Cancellation page
- Should now work! ✅

## Code Already Updated
The code now shows helpful error messages when permissions are missing, so you'll know exactly what to do.

## Need Help?
See `PRICING_PLANS_PERMISSIONS_FIX.md` for detailed instructions.
