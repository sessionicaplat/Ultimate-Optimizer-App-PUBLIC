# Fixing "Missing Instance Token" Error

## Problem
You're seeing: "Missing instance token. Please access this app from your Wix dashboard."

This happens because Wix isn't passing the instance token to your app when it loads in the iframe.

## Root Cause
The Wix app configuration needs to include the `{instance}` placeholder in the dashboard URL so Wix knows to pass the signed instance token.

## Solution: Update Wix App Configuration

### Step 1: Go to Wix Developers
1. Navigate to https://dev.wix.com
2. Sign in with your Wix account
3. Click on your app (Ultimate Optimizer App)

### Step 2: Configure Dashboard Component

#### Option A: If using Dashboard Extension
1. Go to **Extensions** or **Components** section
2. Find your Dashboard component
3. Update the **Component URL** to:
   ```
   https://your-app.onrender.com/dashboard?instance={instance}
   ```
   **Important:** Use `{instance}` with curly braces - this is a Wix placeholder

#### Option B: If using App Settings
1. Go to **Settings** → **Dashboard**
2. Update the **Dashboard URL** to:
   ```
   https://your-app.onrender.com/dashboard?instance={instance}
   ```

### Step 3: Save and Test
1. Click **Save** in Wix Developers
2. Go to your test site
3. Uninstall the app (if already installed)
4. Reinstall the app
5. Open the app from your Wix dashboard

## What the {instance} Parameter Does

When you use `{instance}` in your URL configuration:
- Wix automatically replaces it with a signed instance token
- The token format is: `<base64_payload>.<signature>`
- Your backend verifies this token using HMAC-SHA256
- This ensures secure communication between Wix and your app

## Example Configuration

**Before (Wrong):**
```
https://your-app.onrender.com/dashboard
```

**After (Correct):**
```
https://your-app.onrender.com/dashboard?instance={instance}
```

## Verification Steps

After updating the configuration:

1. **Check the URL in browser:**
   - Open your app in Wix dashboard
   - Look at the iframe URL in browser dev tools
   - You should see: `?instance=eyJpbnN0YW5jZUlkIjoiLi4uIn0.abc123...`

2. **Check browser console:**
   - Open browser dev tools (F12)
   - Look for any error messages
   - The instance token should be logged (if debug mode is on)

3. **Test API calls:**
   - Navigate to Billing & Credits page
   - Check if credit data loads
   - If it works, the instance token is being passed correctly

## Alternative: Manual Testing

If you want to test locally without Wix:

1. Get a real instance token from Wix (copy from browser URL when app loads)
2. Add it to your local URL:
   ```
   http://localhost:5173/dashboard?instance=<paste-token-here>
   ```

## Common Issues

### Issue 1: Token Still Missing After Configuration
**Solution:** Uninstall and reinstall the app on your test site

### Issue 2: Token Invalid/Expired
**Solution:** The instance token changes each time. Always use the fresh token from the URL

### Issue 3: CORS Errors
**Solution:** Make sure your backend allows requests from Wix domains:
- `*.wix.com`
- `*.wixsite.com`
- `*.editorx.com`

## Need More Help?

Check the browser console and network tab for detailed error messages. The app now includes debug logging to help identify the issue.
