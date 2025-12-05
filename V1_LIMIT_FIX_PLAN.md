# V1 Limit Error Fix Plan

## The Issue

Frontend requests 200 products, but V1 API max is 100.

**Error:**
```
limit got 200, expected 100 or less
```

## The Fix

Add version-specific limit enforcement in `getProducts()` method.

## Implementation

### File to Modify
`backend/src/wix/storesClient.ts`

### Method to Update
`getProducts()` (around line 100-125)

### Current Code (Line ~110)
```typescript
const version = await this.getCatalogVersion();
const limit = options?.limit || 50;
```

### Updated Code
```typescript
const version = await this.getCatalogVersion();

// V1 has max limit of 100, V3 has max of 200
const maxLimit = version === 'V1' ? 100 : 200;
const requestedLimit = options?.limit || 50;
const limit = Math.min(requestedLimit, maxLimit);

// Log if we're capping the limit
if (requestedLimit > maxLimit) {
  console.log(`[WixStoresClient] Capping limit from ${requestedLimit} to ${maxLimit} for ${version}`);
}
```

## Why This Works

### Before (Broken)
```
Frontend: limit=200
Backend: passes 200 to V1 API
V1 API: ❌ Rejects (max 100)
```

### After (Fixed)
```
Frontend: limit=200
Backend: caps to 100 for V1
V1 API: ✅ Accepts 100
```

## API Limits Reference

| Version | Max Limit | Source |
|---------|-----------|--------|
| V1 | 100 | Wix API validation error |
| V3 | 200 | Current working behavior |

## Testing

1. **V1 Store - Request 200 products:**
   - Should cap to 100
   - No error
   - Returns 100 products
   - Log: "Capping limit from 200 to 100 for V1"

2. **V1 Store - Request 50 products:**
   - Should use 50 (under limit)
   - No capping
   - Works normally

3. **V3 Store - Request 200 products:**
   - Should use 200 (at limit)
   - No capping
   - Works normally

## Frontend Consideration

If frontend needs all products on V1:
- Use pagination with cursor
- Make multiple requests of 100 each
- Combine results

But backend fix prevents the error regardless.

## Estimated Time

- Code change: 2 minutes
- Testing: 3 minutes
- Total: 5 minutes

## Files to Modify

- ✅ `backend/src/wix/storesClient.ts` - Add limit capping logic
