# Walkumentary - System Architecture Design
*Modern, Cost-Optimized Tech Stack*

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT LAYER                           │
├─────────────────────────────────────────────────────────────┤
│  Next.js 14 PWA + React + TypeScript + Tailwind + shadcn  │
│  • Mobile-first responsive design                          │
│  • Service worker for caching                              │
│  • Geolocation & Camera APIs                              │
└─────────────────────────────────────────────────────────────┘
                                │
                               HTTPS
                                │
┌─────────────────────────────────────────────────────────────┐
│                     API GATEWAY                            │
├─────────────────────────────────────────────────────────────┤
│  FastAPI + Python 3.9+ (Deployed on Railway/Fly.io)      │
│  • JWT authentication via Supabase                         │
│  • Rate limiting & request validation                      │
│  • Response caching with Redis                             │
└─────────────────────────────────────────────────────────────┘
                                │
                     ┌──────────┼──────────┐
                     │          │          │
            ┌────────▼─┐    ┌───▼────┐   ┌─▼──────────┐
            │DATABASE  │    │STORAGE │   │  EXTERNAL  │
            │          │    │        │   │  SERVICES  │
            │Supabase  │    │Supabase│   │            │
            │PostgreSQL│    │Storage │   │• OpenAI    │
            │          │    │        │   │• Nominatim │
            │• Users   │    │• Images│   │• Leaflet   │
            │• Tours   │    │• Audio │   │• Audio     │
            │• Cache   │    │        │   │• Audio     │
            └──────────┘    └────────┘   └────────────┘
```

## 2. Technology Stack

### 2.1 Frontend Stack
**Framework:** Next.js 14 with App Router
- **Language:** TypeScript (full type safety)
- **Styling:** Tailwind CSS + shadcn/ui components
- **State Management:** React Context + useReducer (Zustand if needed)
- **PWA:** next-pwa for service worker and caching
- **Maps:** React-Leaflet with OpenStreetMap tiles
- **HTTP Client:** Fetch API with custom hooks
- **Build Tool:** Turbopack (Next.js 14 default)

**Key Frontend Libraries:**
```json
{
  "next": "^14.0.0",
  "react": "^18.0.0", 
  "typescript": "^5.0.0",
  "tailwindcss": "^3.4.0",
  "@radix-ui/react-*": "latest", // shadcn/ui base
  "lucide-react": "latest", // icons
  "react-leaflet": "^4.2.0", // maps
  "next-pwa": "^5.6.0", // PWA capabilities
  "react-hook-form": "^7.45.0", // forms
  "zod": "^3.22.0" // validation
}
```

### 2.2 Backend Stack
**Framework:** FastAPI with Python 3.9+
- **Authentication:** Supabase Auth integration
- **Validation:** Pydantic v2
- **Database ORM:** SQLAlchemy 2.0 + asyncpg
- **Caching:** Redis for API responses and sessions
- **File Handling:** Supabase Storage integration
- **HTTP Client:** httpx for external API calls
- **Background Tasks:** FastAPI BackgroundTasks

**Key Backend Libraries:**
```python
# requirements.txt
fastapi==0.104.0
uvicorn[standard]==0.24.0
sqlalchemy==2.0.23
asyncpg==0.29.0
supabase==2.0.0
redis==5.0.1
httpx==0.25.0
pillow==10.1.0
pydantic==2.5.0
python-multipart==0.0.6
```

### 2.3 Database & Storage
**Primary Database:** Supabase (Managed PostgreSQL)
- **Authentication:** Built-in Supabase Auth
- **Storage:** Supabase Storage for images and audio files
- **Real-time:** Supabase real-time subscriptions (if needed)
- **Edge Functions:** For lightweight serverless functions

**Caching Layer:** Redis (Upstash or Railway Redis)
- API response caching (1-24 hours TTL)
- User session management
- Rate limiting counters
- Temporary data storage

### 2.4 External Services

**AI & Content Generation:**
- **LLM:** OpenAI GPT-4o-mini (cost-optimized)
- **Text-to-Speech:** OpenAI TTS-1 (user has credits)
- **Image Recognition:** OpenAI GPT-4V (when available) or Google Vision API

**Mapping & Location:**
- **Geocoding:** Nominatim (free OpenStreetMap)
- **Maps:** OpenStreetMap via Leaflet (free)
- **Fallback:** Google Maps API (if needed, free tier available)

**Infrastructure:**
- **Frontend Hosting:** Vercel (free tier sufficient)
- **Backend Hosting:** Railway or Fly.io
- **CDN:** Vercel Edge Network
- **Monitoring:** Vercel Analytics + Sentry (free tiers)

## 3. Detailed Architecture Components

### 3.1 Frontend Architecture

```
src/
├── app/                    # Next.js 14 App Router
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.tsx           # Home page
│   ├── auth/
│   │   └── page.tsx       # Authentication
│   ├── search/
│   │   └── page.tsx       # Location search
│   ├── tour/
│   │   └── [id]/page.tsx  # Tour details
│   └── api/               # API routes (if needed)
├── components/            # Reusable UI components
│   ├── ui/               # shadcn/ui components
│   ├── forms/            # Form components
│   ├── maps/             # Map components
│   └── audio/            # Audio player components
├── lib/                  # Utilities and configurations
│   ├── supabase.ts       # Supabase client
│   ├── api.ts            # API client
│   ├── utils.ts          # Helper functions
│   └── types.ts          # TypeScript types
├── hooks/                # Custom React hooks
│   ├── useAuth.ts
│   ├── useLocation.ts
│   └── useAudio.ts
└── stores/               # State management
    └── auth-store.ts     # Authentication state
