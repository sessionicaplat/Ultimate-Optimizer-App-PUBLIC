# Testing API Endpoints

## Issue
Products and collections are not loading from the API - only showing "No products found" or "No collections found".

## Possible Causes

1. **Missing Instance Token**: The frontend needs a valid Wix instance token in the URL query parameter
2. **Authentication Failure**: The `verifyInstance` middleware might be rejecting requests
3. **Database Issue**: No app instance exists in the database
4. **Wix API Issue**: The WixStoresClient might be failing to fetch data

## How to Test

### 1. Check if the API endpoints are accessible

Open your browser console and run:

```javascript
// Test without authentication (should fail with 401)
fetch('http://localhost:3000/api/products')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
```

Expected: `401 Unauthorized` with message about missing instance token

### 2. Check if you have a valid instance token

The app needs to be accessed with a valid instance token in the URL:
```
http://localhost:3000/dashboard?instance=<VALID_INSTANCE_TOKEN>
```

### 3. Check if there's an app instance in the database

Run this query in your PostgreSQL database:
```sql
SELECT instance_id, site_host, created_at 
FROM app_instances 
ORDER BY created_at DESC 
LIMIT 5;
```

### 4. Check browser console for errors

Open the browser DevTools (F12) and check:
- **Console tab**: Look for JavaScript errors or failed API calls
- **Network tab**: Check if `/api/products` and `/api/collections` requests are being made
  - Look at the request headers (should include `X-Wix-Instance`)
  - Look at the response status and body

## Current Implementation Status

The implementation is correct:
- ✅ Backend routes are properly defined in `backend/src/routes/products.ts`
- ✅ Routes are registered in `backend/src/server.ts`
- ✅ Frontend is making API calls with `fetchWithAuth`
- ✅ Frontend has proper error handling and loading states

## Most Likely Issue

**The app is being accessed without a valid instance token.**

To fix this, you need to:

1. **For Development Testing**: Create a mock instance token or use a real one from Wix
2. **For Production**: Ensure the app is accessed through the Wix dashboard, which automatically includes the instance token

## Quick Fix for Development

You can temporarily modify the frontend to work without authentication for testing:

1. Comment out the instance token check in `frontend/src/utils/api.ts`
2. Add mock endpoints in the backend that don't require authentication
3. Or create a test instance in the database and use its token

## Next Steps

1. Check the browser console for specific error messages
2. Verify if you have an instance token in the URL
3. If no instance token, you need to either:
   - Access the app through Wix dashboard
   - Or complete the OAuth flow to get a valid instance
   - Or create a development bypass for testing
