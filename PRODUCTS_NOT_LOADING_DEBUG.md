# Products Not Loading - Debugging Guide

## Current Status

✅ Backend API endpoints are implemented and running
✅ Frontend is making API calls
✅ Server has been rebuilt and restarted
✅ Code has no TypeScript errors

## The Real Issue

**The API endpoints require a valid Wix instance token to work.** Without it, the requests will fail with a 401 Unauthorized error.

## How to Check What's Happening

### Step 1: Open Browser DevTools

1. Open your app in the browser: `http://localhost:3000/dashboard`
2. Press **F12** to open DevTools
3. Go to the **Console** tab

### Step 2: Check for Errors

Look for error messages like:
- ❌ `Missing instance token. Please access this app from your Wix dashboard.`
- ❌ `Authentication failed`
- ❌ `Failed to load products`

### Step 3: Check Network Requests

1. Go to the **Network** tab in DevTools
2. Refresh the page
3. Look for requests to `/api/products` and `/api/collections`
4. Click on each request and check:
   - **Status**: Should be 200 (if working) or 401 (if no token)
   - **Headers**: Look for `X-Wix-Instance` header
   - **Response**: See what error message is returned

## Common Scenarios

### Scenario 1: "No products found" message

**Cause**: The API call is failing (likely 401 or 404)

**Check**:
```javascript
// Open browser console and run:
console.log(window.location.search); // Should show ?instance=...
```

**Fix**: You need a valid instance token in the URL

### Scenario 2: "Failed to load products" error

**Cause**: API returned an error

**Check**: Look at the Network tab to see the actual error response

**Possible fixes**:
- No instance in database → Complete OAuth flow
- Invalid tokens → Re-authenticate
- Wix API error → Check WIX_APP_ID and WIX_APP_SECRET

### Scenario 3: Still seeing old mock data

**Cause**: Browser cache or old build

**Fix**:
1. Hard refresh: **Ctrl+Shift+R** (Windows) or **Cmd+Shift+R** (Mac)
2. Clear browser cache
3. Rebuild frontend: `cd frontend && npm run build`

## Testing Without Wix (Development Mode)

If you want to test the UI without connecting to Wix, you can create a development bypass:

### Option 1: Mock the API responses in frontend

Create `frontend/src/utils/mockData.ts`:
```typescript
export const MOCK_PRODUCTS = [
  {
    id: '1',
    name: 'Test Product 1',
    media: { mainMedia: { image: { url: 'https://via.placeholder.com/50' } } }
  },
  // ... more products
];

export const MOCK_COLLECTIONS = [
  { id: 'c1', name: 'Test Collection', numberOfProducts: 5 },
  // ... more collections
];
```

Then modify `ProductOptimizer.tsx` to use mock data when in development:
```typescript
const isDevelopment = import.meta.env.DEV;

const fetchProducts = async () => {
  if (isDevelopment) {
    setProducts(MOCK_PRODUCTS);
    return;
  }
  // ... real API call
};
```

### Option 2: Create a test instance token

1. Create a test instance in the database
2. Generate a test instance token
3. Add it to your URL: `?instance=<test-token>`

## What Should Happen When Working

1. **Page loads** → Frontend calls `/api/products`
2. **Backend receives request** → Verifies instance token
3. **Token is valid** → Fetches instance from database
4. **Has tokens** → Calls Wix Stores API
5. **Wix returns data** → Backend sends to frontend
6. **Frontend displays** → Products appear in the list

## Current Implementation Details

### Backend Endpoints

- **GET /api/products**
  - Requires: `X-Wix-Instance` header
  - Query params: `cursor`, `query`, `limit`
  - Returns: `{ products: [], nextCursor?: string }`

- **GET /api/collections**
  - Requires: `X-Wix-Instance` header
  - Query params: `cursor`, `limit`
  - Returns: `{ collections: [], nextCursor?: string }`

### Frontend API Calls

The frontend uses `fetchWithAuth()` which:
1. Extracts instance token from URL query params
2. Adds it to the `X-Wix-Instance` header
3. Makes the API request
4. Handles errors and displays messages

## Next Steps

1. **Check browser console** for the actual error message
2. **Check Network tab** to see the API response
3. **Share the error details** so I can provide a specific fix

## Quick Test

Run this in your browser console to test the API:

```javascript
// Check if instance token exists
const params = new URLSearchParams(window.location.search);
const token = params.get('instance');
console.log('Instance token:', token ? 'EXISTS' : 'MISSING');

// Try to fetch products
fetch('http://localhost:3000/api/products', {
  headers: {
    'X-Wix-Instance': token || 'test',
    'Content-Type': 'application/json'
  }
})
.then(r => r.json())
.then(data => console.log('API Response:', data))
.catch(err => console.error('API Error:', err));
```

This will show you exactly what's happening with the API call.