```

### 3.2 Backend Architecture

```
app/
├── main.py               # FastAPI application
├── config.py             # Configuration management
├── database.py           # Database connection
├── auth.py               # Authentication middleware
├── models/               # SQLAlchemy models
│   ├── user.py
│   ├── tour.py
│   └── location.py
├── schemas/              # Pydantic schemas
│   ├── user.py
│   ├── tour.py
│   └── location.py
├── routers/              # API route handlers
│   ├── auth.py
│   ├── locations.py
│   ├── tours.py
│   └── uploads.py
├── services/             # Business logic
│   ├── ai_service.py     # OpenAI integration
│   ├── location_service.py
│   ├── tour_service.py
│   └── cache_service.py
└── utils/                # Utility functions
    ├── image_processing.py
    ├── text_processing.py
    └── audio_generation.py
```

### 3.3 Database Schema

```sql
-- Users (managed by Supabase Auth)
-- We'll extend with a profiles table

CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    email TEXT,
    full_name TEXT,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Locations
CREATE TABLE locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    country TEXT,
    city TEXT,
    location_type TEXT, -- landmark, museum, etc.
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tours
CREATE TABLE tours (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id),
    location_id UUID REFERENCES locations(id),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    audio_url TEXT,
    duration_minutes INTEGER,
    interests TEXT[], -- array of interest categories
    language TEXT DEFAULT 'en',
    status TEXT DEFAULT 'active', -- active, archived
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Cache table for API responses
CREATE TABLE api_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cache_key TEXT UNIQUE NOT NULL,
    data JSONB NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_locations_coords ON locations(latitude, longitude);
CREATE INDEX idx_tours_user_id ON tours(user_id);
CREATE INDEX idx_tours_location_id ON tours(location_id);
CREATE INDEX idx_cache_key ON api_cache(cache_key);
CREATE INDEX idx_cache_expires ON api_cache(expires_at);
```

## 4. API Design

### 4.1 Core API Endpoints

```
Authentication:
POST   /auth/login          # Google OAuth redirect
POST   /auth/logout         # Clear session
GET    /auth/user           # Get current user

Location Services:
GET    /locations/search    # Text search with autocomplete
POST   /locations/detect    # GPS-based location detection
POST   /locations/recognize # Image recognition
GET    /locations/{id}      # Get location details

Tour Management:
POST   /tours/generate      # Generate new tour
GET    /tours/{id}          # Get tour details
GET    /tours/user          # Get user's tours
PUT    /tours/{id}          # Update tour preferences
DELETE /tours/{id}          # Delete tour

Audio Services:
POST   /audio/generate      # Generate TTS audio
GET    /audio/{id}          # Stream audio file

Utility:
GET    /health              # Health check
GET    /maps/tiles/{z}/{x}/{y} # Map tiles (if needed)
```

### 4.2 Response Formats

```typescript
// Standard API Response
interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  errors?: string[];
}

// Location Search Response
interface LocationSearchResponse {
  locations: {
    id: string;
    name: string;
    description: string;
    coordinates: [number, number]; // [lat, lng]
    type: string;
    confidence: number;
  }[];
  suggestions: string[];
}

// Tour Generation Response
interface TourResponse {
  id: string;
  title: string;
  content: string;
  audioUrl: string;
  duration: number;
  location: LocationInfo;
  interests: string[];
}
```

## 5. Performance & Optimization

### 5.1 Frontend Optimizations
- **Code Splitting:** Route-based and component-based
- **Image Optimization:** Next.js Image component with WebP
- **Caching:** Service Worker for API responses and static assets
- **Bundle Analysis:** Regular bundle size monitoring
- **Lazy Loading:** Components and maps load on demand

### 5.2 Backend Optimizations
- **Connection Pooling:** AsyncPG with connection pooling
- **Response Caching:** Redis-based caching with smart TTL
- **Request Batching:** Batch external API calls where possible
- **Background Tasks:** Async processing for non-critical operations
- **Database Optimization:** Proper indexing and query optimization

### 5.3 Cost Optimizations
- **LLM Prompt Engineering:** Minimize token usage with efficient prompts
- **Response Caching:** Cache AI-generated content for 24 hours
- **Image Compression:** Compress images before processing
- **Rate Limiting:** Prevent excessive API usage
- **Usage Monitoring:** Track and alert on API costs

## 6. Security & Privacy

### 6.1 Authentication & Authorization
- **OAuth 2.0:** Google authentication via Supabase
- **JWT Tokens:** Secure session management
- **RBAC:** Role-based access control (future enhancement)
- **API Keys:** Secure external service integration

### 6.2 Data Protection
- **HTTPS:** All communications encrypted
- **Input Validation:** Comprehensive input sanitization
- **SQL Injection:** Parameterized queries via SQLAlchemy
- **XSS Protection:** React's built-in XSS prevention
- **File Upload Security:** Validated file types and sizes

### 6.3 Privacy Considerations
- **Location Data:** Minimal storage, user consent required
- **Personal Data:** GDPR-compliant data handling
- **Analytics:** Privacy-focused analytics (no PII tracking)
- **Caching:** Sensitive data excluded from caches

## 7. Deployment & DevOps

### 7.1 Development Environment
```bash
# Frontend
npm run dev          # Next.js development server
npm run build        # Production build
npm run type-check   # TypeScript validation

