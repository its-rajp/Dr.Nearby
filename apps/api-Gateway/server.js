// apps/api-gateway/server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createProxyMiddleware } from 'http-proxy-middleware';
import path from 'path';
import { fileURLToPath } from 'url';

// Determine __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = express();
const PORT = process.env.API_GATEWAY_PORT || 5501;

// CORS: Allow your frontend (http-server on port 8000)
app.use(cors({
  origin: (origin, callback) => {
    callback(null, true); // Allow any origin for development
  },
  credentials: true
}));

// Logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Shared error handler for proxy failures
const onProxyError = (err, req, res) => {
  console.error(`❌ Proxy Error [${req.originalUrl}]: ${err.message}`);
  res.status(502).json({ success: false, message: 'Service unavailable. The backend service is likely down.', error: err.message });
};

// --- Unified Profile Proxy ---
app.use('/api/profile/:id', (req, res, next) => {
  const { id } = req.params;
  const role = req.query.role;

  if (!role) {
    return res.status(400).json({ success: false, message: 'Role query parameter is required (?role=doctor or ?role=patient)' });
  }

  let targetPort;
  let targetPath;

  if (role === 'doctor') {
    targetPort = process.env.DOCTOR_SERVICE_PORT || 5503;
    targetPath = `/doctor/profile/${id}`;
  } else if (role === 'patient') {
    targetPort = process.env.PATIENT_SERVICE_PORT || 5502;
    targetPath = `/patient/profile/${id}`;
  } else {
    return res.status(400).json({ success: false, message: 'Invalid role' });
  }

  console.log(`[Gateway] Unified Profile Request: ${id} (${role}) -> port ${targetPort}${targetPath}`);

  return createProxyMiddleware({
    target: `http://127.0.0.1:${targetPort}`,
    changeOrigin: true,
    pathRewrite: () => targetPath,
    onError: onProxyError
  })(req, res, next);
});

// ---Patient Service Proxy---
// All routes targeting the Patient Service (auth, profile, medical-history, health-records, medicines, orders)
// Use req.originalUrl in pathRewrite so it works even when Express sets req.url to '/' for mounted paths
app.use(
  ['/api/auth', '/api/patients', '/api/patient', '/api/medical-history', '/api/health-records', '/api/medicines', '/api/orders', '/api/payments/medicines'],
  createProxyMiddleware({
    target: `http://127.0.0.1:${process.env.PATIENT_SERVICE_PORT || 5502}`,
    changeOrigin: true,
    pathRewrite: (path, req) => {
      const url = req.originalUrl || req.url || path || '';
      console.log(`[Gateway] Rewriting Patient Service path: ${url}`);
      
      if (url.startsWith('/api/auth')) {
        // /api/auth/register -> /register, /api/auth/login -> /login
        let newPath = url.replace('/api/auth', '');
        // If empty or doesn't start with /, add it
        if (!newPath || !newPath.startsWith('/')) {
          newPath = '/' + (newPath || '');
        }
        // Remove double slashes
        newPath = newPath.replace(/\/+/g, '/');
        console.log(`[Gateway] Auth path rewritten: ${url} -> ${newPath}`);
        return newPath;
      }
      if (url.startsWith('/api/patients') || url.startsWith('/api/patient')) {
        const result = url.replace(/^\/api\/patients?/, '/patient');
        console.log(`[Gateway] Patient path rewritten to: ${result}`);
        return result;
      }
      if (url.startsWith('/api/medical-history')) {
        // Rewrite /api/medical-history -> /patient/medical-history
        // Rewrite /api/medical-history/123 -> /patient/medical-history/123
        const result = url.replace('/api', '/patient');
        console.log(`[Gateway] Medical history path rewritten to: ${result}`);
        return result;
      }
      const result = url.replace('/api', '/patient');
      console.log(`[Gateway] Default path rewritten to: ${result}`);
      return result;
    },
    onError: onProxyError
  })
);

// --- Uploads Proxy ---
app.use('/uploads', createProxyMiddleware({
  target: `http://127.0.0.1:${process.env.PATIENT_SERVICE_PORT || 5502}`,
  changeOrigin: true,
  pathRewrite: (path, req) => {
    // We must preserve /uploads prefix because Patient Service expects /uploads/filename
    // Express app.use('/uploads', ...) strips the prefix from req.url, so 'path' is just '/filename'
    // We use req.originalUrl to get the full path including /uploads
    
    // Also handle doctor logic if needed (though we rely on router)
    if (path.includes('doctor-')) {
       // Doctor service also serves at /uploads now
       // So just return the original URL
    }
    return req.originalUrl;
  },
  router: (req) => {
      if (req.url.includes('doctor-')) {
          return `http://127.0.0.1:${process.env.DOCTOR_SERVICE_PORT || 5503}`;
      }
      return `http://127.0.0.1:${process.env.PATIENT_SERVICE_PORT || 5502}`;
  },
  onError: onProxyError
}));

