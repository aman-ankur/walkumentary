# Environment Setup Guide - Walkumentary
*Complete development environment configuration*

## 1. Prerequisites & System Requirements

### 1.1 Required Software

**Operating System Support:**
- ✅ **macOS** 12.0+ (recommended for development)
- ✅ **Windows** 10/11 with WSL2
- ✅ **Linux** Ubuntu 20.04+, Debian 11+, or equivalent

**Core Requirements:**
- **Node.js** 18.0+ and npm 9.0+
- **Python** 3.9+ (specifically 3.9 for compatibility)
- **Git** 2.30+
- **VS Code** or preferred IDE with extensions

**Database & Services:**
- **PostgreSQL** 14+ (for local development, optional)
- **Redis** 6.0+ (for local development, optional)
- **Docker** 20.10+ (optional, for containerized development)

### 1.2 Installation Commands by OS

#### macOS (recommended)
```bash
# Install Homebrew (if not already installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install core dependencies
brew install node python@3.9 git postgresql redis
brew install --cask visual-studio-code

# Verify installations
node --version      # Should be 18.0+
python3.9 --version # Should be 3.9.x
git --version       # Should be 2.30+
```

#### Ubuntu/Debian Linux
```bash
# Update package manager
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Python 3.9
sudo apt-get install -y python3.9 python3.9-venv python3.9-dev python3-pip

# Install other dependencies
sudo apt-get install -y git postgresql postgresql-contrib redis-server

# Install VS Code
wget -qO- https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor > packages.microsoft.gpg
sudo install -o root -g root -m 644 packages.microsoft.gpg /etc/apt/trusted.gpg.d/
sudo sh -c 'echo "deb [arch=amd64,arm64,armhf signed-by=/etc/apt/trusted.gpg.d/packages.microsoft.gpg] https://packages.microsoft.com/repos/code stable main" > /etc/apt/sources.list.d/vscode.list'
sudo apt update && sudo apt install code
```

#### Windows (with WSL2)
```powershell
# Install WSL2 and Ubuntu
wsl --install

# Inside WSL2, follow Ubuntu instructions above
# Install Windows Terminal for better experience
winget install Microsoft.WindowsTerminal

# Install VS Code for Windows with WSL extension
winget install Microsoft.VisualStudioCode
```

## 2. Project Setup

### 2.1 Repository Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/walkumentary.git
cd walkumentary

