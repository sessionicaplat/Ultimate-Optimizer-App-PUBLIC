# Ultimate Optimizer App

AI-powered product optimization tool for Wix Stores.

📚 **[Quick Reference](./QUICK_REFERENCE.md)** | 🚀 **[Deploy Now](./DEPLOY_NOW.md)** | ✅ **[Phase 1 Complete](./PHASE_1_COMPLETE.md)**

## Project Structure

```
ultimate-optimizer-app/
├── backend/          # Express API server
│   ├── src/         # TypeScript source files
│   └── dist/        # Compiled JavaScript
├── frontend/        # React dashboard
│   ├── src/         # React components
│   └── dist/        # Built static files
└── package.json     # Root workspace configuration
```

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
cd backend
cp .env.example .env
# Edit .env with your credentials
```

3. Run development servers:
```bash
npm run dev
```

This will start:
- Backend API on http://localhost:3000
- Frontend dashboard on http://localhost:5173

## Build for Production

```bash
npm run build
```

## Database Migrations

```bash
npm run migrate
```

## Environment Variables

See `backend/.env.example` for required configuration.

## Deployment

### Quick Deploy to Render

**Ready to deploy now?** Follow [DEPLOY_NOW.md](./DEPLOY_NOW.md) for step-by-step instructions.

### Deployment Resources

- **[DEPLOY_NOW.md](./DEPLOY_NOW.md)** - Quick start guide with all steps
- **[RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md)** - Detailed deployment documentation
- **[DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)** - Track your progress
- **[ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md)** - Environment configuration guide
- **[RENDER_BUILD_FIX.md](./RENDER_BUILD_FIX.md)** - Fix for npm ci build errors

### Verification Scripts

After deployment, verify everything works:

```bash
# macOS/Linux
./scripts/verify-deployment.sh https://your-app.onrender.com

# Windows PowerShell
.\scripts\verify-deployment.ps1 https://your-app.onrender.com
```

### Render Configuration

The project includes a `render.yaml` file for Infrastructure as Code deployment. You can either:
- Use the Render Dashboard (recommended for first deployment)
- Use the `render.yaml` file for automated setup
