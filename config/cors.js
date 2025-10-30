// config/cors.js
const cors = require('cors');

// CORS configuration with flexible origin handling for Vercel
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  process.env.FRONTEND_URL,
].filter(Boolean); // Remove any undefined values

const corsOptions = {
  origin: function(origin, callback) {
    console.log('Request origin:', origin); // Debug log
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      console.log('No origin provided - allowing request');
      return callback(null, true);
    }
    
    // Check if the origin matches any allowed origins
    const isAllowed = allowedOrigins.includes(origin);
    console.log('Is origin in allowed list:', isAllowed); // Debug log
    
    // Also check if origin is a Vercel deployment
    const isVercelApp = origin.includes('.vercel.app');
    console.log('Is Vercel app:', isVercelApp); // Debug log
    
    if (isAllowed || isVercelApp) {
      console.log('CORS: Allowing origin:', origin);
      return callback(null, true);
    }
    
    // For development, allow all origins but log a warning
    console.log('CORS warning for origin:', origin, '- allowing anyway');
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'x-user-id',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Cache-Control',
    'X-CSRF-Token'
  ],
  exposedHeaders: ['Content-Length', 'X-Request-Id', 'Content-Range', 'X-Content-Range'],
  optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
  preflightContinue: false,
  maxAge: 86400 // Cache preflight requests for 24 hours
};

module.exports = { corsOptions };
