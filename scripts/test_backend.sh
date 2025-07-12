#!/bin/bash

# Backend Test Runner
# Runs pytest with coverage

set -e

echo "🔧 Running Backend Tests"
echo "========================"

# Activate virtual environment
source venv_walk/bin/activate

# Run tests with coverage
python -m pytest app/tests/ -v --cov=app --cov-report=html:coverage/backend --cov-report=term-missing

echo ""
echo "📊 Backend test coverage report generated in coverage/backend/"
echo "Open coverage/backend/index.html to view detailed coverage"