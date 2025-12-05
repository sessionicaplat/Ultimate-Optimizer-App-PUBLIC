# Image Optimization - Quick Start

## 🚀 5-Minute Setup

### 1. Get Replicate API Token
Visit: https://replicate.com/account/api-tokens

### 2. Add to Environment
```bash
# Backend .env file
REPLICATE_API_TOKEN=r8_your_replicate_token_here
```

### 3. Run Migration
```bash
cd backend
npm run migrate
```

### 4. Restart Server
```bash
npm run dev
```

## ✅ Verify It's Working

Look for this in server logs:
```
[ImageOptWorker] Starting image optimization worker...
[ImageOptWorker] Worker started (checking every 30 seconds)
```

## 🎨 Test It Out

1. Go to `/image-optimization`
2. Select a product
3. Pick 1-2 images
4. Add prompt: "Make background white"
5. Click "Optimize Images"
6. Watch progress on `/ongoing-image-optimization`
7. View results on `/completed-image-optimization`

## 📊 Key Info

- **Cost:** 15 credits per image
- **Limit:** 10 images per job
- **Time:** ~30-60 seconds per image
- **Model:** google/nano-banana

## 🔗 Quick Links

- **Setup Guide:** `SETUP_IMAGE_OPTIMIZATION.md`
- **Full Docs:** `IMAGE_OPTIMIZATION_WITH_REPLICATE.md`
- **Summary:** `IMAGE_OPTIMIZATION_SUMMARY.md`

## 🆘 Troubleshooting

**Jobs not processing?**
- Check REPLICATE_API_TOKEN is set
- Verify worker started (check logs)
- Ensure database migration ran

**Images failing?**
- Verify image URLs are accessible
- Check Replicate API status
- Review error messages in completed page

## 💡 Example Prompts

- "Make the background pure white"
- "Enhance colors and brightness"
- "Remove shadows, add professional lighting"
- "Make product stand out with better contrast"

---

**That's it!** You're ready to optimize images with AI. 🎉
