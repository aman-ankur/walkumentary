#!/bin/bash

# Demo Setup Script for Walkumentary
# This sets up instant demo data for recording purposes

set -e

echo "🎬 Setting up Walkumentary demo data..."

# Activate virtual environment if it exists
if [ -d "venv_walk" ]; then
    echo "Activating virtual environment..."
    source venv_walk/bin/activate
fi

# Ensure we're in the right directory
cd "$(dirname "$0")/.."

# Run the complete demo setup  
echo "Creating production-ready demo with real audio and transcript sync..."
python scripts/create_complete_demo.py

echo ""
echo "✅ Demo setup complete!"
echo ""
echo "🎥 For recording your demo:"
echo "1. Start your backend: python app/main.py"
echo "2. Start your frontend: cd frontend && npm run dev"
echo "3. Navigate to localhost:3000"
echo "4. Log in with your Gmail account (the one you provided)"
echo "5. Search for 'Central Park'"
echo "6. Select interests: history, architecture, nature"
echo "7. Set duration: 30 minutes"
echo "8. Click Generate Tour - it will appear instantly!"
echo ""
echo "🧹 To clean up demo data later:"
echo "   Delete tours for your email from your database" 