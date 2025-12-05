# Blog Image Wix Media Fix - SDK Implementation

## Problem
Blog posts were being created successfully with text content, but the cover image wasn't appearing. The initial fix attempted to use REST API but got a 404 error because the endpoint didn't exist.

## Root Cause
- Used wrong REST API endpoint `/media-manager/v1/files/upload/url` (doesn't exist)
- Should use Wix SDK's `files` module from `@wix/media` package instead

## Solution (2025 Wix SDK)
Implemented proper Wix SDK approach:
1. Generate image with Replicate (existing)
2. **Upload to Wix Media Manager using SDK** (fixed)
3. Use the Wix Media URL when creating the draft post (updated)

## Changes Made

### 1. Added @wix/media Package (`backend/package.json`)
```json
"@wix/media": "^1.0.0"
```

### 2. Updated SDK Client (`backend/src/wix/sdkClient.ts`)
- Imported `files` from `@wix/media`
- Added `files` to SDK client modules
- Created `uploadFileToMedia()` method that:
  - Uses `files.generateFileUploadUrl()` SDK method
  - Uploads file via PUT request to generated URL
  - Extracts Wix Media URL from response: `response.file.media.image.image`
- Updated `createDraftPost()` to use `media.wixMedia.image` format

### 3. Updated Media Helper (`backend/src/wix/mediaHelper.ts`)
- Removed REST API calls
- Now uses SDK client's `uploadFileToMedia()` method
- Downloads image from Replicate URL
- Passes to SDK for proper upload

### 4. Blog Worker (`backend/src/workers/blogGenerationWorker.ts`)
- Calls `uploadImageToWixMedia()` before creating draft
- Passes Wix Media URL to `createDraftPost`
- Gracefully handles upload failures

## How It Works

```
Replicate Image URL
    ↓
Download Image
    ↓
Upload to Wix Media Manager
    ↓
Get Wix Media URL (wix:image://...)
    ↓
Create Draft Post with Wix Media URL
    ↓
✅ Blog post with cover image
```

## Deployment Steps

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Verify App Permissions
Go to Wix Developers Dashboard → Your App → Permissions:
- Ensure **"Manage Media Manager"** permission is enabled
- If not enabled, add it and reinstall the app on your test site

### 3. Commit and Deploy
```bash
git add backend/package.json
git add backend/src/wix/sdkClient.ts
git add backend/src/wix/mediaHelper.ts
git commit -m "Fix: Use Wix SDK for media upload (fixes 404 error)"
git push origin main
```

### 4. Verify on Render
- Check Render logs for successful build
- Look for `npm install` completing successfully
- Verify app restarts without errors

### 5. Test
- Create a new blog post in your app
- Check logs for successful upload messages
- Verify cover image appears in Wix Blog dashboard

## Testing

1. Go to Blog Generator in your app
2. Generate blog ideas for a product
3. Select an idea
4. Wait for generation to complete
5. Check the draft post in Wix Blog dashboard
6. **Verify the cover image is now visible**

## Expected Log Messages

Success flow:
```
[Blog Worker] Uploading image to Wix Media Manager...
[Wix Media] Downloading image from: https://replicate.delivery/...
[Wix Media] Downloaded 100744 bytes, type: image/jpeg
[uploadFileToMedia] Generating upload URL for tmpXXX.jpeg
[uploadFileToMedia] Got upload URL
[uploadFileToMedia] Upload successful
[uploadFileToMedia] Wix Media URL: wix:image://v1/...
[Blog Worker] Image uploaded to Wix Media: wix:image://v1/...
[createDraftPost] Creating draft with: { hasMedia: true, mediaImage: 'wix:image://...' }
```

If you see errors about missing permissions:
- Check Wix app permissions include "Manage Media Manager"
- Reinstall the app on your test site

## Fallback Behavior

If image upload fails:
- Error is logged but doesn't fail the entire post
- Draft post is created without cover image
- Text content is still published successfully

## Technical Details

### Wix SDK Method Used
```javascript
import { files } from '@wix/media';

// Generate upload URL
const result = await files.generateFileUploadUrl(mimeType, { fileName });

// Upload file
await fetch(result.uploadUrl, {
  method: 'PUT',
  headers: { 'Content-Type': mimeType },
  body: fileBuffer
});

// Response contains Wix Media URL
const wixMediaUrl = response.file.media.image.image;
// Format: "wix:image://v1/<uri>/<filename>#originWidth=<width>&originHeight=<height>"
```

### Blog Post Media Format
```javascript
{
  media: {
    wixMedia: {
      image: "wix:image://v1/..."
    },
    displayed: true
  }
}
```

### Required Permission
- **Manage Media Manager** - Must be enabled in Wix App Dashboard
