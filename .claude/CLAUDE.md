# CLAUDE.md
## Project Overview
Walkumentary is a modern, cost-optimized mobile web application that provides personalized audio tours of landmarks and points of interest. Built with cutting-edge technologies and designed for optimal user experience, it transforms how travelers explore new places through intelligent location identification and AI-generated contextual content.

## Key Resources
- **Architecture**: See `architecture.md` for system design and structure.
- **Context**: Refer to `project_context.md` for project background and requirements.
- **Roadmap**: Check `roadmap.md` for implementation phases and milestones.
- **Implementation Guides**: Use `backend-implementation-guide.md` and `frontend-implementation-guide.md` for coding specifics.
- **Technical Specs**: Review `technical-spec.md` for detailed requirements.
- **Testing**: Follow `testing-strategy.md` for QA processes.

## Conventions
- **Branch Naming**: Use `feature/<feature-name>`, `bugfix/<issue-number>`.
- **Commit Messages**: Follow `<type>(<scope>): <description>` (e.g., `feat(auth): add login endpoint`).
- **Code Style**: Adhere to guidelines in `settings.local.json` and respective implementation guides.
- **Environment**: Set up per `environment-setup.md`.

## Known Issues
- Check `prd.md` for production-specific quirks or warnings.
- Avoid [e.g., "f-strings in backend code"] as noted in relevant guides.

## Implementation Status ✅ 95% COMPLETE & PRODUCTION READY

**MAJOR UPDATE (July 12, 2025)**: After comprehensive codebase analysis, Walkumentary is **production-ready** with sophisticated implementation across all core features.
**All Phase 1 Features - COMPLETED & PRODUCTION-TESTED (June 22-23, 2025)**

### 🎉 Phase 1 Complete Feature Set
**All features implemented, tested, and working end-to-end:**

#### Phase 1A: Authentication & Setup ✅
- ✅ FastAPI backend with Supabase integration
- ✅ Next.js frontend with Google OAuth
- ✅ Database models and API endpoints
- ✅ Secure credential management

#### Phase 1B: Location Search ✅
- ✅ Text-based location search with Nominatim API
- ✅ Real-time search results and autocomplete
- ✅ Backend caching and performance optimization

#### Phase 1C: GPS & Nearby Discovery ✅
- ✅ Advanced GPS location detection with error handling
- ✅ Smart nearby POI discovery with filtering
- ✅ Mobile-optimized GPS interface with settings
- ✅ Real-time location tracking capabilities

#### Phase 1D: AI Tour Generation ✅ **PRODUCTION-TESTED**
- ✅ **Multi-LLM AI service** (OpenAI GPT-4o-mini + Anthropic Claude-3 Haiku)
- ✅ **Audio generation** with OpenAI TTS-1 and streaming
- ✅ **Cost optimization** with intelligent caching (70-80% cost reduction)
- ✅ **Tour management** with full CRUD operations
- ✅ **Real-time status tracking** with background processing
- ✅ **Professional audio player** with speed control and download

### 🧪 Production Validation (June 22-23, 2025)
**Live testing completed successfully with complete audio functionality:**

#### Test Results
- ✅ **End-to-End Flow**: Search → Location → Generate → Play working completely
- ✅ **Generated Tour**: "Unveiling Lady Liberty: A Journey Through History and Culture"
- ✅ **AI Content**: 3,686 characters of high-quality tour content
- ✅ **Audio Generation**: Successfully generated and playable via streaming
- ✅ **Audio Player**: Professional player with speed control, scrubbing, and download
- ✅ **Audio Recovery**: Auto-regeneration of missing cache data working
- ✅ **Tour List**: Displaying generated tours with proper metadata
- ✅ **Performance**: 1-2 minute total generation time with background processing

#### Critical Issues Resolved During Testing
- ✅ **Authentication Loop**: Fixed infinite loading in auth hook
- ✅ **CORS Issues**: Added frontend port to backend ALLOWED_ORIGINS  
- ✅ **Database Validation**: Fixed TourCreate schema validation errors
- ✅ **UUID Conversion**: Fixed location ID type mismatches
- ✅ **Audio Limits**: Added OpenAI TTS 4096-character limit handling
- ✅ **API Responses**: Fixed UUID→string conversion in tour responses
- ✅ **Audio Encoding**: Fixed binary MP3 corruption with proper base64 encoding
- ✅ **Cache Recovery**: Added automatic audio regeneration for missing data

