require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Import configurations
const { corsOptions } = require('./config/cors');

// Import routes
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const organizationRoutes = require('./routes/organizationRoutes');
const endpointRoutes = require('./routes/endpointRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const bulkUploadRoutes = require('./routes/bulkUploadRoutes');
const wazuhRoutes = require('./routes/wazuhRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

const app = express();

// Middleware for parsing JSON and URL-encoded data
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Enable CORS with options
app.use(cors(corsOptions));

// Handle preflight requests explicitly
app.options('*', cors(corsOptions));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log('Origin:', req.headers.origin);
  next();
});

// Root endpoint
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Nexus Backend API Status</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 40px;
            line-height: 1.6;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
          }
          .status {
            padding: 20px;
            background-color: #e7f3ff;
            border-radius: 5px;
            margin-bottom: 20px;
          }
          .endpoints {
            background-color: #f5f5f5;
            padding: 20px;
            border-radius: 5px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="status">
            <h1>✅ Nexus Backend API is Running</h1>
            <p>Server is operational and ready to accept requests.</p>
          </div>
          <div class="endpoints">
            <h2>Available Test Endpoints:</h2>
            <ul>
              <li><strong>Health Check:</strong> <a href="/api/health">/api/health</a></li>
              <li><strong>API Base:</strong> /api/...</li>
            </ul>
          </div>
        </div>
      </body>
    </html>
  `);
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    service: 'Nexus Backend API',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes - all prefixed with /api
app.use('/api', authRoutes);
app.use('/api', adminRoutes);
app.use('/api', organizationRoutes);
app.use('/api', endpointRoutes);
app.use('/api', dashboardRoutes);
app.use('/api', bulkUploadRoutes);
app.use('/api', wazuhRoutes);
app.use('/api', analyticsRoutes);

// Catch-all for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'API endpoint not found',
    path: req.originalUrl,
    method: req.method,
    availableEndpoints: '/api/*'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('API Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Export the Express app
module.exports = app;
