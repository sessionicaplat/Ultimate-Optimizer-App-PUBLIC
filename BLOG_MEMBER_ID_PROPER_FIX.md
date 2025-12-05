# Blog Member ID - Proper Fix Implementation

## Overview

Implemented the proper fix for blog generation by capturing and storing the site owner's member ID during app installation.

## Changes Made

### 1. Database Migration
**File**: `backend/migrations/1730000003000_add-owner-member-id.js`

Added `owner_member_id` column to `app_instances` table:
```sql
ALTER TABLE app_instances ADD COLUMN owner_member_id VARCHAR(255);
CREATE INDEX ON app_instances(owner_member_id);
```

### 2. TypeScript Types
**File**: `backend/src/db/types.ts`

Updated `AppInstance` interface:
```typescript
export interface AppInstance {
  // ... existing fields
  owner_member_id?: string; // Site owner's Wix member ID
}
```

### 3. Database Functions
**File**: `backend/src/db/appInstances.ts`

Added function to update owner member ID:
```typescript
export async function updateOwnerMemberId(
  instanceId: string,
  ownerMemberId: string
): Promise<void>
```

### 4. SDK Client
**File**: `backend/src/wix/sdkClient.ts`

Added method to get site owner info:
```typescript
async getSiteOwnerInfo(): Promise<{ memberId?: string; email?: string }>
```

Updated `createDraftPost` to require member ID:
```typescript
async createDraftPost(data: {
  title: string;
  richContent: any;
  media?: any;
  excerpt?: string;
  memberId: string; // Now required
}): Promise<any>
```

### 5. Provisioning
**File**: `backend/src/routes/provision.ts`

Added member ID capture during app installation:
```typescript
// After storing access token
const wixClient = createWixClient(tokenData.access_token);
const ownerInfo = await wixClient.getSiteOwnerInfo();

if (ownerInfo.memberId) {
  await updateOwnerMemberId(instanceId, ownerInfo.memberId);
}
```

### 6. Blog Worker
**File**: `backend/src/workers/blogGenerationWorker.ts`

Updated to use stored member ID:
```typescript
if (!instance.owner_member_id) {
  throw new Error('Owner member ID not available. Please reinstall the app.');
}

await wixClient.createDraftPost({
  title: generation.blog_title!,
  richContent,
  memberId: instance.owner_member_id, // Use stored ID
  media: ...
});
```

## Deployment Steps

### 1. Run Migration on Render

```bash
# SSH into Render or use Render Shell
cd /opt/render/project/src/backend
node run-migrations.js
```

Or set up automatic migrations in `package.json`:
```json
{
  "scripts": {
    "build": "tsc && node run-migrations.js"
  }
}
```

### 2. Deploy Code

```bash
git add .
git commit -m "Implement proper blog member ID fix"
git push origin main
```

### 3. Reinstall App

**IMPORTANT**: Existing installations won't have the member ID. Users must reinstall:

1. Go to Wix site dashboard
2. Apps → Manage Apps
3. Remove "Ultimate Optimizer"
4. Reinstall from your app URL

## Testing

### 1. Check Migration

```sql
-- Verify column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'app_instances' 
AND column_name = 'owner_member_id';
```

### 2. Check Member ID Captured

```sql
-- After reinstalling app
SELECT instance_id, owner_member_id 
FROM app_instances 
WHERE instance_id = 'YOUR_INSTANCE_ID';
```

Should show a valid GUID for `owner_member_id`.

### 3. Test Blog Generation

1. Go to Blog Generator
2. Select a product
3. Generate ideas → Select one → Generate post
4. Should complete successfully

### 4. Check Logs

Look for:
```
✅ Stored owner member ID: c00e8a5c-322b-4e77-8813-002e3ea7e811
[Blog Worker] Creating draft post for X
[Blog Worker] Completed generation X, draft post: abc123
```

## Troubleshooting

### Member ID Not Captured

**Symptom**: `owner_member_id` is NULL after reinstall

**Causes**:
1. App doesn't have permission to read site owner info
2. Wix API returned unexpected format
3. Error during provisioning

**Solution**:
1. Check Render logs for provisioning errors
2. Verify app permissions in Wix Dev Dashboard
3. Try reinstalling again

### Blog Generation Still Fails

**Error**: "Owner member ID not available"

**Solution**:
1. Check database: `SELECT owner_member_id FROM app_instances WHERE instance_id = '...'`
2. If NULL, reinstall the app
3. Check provisioning logs for errors

### Migration Fails

**Error**: Column already exists

**Solution**:
```sql
-- Check if column exists
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'app_instances' AND column_name = 'owner_member_id';

-- If it exists, migration already ran
-- If not, run migration manually
```

## Rollback Plan

If something goes wrong:

### 1. Revert Code
```bash
git revert HEAD
git push origin main
```

### 2. Remove Column (Optional)
```sql
ALTER TABLE app_instances DROP COLUMN owner_member_id;
```

## Success Criteria

✅ Migration runs successfully
✅ Column `owner_member_id` exists in database
✅ Member ID captured during app installation
✅ Blog generation uses stored member ID
✅ Draft posts created successfully in Wix
✅ No "Missing post owner information" errors

## Future Improvements

1. **Fallback**: If member ID not available, show helpful error message in UI
2. **Re-capture**: Add endpoint to re-capture member ID without full reinstall
3. **Validation**: Validate member ID before attempting blog creation
4. **UI Indicator**: Show in UI if blog generation is available

## Related Files

- `backend/migrations/1730000003000_add-owner-member-id.js` - Database migration
- `backend/src/db/types.ts` - TypeScript types
- `backend/src/db/appInstances.ts` - Database functions
- `backend/src/wix/sdkClient.ts` - Wix SDK client
- `backend/src/routes/provision.ts` - App provisioning
- `backend/src/workers/blogGenerationWorker.ts` - Blog worker

## Notes

- **Breaking Change**: Existing installations need to reinstall
- **User Communication**: Notify users they need to reinstall for blog feature
- **Graceful Degradation**: Other features continue to work without member ID
- **One-Time Setup**: Member ID only needs to be captured once per installation

---

**Status**: ✅ Implemented and ready to deploy
**Risk**: Medium (requires app reinstall)
**Impact**: Blog generation will work properly after reinstall
