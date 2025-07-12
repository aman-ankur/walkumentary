#!/bin/bash

# Walkumentary Test Runner
# Runs both frontend and backend tests

set -e

echo "🚀 Running Walkumentary Test Suite"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${2}${1}${NC}"
}

# Track test results
FRONTEND_PASSED=false
BACKEND_PASSED=false

# Run Frontend Tests
echo ""
print_status "📱 Running Frontend Tests..." "$YELLOW"
echo "------------------------------"

cd frontend

if npm test -- --watchAll=false --passWithNoTests; then
    print_status "✅ Frontend tests passed!" "$GREEN"
    FRONTEND_PASSED=true
else
    print_status "❌ Frontend tests failed!" "$RED"
fi

# Run Backend Tests
echo ""
print_status "🔧 Running Backend Tests..." "$YELLOW"
echo "-----------------------------"

cd ../

# Activate virtual environment and run tests
if source venv_walk/bin/activate && python -m pytest app/tests/ -v --tb=short; then
    print_status "✅ Backend tests passed!" "$GREEN"
    BACKEND_PASSED=true
else
    print_status "❌ Backend tests failed!" "$RED"
fi

# Summary
echo ""
echo "📊 Test Summary"
echo "==============="

if [ "$FRONTEND_PASSED" = true ]; then
    print_status "Frontend: PASSED" "$GREEN"
else
    print_status "Frontend: FAILED" "$RED"
fi

if [ "$BACKEND_PASSED" = true ]; then
    print_status "Backend:  PASSED" "$GREEN"
else
    print_status "Backend:  FAILED" "$RED"
fi

echo ""

# Exit with error if any tests failed
if [ "$FRONTEND_PASSED" = true ] && [ "$BACKEND_PASSED" = true ]; then
    print_status "🎉 All tests passed!" "$GREEN"
    exit 0
else
    print_status "💥 Some tests failed!" "$RED"
    exit 1
fi