# Set up git hooks (optional but recommended)
git config core.hooksPath .githooks
chmod +x .githooks/*

# Verify project structure
ls -la
# Should see: .claude/, memory-bank/, README.md
```

### 2.2 Frontend Setup (Next.js)

```bash
# Navigate to frontend directory (will be created in Phase 1)
mkdir walkumentary-frontend
cd walkumentary-frontend

# Create Next.js project with TypeScript
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir

# Install core dependencies
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
npm install @radix-ui/react-avatar @radix-ui/react-button @radix-ui/react-card
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-input
npm install @radix-ui/react-label @radix-ui/react-progress @radix-ui/react-separator
npm install @radix-ui/react-sheet @radix-ui/react-switch @radix-ui/react-toast
npm install lucide-react class-variance-authority clsx tailwind-merge
npm install react-leaflet leaflet
npm install react-hook-form @hookform/resolvers zod
npm install next-pwa workbox-webpack-plugin
npm install react-hot-toast sonner zustand

# Install development dependencies
npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event
npm install -D jest jest-environment-jsdom @types/jest
npm install -D cypress @cypress/code-coverage
npm install -D msw @mswjs/data
npm install -D @types/leaflet
npm install -D prettier eslint-config-prettier eslint-plugin-testing-library
npm install -D @typescript-eslint/eslint-plugin @typescript-eslint/parser

# Verify installation
npm run build
npm run type-check
npm run lint
```

### 2.3 Backend Setup (FastAPI)

```bash
# Navigate to backend directory (will be created in Phase 1)
mkdir walkumentary-backend
cd walkumentary-backend

# Create virtual environment with Python 3.9
python3.9 -m venv venv
source venv/bin/activate  # On Windows WSL: source venv/bin/activate

# Upgrade pip
pip install --upgrade pip setuptools wheel

# Install core dependencies
pip install fastapi==0.104.0
pip install uvicorn[standard]==0.24.0
pip install sqlalchemy==2.0.23
pip install asyncpg==0.29.0
pip install alembic==1.12.1
pip install supabase==2.0.0
pip install redis==5.0.1
pip install httpx==0.25.0
pip install pillow==10.1.0
pip install pydantic==2.5.0
pip install python-multipart==0.0.6
pip install pydantic-settings==2.1.0
pip install python-jose[cryptography]==3.3.0
pip install passlib[bcrypt]==1.7.4

# Install AI/ML dependencies
pip install openai==1.3.0
pip install anthropic==0.7.0
pip install google-cloud-vision==3.4.5

# Install development and testing dependencies
pip install pytest==7.4.3
pip install pytest-asyncio==0.21.1
pip install pytest-cov==4.1.0
pip install factory-boy==3.3.0
pip install faker==20.1.0
pip install black==23.11.0
pip install isort==5.12.0
pip install flake8==6.1.0
pip install mypy==1.7.0
pip install pre-commit==3.5.0

# Save dependencies
pip freeze > requirements.txt

# Verify installation
python -c "import fastapi, sqlalchemy, openai, anthropic; print('All packages imported successfully')"
```

## 3. Service Configuration

### 3.1 Supabase Setup

**Create Supabase Project:**
1. Go to [supabase.com](https://supabase.com) and sign up
2. Create new project: "walkumentary-dev"
3. Choose region closest to your location
4. Set strong database password
5. Wait for project initialization (2-3 minutes)

**Configure Authentication:**
```sql
-- In Supabase SQL Editor, run these commands:

-- Enable Google OAuth
-- (Done via Dashboard: Authentication > Providers > Google)

-- Create profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**Get API Keys:**
1. Go to Settings > API
2. Copy `Project URL` and `anon/public key`
3. Copy `service_role/secret key` (keep secure!)

### 3.2 Redis Setup

**Option 1: Upstash (Recommended for Development)**
1. Go to [upstash.com](https://upstash.com) and sign up
2. Create new Redis database
3. Choose free tier and closest region
4. Copy Redis URL from dashboard

**Option 2: Local Redis**
```bash
# macOS
brew services start redis

# Ubuntu/Debian
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Test connection
redis-cli ping
# Should respond with "PONG"
```

### 3.3 External API Keys

**OpenAI Setup:**
1. Go to [platform.openai.com](https://platform.openai.com)
2. Sign up or login
3. Go to API Keys section
4. Create new secret key
5. Add billing information (required for usage)
6. Set usage limits to prevent unexpected charges

**Anthropic Setup:**
1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Sign up for developer account
3. Go to API Keys section
4. Create new API key
5. Note: May require waitlist approval

**Google Cloud Vision (Optional):**
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create new project or select existing
3. Enable Vision API
4. Create service account and download JSON key
5. Set environment variable: `GOOGLE_APPLICATION_CREDENTIALS`

## 4. Environment Variables

### 4.1 Frontend Environment (.env.local)

```bash
# Create frontend/.env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_ENVIRONMENT=development

# Optional: Analytics and monitoring
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=your-analytics-id
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
```

### 4.2 Backend Environment (.env)

```bash
# Create backend/.env
# Application
APP_NAME=Walkumentary API
ENVIRONMENT=development
DEBUG=true
SECRET_KEY=your-super-secret-key-here-minimum-32-characters-long
HOST=0.0.0.0
PORT=8000

# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/walkumentary_dev
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key-here
SUPABASE_ANON_KEY=your-anon-key-here

# Redis
REDIS_URL=redis://localhost:6379
# Or for Upstash: redis://:password@host:port

# AI Services
DEFAULT_LLM_PROVIDER=openai
OPENAI_API_KEY=sk-your-openai-key-here
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key-here

# External APIs
NOMINATIM_BASE_URL=https://nominatim.openstreetmap.org
NOMINATIM_USER_AGENT=Walkumentary/1.0

# Google Cloud (if using)
GOOGLE_APPLICATION_CREDENTIALS=path/to/your/service-account.json
GOOGLE_CLOUD_PROJECT=your-project-id

# Security
ALLOWED_ORIGINS=["http://localhost:3000","https://localhost:3000"]
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Monitoring (optional)
SENTRY_DSN=your-sentry-dsn-here
LOG_LEVEL=INFO
```

### 4.3 Environment Validation

```bash
# Frontend validation
cd walkumentary-frontend
npm run dev
# Should start on http://localhost:3000

# Backend validation
cd walkumentary-backend
source venv/bin/activate
uvicorn app.main:app --reload
# Should start on http://localhost:8000

# Test backend health
curl http://localhost:8000/health
# Should respond with {"status": "healthy"}
```

## 5. IDE Configuration

### 5.1 VS Code Extensions

**Essential Extensions:**
```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-python.python",
    "ms-python.black-formatter",
    "ms-python.isort",
    "ms-python.mypy-type-checker",
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-json",
    "redhat.vscode-yaml",
    "ms-vscode-remote.remote-wsl",
    "github.copilot"
  ]
}
```

**VS Code Settings (.vscode/settings.json):**
```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.organizeImports": true
  },
  "python.defaultInterpreterPath": "./walkumentary-backend/venv/bin/python",
  "python.formatting.provider": "black",
  "python.linting.enabled": true,
  "python.linting.flake8Enabled": true,
  "python.linting.mypyEnabled": true,
  "typescript.preferences.importModuleSpecifier": "relative",
  "tailwindCSS.includeLanguages": {
    "typescript": "typescript",
    "typescriptreact": "typescriptreact"
  },
  "files.associations": {
    "*.css": "tailwindcss"
  }
}
```

### 5.2 Git Configuration

**Global Git Setup:**
```bash
# Set up user info
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Set up useful aliases
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.ci commit
git config --global alias.st status
git config --global alias.unstage 'reset HEAD --'
git config --global alias.last 'log -1 HEAD'
git config --global alias.visual '!gitk'

# Set up default editor
git config --global core.editor "code --wait"
```

**Pre-commit Hooks Setup:**
```bash
# Install pre-commit (if not already installed)
pip install pre-commit

# Set up hooks for the project
cd walkumentary
pre-commit install

# Test hooks
pre-commit run --all-files
```

## 6. Development Workflow

### 6.1 Daily Development Setup

```bash
# Start development session
cd walkumentary

# Start backend
cd walkumentary-backend
source venv/bin/activate
uvicorn app.main:app --reload &

# Start frontend (in new terminal)
cd walkumentary-frontend
npm run dev &

# Start Redis (if running locally)
redis-server &

# Open VS Code
code .
```

### 6.2 Testing Setup

```bash
# Frontend testing
cd walkumentary-frontend
npm run test              # Run unit tests
npm run test:watch        # Run tests in watch mode
npm run test:coverage     # Run with coverage
npm run test:e2e          # Run Cypress tests

# Backend testing
cd walkumentary-backend
source venv/bin/activate
pytest                    # Run all tests
pytest --cov=app         # Run with coverage
pytest -v                # Verbose output
pytest app/tests/test_specific.py  # Run specific test file
```

### 6.3 Code Quality Checks

```bash
# Frontend
cd walkumentary-frontend
npm run lint              # ESLint
npm run lint:fix          # Auto-fix linting issues
npm run type-check        # TypeScript validation
npm run format            # Prettier formatting

# Backend
cd walkumentary-backend
source venv/bin/activate
black .                   # Format Python code
isort .                   # Sort imports
flake8 .                  # Linting
mypy app/                 # Type checking
```

## 7. Troubleshooting

### 7.1 Common Issues & Solutions

**Node.js Version Issues:**
```bash
# Use nvm to manage Node.js versions
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18
nvm alias default 18
```

**Python Virtual Environment Issues:**
```bash
# Remove and recreate virtual environment
rm -rf venv
python3.9 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

**Port Already in Use:**
```bash
# Find and kill process using port 3000 or 8000
lsof -ti:3000 | xargs kill -9
lsof -ti:8000 | xargs kill -9

# Or use different ports
npm run dev -- --port 3001
uvicorn app.main:app --port 8001
```

**Database Connection Issues:**
```bash
# Check PostgreSQL is running
pg_isready -h localhost -p 5432

# Check Redis is running
redis-cli ping

# Reset database (if needed)
alembic downgrade base
alembic upgrade head
```

### 7.2 Performance Optimization

**Frontend Optimization:**
```bash
# Analyze bundle size
npm run build
npm run analyze

# Optimize dependencies
npm audit fix
npm update
```

**Backend Optimization:**
```bash
# Profile code performance
pip install py-spy
py-spy record -o profile.svg -- python -m uvicorn app.main:app

# Check dependency vulnerabilities
pip-audit
```

## 8. Deployment Preparation

### 8.1 Environment-Specific Configurations

**Development Environment:**
- Local database and Redis
- Debug mode enabled
- Hot reloading
- Detailed error messages

**Staging Environment:**
- Cloud database (Supabase)
- Cloud Redis (Upstash)
- Production builds
- Error tracking enabled

**Production Environment:**
- All optimizations enabled
- Security headers
- Rate limiting
- Monitoring and alerting

### 8.2 Security Checklist

- [ ] All API keys stored in environment variables
- [ ] No sensitive data in Git repository
- [ ] HTTPS enabled for all environments
- [ ] CORS properly configured
- [ ] Rate limiting implemented
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (parameterized queries)
- [ ] Authentication and authorization working
- [ ] Error messages don't leak sensitive information

## 9. Getting Help

### 9.1 Documentation Resources

- **Next.js:** [nextjs.org/docs](https://nextjs.org/docs)
- **FastAPI:** [fastapi.tiangolo.com](https://fastapi.tiangolo.com)
- **Supabase:** [supabase.com/docs](https://supabase.com/docs)
- **Tailwind CSS:** [tailwindcss.com/docs](https://tailwindcss.com/docs)
- **OpenAI API:** [platform.openai.com/docs](https://platform.openai.com/docs)
- **Anthropic API:** [docs.anthropic.com](https://docs.anthropic.com)

### 9.2 Community Resources

- **GitHub Discussions:** For project-specific questions
- **Stack Overflow:** For general development issues
- **Discord/Slack:** For real-time help (if available)

This environment setup guide ensures a consistent and productive development experience across all team members and development phases.