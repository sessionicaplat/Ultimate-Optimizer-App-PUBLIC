# Wix Catalog V3 Migration Guide

**Date:** October 31, 2025  
**Status:** ✅ Complete and Working

## Overview

This guide documents the successful migration from Wix Stores Catalog V1 to V3 API for self-hosted dashboard apps. All new Wix stores created in 2024+ use Catalog V3 by default.

## Problem Summary

When calling Wix Stores API endpoints, the app received:
```
428 CATALOG_V3_CALLING_CATALOG_V1_API
"Endpoint belongs to CATALOG_V1, but your site is using CATALOG_V3"
```

## Root Causes

1. **Wrong API endpoints** - Using V1 paths instead of V3
2. **Catalog version detection failing** - Detection endpoint returns 404 for self-hosted apps
3. **Different data structures** - V3 uses different field names and structures than V1
4. **Collections moved to Categories API** - V3 uses a separate Categories API

## Solutions Implemented

### 1. Catalog Version Detection

**Issue:** `/stores/catalog-versioning/v1/catalog-version` returns 404 for self-hosted apps

**Solution:** Default to V3 and handle detection failure gracefully

```typescript
private async getCatalogVersion(): Promise<string> {
  if (this.catalogVersion) {
    return this.catalogVersion;
  }

  try {
    const response = await fetch(
      `${WixStoresClient.BASE_URL}/stores/catalog-versioning/v1/catalog-version`,
      {
        method: 'GET',
        headers: {
          Authorization: this.accessToken,
        },
      }
    );

    if (response.ok) {
      const data = await response.json() as { version: string };
      this.catalogVersion = data.version === 'V3' ? 'V3' : 'V1';
      console.log(`[WixStoresClient] Detected catalog version: ${this.catalogVersion}`);
    } else {
      // Catalog versioning endpoint not available for self-hosted apps
      // Default to V3 since all new stores use V3
      this.catalogVersion = 'V3';
      console.log('[WixStoresClient] Using Catalog V3 (default for new stores)');
    }
  } catch (error) {
    // Default to V3 since all new stores use V3
    this.catalogVersion = 'V3';
    console.log('[WixStoresClient] Using Catalog V3 (default for new stores)');
  }

  return this.catalogVersion;
}
```

### 2. Products API Endpoints

**V1 Endpoint (OLD):**
```
POST /stores/v1/products/query
```

**V3 Endpoint (CORRECT):**
```
POST /stores/v3/products/query
```

**Note:** NOT `/stores/catalog-v3/products/query` - the `/catalog-` prefix is incorrect!

**Implementation:**
```typescript
async getProducts(options?: {
  cursor?: string;
  query?: string;
  limit?: number;
}): Promise<{
  products: any[];
  nextCursor?: string;
}> {
  const version = await this.getCatalogVersion();
  const limit = options?.limit || 50;
  const requestBody: any = {
    query: {
      paging: {
        limit,
      },
    },
  };

  if (options?.cursor) {
    requestBody.query.paging.cursor = options.cursor;
  }

  if (options?.query) {
    requestBody.query.filter = {
      name: {
        $contains: options.query,
      },
    };
  }

  // Use correct endpoint based on catalog version
  const endpoint = version === 'V3' 
    ? '/stores/v3/products/query'
    : '/stores/v1/products/query';

  const response = await this.request(endpoint, requestBody, 'POST');

  return {
    products: response.products || [],
    nextCursor: response.pagingMetadata?.cursors?.next,
  };
}
```

### 3. Collections API → Categories API

**Issue:** V3 doesn't use Collections API - it uses Categories API

**V1 Collections (OLD):**
```
POST /stores/v1/collections/query
```

**V3 Categories (CORRECT):**
```
POST /categories/v1/categories/query
```

**Implementation:**
```typescript
async getCollections(options?: {
  cursor?: string;
  limit?: number;
}): Promise<{
  collections: any[];
  nextCursor?: string;
}> {
  const version = await this.getCatalogVersion();
  const limit = options?.limit || 100;

  if (version === 'V3') {
    // V3 uses Categories API
    const requestBody: any = {
      query: {
        paging: {
          limit,
        },
      },
      treeReference: {
        appNamespace: '@wix/stores',
        treeKey: null,
      },
      returnNonVisibleCategories: false,
    };

    if (options?.cursor) {
      requestBody.query.paging.cursor = options.cursor;
    }

    const response = await this.request(
      '/categories/v1/categories/query',
      requestBody,
      'POST'
    );

    return {
      collections: response.categories || [],
      nextCursor: response.pagingMetadata?.cursors?.next,
    };
  } else {
    // V1 uses Collections API
    const requestBody: any = {
      query: {
        paging: {
          limit,
        },
      },
    };

    if (options?.cursor) {
      requestBody.query.paging.cursor = options.cursor;
    }

    const response = await this.request(
      '/stores/v1/collections/query',
      requestBody,
      'POST'
    );

    return {
      collections: response.collections || [],
      nextCursor: response.pagingMetadata?.cursors?.next,
    };
  }
}
```

