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