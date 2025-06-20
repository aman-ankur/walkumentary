# Walkumentary - Project Context
*Modern Travel Companion App - Complete Redesign*

## Quick Overview

**Project Name:** Walkumentary  
**Type:** Mobile Web App (PWA)  
**Timeline:** 2-3 weeks MVP  
**Purpose:** Personal travel companion for South Africa & Europe  
**Focus:** Modern UI/UX, cost-optimized AI integration  

## Tech Stack Summary

### Frontend
- **Framework:** Next.js 14 with App Router + TypeScript
- **Styling:** Tailwind CSS + shadcn/ui components  
- **State:** React Context + useReducer
- **Maps:** React-Leaflet + OpenStreetMap (free)
- **PWA:** next-pwa for offline capabilities
- **Deployment:** Vercel (free tier)

### Backend  
- **Framework:** FastAPI + Python 3.9+
- **Database:** Supabase (PostgreSQL + Auth + Storage)
- **Caching:** Redis (Upstash free tier)
- **Authentication:** Supabase Auth with Google OAuth
- **Deployment:** Railway or Fly.io

### AI Services (Cost-Optimized)
- **Content Generation:** OpenAI GPT-4o-mini (~$2-4/month)
- **Text-to-Speech:** OpenAI TTS-1 (~$1-2/month)  
- **Image Recognition:** Google Vision API (~$0.50/month)
- **Total Estimated Cost:** $3.50-7.00/month

## Core Features Priority

### Phase 1 (MVP Week 1-2)
1. **Text Search** - Autocomplete location search via Nominatim
2. **GPS Detection** - Automatic nearby landmark discovery
3. **Tour Generation** - AI-powered personalized audio content
4. **Audio Playback** - Modern audio player with controls

### Phase 2 (Week 3)  
1. **Image Recognition** - Camera capture + landmark identification
2. **Interactive Maps** - Location markers and route visualization
3. **Performance Optimization** - Mobile-first optimization
4. **Production Deployment** - Full deployment with monitoring

### Phase 3 (Future)
- Offline tour downloads
- Multi-language support  
- Social sharing features
- Native mobile app

## Key Design Principles

### User Experience
- **Mobile-first responsive design**
- **Buttery smooth interactions**
- **Modern, chic, sleek interface**
- **Accessibility and usability focused**

### Technical Principles  
- **API-first architecture**
- **Aggressive caching for cost control**
- **Type-safe development (TypeScript)**
- **Component-based UI system**
- **Performance-optimized bundle**

### Cost Optimization
- **Multi-layer caching strategy**
- **Token-optimized AI prompts**
- **Free/cheap service alternatives**
- **Usage monitoring and alerts**
- **Smart service degradation**

## Architecture Patterns

### Frontend Architecture
```
src/
├── app/              # Next.js App Router
├── components/       # Reusable UI components  
│   ├── ui/          # shadcn/ui base components
│   ├── forms/       # Form components
│   ├── maps/        # Map components
│   └── audio/       # Audio player components
├── lib/             # Utilities and configurations
├── hooks/           # Custom React hooks
└── stores/          # State management
```

### Backend Architecture
```
app/
├── main.py          # FastAPI application
├── models/          # SQLAlchemy models
├── schemas/         # Pydantic schemas  
├── routers/         # API route handlers
├── services/        # Business logic
└── utils/           # Utility functions
```

## Database Schema (Supabase)

### Core Tables
- **profiles** - User profiles (extends Supabase auth.users)
- **locations** - Landmark and POI data
- **tours** - Generated tour content and metadata
- **api_cache** - Cached API responses for cost optimization

### Key Relationships
- Users have many Tours
- Tours belong to Locations  
- Tours have cached Audio files
- Locations have geographic coordinates

## API Design

### Core Endpoints
```
Authentication:
POST /auth/login      # Google OAuth
GET  /auth/user       # Current user info

Location Services:
GET  /locations/search        # Text search with autocomplete
POST /locations/detect        # GPS-based detection  
POST /locations/recognize     # Image recognition

Tour Management:
POST /tours/generate          # Generate new tour
GET  /tours/{id}             # Get tour details
GET  /tours/user             # User's tours

Audio Services:
POST /audio/generate          # Generate TTS audio
GET  /audio/{id}             # Stream audio file
```

## Development Environment

### Prerequisites
- Node.js 18+ and npm
- Python 3.9+ and pip
- Supabase account and project
- OpenAI API key with credits
- Redis instance (Upstash free tier)

### Environment Variables
```bash
# Frontend (.env.local)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_API_BASE_URL=

# Backend (.env)
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
OPENAI_API_KEY=
REDIS_URL=
DATABASE_URL=
```

### Quick Start Commands
```bash
# Frontend development
npm run dev          # Start Next.js dev server
npm run build        # Production build
npm run type-check   # TypeScript validation

# Backend development  
uvicorn main:app --reload    # Start FastAPI dev server
pytest                       # Run tests
black . && isort .          # Code formatting
```

## Cost Monitoring Strategy

### Usage Tracking
- Real-time API usage monitoring
- Daily/monthly cost tracking  
- Cache hit rate optimization
- Automated cost alerts at 80% budget

### Cost Optimization Techniques
- **Aggressive Caching:** 7-day cache for tour content
- **Prompt Optimization:** Minimal token usage
- **Service Alternatives:** Free tiers where possible
- **Progressive Loading:** Basic content first, enhanced on demand

### Budget Allocation
- Monthly budget: $10.00
- Tour generation: $2.50-4.00
- Image recognition: $0.75-1.50  
- Text-to-speech: $1.25-2.50
- Infrastructure: $0.50-1.00

## Quality Assurance

### Testing Strategy
- **Unit Tests:** Core business logic
- **Integration Tests:** API endpoints
- **E2E Tests:** Critical user journeys
- **Performance Tests:** Mobile optimization
- **Cost Tests:** API usage validation

### Performance Targets
- **First Contentful Paint:** < 1.5s
- **Largest Contentful Paint:** < 2.5s  
- **Cumulative Layout Shift:** < 0.1
- **Time to Interactive:** < 3.0s
- **API Response Time:** < 500ms (cached), < 2s (uncached)

## Deployment Strategy

### Staging Environment
- **Frontend:** Vercel preview deployments
- **Backend:** Railway/Fly.io staging instance
- **Database:** Supabase staging project
- **Testing:** Automated on PR creation

### Production Environment
- **Frontend:** Vercel production deployment
- **Backend:** Railway/Fly.io production instance  
- **Database:** Supabase production project
- **Monitoring:** Sentry + Vercel Analytics
- **Alerts:** Cost monitoring + error tracking

## Success Metrics

### MVP Success Criteria
- All three discovery methods functional
- < 3 second initial load time
- < $10/month operational cost
- Modern, responsive mobile experience
- Production deployment successful

### User Experience Metrics
- Average session duration > 10 minutes
- Tour completion rate > 70%
- Feature discovery rate > 80%
- User satisfaction (subjective feedback)

## Future Considerations

### Scalability Planning
- **Horizontal Scaling:** Stateless API design
- **Database Scaling:** Supabase auto-scaling
- **CDN:** Vercel Edge Network
- **Caching:** Multi-region Redis if needed

### Feature Roadmap
- **Month 2:** Offline capabilities, enhanced personalization
- **Month 3:** Multi-language, social features  
- **Month 4+:** Native app, AR integration, monetization

This context document serves as the single source of truth for the Walkumentary project, providing all essential information for development, deployment, and maintenance.