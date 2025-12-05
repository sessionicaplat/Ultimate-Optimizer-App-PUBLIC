# V1 Publish Testing Checklist

## Pre-Deployment
- [x] Code changes complete
- [x] TypeScript compilation successful
- [x] No diagnostics errors

## After Deployment

### Test on V1 Store

1. **Create Optimization Job**
   - [ ] Select a product
   - [ ] Optimize all fields (name, description, SEO title, SEO meta)
   - [ ] Wait for job to complete

2. **Publish All Fields**
   - [ ] Go to job details page
   - [ ] Click publish on name
   - [ ] Click publish on description
   - [ ] Click publish on SEO title
   - [ ] Click publish on SEO meta description

3. **Verify in Wix Dashboard**
   - [ ] Open product in Wix dashboard
   - [ ] Check name updated
   - [ ] Check description updated
   - [ ] Check SEO title updated (in SEO settings)
   - [ ] Check meta description updated (in SEO settings)

4. **Check Logs**
   Look for these messages:
   ```
   [Publish] Using V1 format for product {id}, attribute name
   [Publish] Using V1 format for product {id}, attribute description
   [Publish] Using V1 format for product {id}, attribute seoTitle
   [Publish] Using V1 format for product {id}, attribute seoDescription
   ```

### Test on V3 Store (Regression)

1. **Verify V3 Still Works**
   - [ ] Optimize product on V3 store
   - [ ] Publish all fields
   - [ ] Verify all updates in Wix dashboard

2. **Check Logs**
   Should see:
   ```
   [Publish] Using V3 format for product {id}, attribute ...
   ```

## Success Criteria

✅ All fields update on V1 stores
✅ All fields still update on V3 stores
✅ No errors in logs
✅ Correct format logged for each version
