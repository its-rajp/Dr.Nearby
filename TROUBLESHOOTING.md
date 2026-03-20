# Dr.Nearby - Troubleshooting Guide

## 🔴 Login/Registration Errors

### Error: "An error occurred during login/registration"

**Common Causes & Solutions:**

#### 1. Services Not Running
**Check:**
```bash
# Check if services are running
lsof -i:5501  # API Gateway
lsof -i:5502  # Patient Service
lsof -i:5503  # Doctor Service
lsof -i:5504  # Admin Service
lsof -i:5505  # Consultation Service
```

**Solution:**
- Start all services using the startup script:
  ```bash
  ./START_SERVICES.sh
  ```
- Or start manually (see PROJECT_SETUP.md)

#### 2. MongoDB Not Running
**Check:**
```bash
# Check if MongoDB is running
pgrep mongod
# OR
mongosh --eval "db.version()"
```

**Solution:**
```bash
# Start MongoDB
mongod
# OR if using Homebrew
brew services start mongodb-community
```

#### 3. Missing .env File
**Check:**
```bash
ls -la .env
```

**Solution:**
Create `.env` file in root directory:
```env
MONGODB_URI=mongodb://127.0.0.1:27017/dr.nearby
JWT_SECRET=dr_nearby_jwt_secret_v2_2025
API_GATEWAY_PORT=5501
PATIENT_SERVICE_PORT=5502
DOCTOR_SERVICE_PORT=5503
ADMIN_SERVICE_PORT=5504
CONSULTATION_SERVICE_PORT=5505
FRONTEND_URL=http://127.0.0.1:8000
```

#### 4. Port Conflicts
**Check:**
```bash
lsof -i:5501
lsof -i:5502
```

**Solution:**
```bash
# Kill processes on ports
lsof -ti:5501,5502,5503,5504,5505 | xargs kill -9
```

#### 5. Network/CORS Issues
**Check browser console for:**
- CORS errors
- Network errors
- Failed fetch requests

**Solution:**
- Ensure frontend is served from port 8000
- Check API Gateway CORS configuration
- Verify API_BASE_URL in `apps/js/config.js` is `http://localhost:5501/api`

## 🔍 Diagnostic Steps

### Step 1: Verify Services Are Running
```bash
# Check API Gateway
curl http://localhost:5501/api
# Should return: {"service":"Dr.Nearby API Gateway","status":"healthy",...}

# Check Patient Service
curl http://localhost:5502/health
# Should return: {"status":"UP","service":"Patient-Service"}
```

### Step 2: Test Authentication Endpoints
```bash
# Test registration endpoint
curl -X POST http://localhost:5501/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@test.com","password":"test123","phone":"1234567890","dob":"2000-01-01","gender":"male"}'

# Test login endpoint
curl -X POST http://localhost:5501/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'
```

### Step 3: Check Service Logs
Look for error messages in service console output:
- MongoDB connection errors
- Route not found errors
- Port already in use errors

### Step 4: Verify MongoDB Connection
```bash
# Test MongoDB connection
mongosh mongodb://127.0.0.1:27017/dr.nearby
# Should connect successfully
```

## 🛠️ Quick Fixes

### Restart All Services
```bash
# Kill all services
lsof -ti:5501,5502,5503,5504,5505 | xargs kill -9

# Start all services
./START_SERVICES.sh
```

### Clear Browser Cache
- Clear browser cache and localStorage
- Open browser DevTools → Application → Clear Storage

### Check Environment Variables
```bash
# Verify .env file exists and has correct values
cat .env
```

## 📋 Service Health Checklist

- [ ] MongoDB is running
- [ ] .env file exists in root directory
- [ ] API Gateway is running on port 5501
- [ ] Patient Service is running on port 5502
- [ ] Doctor Service is running on port 5503
- [ ] Admin Service is running on port 5504
- [ ] Consultation Service is running on port 5505
- [ ] Frontend server is running on port 8000
- [ ] No port conflicts
- [ ] Browser console shows no CORS errors

## 🆘 Still Having Issues?

1. **Check Service Logs**: Look at console output for each service
2. **Check Browser Console**: Open DevTools (F12) and check for errors
3. **Verify Network Tab**: Check if requests are reaching the server
4. **Test Direct API Calls**: Use curl or Postman to test endpoints directly
5. **Check MongoDB**: Ensure MongoDB is accessible and database exists

## 📞 Common Error Messages

| Error Message | Likely Cause | Solution |
|--------------|--------------|----------|
| "Cannot connect to server" | Services not running | Start all services |
| "MongoDB connection failed" | MongoDB not running | Start MongoDB |
| "Port already in use" | Port conflict | Kill existing process |
| "Route not found" | Service not running or wrong route | Check service status |
| "Invalid credentials" | Wrong email/password | Use correct credentials |
| "User already exists" | Email already registered | Use different email |
