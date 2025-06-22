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

## Phase 1 Implementation Status ✅ COMPLETE & TESTED
**All Phase 1 Features - COMPLETED & PRODUCTION-TESTED (June 22, 2025)**

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

### 🧪 Production Validation (June 22, 2025)
**Live testing completed successfully with real tour generation:**

#### Test Results
- ✅ **End-to-End Flow**: Search → Location → Generate → Play working
- ✅ **Generated Tour**: "Unveiling Lady Liberty: A Journey Through History and Culture"
- ✅ **AI Content**: 3,686 characters of high-quality tour content
- ✅ **Audio Generation**: Successfully generated and playable via streaming
- ✅ **Tour List**: Displaying generated tours with proper metadata
- ✅ **Performance**: 1-2 minute total generation time with background processing

#### Issues Resolved During Testing
- ✅ **Authentication Loop**: Fixed infinite loading in auth hook
- ✅ **CORS Issues**: Added frontend port to backend ALLOWED_ORIGINS  
- ✅ **Database Validation**: Fixed TourCreate schema validation errors
- ✅ **UUID Conversion**: Fixed location ID type mismatches
- ✅ **Audio Limits**: Added OpenAI TTS 4096-character limit handling
- ✅ **API Responses**: Fixed UUID→string conversion in tour responses

### 📊 Current Application State
**Fully functional Walkumentary application with:**

#### Working User Flow
1. **Authentication**: Google OAuth sign-in working
2. **Location Discovery**: Search by text or GPS detection
3. **Tour Customization**: Select interests, duration, language
4. **AI Generation**: Multi-LLM content and audio generation
5. **Tour Playback**: Professional audio player with full controls
6. **Tour Management**: View history, delete tours, track status

#### Technical Stack Validated
- **Backend**: FastAPI + Supabase + PostgreSQL + Redis caching
- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS + Radix UI
- **AI Services**: OpenAI GPT-4o-mini + Claude-3 Haiku + TTS-1
- **Database**: Proper schema with RLS policies and relationships
- **Authentication**: Supabase Auth with Google OAuth integration

### 🚀 Ready for Phase 2
**Phase 1 foundation is solid and production-ready. Next priorities:**
- **Enhanced Audio Features**: Offline playback, custom voices
- **Map Integration**: Interactive maps with tour routes
- **Social Features**: Tour sharing and community ratings
- **Advanced Personalization**: User preferences and recommendations

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

### Cursor Integration Crashes
**Problem**: Claude Code crashes with "String not found in file" even when using Write tool
**Cause**: Node.js v23.x compatibility issues with Cursor integration
**Solutions**:

1. **Downgrade Node.js** (Recommended):
   ```bash
   nvm install 20 && nvm use 20
   npm uninstall -g @anthropic-ai/claude-code
   npm install -g @anthropic-ai/claude-code 