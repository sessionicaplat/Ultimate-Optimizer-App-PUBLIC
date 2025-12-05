# Quick Setup Guide: Image Optimization with Replicate

## Prerequisites
- Replicate account with API token
- Backend and frontend already set up
- Database connection configured

## Setup Steps

### 1. Add Replicate API Token

Add to your backend `.env` file:
```bash
REPLICATE_API_TOKEN=r8_your_replicate_token_here
```

**Important:** Get your actual Replicate API token from https://replicate.com/account/api-tokens

### 2. Run Database Migration

The migration creates two new tables:
- `image_optimization_jobs`
- `image_optimization_items`

```bash
cd backend
npm run migrate
```

If you're on Render.com, the migration will run automatically on next deployment.

### 3. Restart Backend Server

The image optimization worker starts automatically with the server.

```bash
cd backend
npm run dev
```

You should see in the logs:
```
[ImageOptWorker] Starting image optimization worker...
[ImageOptWorker] Worker started (checking every 30 seconds)
```

### 4. Test the Feature

1. **Navigate to Image Optimization:**
   - Go to http://localhost:5173/image-optimization
   - Or click "Image Optimization" in the sidebar

2. **Select Product & Images:**
   - Search for a product
   - Click on a product to view its images
   - Select 1-3 images (for testing)

3. **Add Prompts:**
   - Either use a global prompt for all images
   - Or add individual prompts per image
   - Example prompt: "Make the background white and professional"

4. **Create Job:**
   - Click "Optimize X images · Y credits"
   - You'll be redirected to the Ongoing page

5. **Monitor Progress:**
   - Watch the progress bar update
   - See individual image statuses change
   - Wait for completion (usually 30-60 seconds per image)

6. **View Results:**
   - Click "Completed Image Optimizations" tab
   - Select your completed job
   - Compare before/after images
   - Click any image for full-size comparison

## Troubleshooting

### Worker Not Starting
**Symptom:** No log message about worker starting

**Solution:**
1. Check `backend/src/server.ts` includes:
   ```typescript
   import { startImageOptimizationWorker } from './workers/imageOptimizationWorker';
   // ...
   startImageOptimizationWorker();
   ```

### Jobs Stuck in PENDING
**Symptom:** Jobs created but never start processing

**Possible Causes:**
1. **Worker not running** - Check server logs
2. **Invalid Replicate token** - Verify token in .env
3. **Database connection issue** - Check DATABASE_URL

**Debug:**
```bash
# Check server logs for errors
tail -f backend/logs/server.log

# Or check console output
```

### Replicate API Errors
**Symptom:** Items fail with "Replicate API error"

**Common Issues:**
1. **Invalid token** - Check REPLICATE_API_TOKEN
2. **Rate limiting** - Worker processes 5 items per cycle with delays
3. **Invalid image URLs** - Ensure product images are publicly accessible

**Solution:**
- Verify token: `echo $REPLICATE_API_TOKEN`
- Check Replicate dashboard for API usage
- Test with a single image first

### Credits Not Deducted
**Symptom:** Job created but credits unchanged

**Solution:**
1. Check `incrementCreditsUsed` function is called
2. Verify database connection
3. Check app_instances table has correct credits

### Images Not Loading
**Symptom:** Blank images or 404 errors

**Possible Causes:**
1. **CORS issues** - Wix media URLs may have restrictions
2. **Invalid URLs** - Check product.media structure
3. **Expired URLs** - Some Wix URLs are temporary

**Solution:**
- Check browser console for CORS errors
- Verify image URLs are accessible
- Test with different products

## Production Deployment

### Environment Variables
Ensure these are set on your production server (e.g., Render.com):

```bash
REPLICATE_API_TOKEN=r8_your_replicate_token_here
DATABASE_URL=postgresql://...
WIX_APP_ID=...
WIX_APP_SECRET=...
```

### Database Migration
On Render.com, migrations run automatically via the build command:
```bash
npm run build && npm run migrate
```

### Monitoring
1. **Check worker logs** for processing activity
2. **Monitor Replicate usage** at https://replicate.com/account
3. **Track credit usage** in your database
4. **Set up alerts** for failed jobs

### Cost Management
- Each image costs ~$0.01-0.05 on Replicate (check current pricing)
- Worker processes 5 images per 30-second cycle
- Maximum ~600 images per hour
- Monitor your Replicate billing dashboard

## Feature Usage

### For End Users

**Credits Required:**
- 15 credits per image
- Maximum 10 images per job
- Check available credits before optimizing

**Best Practices:**
1. **Start small** - Test with 1-2 images first
2. **Clear prompts** - Be specific about desired changes
3. **Check results** - Review before applying to more images
4. **Monitor credits** - Keep track of usage

**Example Prompts:**
- "Make the background pure white"
- "Enhance colors and increase brightness"
- "Remove shadows and make lighting even"
- "Make the product stand out with professional lighting"
- "Add a subtle shadow for depth"

## API Endpoints

### Create Job
```
POST /api/image-optimization
Authorization: Bearer <instance-token>
Body: {
  productId: string,
  productName: string,
  images: [{
    imageId: string,
    imageUrl: string,
    prompt: string
  }]
}
```

### List Jobs
```
GET /api/image-optimization/jobs?status=PENDING,RUNNING
Authorization: Bearer <instance-token>
```

### Get Job Details
```
GET /api/image-optimization/jobs/:jobId
Authorization: Bearer <instance-token>
```

## Next Steps

1. **Test thoroughly** with various products and prompts
2. **Monitor costs** on Replicate dashboard
3. **Gather user feedback** on optimization quality
4. **Adjust worker settings** if needed (cycle time, batch size)
5. **Consider webhooks** for instant updates (future enhancement)

## Support Resources

- **Replicate Docs:** https://replicate.com/docs
- **Model Page:** https://replicate.com/google/nano-banana
- **API Reference:** https://replicate.com/docs/reference/http
- **Pricing:** https://replicate.com/pricing

## Success Checklist

- [ ] Replicate API token configured
- [ ] Database migration completed
- [ ] Worker starts with server
- [ ] Can create optimization jobs
- [ ] Jobs process successfully
- [ ] Can view ongoing jobs
- [ ] Can view completed jobs
- [ ] Before/After comparison works
- [ ] Credits are deducted correctly
- [ ] Error handling works properly

---

**Ready to optimize!** 🎨✨
