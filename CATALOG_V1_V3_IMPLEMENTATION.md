# Wix Catalog V1 & V3 Support Implementation

## Overview
Successfully implemented support for both Wix Catalog V1 and V3 in the Ultimate Optimizer app. The app now automatically detects which catalog version a site is using and routes API calls to the correct endpoints.

## What Was Changed

### 1. Database Layer (`backend/src/db/`)

**appInstances.ts**
- Added `updateCatalogVersion()` function to persist detected catalog version
- Stores 'V1' or 'V3' in the `catalog_version` column

**types.ts**
- Added `catalog_version?: string | null` to `AppInstance` interface

### 2. Core Client (`backend/src/wix/storesClient.ts`)

**Constructor**
- Now accepts optional `cachedVersion` parameter to avoid re-detection
- Initializes with cached version from database if available

**Catalog Version Detection**
- Implements smart detection using 428 error method (most reliable)
- Tries V3 endpoint first
- If 428 error with `CATALOG_V1_SITE_CALLING_CATALOG_V3_API` → marks as V1
- Caches result in memory and database
- Prevents race conditions with `versionDetectionInProgress` promise

**API Methods Updated**
- `getProducts()`: Routes to V3 or V1 endpoint based on version
- `getProduct()`: V3 uses query filter, V1 uses direct GET
- `updateProduct()`: V3 requires revision, V1 doesn't (simpler!)
- `getCollections()`: V3 uses Categories API, V1 uses Collections API
- `getProductIdsByCollection()`: Already had V1 support, now properly integrated

**Error Handling**
- `request()` method now catches 428 errors
- Automatically updates cached version if mismatch detected
- Logs version switches for monitoring

### 3. API Routes

**products.ts**
- All `WixStoresClient` instantiations now pass `instance.catalog_version`
- Enables immediate use of cached version without re-detection

**publish.ts**
- Updated to pass catalog version to client

**jobs.ts**
- Updated to pass catalog version to client

### 4. Workers

**jobWorker.ts**
- Updated to pass catalog version to client

## How It Works

### First Request Flow (No Cached Version)
1. Client instantiated without cached version
2. First API call triggers `getCatalogVersion()`
3. Attempts V3 query with limit 1
4. If successful → V3, store in DB
5. If 428 error with V1 code → V1, store in DB
6. All subsequent calls use cached version

### Subsequent Requests (Cached Version)
1. Client instantiated with `instance.catalog_version` from DB
2. No detection needed - uses cached version immediately
3. If 428 error occurs (rare) → updates cache and logs warning

### Version Mismatch Recovery
If stored version is wrong (edge case):
1. API call returns 428 error
2. Error handler detects mismatch
3. Updates cached version in memory and DB
4. Caller should retry (or next request will use correct version)

## API Endpoint Mapping

| Operation | V1 Endpoint | V3 Endpoint |
|-----------|-------------|-------------|
| Query Products | `POST /stores/v1/products/query` | `POST /stores/v3/products/query` |
| Get Product | `GET /stores/v1/products/{id}` | `POST /stores/v3/products/query` (filter) |
| Update Product | `PATCH /stores/v1/products/{id}` | `PATCH /stores/v3/products/{id}` |
| Query Collections | `POST /stores/v1/collections/query` | `POST /categories/v1/categories/query` |
| Products by Collection | Filter by `collectionIds` | `GET /categories/v1/categories/{id}/list-items` |

## Key Differences: V1 vs V3

### Products
- **V1**: Direct GET endpoint, no revision needed for updates, includes full media
- **V3**: Query-based, requires revision for updates, needs separate call for full media

### Collections
- **V1**: Uses Collections API (`/stores/v1/collections`)
- **V3**: Uses Categories API (`/categories/v1/categories`)

### Media
- **V1**: `media.items` array included in query response
- **V3**: Query returns minimal media, need stores-reader endpoint for full gallery

## Testing Checklist

✅ V1 site loads products without 428 errors
✅ V3 site continues working as before
✅ Catalog version detected and cached in database
✅ No TypeScript errors
✅ All WixStoresClient instantiations updated
✅ Error handling for version mismatches
✅ Logging for debugging and monitoring

## Monitoring

Look for these log messages:
- `[WixStoresClient] Detecting catalog version...`
- `[WixStoresClient] ✅ Detected Catalog V1 (from 428 error)`
- `[WixStoresClient] ✅ Detected Catalog V3`
- `[WixStoresClient] ⚠️ Catalog version mismatch detected: switching to V1/V3`
- `[WixStoresClient] Fetching products using V1/V3 endpoint`
- `[AppInstances] Updated catalog version for {instanceId}: V1/V3`

## Performance Impact

**Minimal:**
- First request: +1 lightweight API call for detection (limit 1 product)
- Subsequent requests: Zero overhead (uses cached version)
- Database: Single column read/write per instance

## Edge Cases Handled

1. **Race conditions**: Multiple simultaneous requests use same detection promise
2. **Version migration**: Site upgraded from V1 to V3 → 428 error triggers re-detection
3. **Network errors**: Defaults to V3 and lets natural errors surface
4. **Missing cache**: Gracefully detects on first use

## Future Considerations

- Catalog version is permanent per site (one-time migration from V1 to V3)
- No need for periodic re-detection
- Could add admin endpoint to force re-detection if needed
- Monitor 428 errors in production to catch any edge cases
