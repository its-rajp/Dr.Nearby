#!/bin/bash

# Dr.Nearby - Service Startup Script
# This script helps start all services and check their status

echo "🚀 Starting Dr.Nearby Services..."
echo ""

# Check if MongoDB is running
echo "📊 Checking MongoDB..."
if pgrep -x "mongod" > /dev/null || pgrep -x "mongosh" > /dev/null; then
    echo "✅ MongoDB appears to be running"
else
    echo "⚠️  MongoDB does not appear to be running"
    echo "   Please start MongoDB with: mongod"
    echo "   Or: brew services start mongodb-community"
    echo ""
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Creating default .env file..."
    cat > .env << EOF
MONGODB_URI=mongodb://127.0.0.1:27017/drnearby
JWT_SECRET=dr_nearby_jwt_secret_v2_2025
API_GATEWAY_PORT=5501
PATIENT_SERVICE_PORT=5502
DOCTOR_SERVICE_PORT=5503
ADMIN_SERVICE_PORT=5504
CONSULTATION_SERVICE_PORT=5505
SIGNALING_SERVICE_PORT=5506
FRONTEND_URL=http://127.0.0.1:8000
EOF
    echo "✅ Created .env file"
    echo ""
fi

# Kill existing processes on ports
echo "🧹 Cleaning up existing processes on ports 5501-5506..."
lsof -ti:5501,5502,5503,5504,5505,5506 | xargs kill -9 2>/dev/null || true
sleep 2

# Start services
echo ""
echo "🚀 Starting services..."
echo ""

# Start API Gateway
echo "Starting API Gateway (port 5501)..."
cd apps/api-Gateway
node server.js &
API_GATEWAY_PID=$!
cd ../..
sleep 2

# Start Patient Service
echo "Starting Patient Service (port 5502)..."
cd apps/Patient-service
node server.js &
PATIENT_SERVICE_PID=$!
cd ../..
sleep 2

# Start Doctor Service
echo "Starting Doctor Service (port 5503)..."
cd apps/Doctor-service
node server.js &
DOCTOR_SERVICE_PID=$!
cd ../..
sleep 2

# Start Admin Service
echo "Starting Admin Service (port 5504)..."
cd apps/admin-service
node server.js &
ADMIN_SERVICE_PID=$!
cd ../..
sleep 2

# Start Consultation Service
echo "Starting Consultation Service (port 5505)..."
cd apps/Consultation-service
node server.js &
CONSULTATION_SERVICE_PID=$!
cd ../..
sleep 2

echo "Starting Signaling Service (port 5506)..."
cd apps/signaling-service
node server.js &
SIGNALING_SERVICE_PID=$!
cd ../..
sleep 2

echo ""
echo "✅ All services started!"
echo ""
echo "Service PIDs:"
echo "  API Gateway: $API_GATEWAY_PID"
echo "  Patient Service: $PATIENT_SERVICE_PID"
echo "  Doctor Service: $DOCTOR_SERVICE_PID"
echo "  Admin Service: $ADMIN_SERVICE_PID"
echo "  Consultation Service: $CONSULTATION_SERVICE_PID"
echo "  Signaling Service: $SIGNALING_SERVICE_PID"
echo ""
echo "To stop all services, run:"
echo "  kill $API_GATEWAY_PID $PATIENT_SERVICE_PID $DOCTOR_SERVICE_PID $ADMIN_SERVICE_PID $CONSULTATION_SERVICE_PID $SIGNALING_SERVICE_PID"
echo ""
echo "🌐 Frontend: Start with 'cd apps && python3 -m http.server 8000'"
echo ""
