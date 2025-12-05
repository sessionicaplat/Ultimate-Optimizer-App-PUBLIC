# Wix Blog Permissions Setup Guide

## Required Permissions for Blog Generation

Your Wix app needs specific permissions to create blog posts. Follow these steps to configure them.

## Step-by-Step Setup

### 1. Access Wix Developer Dashboard

1. Go to https://dev.wix.com/apps
2. Sign in with your Wix account
3. Select your app from the list

### 2. Navigate to Permissions

1. In the left sidebar, click **Permissions**
2. You'll see a list of available Wix APIs and their permission levels

### 3. Configure Blog Permissions

Find and configure these permissions:

#### Blog - Draft Posts (REQUIRED)
- **Permission**: `blog.draft-posts`
- **Access Level**: **Manage**
- **Why**: Allows your app to create, edit, and delete draft blog posts

#### Blog - Posts (Optional)
- **Permission**: `blog.posts`
- **Access Level**: **Read**
- **Why**: Allows your app to read published blog posts (useful for future features)

### 4. Save Changes

1. Click **Save** at the bottom of the permissions page
2. Wait for confirmation that permissions were updated

### 5. Update App Version (If Required)

If you've already published your app:
1. Go to **Versions** in the left sidebar
2. Create a new version with the updated permissions
3. Submit for review (if applicable)

## After Updating Permissions

### For Test Sites

Users who already installed your app need to **reinstall** it to get the new permissions:

1. Go to the Wix site dashboard
2. Navigate to **Apps** → **Manage Apps**
3. Find your app
4. Click **Remove** or **Uninstall**
5. Reinstall the app from your test URL

### For Production Sites

If your app is live in the Wix App Market:
1. Wix will notify users of the permission update
2. Users must accept the new permissions
3. Or they can reinstall the app

## Verify Permissions

### Check in Code

Your app should now be able to call:

```typescript
const wixClient = createWixClient(accessToken);
const draftPost = await wixClient.createDraftPost({
  title: "My Blog Post",
  richContent: { nodes: [...] },
  media: { ... }
});
```

### Check in Logs

Look for successful API calls:
```
[Blog Worker] Creating draft post for X
[Blog Worker] Completed generation X, draft post: abc123
```

### Check in Wix Dashboard

1. Go to your Wix site
2. Navigate to **Blog** → **Posts**
3. You should see draft posts created by your app

## Common Issues

### "UNAUTHENTICATED: Not authenticated"

**Cause**: App doesn't have blog permissions or user hasn't accepted them

**Solution**:
1. Verify permissions are set to **Manage** in Dev Dashboard
2. Reinstall the app on the test site
3. Check that `WIX_APP_ID` and `WIX_APP_SECRET` are correct

### "Permission denied"

**Cause**: Permission level is too low (e.g., Read instead of Manage)

**Solution**:
1. Change permission to **Manage**
2. Save changes
3. Reinstall app

### "Invalid token"

**Cause**: Token was issued before permissions were updated

**Solution**:
1. Force token refresh by reinstalling app
2. Or run SQL to expire current token:
   ```sql
   UPDATE app_instances 
   SET token_expires_at = NOW() - INTERVAL '1 hour'
   WHERE instance_id = 'YOUR_INSTANCE_ID';
   ```

## Permission Scopes Reference

| Permission | Scope | Access Level | Purpose |
|------------|-------|--------------|---------|
| Blog - Draft Posts | `blog.draft-posts` | Manage | Create, edit, delete drafts |
| Blog - Posts | `blog.posts` | Read | Read published posts |
| Blog - Posts | `blog.posts` | Manage | Publish, edit, delete posts |
| Blog - Categories | `blog.categories` | Read | Read blog categories |
| Blog - Tags | `blog.tags` | Read | Read blog tags |

## Testing Checklist

After setting up permissions:

- [ ] Permissions saved in Wix Dev Dashboard
- [ ] App reinstalled on test site
- [ ] Blog generation creates draft post successfully
- [ ] Draft post visible in Wix Blog dashboard
- [ ] No authentication errors in logs
- [ ] Credits deducted correctly after generation

## Additional Resources

- [Wix Blog API Documentation](https://dev.wix.com/api/rest/drafts/blog/draft-posts)
- [Wix App Permissions Guide](https://dev.wix.com/docs/build-apps/developer-tools/cli/permissions)
- [OAuth Authentication](https://dev.wix.com/docs/build-apps/develop-your-app/frameworks/authentication)

## Support

If you continue to have permission issues:

1. Check Render logs for specific error messages
2. Verify `WIX_APP_ID` and `WIX_APP_SECRET` environment variables
3. Test with a fresh Wix site installation
4. Contact Wix Developer Support if needed
