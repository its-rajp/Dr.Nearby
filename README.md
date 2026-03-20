# 🏥 Dr.Nearby - Healthcare Management System

A comprehensive microservices-based healthcare platform for patients, doctors, and administrators.

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v14 or higher)
- **MongoDB** (running locally or remote)
- **npm** or **yarn**

### 1. Environment Setup

Create a `.env` file in the root directory:

```bash
cd /Users/rajpujari/Drnearby
cat > .env << EOF
MONGODB_URI=mongodb://127.0.0.1:27017/drnearby
JWT_SECRET=dr_nearby_jwt_secret_v2_2025
API_GATEWAY_PORT=5501
PATIENT_SERVICE_PORT=5502
DOCTOR_SERVICE_PORT=5503
ADMIN_SERVICE_PORT=5504
CONSULTATION_SERVICE_PORT=5505
FRONTEND_URL=http://127.0.0.1:8000
EOF
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install service dependencies
cd apps/api-Gateway && npm install && cd ../..
cd apps/Patient-service && npm install && cd ../..
cd apps/Doctor-service && npm install && cd ../..
cd apps/admin-service && npm install && cd ../..
cd apps/Consultation-service && npm install && cd ../..
```

### 3. Start MongoDB

```bash
# Option 1: Direct start
mongod

# Option 2: Using Homebrew service
brew services start mongodb-community

# Option 3: Using Docker
docker run -d -p 27017:27017 --name mongodb mongo
```

### 4. Start All Services

**Option A: Using the startup script (Recommended)**
```bash
./START_SERVICES.sh
```

**Option B: Using npm script**
```bash
npm run dev
```

**Option C: Manual start (5 terminals)**
```bash
# Terminal 1 - API Gateway
cd apps/api-Gateway && node server.js

# Terminal 2 - Patient Service
cd apps/Patient-service && node server.js

# Terminal 3 - Doctor Service
cd apps/Doctor-service && node server.js

# Terminal 4 - Admin Service
cd apps/admin-service && node server.js

# Terminal 5 - Consultation Service
cd apps/Consultation-service && node server.js
```

### 5. Start Frontend Server

```bash
cd apps
python3 -m http.server 8000
# OR
npx http-server -p 8000
```

### 6. Access the Application

Open your browser and navigate to:
```
http://localhost:8000
```

## 📋 Project Structure

```
Drnearby/
├── apps/
│   ├── api-Gateway/          # API Gateway (Port 5501)
│   │   ├── server.js
│   │   └── package.json
│   ├── Patient-service/      # Patient Service (Port 5502)
│   │   ├── server.js
│   │   ├── routes/
│   │   ├── Controllers/
│   │   ├── models/
│   │   └── package.json
│   ├── Doctor-service/       # Doctor Service (Port 5503)
│   ├── admin-service/        # Admin Service (Port 5504)
│   ├── Consultation-service/ # Consultation Service (Port 5505)
│   ├── Shared/               # Shared utilities
│   │   └── Config/
│   │       └── db.js
│   ├── js/                   # Frontend JavaScript
│   │   ├── auth.js
│   │   ├── profile.js
│   │   └── config.js
│   ├── css/                  # Stylesheets
│   └── *.html                # Frontend pages
├── .env                      # Environment variables
├── package.json              # Root package.json
├── README.md                 # This file
├── PROJECT_SETUP.md          # Detailed setup guide
├── TROUBLESHOOTING.md        # Troubleshooting guide
├── COMPLETION_SUMMARY.md     # Project completion summary
└── START_SERVICES.sh         # Service startup script
```

## ✨ Features

### Patient Features
- ✅ User Registration & Login
- ✅ Profile Management (View & Edit)
- ✅ Medical History (View & Edit)
- ✅ Health Records Upload & View
- ✅ Medicine Catalog & Ordering
- ✅ Appointment Booking
- ✅ Online Consultations

### Doctor Features
- ✅ Doctor Login
- ✅ Patient Management
- ✅ Appointment Management
- ✅ Consultation Management
- ✅ Prescription Management

### Admin Features
- ✅ Admin Login
- ✅ User Management
- ✅ Doctor Management
- ✅ System Administration

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Patient Profile
- `GET /api/patients/profile` - Get patient profile
- `PUT /api/patients/profile` - Update patient profile

### Medical History
- `GET /api/medical-history` - Get medical history
- `PUT /api/medical-history` - Update medical history

### Health Records
- `GET /api/health-records` - Get health records
- `POST /api/health-records/upload` - Upload health record

### Medicines
- `GET /api/medicines` - Get medicine catalog
- `POST /api/orders` - Place medicine order

## 🛠️ Troubleshooting

### Common Issues

**Login/Registration Errors:**
1. Check if all services are running
2. Verify MongoDB is running
3. Check `.env` file exists
4. See `TROUBLESHOOTING.md` for detailed solutions

**Port Already in Use:**
```bash
lsof -ti:5501,5502,5503,5504,5505 | xargs kill -9
```

**MongoDB Connection Failed:**
```bash
# Check MongoDB status
mongosh --eval "db.version()"

# Start MongoDB
mongod
```

For more detailed troubleshooting, see `TROUBLESHOOTING.md`.

## 📚 Documentation

- **PROJECT_SETUP.md** - Complete setup instructions
- **TROUBLESHOOTING.md** - Detailed troubleshooting guide
- **COMPLETION_SUMMARY.md** - Project completion summary

## 🔒 Security Features

- Password hashing with bcrypt
- JWT token authentication
- Protected API routes
- CORS configuration
- Input validation
- Password exclusion from responses

## 🎯 Service Ports

| Service | Port | Description |
|---------|------|-------------|
| API Gateway | 5501 | Main entry point |
| Patient Service | 5502 | Patient operations |
| Doctor Service | 5503 | Doctor operations |
| Admin Service | 5504 | Admin operations |
| Consultation Service | 5505 | Consultations & appointments |
| Frontend | 8000 | Web interface |

## 📝 Development

### Adding New Features

1. Create routes in appropriate service
2. Add controllers for business logic
3. Create models if needed
4. Update API Gateway routing if needed
5. Update frontend JavaScript if needed

### Testing

Test endpoints using curl or Postman:
```bash
# Health check
curl http://localhost:5501/api
curl http://localhost:5502/health

# Test registration
curl -X POST http://localhost:5501/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@test.com","password":"test123","phone":"1234567890","dob":"2000-01-01","gender":"male"}'
```

## 🎉 Project Status

**✅ COMPLETE** - All core features implemented and tested.

## 📞 Support

For issues or questions:
1. Check `TROUBLESHOOTING.md`
2. Review service logs
3. Check browser console for errors
4. Verify all services are running

## 📄 License

This project is part of the Dr.Nearby healthcare platform.

---

**Built with:** Node.js, Express, MongoDB, JavaScript, HTML, CSS
