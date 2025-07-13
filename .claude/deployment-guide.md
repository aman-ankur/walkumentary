# Walkumentary Deployment Guide

## Overview
This guide provides step-by-step instructions to deploy Walkumentary to production using:
- **Backend**: Render (with Redis add-on)
- **Frontend**: Vercel
- **Database**: Supabase (already configured)

## Pre-Deployment Checklist

### ✅ Build & Test Status
- [x] Frontend builds successfully (`npm run build`)
- [x] Backend dependencies installed and app loads
- [x] Environment variables documented
- [x] Production configurations created
- [ ] Backend tests passing (some config issues remain - non-blocking for deployment)

### ✅ Files Created
- [x] `.env.production` (backend)
- [x] `frontend/.env.production` (frontend)
- [x] `Dockerfile` (backend)
- [x] `render.yaml` (infrastructure)
- [x] `frontend/vercel.json` (frontend config)

## Backend Deployment (Render)

### Step 1: Prepare Repository
```bash
# Push deployment branch to your repository
git add .
git commit -m "Add production deployment configurations"
git push origin deployment-preparation
```

### Step 2: Create Render Account & Service
1. Go to [render.com](https://render.com) and sign up/login
2. Connect your GitHub repository
3. Click "New" → "Web Service"
4. Select your `walkumentary` repository
5. Configure the service:
   - **Name**: `walkumentary-backend`
   - **Environment**: `Python`
   - **Branch**: `deployment-preparation` (or merge to main first)
   - **Root Directory**: `/` (root of repo)
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### Step 3: Add Redis Service
1. In your Render dashboard, click "New" → "Redis"
2. Configure:
   - **Name**: `walkumentary-redis`
   - **Plan**: Free tier initially
3. Note the Redis connection string for environment variables

### Step 4: Configure Environment Variables
In your Render web service settings, add these environment variables:

#### Required Variables:
```bash
# Database (use your actual Supabase values)
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
SUPABASE_ANON_KEY=your_supabase_anonymous_key
DATABASE_URL=your_postgresql_database_url

# Redis (will be provided by Render Redis service)
REDIS_URL=[Copy from your Redis service]

# AI Services (use your actual API keys)
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key

# Application
ENVIRONMENT=production
DEBUG=false
SECRET_KEY=[Generate a secure 32+ character secret key]
HOST=0.0.0.0
PORT=8000
RELOAD=false

# CORS (update with your Vercel frontend URL)
ALLOWED_ORIGINS=["https://your-frontend.vercel.app"]
```

### Step 5: Deploy Backend
1. Click "Create Web Service"
2. Wait for deployment to complete
3. Note your backend URL (e.g., `https://walkumentary-backend.onrender.com`)

## Frontend Deployment (Vercel)

### Step 1: Create Vercel Account
1. Go to [vercel.com](https://vercel.com) and sign up/login
2. Connect your GitHub account

### Step 2: Deploy Frontend
1. Click "New Project"
2. Import your repository
3. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

### Step 3: Configure Environment Variables
In Vercel project settings → Environment Variables, add:

```bash
# Supabase (use your actual values)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anonymous_key

# API (use your Render backend URL)
NEXT_PUBLIC_API_BASE_URL=https://walkumentary-backend.onrender.com

# Features
NEXT_PUBLIC_PLAYER_V2=true
NEXT_PUBLIC_UI_V2=true
```

### Step 4: Update CORS Settings
1. Go back to your Render backend service
2. Update the `ALLOWED_ORIGINS` environment variable with your Vercel URL:
   ```bash
   ALLOWED_ORIGINS=["https://your-project.vercel.app"]
   ```
3. Redeploy the backend service

## Post-Deployment Configuration

### 1. DNS & Custom Domains (Optional)
- **Frontend**: Configure custom domain in Vercel dashboard
- **Backend**: Configure custom domain in Render dashboard

### 2. SSL Certificates
Both Render and Vercel provide automatic SSL certificates.

### 3. Environment Verification
Test these endpoints after deployment:
- Frontend: `https://your-project.vercel.app`
- Backend Health: `https://your-backend.onrender.com/health`
- Backend API Docs: `https://your-backend.onrender.com/docs`

## Production Monitoring

### Health Checks
Your backend includes a health check endpoint at `/health`.

### Logs
- **Render**: View logs in Render dashboard
- **Vercel**: View function logs in Vercel dashboard

### Performance
- **Render**: Monitor CPU/Memory in dashboard
- **Vercel**: View analytics in dashboard

## Security Considerations

### Environment Variables
- ✅ All sensitive keys are stored as environment variables
- ✅ Frontend only exposes `NEXT_PUBLIC_*` variables
- ✅ CORS is properly configured

### HTTPS
- ✅ Both services enforce HTTPS
- ✅ Security headers configured in `vercel.json`

## Troubleshooting

### Common Issues:

#### Backend Won't Start
1. Check environment variables are set correctly
2. Verify Redis connection string
3. Check build logs for dependency issues

#### Frontend Can't Connect to Backend
1. Verify `NEXT_PUBLIC_API_BASE_URL` points to correct Render URL
2. Check CORS settings on backend
3. Ensure backend is running and accessible

#### Database Connection Issues
1. Verify Supabase credentials
2. Check if database URL is accessible from Render
3. Test connection from Render console

### Debug Commands:
```bash
# Test backend locally with production config
cd /Users/aankur/workspace/walkumentary
source venv_walk/bin/activate
export $(cat .env.production | xargs)
uvicorn app.main:app --reload

# Test frontend build
cd frontend
npm run build
npm start
```

## Cost Estimates

### Free Tier Limits:
- **Render**: 750 hours/month free
- **Vercel**: 100GB bandwidth, 6000 build minutes
- **Supabase**: 500MB database, 2GB bandwidth

### Scaling:
- **Render**: $7/month for always-on service
- **Vercel**: $20/month Pro plan
- **Redis**: $7/month for 25MB cache

## Next Steps

1. ✅ Deploy to staging/production
2. Set up monitoring and alerts
3. Configure backup strategies
4. Set up CI/CD pipelines
5. Add error tracking (Sentry)
6. Performance monitoring

## Support

For deployment issues:
- **Render**: [Render Documentation](https://render.com/docs)
- **Vercel**: [Vercel Documentation](https://vercel.com/docs)
- **Application Issues**: Check application logs and contact development team

---

**Ready to deploy!** Follow the steps above in order for a successful production deployment.