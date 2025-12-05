# Instance Token Issue - FIXED ✅

## Problem
Wix doesn't allow `{instance}` placeholder in the URL field, causing "Missing instance token" error.

## Solution Implemented
Updated the app to use **Wix SDK** to automatically get the instance token when embedded in Wix dashboard.

## What Changed

### 1. Added Wix SDK
- Installed `@wix/sdk` package
- Added Wix SDK script to `index.html`
- App now calls `Wix.Utils.getInstanceId()` automatically

### 2. Updated AuthContext
The app now tries **three methods** to get the token:
1. URL parameter (`?instance=token`) - for direct access
2. Wix SDK (`Wix.Utils.getInstanceId()`) - for embedded dashboard
3. Session storage - persists token across navigations

### 3. Better Error Handling
- Shows helpful setup instructions if token is missing
- Displays debug information (URL, iframe status, Wix SDK status)
- Provides two options to fix the issue

## What You Need to Do

### In Wix Developers (dev.wix.com):

1. Go to **Extensions** → **Add Extension** → **Dashboard Page**
2. Set URL to: `https://ultimate-optimizer-app.onrender.com/dashboard`
   - **No need for `{instance}` parameter!**
3. Save and publish

### Deploy:

1. Deploy the updated code to Render
2. Reinstall the app on your test site
3. Open the app from Wix dashboard

## How It Works

**Before:**
- App expected `?instance={instance}` in URL
- Wix didn't allow curly braces
- Token was missing → Error

**After:**
- App loads Wix SDK automatically
- SDK provides `Wix.Utils.getInstanceId()` method
- App gets token from SDK when embedded
- No URL parameters needed!

## Files Changed

- `frontend/index.html` - Added Wix SDK script
- `frontend/src/contexts/AuthContext.tsx` - Added Wix SDK token retrieval
- `frontend/package.json` - Added @wix/sdk dependency

## Testing

After deploying:

1. Open app in Wix dashboard
2. Check browser console (F12)
3. Should see: `✅ Instance token found from Wix SDK`
4. App should load without errors

## Verification Checklist

- [ ] Deploy updated frontend to Render
- [ ] Add Dashboard Extension in Wix Developers
- [ ] Set URL to: `https://ultimate-optimizer-app.onrender.com/dashboard`
- [ ] Save and publish
- [ ] Uninstall app from test site
- [ ] Reinstall app
- [ ] Open app from Wix dashboard
- [ ] Verify no "Missing instance token" error
- [ ] Check browser console for success message

## Need Help?

If you still see the error:
1. Check browser console for debug info
2. Verify Wix SDK is loaded: `console.log(window.Wix)`
3. Check if in iframe: `console.log(window.self !== window.top)`
4. Try manual token method (see WIX_DASHBOARD_SETUP.md)

The app now provides detailed error messages and setup instructions if anything goes wrong!
