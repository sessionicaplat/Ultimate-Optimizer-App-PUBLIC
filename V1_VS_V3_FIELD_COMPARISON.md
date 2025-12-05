# V1 vs V3 Product Update Field Comparison

## Quick Reference: What's Different

| Attribute | V1 Field Name | V3 Field Name | Additional V1 Properties |
|-----------|---------------|---------------|--------------------------|
| Name | `name` | `name` | None |
| Description | `description` | `plainDescription` | None |
| SEO Title | `seoData.tags[]` | `seoData.tags[]` | `custom`, `disabled` |
| SEO Meta | `seoData.tags[]` | `seoData.tags[]` | `custom`, `disabled` |

## Side-by-Side Examples

### 1. Product Name (Same in Both)

**V1:**
```json
{
  "name": "Colombian Arabica Coffee"
}
```

**V3:**
```json
{
  "name": "Colombian Arabica Coffee"
}
```

✅ **Status**: Works in both versions

---

### 2. Product Description (DIFFERENT)

**V1:**
```json
{
  "description": "The best organic coffee that Colombia has to offer."
}
```

**V3:**
```json
{
  "plainDescription": "<p>The best organic coffee that Colombia has to offer.</p>"
}
```

❌ **Current Issue**: Code sends `plainDescription` to V1 → Field ignored
✅ **Fix**: Send `description` to V1

---

### 3. SEO Title (DIFFERENT)

**V1:**
```json
{
  "seoData": {
    "tags": [
      {
        "type": "title",
        "children": "Buy Colombian Arabica Coffee Online",
        "custom": false,
        "disabled": false
      }
    ]
  }
}
```

**V3:**
```json
{
  "seoData": {
    "tags": [
      {
        "type": "title",
        "children": "Buy Colombian Arabica Coffee Online"
      }
    ]
  }
}
```

❌ **Current Issue**: Code sends V3 structure (missing `custom`, `disabled`) to V1 → May be ignored
✅ **Fix**: Include `custom: false, disabled: false` for V1

---

### 4. SEO Meta Description (DIFFERENT)

**V1:**
```json
{
  "seoData": {
    "tags": [
      {
        "type": "meta",
        "props": {
          "name": "description",
          "content": "Shop premium Colombian Arabica coffee beans."
        },
        "custom": false,
        "disabled": false
      }
    ]
  }
}
```

**V3:**
```json
{
  "seoData": {
    "tags": [
      {
        "type": "meta",
        "props": {
          "name": "description",
          "content": "Shop premium Colombian Arabica coffee beans."
        }
      }
    ]
  }
}
```

❌ **Current Issue**: Code sends V3 structure (missing `custom`, `disabled`) to V1 → May be ignored
✅ **Fix**: Include `custom: false, disabled: false` for V1

---

## Why Name Works But Others Don't

```
┌─────────────────────────────────────────────────────────┐
│                    Current Behavior                      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  V1 Store receives V3-formatted updates:                │
│                                                          │
│  ✅ name: "Product Name"                                │
│     → V1 recognizes "name" field → Updates!            │
│                                                          │
│  ❌ plainDescription: "<p>Description</p>"              │
│     → V1 doesn't recognize "plainDescription"          │
│     → Ignores field → No update!                       │
│                                                          │
│  ❌ seoData.tags without custom/disabled                │
│     → V1 may reject incomplete structure               │
│     → No update!                                        │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## The Fix in Action

### Before (Current - Broken for V1)

```typescript
function buildProductUpdate(attribute: string, value: string): any {
  switch (attribute) {
    case 'description':
      return { plainDescription: `<p>${value}</p>` };  // ❌ V3 only!
  }
}
```

### After (Fixed - Works for Both)

```typescript
function buildProductUpdateV1(attribute: string, value: string): any {
  switch (attribute) {
    case 'description':
      return { description: value };  // ✅ V1 format!
  }
}

function buildProductUpdateV3(attribute: string, value: string): any {
  switch (attribute) {
    case 'description':
      return { plainDescription: `<p>${value}</p>` };  // ✅ V3 format!
  }
}

// In route handler:
const updatePayload = catalogVersion === 'V1'
  ? buildProductUpdateV1(item.attribute, item.after_value)
  : buildProductUpdateV3(item.attribute, item.after_value);
```

## Real-World Example

### Scenario: Update product description to "Premium organic coffee"

**V1 Store (Current - Fails):**
```
Request: PATCH /stores/v1/products/abc123
Body: { "plainDescription": "<p>Premium organic coffee</p>" }
Result: ❌ Field ignored, description unchanged
```

**V1 Store (After Fix - Works):**
```
Request: PATCH /stores/v1/products/abc123
Body: { "description": "Premium organic coffee" }
Result: ✅ Description updated successfully
```

**V3 Store (Still Works):**
```
Request: PATCH /stores/v3/products/abc123
Body: { "plainDescription": "<p>Premium organic coffee</p>" }
Result: ✅ Description updated successfully
```

## Summary

The fix is simple: **Use the correct field names for each catalog version**.

- V1 needs: `description`, `custom`, `disabled`
- V3 needs: `plainDescription`, no extra properties

This is exactly the same pattern we already use in `WixStoresClient` for reading products - now we need it for writing too.
