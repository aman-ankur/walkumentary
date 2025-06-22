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

## Phase 1C Implementation Status ✅
**GPS Detection & Nearby Discovery Feature - COMPLETED (June 21, 2025)**

### Advanced GPS & Location Features Implemented
1. **Enhanced GPS Service**: Advanced `useGeolocation` hook with comprehensive error handling
2. **Smart Nearby Discovery**: `useNearbyLocations` hook with intelligent caching and filtering
3. **Advanced GPS UI**: `GPSLocationDetector` component with settings panel and real-time controls
4. **New UI Components**: Badge, Slider, Switch, Select components with Radix UI integration
5. **Comprehensive Testing**: 50+ test cases covering all GPS functionality scenarios

### Technical Achievements
- **Production-Ready Build**: All TypeScript compilation successful
- **Error Resilience**: Graceful GPS permission and network error handling
- **Performance Optimized**: Request debouncing, caching, and cleanup
- **Mobile-First Design**: Touch-optimized controls and responsive interface
- **Modern React Patterns**: Custom hooks with proper state management

### Working Features (Phase 1B + 1C Combined)
- ✅ User authentication with Supabase (Google OAuth)
- ✅ Location search with real-time results and autocomplete
- ✅ Advanced GPS location detection with comprehensive error handling
- ✅ Smart nearby location discovery with filtering (type, radius, rating)
- ✅ Real-time location tracking and auto-refresh capabilities
- ✅ Backend API integration with caching and performance optimization
- ✅ Mobile-optimized GPS interface with settings panel
- ✅ Comprehensive test coverage for all location functionality

### API Performance & Integration
- Backend API fully functional at http://localhost:8000
- Location search and nearby detection working seamlessly
- GPS coordinates processed with distance calculations
- Intelligent caching reducing API calls and improving performance
- CORS and authentication properly configured

### Next Steps - Phase 1D
- **AI Tour Generation**: Multi-LLM integration (OpenAI GPT-4o-mini + Anthropic Claude-3 Haiku)
- **Audio Generation**: Text-to-speech with OpenAI TTS-1
- **Cost Optimization**: Intelligent provider switching and caching strategies
- **Tour Management**: User tour history and preferences

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