# Quick Fix: Instance Token Missing

## The Problem
Error: "Missing instance token. Please access this app from your Wix dashboard."

## The Solution (2 minutes)

### Step 1: Update Wix App Configuration
1. Go to https://dev.wix.com
2. Open your app
3. Find **Dashboard URL** setting
4. Change from:
   ```
   https://your-app.onrender.com/dashboard
   ```
   To:
   ```
   https://your-app.onrender.com/dashboard?instance={instance}
   ```
   ⚠️ **Important:** Use `{instance}` with curly braces exactly as shown

### Step 2: Reinstall App
1. Go to your Wix test site
2. Uninstall the app
3. Reinstall the app
4. Open the app

## What Changed in the Code

I've added helpful debugging and error messages:

1. **Better error messages** - Now shows exactly what's wrong and how to fix it
2. **Debug logging** - Console shows the current URL and what's missing
3. **Configuration help screen** - If token is missing, shows step-by-step fix instructions
4. **URL validation** - Logs all URL parameters to help troubleshoot

## Testing

After updating the Wix configuration:

1. Open your app in Wix dashboard
2. Open browser console (F12)
3. You should see: `✅ Instance token found`
4. If you see `❌ No instance token in URL`, the Wix configuration needs updating

## What the Code Does Now

**Before:** Just showed generic error
**After:** 
- Shows detailed error with fix instructions
- Logs current URL for debugging
- Displays helpful configuration screen
- Provides step-by-step guidance

## Files Updated

- `frontend/src/utils/api.ts` - Added debug logging
- `frontend/src/contexts/AuthContext.tsx` - Added configuration help screen
- `WIX_INSTANCE_TOKEN_FIX.md` - Detailed troubleshooting guide

## Still Having Issues?

Check the browser console - it will show:
- Current URL
- Whether instance token was found
- Detailed error messages
- Fix instructions

The app now provides all the information you need to diagnose and fix the issue!
