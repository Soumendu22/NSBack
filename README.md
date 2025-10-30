# Nexus Backend

This is the backend API for the Nexus application with proper CORS configuration and Vercel deployment support.

## Development Setup

### Local Development
```bash
npm install
npm run dev
```
Server will run on http://localhost:5000

### Environment Variables
Create a `.env` file with:
```
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
# Add your other environment variables here
```

## Deployment

### Vercel Deployment
The app is configured for Vercel serverless deployment:
- `api/index.js` - Serverless function entry point
- `vercel.json` - Vercel configuration with CORS headers
- All API routes are accessible under `/api/*`

### Files Structure
- `server.js` - Local development server
- `index.js` - Original server (kept for compatibility)
- `api/index.js` - Vercel serverless function
- `config/cors.js` - CORS configuration
- `routes/` - API route handlers
- `controllers/` - Business logic
- `middleware/` - Custom middleware

## API Endpoints
All endpoints are prefixed with `/api/` in production:
- Health check: `GET /api/health`
- Authentication: `/api/auth/*`
- Admin: `/api/admin/*`
- Organizations: `/api/organizations/*`
- Endpoints: `/api/endpoints/*`
- Dashboard: `/api/dashboard/*`
- Bulk Upload: `/api/bulk-upload/*`
- Wazuh: `/api/wazuh/*`
- Analytics: `/api/analytics/*`

## CORS Configuration
CORS is configured to allow:
- Localhost development (ports 3000, 3001)
- Vercel deployment domains
- Custom frontend URL from environment variables
- All common HTTP methods and headers

## Troubleshooting

### CORS Issues
If you encounter CORS errors:
1. Check that your frontend URL is included in `config/cors.js`
2. Ensure the backend is deployed and accessible
3. Verify environment variables are set correctly

### Vercel Deployment Issues
1. Make sure `api/index.js` exists and exports the Express app
2. Check `vercel.json` configuration
3. Verify all dependencies are in `package.json`