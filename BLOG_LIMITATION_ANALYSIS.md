# Blog Generation Limitation - Technical Analysis

## The Core Problem

The Wix Blog Draft Posts API has a fundamental requirement:
> **For 3rd-party apps, `memberId` is a required field.**

This creates a chicken-and-egg problem for our app architecture.

## Why It's Failing

### Our Current Authentication
- We use **OAuth client credentials** (app-level authentication)
- This gives us an app token that can access the site's data
- But it doesn't provide a specific member/user context

### What Wix Blog API Needs
- A **member ID** of the site owner or a blog contributor
- This identifies WHO is creating the blog post
- The API won't accept posts without this information

## Why We Can't Get Member ID Easily

1. **App Instance API** doesn't return member ID in our current setup
2. **Members API** requires different permissions
3. **Site owner info** isn't accessible with app-level tokens

## Potential Solutions

### Solution 1: Store Member ID During Installation (Recommended)

During app installation, when the user authorizes the app:
1. Get the user's member ID from the OAuth flow
2. Store it in the `app_instances` table
3. Use it when creating blog posts

**Implementation**:
```sql
ALTER TABLE app_instances ADD COLUMN owner_member_id VARCHAR(255);
```

Then in `provision.ts`:
```typescript
// During OAuth callback, get member ID
const memberInfo = await wixClient.getCurrentMember();
await updateAppInstance(instanceId, {
  ownerMemberId: memberInfo.id
});
```

### Solution 2: Use Wix Blocks/Velo Instead

Wix Blocks apps run in the site's context and have access to the current user:
```javascript
import wixUsers from 'wix-users';
const memberId = wixUsers.currentUser.id;
```

This would work, but requires rebuilding as a Blocks app.

### Solution 3: Manual Blog Creation

Instead of using the Draft Posts API:
1. Generate the blog content (title, body, image)
2. Display it to the user in the app
3. Provide a "Copy" button
4. User manually creates the blog post in Wix and pastes the content

**Pros**: Works with current architecture
**Cons**: Not automated, poor UX

### Solution 4: Use a Different API

Check if Wix has alternative APIs for blog creation that don't require member ID.

## Recommended Path Forward

### Short Term: Disable Blog Feature
Comment out or disable the blog generation feature until we can implement Solution 1.

### Long Term: Implement Solution 1
1. Add `owner_member_id` column to database
2. Update OAuth flow to capture member ID
3. Store it during app installation
4. Use it when creating blog posts

## Code Changes Needed for Solution 1

### 1. Database Migration
```javascript
exports.up = function(knex) {
  return knex.schema.table('app_instances', (table) => {
    table.string('owner_member_id', 255);
  });
};
```

### 2. Update App Instances Type
```typescript
export interface AppInstance {
  // ... existing fields
  owner_member_id?: string;
}
```

### 3. Capture Member ID During Installation
```typescript
// In provision.ts or oauth.ts
async function handleAppInstallation(instanceId: string, accessToken: string) {
  // Get site owner info
  const wixClient = createWixClient(accessToken);
  const siteInfo = await wixClient.getSiteInfo();
  const ownerMemberId = siteInfo.site.ownerInfo.memberId;
  
  // Store in database
  await updateAppInstance(instanceId, {
    ownerMemberId
  });
}
```

### 4. Use Member ID in Blog Worker
```typescript
const instance = await getAppInstance(generation.instance_id);
if (!instance.owner_member_id) {
  throw new Error('Owner member ID not available. Please reinstall the app.');
}

await wixClient.createDraftPost({
  title: generation.blog_title!,
  richContent,
  memberId: instance.owner_member_id, // Use stored member ID
  media: ...
});
```

## Why This Is Hard

1. **Wix's API design** assumes apps run in user context (Blocks/Velo)
2. **Self-hosted apps** use app-level auth, not user-level
3. **Member ID** isn't easily accessible with app-level tokens
4. **Documentation** doesn't clearly explain this limitation

## Alternative: Content Generation Only

We could pivot the feature to:
1. Generate blog content (title, body, image)
2. Show it in the app UI
3. Provide export/copy functionality
4. User creates the blog post manually in Wix

This keeps the AI value proposition while working around the API limitation.

## Decision Needed

Choose one of:
1. **Implement Solution 1** (proper fix, requires migration and reinstall)
2. **Implement Solution 3** (quick workaround, manual process)
3. **Disable feature** (until proper fix can be implemented)
4. **Pivot to content generation only** (no Wix API integration)

## Recommendation

**Implement Solution 1** because:
- It's the proper fix
- Provides best user experience
- Aligns with Wix's API design
- Future-proof

**Timeline**: 2-3 hours of development + testing

---

**Current Status**: Blog generation fails due to missing member ID
**Blocker**: Wix Blog API requires member ID for 3rd-party apps
**Solution**: Store owner member ID during app installation
