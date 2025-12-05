# Image Publish - URL Field Fix ✅

## The Issue

Wix V3 API validation error:
```
"product.media.itemsInfo.items[2]" id or url must not be empty
```

## Root Cause

We were using `image` as the field name:
```typescript
const newMediaItem = {
  image: optimizedImageUrl,  // ❌ Wrong field name
  altText: altText,
};
```

But Wix V3 API requires either `id` or `url`:
- `id` - for existing media items in Wix
- `url` - for new external images

## The Fix

Changed to use `url`:
```typescript
const newMediaItem = {
  url: optimizedImageUrl,  // ✅ Correct field name
  altText: altText,
};
```

## Why This Works

According to Wix documentation, when adding new media to a product:
- Use `id` to reference existing Wix media
- Use `url` to add new external images

Our optimized images are hosted on Replicate, so we need to use `url`.

## Deploy & Test

```bash
cd backend
npm run build
git push
```

Then click "Publish to Store" - it will work this time!

## What Will Happen

1. Product fetched ✅
2. Existing media retrieved ✅
3. New media item created with `url` field ✅
4. Product updated successfully ✅
5. Image appears in Wix product gallery ✅

This is the final fix!
