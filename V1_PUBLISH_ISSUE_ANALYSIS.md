# V1 Product Update Issue Analysis

## Problem Statement

When publishing optimized content to V1 stores:
- ✅ **Product name/title** updates successfully
- ❌ **Description** does not update
- ❌ **SEO title** does not update  
- ❌ **SEO meta description** does not update

## Root Cause

The `buildProductUpdate()` function in `backend/src/routes/publish.ts` is building update payloads using **V3 field structure**, but V1 has a **completely different structure**.

### Current Code (V3-only structure)

```typescript
function buildProductUpdate(attribute: string, value: string): any {
  switch (attribute) {
    case 'name':
      return { name: value };  // ✅ Works in both V1 and V3
    
    case 'description':
      return {
        plainDescription: `<p>${value}</p>`,  // ❌ V3 only!
      };
    
    case 'seoTitle':
      return {
        seoData: {
          tags: [
            {
              type: 'title',
              children: value,
            },
          ],
        },
      };  // ❌ V3 structure!
    
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
            },
          ],
        },
      };  // ❌ V3 structure!
  }
}
```

## V1 vs V3 Field Structure Differences

### 1. Product Description

**V3 Structure:**
```typescript
{
  plainDescription: "<p>Description text</p>"  // HTML string
}
```

**V1 Structure:**
```typescript
{
  description: "Description text"  // Plain text or HTML
}
```

### 2. SEO Title

**V3 Structure:**
```typescript
{
  seoData: {
    tags: [
      {
        type: "title",
        children: "SEO Title"
      }
    ]
  }
}
```

**V1 Structure:**
```typescript
{
  seoData: {
    tags: [
      {
        type: "title",
        children: "SEO Title",
        custom: false,
        disabled: false
      }
    ]
  }
}
```

### 3. SEO Meta Description

**V3 Structure:**
```typescript
{
  seoData: {
    tags: [
      {
        type: "meta",
        props: {
          name: "description",
          content: "Meta description"
        }
      }
    ]
  }
}
```

**V1 Structure:**
```typescript
{
  seoData: {
    tags: [
      {
        type: "meta",
        props: {
          name: "description",
          content: "Meta description"
        },
        custom: false,
        disabled: false
      }
    ]
  }
}
```

## Evidence from V1 Documentation

From the Wix V1 documentation you provided:

### Creating a Product (V1 Example)
```javascript
const product = {
  name: "Colombian Arabica",
  description: "The best organic coffee that Colombia has to offer.",  // ← Plain 'description' field
  priceData: {
    price: 35,
  },
  // ... other fields
  seoData: {
    tags: [
      {
        type: "title",
        children: "Colombian Arabica",
        custom: false,
        disabled: false,
      },
      {
        type: "meta",
        props: {
          name: "description",
          content: "The best organic coffee that Colombia has to offer.",
        },
        custom: false,
        disabled: false,
      },
    ],
  },
};
```

Key observations:
1. V1 uses `description` (not `plainDescription`)
2. V1 SEO tags include `custom` and `disabled` properties
3. Structure is similar but not identical to V3

## Solution Strategy

### Option 1: Version-Aware buildProductUpdate() (Recommended)

Modify `buildProductUpdate()` to accept catalog version and build appropriate structure:

```typescript
function buildProductUpdate(
  attribute: string, 
  value: string, 
  catalogVersion: 'V1' | 'V3'
): any {
  switch (attribute) {
    case 'name':
      // Same for both versions
      return { name: value };
    
    case 'description':
      if (catalogVersion === 'V3') {
        return { plainDescription: `<p>${value}</p>` };
      } else {
        return { description: value };
      }
    
    case 'seoTitle':
      if (catalogVersion === 'V3') {
        return {
          seoData: {
            tags: [
              {
                type: 'title',
                children: value,
              },
            ],
          },
        };
      } else {
        return {
          seoData: {
            tags: [
              {
                type: 'title',
                children: value,
                custom: false,
                disabled: false,
              },
            ],
          },
        };
      }
    
    case 'seoDescription':
      if (catalogVersion === 'V3') {
        return {
          seoData: {
            tags: [
              {
                type: 'meta',
                props: {
                  name: 'description',
                  content: value,
                },
              },
            ],
          },
        };
      } else {
        return {
          seoData: {
            tags: [
              {
                type: 'meta',
                props: {
                  name: 'description',
                  content: value,
                },
                custom: false,
                disabled: false,
              },
            ],
          },
        };
      }
    
    default:
      throw new Error(`Unknown attribute type: ${attribute}`);
  }
}
```

### Option 2: Separate Functions (Cleaner)

Create separate functions for V1 and V3:

```typescript
function buildProductUpdateV1(attribute: string, value: string): any {
  switch (attribute) {
    case 'name':
      return { name: value };
    
    case 'description':
      return { description: value };
    
    case 'seoTitle':
      return {
        seoData: {
          tags: [
            {
              type: 'title',
              children: value,
              custom: false,
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
              custom: false,
              disabled: false,
            },
          ],
        },
      };
    
    default:
      throw new Error(`Unknown attribute type: ${attribute}`);
  }
}

function buildProductUpdateV3(attribute: string, value: string): any {
  // ... existing V3 logic
}

// In the route handler:
const catalogVersion = instance.catalog_version || 'V3';
const updatePayload = catalogVersion === 'V1' 
  ? buildProductUpdateV1(item.attribute, item.after_value)
  : buildProductUpdateV3(item.attribute, item.after_value);
```

## Implementation Steps

1. **Detect catalog version** from `instance.catalog_version`
2. **Modify buildProductUpdate()** to handle both V1 and V3 structures
3. **Update description field** mapping:
   - V1: `description`
   - V3: `plainDescription`
4. **Add V1 SEO properties** (`custom`, `disabled`) to tag objects
5. **Test on V1 store** to verify all fields update correctly

## Files to Modify

1. **backend/src/routes/publish.ts**
   - Modify `buildProductUpdate()` function
   - Pass catalog version to the function
   - Handle V1 vs V3 field structures

## Testing Checklist

After implementation:
- [ ] V1: Product name updates ✅ (already working)
- [ ] V1: Product description updates
- [ ] V1: SEO title updates
- [ ] V1: SEO meta description updates
- [ ] V3: All fields still update correctly (regression test)

## Key Differences Summary

| Field | V1 | V3 |
|-------|----|----|
| Name | `name` | `name` |
| Description | `description` | `plainDescription` |
| SEO Title | `seoData.tags[].type='title'` + `custom`, `disabled` | `seoData.tags[].type='title'` |
| SEO Meta | `seoData.tags[].type='meta'` + `custom`, `disabled` | `seoData.tags[].type='meta'` |

## Why Name Works But Others Don't

The `name` field has the **same structure in both V1 and V3**, so it works.

All other fields have **different structures**, so they fail silently when V3 structure is sent to V1 API.

## Recommendation

Use **Option 2 (Separate Functions)** for:
- Cleaner code separation
- Easier to maintain
- Clear distinction between V1 and V3 logic
- Better for future changes

This follows the same pattern already established in `WixStoresClient` where V1 and V3 have separate code paths.
