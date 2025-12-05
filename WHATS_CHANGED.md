# What Changed - V1 Publish Fix

## File Modified
`backend/src/routes/publish.ts`

## Changes Summary

### 1. Split Builder Function (Lines ~11-110)

**Before:**
- Single `buildProductUpdate()` function
- Used V3 field structure only

**After:**
- `buildProductUpdateV1()` - V1 field structure
- `buildProductUpdateV3()` - V3 field structure

### 2. Key Field Differences

| Field | V1 | V3 |
|-------|----|----|
| Description | `description` | `plainDescription` |
| SEO Tags | Includes `custom`, `disabled` | No extra properties |

### 3. Route Handler Update (Line ~200)

**Before:**
```typescript
const updatePayload = buildProductUpdate(item.attribute, item.after_value);
```

**After:**
```typescript
const catalogVersion = instance.catalog_version || 'V3';
const updatePayload = catalogVersion === 'V1'
  ? buildProductUpdateV1(item.attribute, item.after_value)
  : buildProductUpdateV3(item.attribute, item.after_value);
console.log(`[Publish] Using ${catalogVersion} format...`);
```

## Why This Works

V1 and V3 have different field names:
- V1 expects `description`, V3 expects `plainDescription`
- V1 requires `custom: false, disabled: false` in SEO tags

Now the code sends the correct format based on catalog version.

## Impact

- ✅ V1 stores: All fields now update correctly
- ✅ V3 stores: Continue working as before (no changes to V3 logic)
- ✅ Backward compatible: Defaults to V3 if version unknown
