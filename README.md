# Walkumentary - Modern Travel Companion App
*AI-Powered Personal Travel Guide with Cost-Optimized Design*

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=black)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat&logo=fastapi&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat&logo=supabase&logoColor=white)
![OpenAI](https://img.shields.io/badge/OpenAI-412991?style=flat&logo=openai&logoColor=white)

## 🌟 Overview

Walkumentary is a **modern, cost-optimized mobile web application** that transforms how you explore new places. Using cutting-edge AI technology, it generates personalized audio tours for landmarks and points of interest, focusing on South Africa and European destinations.

## 🚀 Key Features

### 🎯 Smart Location Discovery
- **🔍 Text Search** - Intelligent autocomplete with Nominatim geocoding
- **📍 GPS Detection** - Automatic nearby landmark discovery  
- **📸 Image Recognition** - AI-powered landmark identification via camera

### 🎨 AI-Powered Content Generation
- **🤖 Smart Tours** - GPT-4o-mini generated personalized content
- **🎧 High-Quality Audio** - OpenAI TTS-1 with natural voices
- **⚡ Real-time Processing** - Dynamic content based on interests and duration
- **💰 Cost-Optimized** - Advanced caching and prompt optimization

### 📱 Modern Mobile Experience
- **🎨 Beautiful UI** - shadcn/ui components with Tailwind CSS
- **⚡ Lightning Fast** - Next.js 14 with optimized performance
- **📲 PWA Ready** - Installable with offline capabilities
- **🗺️ Interactive Maps** - React-Leaflet with OpenStreetMap

## 🏗️ Modern Tech Stack

### Frontend
```typescript
• Next.js 14 (App Router) + TypeScript
• Tailwind CSS + shadcn/ui components
• React-Leaflet for interactive maps
• Progressive Web App (PWA) capabilities
• Deployed on Vercel (free tier)
```

### Backend
```python
• FastAPI + Python 3.11+ (async/await)
• Supabase (PostgreSQL + Auth + Storage)
• Redis caching (Upstash free tier)
• Google OAuth authentication
• Deployed on Railway/Fly.io
```

### AI Services (Cost-Optimized)
```
• OpenAI GPT-4o-mini - Content generation (~$2-4/month)
• OpenAI TTS-1 - Text-to-speech (~$1-2/month)
• Google Vision API - Image recognition (~$0.50/month)
• Total estimated cost: $3.50-7.00/month
```

## 📁 Project Structure

```
walkumentary/
├── .claude/                    # Project documentation
│   ├── prd.md                 # Product Requirements Document
│   ├── architecture.md        # System Architecture Design
│   ├── technical-spec.md      # Technical Implementation Guide
│   ├── llm-strategy.md        # Cost-Optimized AI Strategy
│   ├── roadmap.md             # 2-3 Week Implementation Plan
│   └── project_context.md     # Single Source of Truth
├── memory-bank/               # Previous iteration (reference only)
├── frontend/                  # Next.js 14 application (to be created)
│   ├── src/
│   │   ├── app/              # App Router pages
│   │   ├── components/       # Reusable UI components
│   │   ├── lib/              # Utilities and configurations
│   │   └── hooks/            # Custom React hooks
│   └── package.json
├── backend/                   # FastAPI application (to be created)
│   ├── app/
│   │   ├── models/           # SQLAlchemy models
│   │   ├── routers/          # API endpoints
│   │   ├── services/         # Business logic
│   │   └── main.py           # FastAPI app
│   └── requirements.txt
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+** and npm
- **Python 3.11+** and pip
- **Supabase account** (free tier)
- **OpenAI API key** with credits
- **Redis instance** (Upstash free tier)

### Environment Setup
```bash
# Frontend environment variables (.env.local)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000

# Backend environment variables (.env)
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key
OPENAI_API_KEY=your_openai_api_key
REDIS_URL=your_redis_url
DATABASE_URL=your_postgres_connection_string
```

### Development Commands
```bash
# Frontend (Next.js)
npm run dev              # Start development server
npm run build            # Production build
npm run type-check       # TypeScript validation

# Backend (FastAPI)
uvicorn main:app --reload    # Start development server
pytest                       # Run tests
black . && isort .          # Code formatting
```

## 🎯 Implementation Phases

### Phase 1: MVP Core (Week 1-2)
- ✅ Modern UI with Next.js 14 + shadcn/ui
- ✅ Google OAuth authentication via Supabase
- ✅ Text search with intelligent autocomplete
- ✅ GPS-based location detection
- ✅ AI-powered tour content generation
- ✅ High-quality audio playback

### Phase 2: Enhanced Features (Week 3)
- ✅ Camera-based image recognition
- ✅ Interactive maps with route visualization  
- ✅ Performance optimization for mobile
- ✅ Production deployment with monitoring

### Phase 3: Future Enhancements
- Offline tour downloads and PWA features
- Multi-language support for global use
- Social sharing and user-generated content
- Native mobile app consideration

## 💰 Cost Optimization Strategy

### Intelligent Caching
- **7-day cache** for AI-generated tour content
- **Multi-layer caching** (browser → CDN → Redis → database)
- **Smart cache keys** based on location and preferences
- **80%+ cache hit rate** target for cost reduction

### AI Efficiency
- **Token-optimized prompts** for minimal API usage
- **GPT-4o-mini** for cost-effective content generation
- **Google Vision API** over OpenAI GPT-4V for image recognition
- **Usage monitoring** with automated cost alerts

### Free Tier Utilization
- **Vercel** (frontend hosting) - Free tier
- **Supabase** (database + auth) - Free tier  
- **OpenStreetMap** (mapping) - Completely free
- **Upstash Redis** (caching) - Free tier

## 🎨 Design Philosophy

### Mobile-First Excellence
- **Buttery smooth interactions** with 60fps animations
- **One-handed operation** optimized for mobile use
- **Touch-friendly controls** with proper accessibility
- **Modern design language** with consistent spacing

### Performance Targets
- **< 1.5s** First Contentful Paint
- **< 2.5s** Largest Contentful Paint  
- **< 0.1** Cumulative Layout Shift
- **< 500ms** API response time (cached)

## 🌍 Geographic Focus

### Primary Regions
- **🇿🇦 South Africa** - Cape Town, Johannesburg, Durban
- **🇪🇺 Europe** - Major capitals and tourist destinations

### Expandable Architecture
- Designed for easy geographic expansion
- Scalable content generation system
- Multi-language ready architecture

## 📈 Success Metrics

### MVP Goals
- All three discovery methods functional
- Sub-3-second initial load times
- Under $10/month operational costs
- Modern responsive mobile experience
- Successful production deployment

### User Experience KPIs
- 15+ minutes average session time
- 70%+ tour completion rate
- 80%+ feature discovery rate
- Exceptional user satisfaction

## 🛡️ Security & Privacy

### Data Protection
- **HTTPS everywhere** with modern SSL/TLS
- **Minimal data collection** - location not persisted
- **Secure authentication** via Supabase OAuth
- **GDPR-compliant** data handling practices

### API Security
- **Rate limiting** to prevent abuse
- **Input validation** and sanitization
- **JWT token authentication** for protected routes
- **Environment-based** API key management

## 🚀 Deployment

### Staging Environment
- **Frontend:** Vercel preview deployments
- **Backend:** Railway/Fly.io staging instance
- **Database:** Supabase staging project

### Production Environment
- **Frontend:** Vercel production with CDN
- **Backend:** Railway/Fly.io with auto-scaling
- **Monitoring:** Sentry + Vercel Analytics
- **Alerts:** Cost monitoring + error tracking

## 🤝 Contributing

This is currently a personal project, but contributions and suggestions are welcome:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit changes** (`git commit -m 'Add amazing feature'`)
4. **Push to branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

## 📝 Documentation

Comprehensive documentation available in `.claude/` directory:
- **📋 PRD** - Complete product requirements
- **🏗️ Architecture** - System design and tech stack
- **⚙️ Technical Spec** - Implementation guidelines
- **💰 LLM Strategy** - Cost optimization approach
- **🗓️ Roadmap** - Development timeline and phases

## 📄 License

MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **OpenAI** for cost-effective AI services
- **Supabase** for modern backend infrastructure
- **Vercel** for exceptional frontend hosting
- **OpenStreetMap** community for free mapping data
- **shadcn/ui** for beautiful component library

## 📞 Support

For questions, issues, or feature requests:
- **📧 Issues:** Open a GitHub issue
- **📖 Documentation:** Check `.claude/` folder
- **💬 Discussions:** Use GitHub Discussions

---

**🌟 Explore. Learn. Discover.** - *Your intelligent travel companion for South Africa and Europe.*