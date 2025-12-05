# Blog Member ID Fix - 2025 Wix Documentation

## Problem

Blog post creation was failing with:
```
Owner member ID not available. Please reinstall the app to enable blog generation.
```

The issue was that we were trying to get a **Site Member ID** directly from the site owner info, but:
- **Wix User** (site owner) ≠ **Site Member**
- Site owners are NOT automatically site members
- The Blog API requires a **Site Member ID**, not a Wix User ID

## Solution (Based on 2025 Wix Docs)

### 4-Step Flow

1. **Get Owner Email** (during provisioning)
   - Use `appInstances.getAppInstance()` from App Management API
   - Requires: "Read Site Owner Email" permission scope
   - Store email in database

2. **Query for Member** (when creating blog post)
   - Use `members.queryMembers().eq('loginEmail', email)`
   - If found: Use `member._id` as `memberId`

3. **Create Member if Needed**
   - If no member found, use `members.createMember()`
   - Pass owner's email as `loginEmail`
   - Returns new member with `_id`

4. **Create Blog Post**
   - Use the `memberId` from step 2 or 3
   - Pass to `draftPosts.createDraftPost({ memberId })`

## Changes Made

### 1. Database Migration
Changed from `owner_member_id` to `owner_email`:
```javascript
// backend/migrations/1730000003000_add-owner-member-id.js
pgm.addColumn('app_instances', {
  owner_email: {
    type: 'varchar(255)',
    notNull: false,
  },
});
```

### 2. New Member Helper Module
Created `backend/src/wix/memberHelper.ts` with:
- `getSiteOwnerEmail()` - Get email from App Management API
- `findMemberByEmail()` - Query for existing member
- `createMemberForOwner()` - Create new member
- `getOrCreateOwnerMemberId()` - Main function (combines 2 & 3)

### 3. Updated Provisioning
```typescript
// backend/src/routes/provision.ts
const { getSiteOwnerEmail } = await import('../wix/memberHelper');
const ownerEmail = await getSiteOwnerEmail(tokenData.access_token);

if (ownerEmail) {
  await updateOwnerEmail(instanceId, ownerEmail);
}
```

### 4. Updated Blog Worker
```typescript
// backend/src/workers/blogGenerationWorker.ts
const getOwnerMemberId = async (): Promise<string | null> => {
  const { getOrCreateOwnerMemberId } = await import('../wix/memberHelper');
  const token = await getInstanceToken(instance.instance_id);
  return await getOrCreateOwnerMemberId(token, instance.owner_email);
};

// Use it when creating draft post
const ownerMemberId = await getOwnerMemberId();
await wixClient.createDraftPost({
  memberId: ownerMemberId,
  // ...
});
```

## Required Wix Dashboard Setup

### Add Permission Scope

1. Go to **Wix Developers** → **Your App** → **Permissions**
2. Add permission: **"Read Site Owner Email"**
3. Save changes

This permission allows your app to call `appInstances.getAppInstance()` and access `site.ownerInfo.email`.

## Deployment Steps

1. **Deploy to Render** (automatic from git push)
   - Migration will run automatically
   - Adds `owner_email` column to `app_instances` table

2. **Update Wix Dashboard**
   - Add "Read Site Owner Email" permission scope
   - Save and publish app changes

3. **Reinstall the App**
   - Go to your Wix site
   - Remove the app
   - Reinstall from app URL
   - Provisioning will capture owner email

4. **Test Blog Generation**
   - Go to Blog Generator
   - Select a product
   - Generate ideas → Select one → Generate post
   - Should complete successfully!

## How It Works Now

### During Provisioning
```
1. App installed
2. Get elevated access token
3. Call App Management API → Get owner email
4. Store email in database
```

### During Blog Generation
```
1. Worker starts blog generation
2. Get owner email from database
3. Query Members API for member with that email
4. If not found: Create new member with that email
5. Get member._id (memberId)
6. Create draft post with memberId
7. Success! ✅
```

## Benefits

- **Follows 2025 Wix best practices**
- **No assumptions** about site owner being a member
- **Automatic member creation** if needed
- **Fresh member ID** retrieved each time (no stale data)
- **Proper separation** of Wix User vs Site Member concepts

## Testing

After deployment and reinstall, check logs for:

```
✅ Stored owner email: owner@example.com
[memberHelper] Getting or creating member ID for: owner@example.com
[memberHelper] Found existing member: abc123
[Blog Worker] Got member ID abc123 for instance xyz
[Blog Worker] Completed generation 21, draft post: def456
```

## Troubleshooting

### "No owner email stored"
- Reinstall the app to capture email during provisioning
- Check that "Read Site Owner Email" permission is enabled

### "Failed to get/create member ID"
- Check app has proper permissions for Members API
- Verify access token has elevated permissions
- Check Render logs for detailed error messages

### "Member created but no ID returned"
- This is a Wix API issue
- Try reinstalling the app
- Contact Wix support if persists

## References

- [Wix App Management API](https://dev.wix.com/docs/sdk/api-reference/app-management)
- [Wix Members API](https://dev.wix.com/docs/sdk/api-reference/members)
- [Wix Blog API](https://dev.wix.com/docs/sdk/api-reference/blog)
- [Creating Blog Posts on Behalf of Site Owner](https://dev.wix.com/docs/sdk/api-reference/blog/draft-posts/create-draft-post)
