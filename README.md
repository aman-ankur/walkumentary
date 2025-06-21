# Walkumentary - Modern Travel Companion App
*AI-Powered Personal Travel Guide with Cost-Optimized Design*

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=black)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat&logo=fastapi&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat&logo=supabase&logoColor=white)
![OpenAI](https://img.shields.io/badge/OpenAI-412991?style=flat&logo=openai&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.9+-3776AB?style=flat&logo=python&logoColor=white)

## Overview

Walkumentary is a **modern, cost-optimized mobile web application** that transforms how you explore new places. Using cutting-edge AI technology, it generates personalized audio tours for landmarks and points of interest, focusing on South Africa and European destinations.

## Key Features

### Smart Location Discovery
- **Text Search** - Intelligent autocomplete with Nominatim geocoding
- **GPS Detection** - Automatic nearby landmark discovery  
- **Image Recognition** - AI-powered landmark identification via camera

### AI-Powered Content Generation
- **Multi-LLM Support** - Configurable OpenAI and Anthropic providers with automatic fallback
- **Smart Tours** - GPT-4o-mini and Claude-3 Haiku generated personalized content
- **High-Quality Audio** - OpenAI TTS-1 with natural voices
- **Real-time Processing** - Dynamic content based on interests and duration
- **Cost-Optimized** - Advanced caching and prompt optimization

### Modern Mobile Experience
- **Beautiful UI** - shadcn/ui components with Tailwind CSS
- **Lightning Fast** - Next.js 14 with optimized performance
- **PWA Ready** - Installable with offline capabilities
- **Interactive Maps** - React-Leaflet with OpenStreetMap
- **Testing-First** - 90%+ test coverage with comprehensive testing strategy

## Modern Tech Stack

### Frontend
```typescript
• Next.js 14 (App Router) + TypeScript
• Tailwind CSS + shadcn/ui components
• React-Leaflet for interactive maps
• Progressive Web App (PWA) capabilities
• Comprehensive testing with Jest, React Testing Library, Cypress
• Deployed on Vercel (free tier)
```

### Backend
```python
• FastAPI + Python 3.9+ (async/await)
• Supabase (PostgreSQL + Auth + Storage)
• Redis caching (Upstash free tier)
• Google OAuth authentication
• Multi-LLM support (OpenAI + Anthropic)
• Comprehensive testing with pytest, factory-boy
• Deployed on Railway/Fly.io
```

### AI Services (Cost-Optimized)
```
• OpenAI GPT-4o-mini - Primary content generation (~$2-4/month)
• Anthropic Claude-3 Haiku - Alternative provider (~$3-5/month)
• Automatic provider fallback and A/B testing capabilities
• OpenAI TTS-1 - Text-to-speech (~$1-2/month)
• Google Vision API - Image recognition (~$0.50/month)
• Total estimated cost: $3.50-8.00/month
```

## Project Structure

```
walkumentary/
├── .claude/                        # Complete project documentation
│   ├── prd.md                     # Product Requirements Document
│   ├── architecture.md            # System Architecture Design
│   ├── technical-spec.md          # Technical Implementation Guide
│   ├── llm-strategy.md            # Multi-LLM Cost Optimization Strategy
│   ├── roadmap.md                 # 2-3 Week Implementation Plan
│   ├── frontend-implementation-guide.md  # Next.js Development Guide
│   ├── backend-implementation-guide.md   # FastAPI Development Guide
│   ├── testing-strategy.md        # Comprehensive Testing Plan
│   ├── phase-implementation-guide.md     # Step-by-Step Implementation
│   ├── environment-setup.md       # Development Environment Setup
│   └── project_context.md         # Single Source of Truth
├── memory-bank/                   # Previous iteration (reference only)
├── frontend/                      # Next.js 14 application (to be created)
│   ├── src/
│   │   ├── app/                  # App Router pages
│   │   ├── components/           # Reusable UI components
│   │   ├── lib/                  # Utilities and configurations
│   │   ├── hooks/                # Custom React hooks
│   │   └── __tests__/            # Comprehensive test suite
│   └── package.json
├── backend/                       # FastAPI application (to be created)
│   ├── app/
│   │   ├── models/               # SQLAlchemy models
│   │   ├── routers/              # API endpoints
│   │   ├── services/             # Business logic with multi-LLM support
│   │   ├── main.py               # FastAPI app
│   │   └── tests/                # Comprehensive test suite
│   └── requirements.txt
└── README.md
```

## Quick Start

### Prerequisites
- **Node.js 18+** and npm
- **Python 3.9+** and pip
- **Supabase account** (free tier)
- **OpenAI API key** with credits
- **Anthropic API key** (optional, for multi-LLM support)
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
ANTHROPIC_API_KEY=your_anthropic_api_key
REDIS_URL=your_redis_url
DATABASE_URL=your_postgres_connection_string
DEFAULT_LLM_PROVIDER=openai
```

### Development Commands
```bash
# Frontend (Next.js)
npm run dev              # Start development server
npm run build            # Production build
npm run type-check       # TypeScript validation
npm run test             # Run unit tests
npm run test:coverage    # Run tests with coverage
npm run test:e2e         # Run Cypress E2E tests

# Backend (FastAPI)
uvicorn main:app --reload    # Start development server
pytest                       # Run tests
pytest --cov=app            # Run tests with coverage
black . && isort .          # Code formatting
mypy app/                   # Type checking
```

## Implementation Phases

### Phase 1: MVP Core (Week 1-2)
- **Phase 1A:** Project setup + authentication (Days 1-2)
- **Phase 1B:** Location search with caching (Days 3-4)
- **Phase 1C:** GPS detection + nearby discovery (Days 5-6)
- **Phase 1D:** AI tour generation with multi-LLM support (Day 7)

Each phase includes:
- Complete implementation with testing
- Integration testing and validation
- Documentation and code review
- Working software ready for demonstration

### Phase 2: Enhanced Features (Week 3)
- Camera-based image recognition
- Interactive maps with route visualization  
- Performance optimization for mobile
- Production deployment with monitoring

### Phase 3: Future Enhancements
- Offline tour downloads and PWA features
- Multi-language support for global use
- Social sharing and user-generated content
- Native mobile app consideration

## Cost Optimization Strategy

### Multi-LLM Provider Strategy
- **Configurable Providers:** Switch between OpenAI and Anthropic
- **Automatic Fallback:** Switch providers on rate limits or errors
- **Cost Comparison:** GPT-4o-mini vs Claude-3 Haiku optimization
- **A/B Testing:** Compare quality and costs between providers

### Intelligent Caching
- **7-day cache** for AI-generated tour content
- **Multi-layer caching** (browser → CDN → Redis → database)
- **Smart cache keys** based on location, interests, and provider
- **80%+ cache hit rate** target for cost reduction

### AI Efficiency
- **Token-optimized prompts** for minimal API usage
- **Provider selection** based on cost and quality metrics
- **Usage monitoring** with automated cost alerts
- **Progressive content loading** for cost control

### Free Tier Utilization
- **Vercel** (frontend hosting) - Free tier
- **Supabase** (database + auth) - Free tier  
- **OpenStreetMap** (mapping) - Completely free
- **Upstash Redis** (caching) - Free tier

## Testing Strategy

### Comprehensive Testing Approach
- **Unit Tests:** 90%+ coverage for all components and services
- **Integration Tests:** API endpoints and database operations
- **E2E Tests:** Complete user journeys with Cypress
- **Performance Tests:** Core Web Vitals and API response times
- **Security Tests:** Authentication, authorization, input validation

### Test-Driven Development
- **Write tests first** before implementation
- **Fast feedback loops** with watch mode testing
- **Automated CI/CD** with GitHub Actions
- **Quality gates** preventing deployment of failing tests

## Design Philosophy

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
- **< 2s** API response time (uncached)

## Geographic Focus

### Primary Regions
- **South Africa** - Cape Town, Johannesburg, Durban
- **Europe** - Major capitals and tourist destinations

### Expandable Architecture
- Designed for easy geographic expansion
- Scalable content generation system
- Multi-language ready architecture

## Development Workflow

### Getting Started
1. **Read the documentation** in `.claude/` folder for comprehensive guides
2. **Set up environment** using `environment-setup.md`
3. **Start with Phase 1A** following `phase-implementation-guide.md`
4. **Follow testing-first approach** with comprehensive test coverage

### Code Quality
- **TypeScript** for type safety throughout
- **ESLint + Prettier** for consistent code formatting
- **Pre-commit hooks** for quality enforcement
- **Comprehensive testing** before each phase completion

## Success Metrics

### MVP Goals
- All three discovery methods functional
- Sub-3-second initial load times
- Under $10/month operational costs
- Modern responsive mobile experience
- Successful production deployment
- 90%+ test coverage achieved

### User Experience KPIs
- 15+ minutes average session time
- 70%+ tour completion rate
- 80%+ feature discovery rate
- Exceptional user satisfaction

## Security & Privacy

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

## Contributing

This is currently a personal project, but contributions and suggestions are welcome:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Follow the testing strategy** with comprehensive test coverage
4. **Commit changes** (`git commit -m 'Add amazing feature'`)
5. **Push to branch** (`git push origin feature/amazing-feature`)
6. **Open a Pull Request**

## Documentation

Comprehensive documentation available in `.claude/` directory:
- **Product Requirements** - Complete product vision and requirements
- **System Architecture** - Technical design and infrastructure
- **Implementation Guides** - Step-by-step development instructions
- **Testing Strategy** - Comprehensive testing approach
- **Cost Optimization** - Multi-LLM and caching strategies
- **Environment Setup** - Development environment configuration

## License

MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- **OpenAI** for cost-effective AI services
- **Anthropic** for alternative LLM capabilities
- **Supabase** for modern backend infrastructure
- **Vercel** for exceptional frontend hosting
- **OpenStreetMap** community for free mapping data
- **shadcn/ui** for beautiful component library

## Support

For questions, issues, or feature requests:
- **Issues:** Open a GitHub issue
- **Documentation:** Check `.claude/` folder for comprehensive guides
- **Discussions:** Use GitHub Discussions for community support

---

**Explore. Learn. Discover.** - *Your intelligent travel companion for South Africa and Europe.*
