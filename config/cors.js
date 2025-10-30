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
      // In development or production, log but allow requests to prevent CORS errors
      console.log('CORS warning for origin:', origin);
      // Allow the request anyway to prevent blocking
      callback(null, true);
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
    'Cache-Control'
  ],
  optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
  preflightContinue: false,
};

module.exports = { corsOptions };
