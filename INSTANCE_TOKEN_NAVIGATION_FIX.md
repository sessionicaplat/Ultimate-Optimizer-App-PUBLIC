# Instance Token Navigation Fix ✅

## The Problem

The console logs showed:
```
✅ Instance token found in URL  (on root page)
❌ Instance token missing!      (on /optimizer page)
Current URL: https://ultimate-optimizer-app.onrender.com/optimizer
Query params: (empty)
```

**Root Cause:** When using React Router for client-side navigation (e.g., clicking "Product Optimizer" in the sidebar), the URL changes from `/?instance=TOKEN` to `/optimizer`, losing the query parameters.

## The Solution

The `AuthContext` was already correctly storing the instance token in `sessionStorage`, but `api.ts` was only reading from the URL query parameters, not from session storage.

### What Was Fixed

Updated `frontend/src/utils/api.ts` to:
1. **First** try to get the token from URL query params (for initial load)
2. **Then** fall back to sessionStorage (for internal navigation)
3. Only throw an error if neither source has the token

### Code Change

**Before:**
```typescript
const params = new URLSearchParams(window.location.search);
const instanceToken = params.get('instance');

if (!instanceToken) {
  throw new ApiError('Missing instance token...', 401);
}
```

**After:**
```typescript
// Try URL first (initial load)
const params = new URLSearchParams(window.location.search);
let instanceToken = params.get('instance');

// Fall back to sessionStorage (internal navigation)
if (!instanceToken) {
  instanceToken = sessionStorage.getItem('wix_instance_token');
}

if (!instanceToken) {
  throw new ApiError('Missing instance token...', 401);
}
```

## How It Works Now

1. **Initial Load** (from Wix dashboard):
   - URL: `https://ultimate-optimizer-app.onrender.com/?instance=TOKEN`
   - `AuthContext` reads token from URL
   - `AuthContext` stores token in sessionStorage
   - API calls work ✅

2. **Internal Navigation** (clicking sidebar links):
   - URL: `https://ultimate-optimizer-app.onrender.com/optimizer`
   - No query params in URL
   - `api.ts` reads token from sessionStorage
   - API calls work ✅

3. **Direct Access** (not through Wix):
   - No token in URL
   - No token in sessionStorage
   - Shows error message ❌

## Testing

After deploying this fix:

1. Open the app from Wix dashboard
2. You should see: `✅ Instance token found in URL`
3. Click "Product Optimizer" in the sidebar
4. The page should load products without errors
5. Navigate between pages - all should work

## Files Changed

- `frontend/src/utils/api.ts` - Added sessionStorage fallback for instance token

## Why This Happened

React Router uses the HTML5 History API for client-side navigation, which changes the URL path without reloading the page. This is the expected behavior for SPAs (Single Page Applications), but it means query parameters from the initial load are lost during navigation.

The fix ensures the instance token persists across navigation by using sessionStorage as a fallback.

## Build Status

✅ TypeScript compilation successful
✅ Vite build successful
✅ No diagnostics errors

## Next Steps

1. Deploy the updated frontend to Render
2. Test the app in Wix dashboard
3. Navigate between pages - all API calls should work now!

The instance token will now persist across all internal navigation within your app.
