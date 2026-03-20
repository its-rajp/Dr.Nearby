#!/bin/bash

# Quick fix script - Run this from the root directory

echo "🔧 Fixing Dr.Nearby Services..."
echo ""

# Step 1: Kill all existing services
echo "🧹 Killing existing services on ports 5501-5505..."
lsof -ti:5501,5502,5503,5504,5505 | xargs kill -9 2>/dev/null || true
sleep 2
echo "✅ Ports cleared"
echo ""

# Step 2: Verify .env file
echo "📋 Checking .env file..."
if grep -q "dr\.nearby" .env 2>/dev/null; then
    echo "⚠️  Fixing database name in .env..."
    sed -i '' 's/dr\.nearby/drnearby/g' .env
    echo "✅ Database name fixed"
else
    echo "✅ .env file is correct"
fi
echo ""

# Step 3: Start services
echo "🚀 Starting all services..."
./START_SERVICES.sh
