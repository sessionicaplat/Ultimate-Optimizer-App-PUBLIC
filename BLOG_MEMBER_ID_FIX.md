# Blog Post Member ID Fix

## Problem

Blog generation was still failing with:
```
Error: INVALID_ARGUMENT: Missing post owner information: UNKNOWN
```

Even after adding `owner: {}`, the error persisted.

## Root Cause

According to Wix Blog API documentation:
> **For 3rd-party apps, `memberId` is a required field.**

The API requires the actual member ID of the site owner, not just an empty owner object.

## Solution

Updated the blog worker to:
1. Attempt to retrieve the site owner's member ID from Wix App Instance API
2. Pass the member ID to `createDraftPost` if available
3. Fall back to not providing member ID if retrieval fails (Wix may infer from auth context)

## Code Changes

### 1. SDK Client (`backend/src/wix/sdkClient.ts`)

**Added method to get site info**:
```typescript
async getSiteInfo(): Promise<any> {
  try {
    const result = await this.client.use({ 
      Authorization: this.client.auth.getAuthHeaders().headers.Authorization 
    }).fetch('https://www.wixapis.com/apps/v1/instance');
    return await result.json();
  } catch (error) {
    console.error('Error getting site info:', error);
    throw error;
  }
}
```

**Updated createDraftPost to accept optional memberId**:
```typescript
async createDraftPost(data: {
  title: string;
  richContent: any;
  media?: any;
  excerpt?: string;
  memberId?: string;  // Optional member ID
}): Promise<any> {
  const draftPost: any = {
    title: data.title,
    richContent: data.richContent,
    media: data.media,
    excerpt: data.excerpt,
  };

  // Add memberId if provided
  if (data.memberId) {
    draftPost.memberId = data.memberId;
  }

  const result = await this.client.draftPosts.createDraftPost(draftPost);
  return result.draftPost;
}
```

### 2. Blog Worker (`backend/src/workers/blogGenerationWorker.ts`)

**Added member ID retrieval**:
```typescript
const createDraft = async (forceRefresh = false) => {
  const wixClient = await getAuthorizedWixClient(forceRefresh);
  
  // Try to get site owner member ID
  let memberId: string | undefined;
  try {
    const siteInfo = await wixClient.getSiteInfo();
    memberId = siteInfo?.site?.ownerInfo?.memberId || siteInfo?.instance?.memberId;
    console.log(`[Blog Worker] Got member ID: ${memberId || 'none'}`);
  } catch (error) {
    console.warn(`[Blog Worker] Could not get member ID, will try without it:`, error);
  }
  
  return wixClient.createDraftPost({
    title: generation.blog_title!,
    richContent,
    memberId, // Pass member ID if available
    media: generation.blog_image_url ? { ... } : undefined,
  });
};
```

## How It Works

1. **Get Wix Client**: Create authenticated Wix SDK client
2. **Fetch Site Info**: Call Wix App Instance API to get site owner details
3. **Extract Member ID**: Get member ID from `site.ownerInfo.memberId`
4. **Create Draft Post**: Pass member ID to createDraftPost
5. **Fallback**: If member ID retrieval fails, try without it

## Deployment

```bash
cd backend
npm run build
git add .
git commit -m "Fix blog post member ID requirement"
git push origin main
```

## Testing

1. Generate a blog post
2. Check logs for:
   ```
   [Blog Worker] Got member ID: <MEMBER_ID>
   [Blog Worker] Creating draft post for X
   [Blog Worker] Completed generation X, draft post: <POST_ID>
   ```
3. Verify draft post in Wix Blog dashboard

## Expected Logs

### Success Case:
```
[Blog Worker] Creating draft post for 13
[Blog Worker] Got member ID: c00e8a5c-322b-4e77-8813-002e3ea7e811
[Blog Worker] Completed generation 13, draft post: abc123
```

### Fallback Case (if member ID not available):
```
[Blog Worker] Creating draft post for 13
[Blog Worker] Could not get member ID, will try without it
[Blog Worker] Completed generation 13, draft post: abc123
```

## Troubleshooting

### Still getting "Missing post owner information"?

1. **Check permissions**: Ensure app has "Manage Blog" permission
2. **Check authentication**: Verify token is valid and instance-specific
3. **Check member ID**: Look for member ID in logs
4. **Reinstall app**: Generate new tokens with proper permissions

### Member ID not found?

The fallback should still work if Wix can infer the owner from the authentication context. If not:
1. Check if site has a valid owner
2. Verify app installation is complete
3. Check Wix App Instance API response

## Alternative Approaches

If this doesn't work, we could:
1. Store member ID during app installation
2. Use Wix Members API to get site owner
3. Use a different authentication method

## Related Documentation

- Wix Blog Draft Posts API: https://dev.wix.com/api/rest/drafts/blog/draft-posts
- Wix App Instance API: https://dev.wix.com/api/rest/app-management/apps/app-instance
- Previous fixes:
  - `BLOG_AUTHENTICATION_FIX.md` - Token caching fix
  - `BLOG_OWNER_FIX.md` - First attempt at owner fix

## Success Criteria

✅ Blog generation completes without errors
✅ Draft post created in Wix
✅ Member ID retrieved successfully (or fallback works)
✅ Post owner is correct
✅ No "Missing post owner information" errors

---

**Status**: Ready to deploy and test
**Risk**: Medium (depends on Wix API behavior)
**Fallback**: If member ID retrieval fails, Wix may still infer owner from auth
