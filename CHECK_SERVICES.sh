#!/bin/bash

echo "🔍 Checking Dr.Nearby Services..."
echo ""

# Check API Gateway
echo "1. API Gateway (Port 5501):"
if lsof -ti:5501 > /dev/null 2>&1; then
    echo "   ✅ Running"
    curl -s http://localhost:5501/api | head -1
else
    echo "   ❌ Not running"
fi
echo ""

# Check Patient Service
echo "2. Patient Service (Port 5502):"
if lsof -ti:5502 > /dev/null 2>&1; then
    echo "   ✅ Running"
    curl -s http://localhost:5502/health | head -1
else
    echo "   ❌ Not running"
fi
echo ""

# Check Doctor Service
echo "3. Doctor Service (Port 5503):"
if lsof -ti:5503 > /dev/null 2>&1; then
    echo "   ✅ Running"
    curl -s http://localhost:5503/health | head -1
else
    echo "   ❌ Not running"
fi
echo ""

# Check Admin Service
echo "4. Admin Service (Port 5504):"
if lsof -ti:5504 > /dev/null 2>&1; then
    echo "   ✅ Running"
else
    echo "   ❌ Not running"
fi
echo ""

# Check Consultation Service
echo "5. Consultation Service (Port 5505):"
if lsof -ti:5505 > /dev/null 2>&1; then
    echo "   ✅ Running"
    curl -s http://localhost:5505/health | head -1
else
    echo "   ❌ Not running"
fi
echo ""

# Check Signaling Service
echo "6. Signaling Service (Port 5506):"
if lsof -ti:5506 > /dev/null 2>&1; then
    echo "   ✅ Running"
    curl -s http://localhost:5506/health | head -1
else
    echo "   ❌ Not running"
fi
echo ""

# Check MongoDB
echo "7. MongoDB (Port 27017):"
if lsof -ti:27017 > /dev/null 2>&1; then
    echo "   ✅ Running"
else
    echo "   ❌ Not running - This will cause login/registration to fail!"
fi
echo ""

echo "To start all services, run: ./START_SERVICES.sh"