# Backend  
uvicorn main:app --reload    # FastAPI development
pytest                       # Run tests
black . && isort .          # Code formatting
mypy .                      # Type checking
```

### 7.2 Production Deployment
**Frontend (Vercel):**
- Automatic deployments from Git
- Preview deployments for PRs
- Edge caching and CDN
- Environment variable management

**Backend (Railway/Fly.io):**
- Docker containerization
- Automatic scaling
- Health checks and monitoring
- Database connection pooling

### 7.3 CI/CD Pipeline
```yaml
# .github/workflows/deploy.yml
name: Deploy
on: [push]
jobs:
  frontend:
    - TypeScript compilation
    - ESLint validation
    - Build optimization
    - Vercel deployment
    
  backend:
    - Python type checking
    - Pytest execution
    - Docker build
    - Railway deployment
```

## 8. Monitoring & Maintenance

### 8.1 Application Monitoring
- **Performance:** Core Web Vitals tracking
- **Errors:** Sentry for error tracking and alerting
- **Usage:** Custom analytics for feature adoption
- **Costs:** API usage monitoring and alerts

### 8.2 Infrastructure Monitoring
- **Uptime:** Health check endpoints
- **Response Times:** API performance tracking
- **Database:** Connection pool and query performance
- **Cache:** Redis hit rates and memory usage

## 9. Scalability Considerations

### 9.1 Horizontal Scaling
- **Stateless Backend:** Easily scalable API servers
- **Database:** Supabase handles scaling automatically
- **CDN:** Vercel Edge Network for global performance
- **Microservices:** Future migration path if needed

### 9.2 Performance Scaling
- **Caching Strategy:** Multi-layer caching (browser, CDN, Redis)
- **Database Optimization:** Proper indexing and query optimization
- **API Rate Limiting:** Prevent abuse and ensure fair usage
- **Background Processing:** Async task queue for heavy operations

## 2025-06-24  Backend & UI Refactor – Audio Generation Pipeline

The following improvements were implemented to streamline audio-tour delivery, reduce latency, and simplify the streaming path:

### 1.  Tour Generation State Machine
| Phase | Status value | Milestone log | Client behaviour |
|-------|--------------|--------------|------------------|
| 1 | `generating` | _Tour generation started_ | Tracker shows 0-50 % |
| 2 | `content_ready` | **LLM content generated** (chars, provider, model) | Tracker jumps to 80 %; UI displays text but **does not** attempt playback |
| 3 | `ready` | **TTS generated** (ms, bytes) & _Tour generation completed_ | Tracker hits 100 %, player auto-loads MP3 |

### 2.  Absolute Audio URLs
`tour.audio_url` now contains a fully-qualified link:
```text
{settings.API_BASE_URL}/tours/<tour-id>/audio
```
Ensures the PWA fetches the file directly rather than proxying through Next.js.

### 3.  Public Streaming Endpoint
`GET /tours/{tour_id}/audio` (FastAPI)
* Reads Base-64 MP3 from Redis key `audio:tour:<id>`.
* Returns `200 audio/mpeg` with `Accept-Ranges: bytes`.
* No authentication → suitable for the `<audio>` tag.

### 4.  Front-end Integration
* `TourStatusTracker` now calls `onTourReady()` twice:
  * at `content_ready` – to show text preview.
  * at `ready` – to pass the final `audio_url`.
* `AudioPlayerProvider` only invokes `playTrack` if `audio_url` is non-null (prevents `/null` 404).

### 5.  Logging & Noise Reduction
* Root logger: `HH:MM:SS LEVEL module: message`.
* Milestone INFO logs: LLM content, TTS success, cache hits.
* Third-party libraries (`sqlalchemy.engine`, `httpx`, `openai`, `uvicorn.access`…) downgraded to WARNING.

### 6.  Performance Tweaks
* TTS speed `1.0 → 1.2` (≈20 % faster).
* Text truncated to 2 500 chars (≈12 min speech) before TTS.

---

This architecture provides a solid foundation for rapid MVP development while maintaining the flexibility to scale and add features as the product evolves.