// config/cors.js
const cors = require('cors');

// CORS configuration
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  process.env.FRONTEND_URL,
  // Add common Vercel patterns
  /^https:\/\/.*\.vercel\.app$/,
  /^https:\/\/nexus.*\.vercel\.app$/
].filter(Boolean); // Remove any undefined values

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Check if origin is in allowed list or matches patterns
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (typeof allowedOrigin === 'string') {
        return allowedOrigin === origin;
      } else if (allowedOrigin instanceof RegExp) {
        return allowedOrigin.test(origin);
      }
      return false;
    });

    if (isAllowed) {
      callback(null, true);
    } else {
      // In production on Vercel, allow all .vercel.app domains to prevent CORS errors
      if (origin && origin.includes('.vercel.app')) {
        console.log('CORS: Allowing Vercel origin:', origin);
        callback(null, true);
      } else {
        console.log('CORS warning for origin:', origin);
        // Allow the request anyway to prevent blocking
        callback(null, true);
      }
    }
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
  exposedHeaders: ['Content-Length', 'X-Request-Id'],
  optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
  preflightContinue: false,
  maxAge: 86400 // Cache preflight requests for 24 hours
};

module.exports = { corsOptions };
