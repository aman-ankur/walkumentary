# Walkumentary Backend Setup Guide

## Project Structure Overview

```
walkumentary/
├── .env                    # Environment variables (root level)
├── venv_walk/             # Virtual environment (root level only)
├── app/                   # FastAPI application
│   ├── main.py           # Application entry point
│   ├── config.py         # Configuration settings
│   ├── database.py       # Database configuration
│   ├── models/           # SQLAlchemy models
│   ├── schemas/          # Pydantic schemas
│   ├── routers/          # API route handlers
│   └── services/         # Business logic services
├── frontend/              # Next.js frontend
└── requirements.txt       # Python dependencies
```

## Backend Server Setup Instructions

### 1. Prerequisites
- Python 3.9+
- PostgreSQL database (Supabase)
- Required API keys (OpenAI, Anthropic)

### 2. Environment Setup

**Create/Verify .env file in project root:**
```bash
# Copy .env.example to .env and fill in your values
cp .env.example .env
```

**Required environment variables:**
```env
SECRET_KEY="your-secret-key-here"
DATABASE_URL="postgresql://username:password@host:port/database"
SUPABASE_URL="https://your-project.supabase.co/"
SUPABASE_SERVICE_KEY="your-service-key"
SUPABASE_ANON_KEY="your-anon-key"
OPENAI_API_KEY="your-openai-key"
ANTHROPIC_API_KEY="your-anthropic-key"
```

### 3. Virtual Environment Setup

**Create virtual environment (first time only):**
```bash
cd walkumentary
python3 -m venv venv_walk
```

**Activate virtual environment:**
```bash
# On macOS/Linux:
source venv_walk/bin/activate

# On Windows:
venv_walk\Scripts\activate
```

### 4. Install Dependencies

```bash
# Make sure virtual environment is activated
pip install -r requirements.txt

# If you encounter missing packages, install them individually:
pip install "pydantic[email]"
pip install greenlet
```

### 5. Start the Backend Server

**From project root directory:**
```bash
# Activate virtual environment
source venv_walk/bin/activate

# Start server with hot reload
uvicorn app.main:app --reload

# Or with custom host/port
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Server will be available at:**
- Local: http://127.0.0.1:8000
- Network: http://0.0.0.0:8000 (if using --host 0.0.0.0)
- API docs: http://127.0.0.1:8000/docs
- ReDoc: http://127.0.0.1:8000/redoc

### 6. Import Structure Rules

**IMPORTANT: All imports must use absolute paths from project root**

✅ **Correct import patterns:**
```python
from app.models.user import User
from app.schemas.auth import UserResponse
from app.services.ai_service import AIService
from app.config import settings
```

❌ **Incorrect import patterns:**
```python
from models.user import User          # Missing 'app' prefix
from schemas.auth import UserResponse # Missing 'app' prefix
from ..models.user import User        # Relative imports
```

**Import rules by location:**
- **Router files** (`app/routers/`): Use `from app.schemas.xxx import`
- **Service files** (`app/services/`): Use `from app.models.xxx import`
- **Schema files** (`app/schemas/`): Use `from app.schemas.base import`
- **Model files** (`app/models/`): Use `from app.models.base import`

### 7. Common Issues & Solutions

**Issue: ModuleNotFoundError for schemas**
- **Solution**: Update imports to use `app.schemas` instead of `schemas`

**Issue: email_validator not found**
- **Solution**: `pip install "pydantic[email]"`

**Issue: greenlet library required**
- **Solution**: `pip install greenlet`

**Issue: .env file not found**
- **Solution**: Ensure `.env` is in project root, config looks for `.env` not `../.env`

**Issue: Database connection failed**
- **Solution**: Verify DATABASE_URL and Supabase credentials in `.env`

### 8. Development Workflow

1. **Always run from project root:** `/path/to/walkumentary/`
2. **Always activate venv first:** `source venv_walk/bin/activate`
3. **Use absolute imports:** Start all imports with `app.`
4. **Keep .env in root:** Don't move environment file
5. **Single venv location:** Only `venv_walk/` in root, not in subfolders

### 9. Testing the Setup

**Quick health check:**
```bash
curl http://127.0.0.1:8000/health
```

**Expected response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### 10. Deployment Notes

- Environment variables must be set in production environment
- Database migrations may be required for new deployments
- Ensure all required packages are in `requirements.txt`
- Use production-grade WSGI server (not uvicorn with --reload)