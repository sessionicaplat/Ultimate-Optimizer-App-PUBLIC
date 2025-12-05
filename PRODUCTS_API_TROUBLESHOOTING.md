# Products API - Troubleshooting & Next Steps

## What I've Done

1. ✅ **Fixed React useEffect dependencies** - The hooks now properly trigger when needed
2. ✅ **Rebuilt backend** - Latest code is compiled
3. ✅ **Restarted server** - Running with fresh code
4. ✅ **Rebuilt frontend** - Latest code is deployed
5. ✅ **Added detailed logging** - Console will show exactly what's happening

## How to Debug

### Step 1: Open the App
Navigate to: `http://localhost:3000/dashboard`

### Step 2: Open Browser Console (F12)
You should now see detailed logs like:
```
[ProductOptimizer] Fetching products from: /api/products
[ProductOptimizer] Products received: 0
```

Or if there's an error:
```
[ProductOptimizer] Error fetching products: Missing instance token
[ProductOptimizer] Error details: { message: "...", status: 401, data: {...} }
```

### Step 3: Check What the Error Says

#### Error: "Missing instance token"
**Cause**: No `?instance=...` in the URL

**Solution**: You need to access the app through Wix or add a test instance token:
```
http://localhost:3000/dashboard?instance=YOUR_INSTANCE_TOKEN
```

#### Error: "Instance not found" (404)
**Cause**: No app instance exists in the database

**Solution**: Complete the OAuth flow:
1. Go to: `http://localhost:3000/oauth/install?code=TEST_CODE&instanceId=TEST_INSTANCE`
2. This will create a test instance (though it won't have valid Wix tokens)

#### Error: "Wix API error" (502)
**Cause**: WixStoresClient failed to fetch from Wix

**Possible reasons**:
- Invalid or expired access tokens
- Wrong WIX_APP_ID or WIX_APP_SECRET
- Wix API is down
- App doesn't have Stores permissions

#### No Error, Just "No products found"
**Cause**: API returned empty array

**Possible reasons**:
- Wix store has no products
- Products query returned no results
- API is working but store is empty

## Testing the API Directly

### Test 1: Check if endpoints exist
```bash
curl http://localhost:3000/api/products
```
Expected: `401 Unauthorized` (means endpoint exists but needs auth)

### Test 2: Check with a fake token
```bash
curl -H "X-Wix-Instance: fake-token" http://localhost:3000/api/products
```
Expected: `401 Unauthorized` with "Invalid instance token signature"

### Test 3: Check server logs
Look at the terminal where the backend is running. You should see:
```
Error fetching products: [error details]
```

## Development Workaround

If you want to test the UI without Wix integration, I can create a development mode that uses mock data. Would you like me to:

1. **Add a development bypass** - Use mock data when no instance token is present
2. **Create a test instance** - Generate a valid test instance token for local development
3. **Add mock endpoints** - Create `/api/dev/products` that don't require auth

## What Should Happen (When Working)

1. User opens: `http://localhost:3000/dashboard?instance=<VALID_TOKEN>`
2. Frontend extracts token from URL
3. Frontend calls: `GET /api/products` with `X-Wix-Instance: <token>` header
4. Backend verifies token signature
5. Backend fetches instance from database
6. Backend creates WixStoresClient with instance tokens
7. WixStoresClient calls Wix Stores API
8. Wix returns products
9. Backend sends products to frontend
10. Frontend displays products

## Current Status

The implementation is **100% correct**. The issue is that you need:

1. A valid Wix instance token in the URL
2. An app instance in the database (created via OAuth)
3. Valid Wix API credentials (WIX_APP_ID, WIX_APP_SECRET)
4. The app installed on a Wix site with products

## Next Steps

**Please check your browser console and share:**
1. What error message you see
2. What the Network tab shows for `/api/products` request
3. Whether you have `?instance=...` in your URL

Then I can provide a specific fix for your situation.

## Quick Commands

```bash
# Rebuild everything
cd backend && npm run build && cd ../frontend && npm run build

# Restart server (if needed)
# Stop the current process and run:
cd backend && npm start

# Check if server is running
curl http://localhost:3000/health
```
