# Quick Reference Card

## Essential Commands

### Development
```bash
npm install              # Install dependencies
npm run dev             # Start dev servers (backend + frontend)
npm run dev:backend     # Start backend only
npm run dev:frontend    # Start frontend only
```

### Build & Deploy
```bash
npm run build           # Build for production
npm start              # Start production server
npm run migrate         # Run database migrations
git push origin main   # Auto-deploy to Render
```

### Database
```bash
cd backend
npm run migrate         # Apply migrations
npm run migrate:down    # Rollback last migration
npm run db:test         # Test connection & verify setup
```

### Verification
```bash
# Bash (macOS/Linux)
./scripts/verify-deployment.sh https://your-app.onrender.com

# PowerShell (Windows)
.\scripts\verify-deployment.ps1 https://your-app.onrender.com
```

## Important URLs

### Local Development
- Backend API: http://localhost:3000
- Frontend Dev: http://localhost:5173
- Dashboard: http://localhost:3000/dashboard
- Health Check: http://localhost:3000/health

### Production (Render)
- Dashboard: https://your-app.onrender.com/dashboard
- Health Check: https://your-app.onrender.com/health
- API Base: https://your-app.onrender.com/api

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/api/me` | Instance info & credits |
| GET | `/api/products` | List products |
| GET | `/api/collections` | List collections |
| GET | `/api/jobs` | List jobs |
| GET | `/api/jobs/:id` | Job details |
| GET | `/api/jobs/:id/items` | Job items |
| POST | `/api/jobs` | Create job |
| POST | `/api/publish` | Publish items |

## Environment Variables

### Phase 1 (Initial Deployment)
```bash
NODE_ENV=production
PORT=3000
WIX_APP_ID=PLACEHOLDER_APP_ID
WIX_APP_SECRET=PLACEHOLDER_APP_SECRET
```

### Phase 2 (Database - Current)
```bash
DATABASE_URL=postgresql://...  # Auto-set by Render
WIX_REDIRECT_URI=https://your-app.onrender.com/oauth/callback
```

### Phase 4 (AI)
```bash
OPENAI_API_KEY=sk-...
```

## Project Structure

```
ultimate-optimizer-app/
├── backend/
│   ├── src/
│   │   └── server.ts          # Express server
│   ├── dist/                  # Built JS (gitignored)
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.tsx           # Root component
│   │   ├── pages/            # Page components
│   │   ├── components/       # Reusable components
│   │   └── utils/            # API client
│   ├── dist/                 # Built static files (gitignored)
│   └── package.json
├── scripts/
│   ├── verify-deployment.sh  # Bash verification
│   └── verify-deployment.ps1 # PowerShell verification
└── package.json              # Root workspace
```

## Deployment Checklist

- [ ] Code pushed to GitHub
- [ ] Render Web Service created
- [ ] Environment variables set
- [ ] Build succeeded
- [ ] Health check passes
- [ ] Dashboard loads
- [ ] All pages render
- [ ] API returns data

## Troubleshooting

### Build Fails
```bash
# Check locally first
npm run build

# Check for TypeScript errors
npm run build -w backend
npm run build -w frontend
```

### Server Won't Start
```bash
# Verify build output exists
ls backend/dist/server.js
ls frontend/dist/index.html

# Check environment variables
echo $NODE_ENV
```

### Dashboard 404
- Verify frontend build succeeded
- Check static file serving in server.ts
- Ensure dist/ folder exists

## Documentation

### Deployment Guides
| Document | Purpose |
|----------|---------|
| [DEPLOY_NOW.md](./DEPLOY_NOW.md) | Step-by-step deployment |
| [RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md) | Detailed Render guide |
| [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) | Progress tracker |
| [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md) | Config reference |

### Database Guides
| Document | Purpose |
|----------|---------|
| [PHASE_2_DATABASE_SETUP.md](./PHASE_2_DATABASE_SETUP.md) | Quick start (15 min) |
| [RENDER_POSTGRESQL_SETUP.md](./RENDER_POSTGRESQL_SETUP.md) | Comprehensive guide |
| [RENDER_POSTGRESQL_CHECKLIST.md](./RENDER_POSTGRESQL_CHECKLIST.md) | Interactive checklist |
| [backend/DATABASE_SETUP.md](./backend/DATABASE_SETUP.md) | Schema documentation |

### Phase Summaries
| Document | Purpose |
|----------|---------|
| [PHASE_1_COMPLETE.md](./PHASE_1_COMPLETE.md) | Phase 1 summary |
| [TASK_6_SUMMARY.md](./TASK_6_SUMMARY.md) | Task 6 summary |

## Support

- **Render**: https://render.com/docs
- **Wix Developers**: https://dev.wix.com
- **OpenAI**: https://platform.openai.com
- **Project Issues**: [GitHub Issues]

## Phase Status

- ✅ Phase 1: Frontend & Deployment (Tasks 1-4)
- 🔄 Phase 2: Database & Authentication (Tasks 5-8)
  - ✅ Task 5: Database schema and migrations
  - ✅ Task 6: Configure Render PostgreSQL
  - ⏭️ Task 7: Wix instance authentication
  - ⏭️ Task 8: Register Wix app
- ⏭️ Phase 3: Wix Stores Integration (Tasks 9-11)
- ⏭️ Phase 4: Job Processing & AI (Tasks 12-15)
- ⏭️ Phase 5: Publishing & Billing (Tasks 16-17)
- ⏭️ Phase 6: Security & Production (Tasks 18-21)

---

**Quick Tip**: Bookmark this page for easy reference!
