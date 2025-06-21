# Walkumentary - Phase 1A Setup Guide

## Authentication System Complete

Phase 1A has been successfully implemented with a complete authentication system using FastAPI, Supabase, and Next.js.

## Backend Setup

### 1. Virtual Environment
```bash
cd /Users/aankur/workspace/walkumentary
python3.9 -m venv walk_venv
source walk_venv/bin/activate  # On Windows: walk_venv\Scripts\activate
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Environment Configuration
Copy `.env.example` to `.env` and configure:

```env
# Database & Supabase
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
SUPABASE_ANON_KEY=your_supabase_anonymous_key
DATABASE_URL=postgresql://user:password@localhost:5432/walkumentary

# Redis (for caching)
REDIS_URL=redis://localhost:6379

# AI Services
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key

# Security
SECRET_KEY=your-super-secret-key-at-least-32-characters-long
DEBUG=true
ENVIRONMENT=development
ALLOWED_ORIGINS=["http://localhost:3000","https://localhost:3000"]
```

### 4. Run Backend
```bash
cd app
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000` with interactive docs at `http://localhost:8000/docs`.

## Frontend Setup

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Environment Configuration
Copy `frontend/.env.example` to `frontend/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anonymous_key
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

### 3. Run Frontend
```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`.

## Authentication Features Implemented

### Backend (FastAPI + Supabase)
- ✅ User models with preferences
- ✅ Supabase JWT token verification
- ✅ Protected API endpoints
- ✅ User profile management
- ✅ Preference updates
- ✅ Database models for users, locations, tours
- ✅ Health check endpoints

### Frontend (Next.js + React)
- ✅ Supabase authentication integration
- ✅ Google OAuth sign-in
- ✅ Authentication context and hooks
- ✅ Protected routes component
- ✅ User profile management UI
- ✅ Responsive design with Tailwind CSS
- ✅ PWA configuration

### API Endpoints Available
- `GET /health` - Health check
- `GET /auth/me` - Get current user
- `PATCH /auth/me` - Update user profile
- `PATCH /auth/me/preferences` - Update user preferences
- `DELETE /auth/me` - Deactivate account

### UI Components
- `AuthProvider` - Authentication context
- `AuthButton` - Sign in/out button
- `ProtectedRoute` - Route protection
- `UserProfile` - Profile management

## Testing the Authentication Flow

1. **Start both backend and frontend servers**
2. **Visit `http://localhost:3000`**
3. **Click "Sign in with Google"**
4. **Complete OAuth flow**
5. **Verify user profile appears**
6. **Test profile editing**
7. **Test sign out**

## Database Setup (Supabase)

The system expects these tables in your Supabase database:
- `users` - User profiles and preferences
- `locations` - Location data
- `tours` - Generated tours
- `cache_entries` - API response caching

Row Level Security (RLS) policies ensure users can only access their own data.

## What's Next

Phase 1A provides the authentication foundation. Next phases will add:

- **Phase 1B**: Location search with Nominatim API
- **Phase 1C**: GPS location detection  
- **Phase 1D**: AI tour generation with OpenAI/Anthropic

## Architecture Overview

```
Frontend (Next.js)     →     Backend (FastAPI)     →     Database (Supabase)
    ↓                             ↓                           ↓
- React components         - Authentication         - User profiles
- Tailwind CSS            - API endpoints           - RLS policies  
- PWA support             - Database models         - Real-time features
- Google OAuth            - Supabase integration    - File storage
```

The authentication system is now complete and ready for the next development phases!