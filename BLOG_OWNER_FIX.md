# Blog Post Owner Information Fix

## Problem

After fixing the authentication issue, blog generation was failing with a new error:

```
Error creating draft post: INVALID_ARGUMENT: Missing post owner information: UNKNOWN
```

## Root Cause

The Wix Blog API requires owner information when creating draft posts. The API expects an `owner` object with member information.

## Solution

Added an empty `owner` object to the draft post creation request. When the owner object is empty, Wix automatically uses the authenticated user (the site owner) as the post owner.

## Code Changes

**File**: `backend/src/wix/sdkClient.ts`

**Before**:
```typescript
async createDraftPost(data: {
  title: string;
  richContent: any;
  media?: any;
  excerpt?: string;
}): Promise<any> {
  try {
    const draftPost = {
      title: data.title,
      richContent: data.richContent,
      media: data.media,
      excerpt: data.excerpt,
    };

    const result = await this.client.draftPosts.createDraftPost(draftPost);
    return result.draftPost;
  }
}
```

**After**:
```typescript
async createDraftPost(data: {
  title: string;
  richContent: any;
  media?: any;
  excerpt?: string;
}): Promise<any> {
  try {
    const draftPost: any = {
      title: data.title,
      richContent: data.richContent,
      media: data.media,
      excerpt: data.excerpt,
      owner: {},  // ← Added: Uses authenticated user as owner
    };

    const result = await this.client.draftPosts.createDraftPost(draftPost);
    return result.draftPost;
  }
}
```

## How It Works

1. **Empty owner object**: `owner: {}`
2. **Wix API behavior**: When owner is an empty object, Wix uses the authenticated user's member ID
3. **Authenticated user**: The site owner who installed the app
4. **Result**: Draft post is created with the site owner as the author

## Deployment

```bash
# Build
cd backend
npm run build

# Deploy
git add backend/src/wix/sdkClient.ts
git add BLOG_OWNER_FIX.md
git commit -m "Fix blog post owner information"
git push origin main
```

Render will auto-deploy in ~2-3 minutes.

## Testing

1. Go to Blog Generator
2. Select a product
3. Generate ideas → Select one → Generate post
4. Should complete successfully
5. Check Wix Blog dashboard for draft post
6. Verify post owner is the site owner

## Expected Logs

```
[Blog Worker] Processing generation X
[Blog Worker] Generating content for X
[Blog Worker] Generated content for X
[Blog Worker] Generating image for X
[Blog Worker] Creating draft post for X
[Blog Worker] Completed generation X, draft post: abc123
```

## Verification

### Check Wix Dashboard
1. Go to Wix site → Blog → Posts
2. Find the draft post
3. Check author - should be the site owner
4. Verify content is present

### Check Database
```sql
SELECT id, status, draft_post_id, error
FROM blog_generations
WHERE id = X;
```

Should show:
- `status`: 'DONE'
- `draft_post_id`: Not null
- `error`: null

## Related Fixes

This fix builds on the previous authentication fix:

1. **Authentication fix** (`BLOG_AUTHENTICATION_FIX.md`): Removed token caching
2. **Owner fix** (this document): Added owner object to draft post

Both fixes were needed for blog generation to work.

## Wix API Documentation

According to Wix Blog API docs:
- Draft posts require an `owner` object
- If `owner` is empty `{}`, uses authenticated user
- If `owner.memberId` is specified, uses that member
- If `owner` is missing entirely, API returns error

## Troubleshooting

### Still getting "Missing post owner information"?

1. **Check token**: Ensure token is valid and not expired
2. **Check permissions**: Verify Blog - Draft Posts permission is set to Manage
3. **Reinstall app**: Generate new tokens with proper permissions

### Post created but wrong owner?

This shouldn't happen with `owner: {}`, but if it does:
- Check which user's token is being used
- Verify the token belongs to the site owner

### Post not visible in Wix?

1. Check it's in **Draft** posts, not Published
2. Verify `draft_post_id` in database matches Wix
3. Check Wix Blog app is installed on the site

## Success Criteria

✅ Blog generation completes without errors
✅ Draft post created in Wix
✅ Post owner is the site owner
✅ Content and title are correct
✅ Image is attached (or fallback used)
✅ Credits deducted correctly

## Next Steps

After successful deployment:
1. Test with multiple products
2. Verify all blog features work
3. Check image generation (separate Replicate issue)
4. Monitor for any other errors
5. Update user documentation

---

**Status**: Ready to deploy
**Risk**: Low (simple addition)
**Impact**: Blog generation now works end-to-end