### 📊 Current Application State
**Fully functional Walkumentary application with:**

#### Working User Flow
1. **Authentication**: Google OAuth sign-in working
2. **Location Discovery**: Search by text or GPS detection
3. **Tour Customization**: Select interests, duration, language
4. **AI Generation**: Multi-LLM content and audio generation
5. **Tour Playback**: Professional audio player with full controls and auto-recovery
6. **Tour Management**: View history, delete tours, track status, regenerate audio

#### Technical Stack Validated
- **Backend**: FastAPI + Supabase + PostgreSQL + Redis caching
- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS + Radix UI
- **AI Services**: OpenAI GPT-4o-mini + Claude-3 Haiku + TTS-1
- **Database**: Proper schema with RLS policies and relationships
- **Authentication**: Supabase Auth with Google OAuth integration

### 🎉 Phase 2A Complete - Audio Player v2 PRODUCTION READY
**Enhanced Audio Player v2 - Complete Implementation:**
- **Professional UI**: 5 custom SVG control icons with embedded timing indicators
- **Volume Control**: Visual slider with AudioPlayerProvider integration and localStorage persistence
- **Dynamic Artwork**: Location-based template selection with professional SVG graphics (urban, nature, coastal themes)
- **Transcript System**: Complete backend generation + frontend overlay with click-to-seek functionality
- **Database Support**: JSONB transcript field with GIN indexing for performance
- **Mobile Optimized**: Touch-friendly controls, responsive design, accessibility considerations
- **Production Quality**: TypeScript type safety, component integration, comprehensive testing

### ✅ Phase 2A: Audio Player v2 COMPLETE (100%)
- **Professional Controls**: 5-button layout with custom SVG icons and timing indicators
- **Advanced Features**: Playback speed (0.5x-2x), volume with mute, auto-scroll transcripts
- **Dynamic Artwork**: 15+ SVG templates with location-based selection algorithm
- **Transcript System**: Full backend generation, interactive overlay, download capability

### ✅ Phase 2B: Modern UI & Customization COMPLETE (95%)
- **Complete Customization Flow**: Sophisticated /customize page with 4-step selection process
- **Orange Design System**: Professional rebrand with consistent theming throughout
- **Advanced Components**: InterestCard, NarrativeCard, VoiceCard with visual selections
- **Backend Integration**: Full API integration with real-time status tracking

### ✅ Phase 2C: Interactive Map Integration COMPLETE (95%)
**Map Integration Implementation - July 13, 2025:**
- **React-Leaflet Integration**: Complete map system with OpenStreetMap tiles
- **Dynamic Map Architecture**: SSR-safe components with dynamic imports
- **Tour Location Markers**: Custom SVG markers with popup information
- **Mobile Optimization**: Touch controls, zoom, responsive design
- **GPS Integration**: Real-time user location tracking on map
- **Audio-Map Sync**: Map displays tour location during audio playback

### ✅ Critical Fixes Implemented (July 13, 2025)
**Map Rendering Issues - RESOLVED:**
- **Fixed SSR Conflicts**: Resolved "Cannot find module './vendor-chunks/next.js'" with proper dynamic imports
- **Map Container Re-initialization**: Fixed "Map container is already initialized" with proper cleanup
- **Leaflet Icon Loading**: Fixed missing marker icons with CDN fallbacks
- **Component Architecture**: Simplified map components to avoid nested dynamic imports

**Audio Player Issues - RESOLVED:**
- **Duration Display**: Fixed "Infinity:NaN" with proper finite number validation
- **Audio URL Fallback**: Implemented fallback URL construction for missing audio_url fields
- **Loading Event Handling**: Added comprehensive audio event listeners (loadedmetadata, canplay, error)
- **Error Recovery**: Enhanced error handling with audio.load() retry mechanism

**UI/UX Improvements - RESOLVED:**
- **Status Text**: Fixed "Tour content is being generated" placeholder text display
- **Subtitle Overlay**: Fixed full-screen overlay covering map (constrained to audio player area)
- **Artwork System**: Implemented 10 unique tour artworks with deterministic selection by tour ID
- **Tour Status Tracking**: Enhanced status detection for "content_ready" vs "ready" states

