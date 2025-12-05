# Wix Dashboard Extension Setup Guide

## The Solution

Since Wix doesn't allow `{instance}` in the URL field, you need to set up a **Dashboard Extension** component. The app now uses the Wix SDK to automatically get the instance token when embedded.

## Step-by-Step Setup

### 1. Go to Wix Developers
Navigate to https://dev.wix.com and open your app

### 2. Add Dashboard Extension

1. Click on **Extensions** in the left sidebar
2. Click **Add Extension**
3. Select **Dashboard Page**
4. Configure the extension:
   - **Name**: Ultimate Optimizer
   - **URL**: `https://ultimate-optimizer-app.onrender.com/dashboard`
   - **Icon**: (optional) Upload an icon
   - **Description**: AI-powered product content optimization

### 3. Save and Publish

1. Click **Save**
2. If prompted, publish the new version of your app

### 4. Test the App

1. Go to your Wix test site
2. If the app is already installed, uninstall it first
3. Reinstall the app from the Wix App Market (or your test URL)
4. Open the app from your Wix dashboard
5. The app should now load without the "Missing instance token" error

## How It Works Now

The app now uses **three methods** to get the instance token:

1. **URL Parameter** (for direct access with `?instance=token`)
2. **Wix SDK** (for embedded dashboard - automatically gets token from Wix)
3. **Session Storage** (persists token across page navigations)

When embedded in Wix dashboard:
- The Wix SDK script loads automatically
- The app calls `Wix.Utils.getInstanceId()` to get the token
- No URL parameters needed!

## Verification

After setup, check the browser console (F12):
- ✅ You should see: "Instance token found from Wix SDK"
- ❌ If you see: "No instance token found", check the debug info

## Debug Info

The app now shows helpful debug information:
- Current URL
- Whether it's running in an iframe
- Whether Wix SDK is loaded
- Step-by-step fix instructions

## Alternative: Manual Testing

If you want to test without setting up the dashboard extension:

1. Install the app on your Wix site
2. Open any page on your Wix site
3. Open browser console (F12)
4. Run: `Wix.Utils.getInstanceId()`
5. Copy the token
6. Open: `https://ultimate-optimizer-app.onrender.com/dashboard?instance=<paste-token>`

## What Changed in the Code

1. **Added Wix SDK script** to `index.html`
2. **Updated AuthContext** to use Wix SDK's `getInstanceId()` method
3. **Added fallback methods** for getting the token
4. **Improved error messages** with setup instructions
5. **Added session storage** to persist token

## Common Issues

### Issue: "Wix SDK not loaded"
**Solution**: Make sure the Wix SDK script is in your `index.html`:
```html
<script src="https://static.parastorage.com/services/js-sdk/1.300.0/js/wix.min.js"></script>
```

### Issue: Token still not found
**Solution**: 
1. Make sure you're accessing the app through the Wix dashboard
2. Check that the Dashboard Extension is properly configured
3. Try uninstalling and reinstalling the app

### Issue: App works but loses token on refresh
**Solution**: The app now uses session storage to persist the token, so this should not happen

## Next Steps

1. Deploy the updated frontend to Render
2. Set up the Dashboard Extension in Wix Developers
3. Reinstall the app on your test site
4. Test the app - it should work without any URL parameters!
