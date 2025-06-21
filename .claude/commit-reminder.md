# Commit & Push Reminder

## Auto-Reminder Rules

**CRITICAL: After every major code change or feature completion, ALWAYS:**

1. **Commit changes with descriptive message**
2. **Push to remote branch** 
3. **Ask user for confirmation before proceeding to next major task**

## What constitutes "Major Changes":
- ✅ New file creation (models, services, components)
- ✅ Completing a todo item 
- ✅ Setting up project structure
- ✅ Installing dependencies
- ✅ Database schema changes
- ✅ API endpoint implementation
- ✅ Authentication setup
- ✅ Configuration changes
- ✅ Any working feature completion

## Commit Message Format:
```
<type>: <description>

```

## Types:
- `feat:` - New feature
- `fix:` - Bug fix  
- `chore:` - Dependencies, setup, config
- `docs:` - Documentation
- `test:` - Adding tests
- `refactor:` - Code refactoring

## Example:
```bash
git add .
git commit -m "chore: Set up FastAPI project structure and dependencies

git push origin feature/project-setup-authentication
```

**REMEMBER: Always prompt user before continuing to next major task after committing!**