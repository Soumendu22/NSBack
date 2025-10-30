# Vercel Deployment Guide - Backend

## Environment Variables Setup

After deploying your backend to Vercel, you **MUST** configure the following environment variables in your Vercel project settings:

### Required Environment Variables

1. **FRONTEND_URL**
   - Value: Your frontend Vercel URL (e.g., `https://your-frontend.vercel.app`)
   - This is critical for CORS to work properly

2. **SUPABASE_URL**
   - Your Supabase project URL
   - Format: `https://your-project.supabase.co`

3. **SUPABASE_SERVICE_KEY**
   - Your Supabase service role key
   - Keep this secret and secure

4. **GMAIL_USER**
   - Your Gmail address for sending emails
   - Format: `your-email@gmail.com`

5. **GMAIL_PASS**
   - Your Gmail app password (not your regular password)
   - Generate this from Google Account settings

6. **NODE_ENV** (optional)
   - Set to `production` for production deployment

## How to Add Environment Variables in Vercel

1. Go to your Vercel dashboard
2. Select your backend project
3. Navigate to **Settings** → **Environment Variables**
4. Add each variable with its value
5. Make sure to add them for **Production**, **Preview**, and **Development** environments
6. Redeploy your application after adding variables

## CORS Configuration

The CORS configuration has been updated to:
- Allow all `.vercel.app` domains automatically
- Support credentials (cookies, authorization headers)
- Handle preflight OPTIONS requests properly

## Testing Your Deployment

After deployment and environment variable setup:

1. Test the health endpoint:
   ```
   https://your-backend.vercel.app/api/health
   ```

2. Check CORS by making a request from your frontend

3. Monitor Vercel logs for any CORS warnings or errors

## Important Notes

- The `vercel.json` has been configured to route all requests through `api/index.js`
- CORS headers are handled by the Express middleware, not by Vercel headers
- Always use HTTPS URLs in production
- Never commit `.env` files to version control

## Troubleshooting

If you still see CORS errors:

1. Verify `FRONTEND_URL` is set correctly in Vercel environment variables
2. Check that your frontend is using the correct backend URL
3. Ensure you're using HTTPS (not HTTP) for both frontend and backend
4. Clear browser cache and try again
5. Check Vercel function logs for detailed error messages