// --- Other Service Proxies ---
// Doctor Service Proxy - use req.originalUrl to avoid path stripping issues
// Include /doctors/search which might be called by frontend
app.use(['/api/doctor', '/api/doctors'], createProxyMiddleware({
  target: `http://127.0.0.1:${process.env.DOCTOR_SERVICE_PORT || 5503}`,
  changeOrigin: true,
  pathRewrite: (path, req) => {
    const url = req.originalUrl || req.url || path || '';
    console.log(`[Gateway] Rewriting Doctor Service path: ${url}`);
    
    if (url.startsWith('/api/doctors')) {
        // Explicitly handle /api/doctors/list -> /doctor/list
        if (url.includes('/list')) {
            const result = '/doctor/list';
            console.log(`[Gateway] Doctors list path rewritten to: ${result}`);
            return result;
        }
        const result = url.replace('/api/doctors', '/doctor'); // Map /api/doctors/search -> /doctor/search if needed, or check routes
        // Wait, Doctor Service route for list is /doctor/list. 
        // Frontend calls /api/doctors/search?query=
        // So we should rewrite /api/doctors/search -> /doctor/list or /doctor/search
        // Looking at doctor.routes.js: router.get('/list', ...)
        if (url.includes('search')) {
             return '/doctor/list';
        }
        console.log(`[Gateway] Doctors path rewritten to: ${result}`);
        return result;
    }
    
    if (url.startsWith('/api/doctor')) {
      const result = url.replace('/api/doctor', '/doctor');
      console.log(`[Gateway] Doctor path rewritten to: ${result}`);
      return result;
    }
    console.log(`[Gateway] Doctor path unchanged: ${path}`);
    return path;
  },
  onError: onProxyError
}));

app.use(
  '/api/admin',
  createProxyMiddleware({
    target: `http://127.0.0.1:${process.env.ADMIN_SERVICE_PORT || 5504}`,
    changeOrigin: true,
    pathRewrite: (path, req) => req.originalUrl.replace('/api/admin', '/admin'),
    onError: onProxyError
  })
);

app.use(
  ['/api/appointments', '/api/consultations', '/api/notifications', '/api/prescriptions', '/api/lab-tests', '/api/payments'],
  createProxyMiddleware({
    target: `http://127.0.0.1:${process.env.CONSULTATION_SERVICE_PORT || 5505}`,
    changeOrigin: true,
    pathRewrite: (path, req) => {
      const url = req.originalUrl || req.url || path || '';
      // Handle prescriptions - direct route
      if (url.startsWith('/api/prescriptions')) {
        return url.replace('/api/prescriptions', '/consultations/prescriptions');
      }
      // Handle notifications - direct route
      if (url.startsWith('/api/notifications')) {
        return url.replace('/api/notifications', '/consultations/notifications');
      }
      // Handle lab-tests - rewrite to /consultations/lab-tests
      if (url.startsWith('/api/lab-tests')) {
        return url.replace('/api/lab-tests', '/consultations/lab-tests');
      }
      // Default: strip /api prefix
      return url.replace('/api', '');
    },
    onError: onProxyError
  })
);

// Health check endpoint
app.get('/api', (req, res) => {
  res.json({
    service: 'Dr.Nearby API Gateway',
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Handle 404 for unknown routes
app.use('*', (req, res) => {
  console.log(`⚠️ 404 Not Found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ success: false, message: `API route not found: ${req.method} ${req.originalUrl}` });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Dr.Nearby API Gateway running on http://localhost:${PORT}`);
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use. Please stop the existing server.`);
    process.exit(1);
  }
});

// Graceful shutdown handler
const shutdown = (signal) => {
  console.log(`${signal} received, shutting down API Gateway...`);
  // Force close all active connections (Node.js 18.2+)
  if (server.closeAllConnections) server.closeAllConnections();
  
  server.close(() => {
    console.log('API Gateway server closed. Exiting process.');
    process.exit(0);
  });
};

// Handle nodemon restarts (SIGUSR2) and other termination signals
process.once('SIGUSR2', () => shutdown('SIGUSR2'));
process.once('SIGINT', () => shutdown('SIGINT'));
process.once('SIGTERM', () => shutdown('SIGTERM'));