# 🚨 Quick Fix Guide

## Current Issues:
1. ❌ Wrong directory - You're in `Consultation-service` but need to be in root
2. ❌ Port 5505 already in use - Services from previous run are still running
3. ❌ Database name still has dot - `.env` file needs to be updated

## 🔧 Step-by-Step Fix:

### Step 1: Go to Root Directory
```bash
cd /Users/rajpujari/Drnearby
```

### Step 2: Kill Existing Services
```bash
# Kill all services on ports 5501-5505
lsof -ti:5501,5502,5503,5504,5505 | xargs kill -9
```

### Step 3: Fix .env File
```bash
# Check current .env
cat .env

# If it shows dr.nearby, fix it:
sed -i '' 's/dr\.nearby/drnearby/g' .env

# Verify it's fixed
cat .env
# Should show: MONGODB_URI=mongodb://127.0.0.1:27017/drnearby
```

### Step 4: Start Services
```bash
./START_SERVICES.sh
```

### Step 5: Verify Services Started
You should see:
```
✅ Connected to MongoDB
✅ Doctor Service: Connected to MongoDB
✅ Consultation Service: Connected to MongoDB
```

## ✅ Expected Result:
All services should start successfully with MongoDB connections working!
