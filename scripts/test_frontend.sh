#!/bin/bash

# Frontend Test Runner
# Runs Jest tests with coverage

set -e

echo "📱 Running Frontend Tests"
echo "========================="

cd frontend

# Run tests with coverage
npm test -- --watchAll=false --coverage --coverageDirectory=../coverage/frontend

echo ""
echo "📊 Frontend test coverage report generated in coverage/frontend/"
echo "Open coverage/frontend/lcov-report/index.html to view detailed coverage"