**Key Requirements for Categories API:**
- Must include `treeReference` with `appNamespace: '@wix/stores'`
- Returns `categories` array (not `collections`)
- Uses `itemCounter` for product count (not `numberOfProducts`)

### 4. Product Image Structure

**Issue:** V3 uses different media structure than V1

**V3 Structure:**
```json
{
  "media": {
    "main": {
      "image": {
        "url": "https://static.wixstatic.com/media/..."
      }
    }
  }
}
```

**V1 Structure:**
```json
{
  "media": {
    "mainMedia": {
      "image": {
        "url": "https://static.wixstatic.com/media/..."
      }
    }
  }
}
```

**Normalization Code:**
```typescript
const transformedProducts = result.products.map((product: any) => {
  const media = product?.media ?? {};
  
  // Extract image URL with comprehensive fallback
  const imageUrl = 
    media?.main?.image?.url ||                // V3 primary
    media?.mainMedia?.image?.url ||           // V1 structure
    media?.main?.thumbnail?.url ||            // V3 thumbnail
    media?.mainMedia?.thumbnail?.url ||       // V1 thumbnail
    media?.main?.url ||                       // V3 direct URL
    media?.mainMedia?.url ||                  // V1 direct URL
    media?.items?.[0]?.image?.url ||          // V3 first item
    media?.items?.[0]?.url ||                 // V3 first item direct
    '';

  return {
    ...product,
    media: {
      ...product.media,
      mainMedia: {
        image: {
          url: imageUrl
        }
      }
    }
  };
});
```

### 5. Collection Product Count

**Issue:** V3 categories use different field name for product count

**V3 Field:** `itemCounter`  
**V1 Field:** `numberOfProducts`

**Normalization Code:**
```typescript
const transformedCollections = result.collections.map((collection: any) => {
  // V3 categories use 'itemCounter', V1 collections use 'numberOfProducts'
  const productCount = collection.itemCounter || collection.numberOfProducts || 0;
  
  return {
    ...collection,
    numberOfProducts: productCount
  };
});
```

## API Comparison Table

| Feature | V1 | V3 |
|---------|----|----|
| **Products Endpoint** | `/stores/v1/products/query` | `/stores/v3/products/query` |
| **Collections Endpoint** | `/stores/v1/collections/query` | `/categories/v1/categories/query` |
| **Collections Response** | `collections` array | `categories` array |
| **Product Count Field** | `numberOfProducts` | `itemCounter` |
| **Image Path** | `media.mainMedia.image.url` | `media.main.image.url` |
| **Categories Requirement** | N/A | Must include `treeReference` |

## Testing Checklist

- [x] Products load successfully
- [x] Product images display correctly
- [x] Collections load successfully
- [x] Collection product counts show correctly
- [x] Search functionality works
- [x] Pagination works with cursors
- [x] No 428 errors in logs
- [x] Clean log output (no alarming warnings)

## Key Learnings

1. **Catalog versioning endpoint is not available** for self-hosted dashboard apps - always default to V3 for new stores
2. **Remove `/catalog-` prefix** - correct path is `/stores/v3/` not `/stores/catalog-v3/`
3. **Categories API is separate** - V3 collections use `/categories/v1/categories/query`
4. **treeReference is required** for Categories API with `appNamespace: '@wix/stores'`
5. **Field names changed** - `main` vs `mainMedia`, `itemCounter` vs `numberOfProducts`
6. **Always normalize data** on the backend to provide consistent structure to frontend

## Files Modified

- `backend/src/wix/storesClient.ts` - Core API client with V3 support
- `backend/src/routes/products.ts` - Product and collection endpoints with normalization

## References

- [Wix Catalog Versioning Documentation](https://dev.wix.com/docs/rest/business-solutions/stores/catalog-versioning/introduction)
- [Wix Stores V3 Products API](https://dev.wix.com/docs/rest/business-solutions/stores/catalog/products)
- [Wix Categories API](https://dev.wix.com/docs/rest/business-solutions/categories)

## Status

✅ **All features working correctly with real Wix data**
- Products loading with images
- Collections loading with product counts
- Authentication and permissions verified
- Ready for production use
