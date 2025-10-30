require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Import configurations
const { corsOptions } = require('../config/cors');

// Import routes
const authRoutes = require('../routes/authRoutes');
const adminRoutes = require('../routes/adminRoutes');
const organizationRoutes = require('../routes/organizationRoutes');
const endpointRoutes = require('../routes/endpointRoutes');
const dashboardRoutes = require('../routes/dashboardRoutes');
const bulkUploadRoutes = require('../routes/bulkUploadRoutes');
const wazuhRoutes = require('../routes/wazuhRoutes');
const analyticsRoutes = require('../routes/analyticsRoutes');

const app = express();

// Middleware for parsing JSON and URL-encoded data
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Enable CORS with preflight handling
app.use(cors(corsOptions));

// Handle preflight requests explicitly
app.options('*', cors(corsOptions));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Nexus Backend API is running on Vercel',
    timestamp: new Date().toISOString(),
    environment: 'serverless'
  });
});

// Root health check
app.get('/', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Nexus Backend API',
    version: '1.0.0'
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
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Export the Express app for Vercel
module.exports = app;