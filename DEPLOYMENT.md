# 🚀 Walkumentary Free Deployment Guide

**Complete step-by-step guide to deploy Walkumentary on free tiers of Render + Vercel**

## 📋 Prerequisites

Before starting, ensure you have:
- ✅ GitHub account with your `walkumentary` repository
- ✅ Local `.env.local` file with working credentials (this contains your real secrets)
- ✅ Your repository merged to `main` branch with deployment configurations

## 🎯 Deployment Strategy

We'll deploy in this order:
1. **Backend** → Render (free tier)
2. **Redis** → Render (free tier) 
3. **Frontend** → Vercel (free tier)
4. **Connect & Test** → Link services together

---

## 🖥️ PART 1: Backend Deployment (Render)

### Step 1: Create Render Account
1. Go to **[render.com](https://render.com)**
2. Click **"Get Started for Free"**
3. Sign up with **GitHub** (recommended for easier repository access)
4. Complete account verification

### Step 2: Connect GitHub Repository
1. In Render dashboard, click **"New"** → **"Web Service"**
2. Click **"Connect GitHub"** if not already connected
3. Find and select your **`walkumentary`** repository
4. If you don't see it, click **"Configure GitHub App"** and grant access

### Step 3: Configure Web Service
Fill out the deployment form:

```
Name: walkumentary-backend
Environment: Python
Region: Oregon (US-West) [or closest to your users]
Branch: main
Root Directory: [leave blank - uses repository root]

Build Command: pip install -r requirements.txt
Start Command: uvicorn app.main:app --host 0.0.0.0 --port $PORT

Instance Type: Free
```

**⚠️ Important**: Don't click "Create Web Service" yet! We need to add environment variables first.

### Step 4: Add Environment Variables
Scroll down to **"Environment Variables"** section. Add these one by one:

#### Copy from your local `.env.local` file:
```bash
# Database (copy exact values from your .env.local)
SUPABASE_URL=https://kumruxjaiwdjiwvmtjyh.supabase.co/
SUPABASE_SERVICE_KEY=[your actual service key from .env.local]
SUPABASE_ANON_KEY=[your actual anon key from .env.local]  
DATABASE_URL=[your actual database URL from .env.local]

# AI Services (copy exact values from your .env.local)
OPENAI_API_KEY=[your actual OpenAI key from .env.local]
ANTHROPIC_API_KEY=[your actual Anthropic key from .env.local]

# Application Settings (use these exact values)
ENVIRONMENT=production
DEBUG=false
SECRET_KEY=walkumentary-production-secret-key-very-long-and-secure-32-chars-minimum
HOST=0.0.0.0
PORT=8000
RELOAD=false
RATE_LIMIT_PER_MINUTE=100
RATE_LIMIT_BURST=200

# External Services
NOMINATIM_BASE_URL=https://nominatim.openstreetmap.org
NOMINATIM_USER_AGENT=Walkumentary/1.0

# CORS (we'll update this after frontend deployment)
ALLOWED_ORIGINS=["http://localhost:3000"]
```

### Step 5: Deploy Backend
1. Click **"Create Web Service"**
2. Wait for deployment (5-10 minutes)
3. ✅ **Success**: You'll see "Your service is live" 
4. 📝 **Copy your backend URL**: e.g., `https://walkumentary-backend-xyz.onrender.com`

### Step 6: Test Backend
Click on your backend URL and add `/health`:
- Visit: `https://your-backend-url.onrender.com/health`
- ✅ Should return: `{"status": "healthy"}`
- Visit: `https://your-backend-url.onrender.com/docs`
- ✅ Should show FastAPI documentation

---

## 🗄️ PART 2: Redis Cache (Render)

### Step 1: Create Redis Service
1. In Render dashboard, click **"New"** → **"Redis"**
2. Configure:
```
Name: walkumentary-redis
Region: [Same as your backend - Oregon US-West]
Plan: Free (25MB)
```
3. Click **"Create Redis"**

### Step 2: Get Redis Connection String
1. Wait for Redis to deploy (2-3 minutes)
2. Go to your Redis service dashboard
3. Copy the **"Internal Redis URL"** (starts with `redis://`)
4. Example: `redis://red-xyz:6379`

### Step 3: Update Backend Environment Variables
1. Go back to your **backend web service**
2. Click **"Environment"** tab
3. Add/update:
```
REDIS_URL=[paste your Redis internal URL]
REDIS_MAX_CONNECTIONS=10
```
4. Your backend will auto-redeploy (takes 2-3 minutes)

---

## 🎨 PART 3: Frontend Deployment (Vercel)

### Step 1: Create Vercel Account
1. Go to **[vercel.com](https://vercel.com)**
2. Click **"Sign Up"**
3. Choose **"Continue with GitHub"**
4. Complete account setup

### Step 2: Import Project
1. Click **"Add New..."** → **"Project"**
2. Find your **`walkumentary`** repository
3. Click **"Import"**

### Step 3: Configure Project Settings
```
Framework Preset: Next.js
Root Directory: frontend
Build Command: npm run build
Output Directory: [leave blank - auto-detected as .next]
Install Command: npm ci
```

### Step 4: Add Environment Variables
Click **"Environment Variables"** and add:

```bash
# Supabase (copy exact values from your .env.local)
NEXT_PUBLIC_SUPABASE_URL=https://kumruxjaiwdjiwvmtjyh.supabase.co/
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your actual anon key from .env.local]

# API Backend (use your Render backend URL from Part 1)
NEXT_PUBLIC_API_BASE_URL=https://walkumentary-backend-xyz.onrender.com

# Features
NEXT_PUBLIC_PLAYER_V2=true
NEXT_PUBLIC_UI_V2=true
```

### Step 5: Deploy Frontend
1. Click **"Deploy"**
2. Wait for build (3-5 minutes)
3. ✅ **Success**: You'll see "Congratulations!"
4. 📝 **Copy your frontend URL**: e.g., `https://walkumentary-xyz.vercel.app`

---

## 🔗 PART 4: Connect Services

### Step 1: Update Backend CORS
1. Go to your **Render backend service**
2. Click **"Environment"** tab
3. Update `ALLOWED_ORIGINS`:
```
ALLOWED_ORIGINS=["https://walkumentary-xyz.vercel.app"]
```
4. Replace `walkumentary-xyz.vercel.app` with your actual Vercel URL
5. Save - backend will redeploy automatically

### Step 2: Test Full Application
1. Visit your Vercel frontend URL
2. ✅ **Test authentication**: Try Google sign-in
3. ✅ **Test location search**: Search for "Central Park"
4. ✅ **Test tour generation**: Generate a short tour
5. ✅ **Test audio playback**: Play generated audio

---

## 🛠️ Troubleshooting Guide

### ❌ Backend Won't Start

**Symptoms**: 
- Build fails or service shows "Deploy failed"
- Backend URL returns 503/502 errors

**Solutions**:
1. **Check Build Logs**:
   - Go to Render service → "Logs" tab
   - Look for Python dependency errors
   - Common fix: Ensure `requirements.txt` is in repository root

2. **Verify Environment Variables**:
   - Go to "Environment" tab
   - Ensure all required variables are set
   - Test individual values (copy from working `.env.local`)

3. **Check Start Command**:
   - Should be: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - Verify in service settings

### ❌ Frontend Build Fails

**Symptoms**:
- Vercel deployment fails during build
- "Module not found" errors

**Solutions**:
1. **Check Build Logs**:
   - Go to Vercel project → "Functions" tab → "View Function Logs"
   - Look for missing dependencies or TypeScript errors

2. **Verify Root Directory**:
   - Should be set to `frontend`
   - Check in project settings

3. **Environment Variables**:
   - Ensure all `NEXT_PUBLIC_*` variables are set
   - No trailing slashes in URLs

### ❌ Frontend Can't Connect to Backend

**Symptoms**:
- Frontend loads but API calls fail
- Network errors in browser console
- Authentication doesn't work

**Solutions**:
1. **Check CORS Settings**:
   ```bash
   # In Render backend environment
   ALLOWED_ORIGINS=["https://your-exact-vercel-url.vercel.app"]
   ```

2. **Verify API URL**:
   ```bash
   # In Vercel frontend environment
   NEXT_PUBLIC_API_BASE_URL=https://your-exact-render-url.onrender.com
   ```

3. **Test Backend Directly**:
   - Visit: `https://your-backend-url.onrender.com/health`
   - Should return: `{"status": "healthy"}`

### ❌ Database Connection Issues

**Symptoms**:
- Backend logs show "connection refused"
- Database-related API calls fail

**Solutions**:
1. **Verify Supabase Credentials**:
   - Copy exact values from working `.env.local`
   - Test connection locally first

2. **Check Network Access**:
   - Supabase should allow connections from anywhere by default
   - Verify in Supabase dashboard → Settings → Database

### ❌ Redis Connection Issues

**Symptoms**:
- Backend logs show Redis connection errors
- Caching not working

**Solutions**:
1. **Use Internal Redis URL**:
   - Should start with `redis://red-`
   - Not the external URL from Redis dashboard

2. **Verify Redis Service**:
   - Ensure Redis service is running
   - Check Render Redis dashboard

---

## 💰 Free Tier Limits

### Render (Backend + Redis)
- **Web Service**: 750 hours/month (enough for 24/7 with sleep)
- **Redis**: 25MB memory, 20 connections
- **Sleep**: Service sleeps after 15 minutes of inactivity
- **Bandwidth**: 100GB/month

### Vercel (Frontend)
- **Bandwidth**: 100GB/month
- **Build Minutes**: 6,000 minutes/month
- **Functions**: 100GB-hrs serverless function execution
- **Projects**: Unlimited

### Supabase (Database)
- **Database**: 500MB storage
- **Bandwidth**: 2GB/month
- **API Requests**: 50,000/month
- **Authentication**: Unlimited users

---

## 🎯 Optimization Tips

### 1. Reduce Backend Sleep Time
```python
# Add to your FastAPI app (already implemented)
@app.get("/health")
async def health_check():
    return {"status": "healthy"}
```
Set up a free uptime monitor (like UptimeRobot) to ping `/health` every 5 minutes.

### 2. Optimize Frontend Performance
- Images are already optimized with Next.js
- Static pages are pre-rendered
- Bundle size is optimized with tree-shaking

### 3. Monitor Usage
- **Render**: Check dashboard for CPU/memory usage
- **Vercel**: Monitor bandwidth in project analytics
- **Supabase**: Check database usage in dashboard

---

## 🚀 Success Checklist

After deployment, verify all these work:

- [ ] **Frontend loads**: Visit your Vercel URL
- [ ] **Backend health**: Visit `your-backend-url/health`
- [ ] **API docs**: Visit `your-backend-url/docs`
- [ ] **Google auth**: Sign in/out works
- [ ] **Location search**: Search finds locations
- [ ] **Tour generation**: Can create tours
- [ ] **Audio playback**: Tours play audio
- [ ] **Mobile responsive**: Works on phone

---

## 📞 Support & Next Steps

### If You Need Help
1. **Check logs first**: Render and Vercel both have detailed logs
2. **Test locally**: Ensure everything works locally before debugging remote
3. **Environment variables**: 90% of issues are incorrect environment variables

### Upgrade Paths
1. **Render Pro ($7/month)**: Always-on backend, no sleep
2. **Vercel Pro ($20/month)**: More bandwidth, custom domains
3. **Supabase Pro ($25/month)**: More database storage and bandwidth

### Next Features to Add
1. **Custom domain**: Point your domain to Vercel
2. **Error monitoring**: Add Sentry for error tracking
3. **Analytics**: Add Google Analytics or Vercel Analytics
4. **Caching**: Optimize API response caching

---

## 🔧 Common Deployment Issues & Fixes

### ❌ Database Configuration Issues

**Issue**: Backend fails to start with Supabase connection errors, especially when using pgbouncer.

**Symptoms**:
- Build succeeds but service won't start
- Logs show database connection errors
- "prepared statement" or "pgbouncer" related errors

**Root Cause**: Supabase uses pgbouncer connection pooling which has conflicts with SQLAlchemy's prepared statements and connection pooling.

**Solution Applied**: Updated `app/database.py` with Supabase-specific configuration:

```python
# Supabase with pgbouncer - disable all prepared statements
elif "supabase.co" in settings.DATABASE_URL or "pooler" in settings.DATABASE_URL:
    connect_args = {
        "statement_cache_size": 0,
        "prepared_statement_cache_size": 0,
    }
    poolclass = None
    extra_kwargs = {
        "connect_args": connect_args,
        "execution_options": {
            "isolation_level": "AUTOCOMMIT"
        }
    }
```

### ❌ Environment Variable Security Issues

**Issue**: Required environment variables caused deployment failures.

**Symptoms**:
- Pydantic validation errors during startup
- "Field required" errors for API keys

**Root Cause**: Configuration fields marked as required (`Field(...)`) but not all services need all API keys.

**Solution Applied**: Made optional services truly optional in `app/config.py`:

```python
# Before (caused failures)
OPENAI_API_KEY: str = Field(..., description="OpenAI API key")
ANTHROPIC_API_KEY: str = Field(..., description="Anthropic API key")

# After (allows deployment without all services)
OPENAI_API_KEY: Optional[str] = Field(default=None, description="OpenAI API key")
ANTHROPIC_API_KEY: Optional[str] = Field(default=None, description="Anthropic API key")
```

### ❌ Environment File Security

**Issue**: `.env.local` contains real credentials that shouldn't be committed.

**Solution**: 
1. Ensured `.env.local` is in `.gitignore`
2. Updated `.env.example` with safe placeholder values
3. Created production environment template

**Security Best Practices Applied**:
- ✅ No real credentials in repository
- ✅ Environment files properly ignored
- ✅ Optional services don't block deployment
- ✅ Production-ready defaults

### 🔍 Pre-Deployment Checklist

Before deploying, verify these configurations:

1. **Database Configuration**:
   ```bash
   # Check if using Supabase
   grep -i "supabase\|pooler" .env.local
   # Should see special pgbouncer handling in app/database.py
   ```

2. **Environment Variables**:
   ```bash
   # Required variables (must have values)
   DATABASE_URL=postgresql://...
   SECRET_KEY=your-32-char-minimum-secret
   
   # Optional variables (can be None/empty)
   OPENAI_API_KEY=sk-... (optional)
   ANTHROPIC_API_KEY=sk-ant-... (optional)
   REDIS_URL=redis://... (optional, falls back to memory)
   ```

3. **Security Check**:
   ```bash
   # Ensure no secrets in git
   git status
   git diff --cached
   # Should NOT show .env.local changes
   ```

### 📝 Deployment Verification Steps

After deployment, check these endpoints:

1. **Health Check**: `https://your-backend.onrender.com/health`
2. **API Docs**: `https://your-backend.onrender.com/docs`
3. **Database**: Try any API endpoint that reads from database
4. **Cache**: Check logs for "Redis cache initialised" or "Using in-memory cache"

---

## 🗂️ File Structure for Deployment

Key files needed for successful deployment:

```
walkumentary/
├── app/
│   ├── config.py          # ✅ Fixed: Optional API keys
│   ├── database.py        # ✅ Fixed: Supabase pgbouncer config
│   └── main.py           # FastAPI app
├── frontend/
│   ├── package.json      # Next.js dependencies
│   └── vercel.json       # Vercel configuration
├── requirements.txt      # Python dependencies
├── .env.example         # Safe template
├── .env.local           # ❌ Local only - not committed
├── .gitignore           # ✅ Excludes .env.local
└── DEPLOYMENT.md        # This guide
```

### ❌ CRITICAL: Supabase Transaction Pooler pgbouncer Issues (2024)

**Issue**: The most common deployment failure with Supabase transaction pooler causing `DuplicatePreparedStatementError` and `TypeError` with NullPool configuration.

**Symptoms**:
```
asyncpg.exceptions.DuplicatePreparedStatementError: prepared statement "__asyncpg_stmt_1__" already exists
HINT: pgbouncer with pool_mode set to "transaction" or "statement" does not support prepared statements properly.
```

OR

```
TypeError: Invalid argument(s) 'pool_size','max_overflow','pool_timeout' sent to create_engine(), 
using configuration PGDialect_asyncpg/NullPool/Engine
```

**Root Cause**: 
1. **Prepared Statement Conflicts**: Supabase's transaction pooler (pgbouncer) cannot handle SQLAlchemy's prepared statement caching
2. **Pool Parameter Incompatibility**: NullPool (required for external poolers) doesn't accept pool size parameters

**DEFINITIVE 2024 Solution Applied**:

Updated `app/database.py` with UUID-based prepared statement naming and conditional pool parameters:

```python
from uuid import uuid4
from sqlalchemy.pool import NullPool

def generate_unique_statement_name():
    """Generate unique prepared statement names to avoid pgbouncer conflicts"""
    return f"__asyncpg_stmt_{uuid4().hex[:8]}__"

# Detect PostgreSQL and Supabase
is_postgresql = "postgresql" in settings.DATABASE_URL.lower()
is_supabase = any(indicator in settings.DATABASE_URL.lower() for indicator in [
    "supabase.co", "pooler", "kumruxjaiwdjiwvmtjyh"
])

if is_postgresql:
    connect_args = {
        # CRITICAL: UUID-based prepared statement naming prevents conflicts
        "prepared_statement_name_func": generate_unique_statement_name,
        # Disable caching as backup
        "statement_cache_size": 0,
        "prepared_statement_cache_size": 0,
        # Connection settings
        "command_timeout": 30,
        "server_settings": {
            "application_name": "walkumentary_app",
        }
    }
    
    # Use NullPool for Supabase (recommended for external poolers)
    poolclass = NullPool if is_supabase else None
    
    extra_kwargs = {
        "connect_args": connect_args,
        "execution_options": {
            "compiled_cache": {},  # Disable compiled cache
        }
    }
    
    # CRITICAL: Only add pool settings if NOT using NullPool
    if not is_supabase:
        extra_kwargs.update({
            "pool_pre_ping": True,
            "pool_recycle": 300,
            "pool_timeout": 30,
        })

# Create engine with conditional parameters
engine_kwargs = {
    "echo": False,
    "poolclass": poolclass,
    **extra_kwargs,
}

# Only add pool size parameters if NOT using NullPool
if not is_supabase:
    engine_kwargs.update({
        "pool_size": settings.DATABASE_POOL_SIZE,
        "max_overflow": settings.DATABASE_MAX_OVERFLOW,
    })

engine = create_async_engine(
    settings.database_url_async,
    **engine_kwargs,
)
```

**Why This Works**:
1. **UUID Statement Names**: Every prepared statement gets a unique name like `__asyncpg_stmt_a1b2c3d4__` preventing pgbouncer conflicts
2. **NullPool for Supabase**: No internal connection pooling, lets Supabase handle it
3. **Conditional Parameters**: Pool parameters only applied when appropriate
4. **Universal Detection**: Works with any PostgreSQL setup, not just Supabase

**Success Logs to Look For**:
```
🔍 Database URL analysis: postgresql://postgres:...
🚀 Supabase pgbouncer configuration with UUID statement naming applied
🎯 Database engine created successfully with pgbouncer-compatible configuration
INFO:     Application startup complete.
```

**This is the DEFINITIVE 2024 solution** based on official SQLAlchemy and asyncpg documentation for pgbouncer compatibility.

---

**🎉 Congratulations! Your Walkumentary app is now live on the internet!**

Share your Vercel URL and start creating amazing audio tours! 🗺️🎧