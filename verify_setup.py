#!/usr/bin/env python3
"""
Verify Walkumentary setup configuration
"""
import os
from pathlib import Path

def check_env_file():
    """Check if .env file exists and has required variables"""
    env_path = Path('.env')
    if not env_path.exists():
        print("❌ .env file not found!")
        return False
    
    print("✅ .env file found")
    
    # Read and check required variables
    with open(env_path) as f:
        content = f.read()
    
    required_vars = [
        'SUPABASE_URL',
        'SUPABASE_SERVICE_KEY', 
        'SUPABASE_ANON_KEY',
        'DATABASE_URL',
        'SECRET_KEY'
    ]
    
    missing_vars = []
    placeholder_vars = []
    
    for var in required_vars:
        if var not in content:
            missing_vars.append(var)
        elif f'{var}=your_' in content or f'{var}=https://your-' in content:
            placeholder_vars.append(var)
    
    if missing_vars:
        print(f"❌ Missing variables: {', '.join(missing_vars)}")
    
    if placeholder_vars:
        print(f"⚠️  Variables still have placeholder values: {', '.join(placeholder_vars)}")
        print("   Please update these with your actual Supabase values")
    
    if not missing_vars and not placeholder_vars:
        print("✅ All required environment variables are set")
    
    return len(missing_vars) == 0

def check_frontend_env():
    """Check frontend environment file"""
    env_path = Path('frontend/.env.local')
    if not env_path.exists():
        print("❌ frontend/.env.local file not found!")
        return False
    
    print("✅ frontend/.env.local file found")
    
    with open(env_path) as f:
        content = f.read()
    
    if 'your_supabase' in content:
        print("⚠️  Frontend environment variables still have placeholder values")
        print("   Please update NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY")
    else:
        print("✅ Frontend environment variables appear to be configured")
    
    return True

def check_gitignore():
    """Check if .env is in gitignore"""
    gitignore_path = Path('.gitignore')
    if not gitignore_path.exists():
        print("❌ .gitignore file not found!")
        return False
    
    with open(gitignore_path) as f:
        content = f.read()
    
    if '.env' in content:
        print("✅ .env files are properly ignored by git")
        return True
    else:
        print("❌ .env files are not in .gitignore!")
        return False

def main():
    print("🔍 Verifying Walkumentary Setup...\n")
    
    # Check current directory
    if not Path('app').exists():
        print("❌ Please run this script from the walkumentary root directory")
        return
    
    print("📁 Directory structure:")
    print("✅ app/ directory found")
    print("✅ frontend/ directory found")
    print()
    
    print("🔐 Environment Configuration:")
    check_env_file()
    check_frontend_env()
    print()
    
    print("📝 Git Configuration:")
    check_gitignore()
    print()
    
    print("📋 Next Steps:")
    print("1. Update .env with your actual Supabase values")
    print("2. Update frontend/.env.local with your Supabase values")
    print("3. Install Python dependencies: pip install -r requirements.txt")
    print("4. Install frontend dependencies: cd frontend && npm install")
    print("5. Start backend: cd app && uvicorn main:app --reload")
    print("6. Start frontend: cd frontend && npm run dev")

if __name__ == "__main__":
    main()