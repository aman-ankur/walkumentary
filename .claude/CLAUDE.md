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

## Phase 1B Implementation Status ✅
**Location Search Feature - COMPLETED**

### Fixed Issues (June 21, 2025)
1. **API Import Error**: Fixed missing `api` export in `/lib/api.ts` 
2. **Missing PWA Icon**: Created `icon-192x192.png` for manifest.json
3. **Next.js Metadata Warnings**: Split viewport config in layout.tsx
4. **Infinite Loading Loop**: Fixed auth state management in useAuth.ts
5. **API Method Missing**: Added HTTP method helpers (get, post, patch, delete) to ApiClient
6. **Service Worker Interference**: Temporarily disabled PWA to prevent loading issues

### Working Features
- ✅ User authentication with Supabase (Google OAuth)
- ✅ Location search with real-time results
- ✅ Backend API integration (location search endpoint)
- ✅ Debounced search with 300ms delay
- ✅ GPS location detection capability
- ✅ User profile management with fallback data

### API Performance
- Backend responding correctly at http://localhost:8000
- Location search returns results for queries like "paris", "eiffel tower"
- CORS properly configured with OPTIONS preflight requests
- Authentication tokens properly passed to backend

### Next Steps
- Improve search result quality (current results from external geocoding API)
- Re-enable PWA service worker after debugging
- Implement tour generation feature (Phase 1C)

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