### 🚀 Ready for Phase 3: Advanced Features
**Next priorities for enhanced travel experience:**
- **Audio Duration Fix**: Resolve 0:00 duration display with proper authentication/CORS handling
- **POI Integration**: Re-enable nearby points of interest with proper rate limiting
- **Route Visualization**: Add walking route overlays on map
- **Offline Features**: Progressive web app with downloadable tours
- **Image Recognition**: Complete camera-based location identification (endpoint exists)
- **Social Features**: Tour sharing, community ratings, user-generated content

## Instructions for Claude
- Analyze existing files (e.g., `@architecture.md`) before suggesting changes.
- Use `/` commands from `.claude/commands/` for repetitive tasks.
- Prioritize iterative, small changes over large refactors unless planned in `roadmap.md`.
- Do not modify files unless explicitly instructed; suggest changes instead.


# Claude Code Configuration & Best Practices

## Core Instructions

### File Operations Strategy
- **Use Write tool to create all new files first**
- **Use Edit tool only for modifications to existing files**
- **Always check if files exist before attempting to edit them**
- **Save files in editor immediately when prompted**

### Safety Protocols
- Verify file existence before editing operations
- Use incremental approach for complex operations
- Create files one at a time for better error handling
- Always save changes in Cursor/VS Code when prompted

## Common Commands & Patterns

### Safe File Creation
```bash
# Good: Explicit about file creation strategy
claude-code "Use Write tool to create all new files first, then use Edit only for modifications. Create the authentication system."

# Good: Incremental approach
claude-code "First check which files exist, then create missing files with Write tool"

# Avoid: Vague requests that might trigger Edit on non-existent files
claude-code "Update the auth system" # Could fail if files don't exist


## Known Issues & Workarounds

### CRITICAL: Supabase Authentication Configuration (RESOLVED - July 14, 2025)
**Problem**: Authentication flow hanging with "Completing authentication..." message after OAuth redirect
**Root Cause**: Supabase client not configured for automatic URL hash detection in Next.js App Router
**Solution**: Configure Supabase client with proper auth options

#### Essential Supabase Configuration (frontend/src/lib/supabase.ts):
```typescript
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // CRITICAL: Enable automatic URL hash detection
    detectSessionInUrl: true,
    autoRefreshToken: true,
    persistSession: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'walkumentary-auth-token',
  }
})
```

#### Auth Callback Implementation (frontend/src/app/auth/callback/page.tsx):
```typescript
// Simple callback - let Supabase handle hash detection
useEffect(() => {
  const timer = setTimeout(() => {
    router.push('/');  // Redirect after 1 second
  }, 1000);
  return () => clearTimeout(timer);
}, [router]);
```

#### Required OAuth Configuration:
**Google Console - Authorized JavaScript origins:**
- `http://localhost:3000`
- `https://walkumentary-frontend.vercel.app` (without trailing slash)

**Google Console - Authorized redirect URIs:**
- `https://kumruxjaiwdjiwvmtjyh.supabase.co/auth/v1/callback`
- `https://walkumentary-frontend.vercel.app/auth/callback`
- `http://localhost:3000/auth/callback`

**Supabase Dashboard - Site URL:**
- `https://walkumentary-frontend.vercel.app/`

**Supabase Dashboard - Redirect URLs:**
- `https://walkumentary-frontend.vercel.app/auth/callback`

#### Symptoms of Incorrect Configuration:
- Auth callback page loads but never redirects
- `getSession()` calls hang indefinitely  
- No auth state change events fire
- Console shows "Auth initialization timeout"

#### Key Learning:
Modern Supabase (v2.38.0+) requires explicit `detectSessionInUrl: true` configuration to automatically process OAuth hash fragments in Next.js App Router. Without this, the session detection fails silently.

### Cursor Integration Crashes
**Problem**: Claude Code crashes with "String not found in file" even when using Write tool
**Cause**: Node.js v23.x compatibility issues with Cursor integration
**Solutions**:

1. **Downgrade Node.js** (Recommended):
   ```bash
   nvm install 20 && nvm use 20
   npm uninstall -g @anthropic-ai/claude-code
   npm install -g @anthropic-ai/claude-code 