# V1 Publish Fix - Implementation Plan

## The Issue

Only product **name** updates on V1 stores. Description and SEO fields don't update because the code uses V3 field structure.

## The Fix

Update `backend/src/routes/publish.ts` to use correct field names for V1 vs V3.

## Key Field Differences

### Description
- **V1**: `description` (plain field)
- **V3**: `plainDescription` (HTML wrapped)

### SEO Tags
- **V1**: Requires `custom: false, disabled: false` properties
- **V3**: Doesn't need these properties

## Code Changes Required

### 1. Add V1-specific builder function

```typescript
function buildProductUpdateV1(attribute: string, value: string): any {
  switch (attribute) {
    case 'name':
      return { name: value };
    
    case 'description':
      return { description: value };  // ← V1 uses 'description'
    
    case 'seoTitle':
      return {
        seoData: {
          tags: [
            {
              type: 'title',
              children: value,
              custom: false,    // ← V1 requires these
              disabled: false,
            },
          ],
        },
      };
    
    case 'seoDescription':
      return {
        seoData: {
          tags: [
            {
              type: 'meta',
              props: {
                name: 'description',
                content: value,
              },
              custom: false,    // ← V1 requires these
              disabled: false,
            },
          ],
        },
      };
    
    default:
      throw new Error(`Unknown attribute type: ${attribute}`);
  }
}
```

### 2. Rename existing function to V3-specific

```typescript
function buildProductUpdateV3(attribute: string, value: string): any {
  // Keep existing logic - it's correct for V3
  switch (attribute) {
    case 'name':
      return { name: value };
    
    case 'description':
      return { plainDescription: `<p>${value}</p>` };  // V3 uses plainDescription
    
    case 'seoTitle':
      return {
        seoData: {
          tags: [
            {
              type: 'title',
              children: value,
              // No custom/disabled needed in V3
            },
          ],
        },
      };
    
    case 'seoDescription':
      return {
        seoData: {
          tags: [
            {
              type: 'meta',
              props: {
                name: 'description',
                content: value,
              },
              // No custom/disabled needed in V3
            },
          ],
        },
      };
    
    default:
      throw new Error(`Unknown attribute type: ${attribute}`);
  }
}
```

### 3. Update the route handler to use correct function

Find this line in the publish route:
```typescript
const updatePayload = buildProductUpdate(item.attribute, item.after_value);
```

Replace with:
```typescript
// Detect catalog version (default to V3 for backward compatibility)
const catalogVersion = instance.catalog_version || 'V3';

// Build update payload using correct structure
const updatePayload = catalogVersion === 'V1'
  ? buildProductUpdateV1(item.attribute, item.after_value)
  : buildProductUpdateV3(item.attribute, item.after_value);
```

### 4. Update SEO merging logic

The SEO merging logic (lines ~160-175) should work for both versions since the tag structure is similar enough. Just ensure it uses the correct builder function.

## Testing Steps

1. **Deploy changes**
2. **Test on V1 store:**
   - Optimize a product (name, description, SEO)
   - Publish all fields
   - Verify in Wix dashboard:
     - ✅ Name updated
     - ✅ Description updated
     - ✅ SEO title updated
     - ✅ SEO meta description updated

3. **Test on V3 store (regression):**
   - Verify all fields still update correctly

## Why This Will Work

### Name (Already Working)
- Same field name in V1 and V3: `name`

### Description (Will Fix)
- V1: `description` → Wix accepts it
- V3: `plainDescription` → Wix accepts it

### SEO Fields (Will Fix)
- V1: Requires `custom` and `disabled` properties → Now included
- V3: Works without these properties → Still works

## File to Edit

**Single file:** `backend/src/routes/publish.ts`

## Lines to Change

1. **Line ~15-60**: Rename `buildProductUpdate` to `buildProductUpdateV3`
2. **After line 60**: Add new `buildProductUpdateV1` function
3. **Line ~145**: Update to use version-specific builder

## Estimated Time

- Code changes: 10 minutes
- Testing: 5 minutes
- Total: 15 minutes

## Risk Level

**Low** - Changes are isolated to publish route, V3 logic unchanged.
