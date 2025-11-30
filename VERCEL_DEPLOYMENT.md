# Vercel Deployment Guide

This guide will help you deploy your project to Vercel with full functionality.

## Project Structure

This project consists of:
- **Frontend**: Vite + React application
- **Backend**: Serverless API functions that proxy webhook requests to n8n

## Prerequisites

1. A [Vercel account](https://vercel.com/signup) (free tier works fine)
2. [Vercel CLI](https://vercel.com/docs/cli) installed (optional but recommended)
   ```bash
   npm install -g vercel
   ```
3. Your n8n webhook URLs ready

## Deployment Steps

### Option 1: Deploy via Vercel Dashboard (Recommended for beginners)

1. **Push your code to GitHub**
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin main
   ```

2. **Import Project to Vercel**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Add New Project"
   - Import your GitHub repository
   - Vercel will auto-detect the framework (Vite)

3. **Configure Environment Variables**

   In the Vercel project settings, add these environment variables:

   | Name | Value |
   |------|-------|
   | `VITE_INVOICE_WEBHOOK_URL` | Your n8n invoice webhook URL |
   | `VITE_KDR_WEBHOOK_URL` | Your n8n KDR webhook URL |
   | `VITE_GA_WEBHOOK_URL` | Your n8n GA webhook URL |
   | `VITE_KDRI_WEBHOOK_URL` | Your n8n KDRI webhook URL |
   | `VITE_GOOGLE_SHEET_URL` | Your Google Sheets published CSV URL (for authentication) |

   **Important**: Make sure to add these to **both** "Production" and "Preview" environments.

4. **Deploy**
   - Click "Deploy"
   - Wait for the build to complete (usually 1-2 minutes)
   - Your app will be live at `https://your-project-name.vercel.app`

### Option 2: Deploy via Vercel CLI

1. **Login to Vercel**
   ```bash
   vercel login
   ```

2. **Deploy from your project directory**
   ```bash
   vercel
   ```

   Follow the prompts:
   - Set up and deploy? **Y**
   - Which scope? Select your account
   - Link to existing project? **N** (first time) or **Y** (subsequent deploys)
   - What's your project's name? Enter a name or press Enter for default
   - In which directory is your code located? `./` (press Enter)

3. **Set Environment Variables**
   ```bash
   vercel env add VITE_INVOICE_WEBHOOK_URL
   vercel env add VITE_KDR_WEBHOOK_URL
   vercel env add VITE_GA_WEBHOOK_URL
   vercel env add VITE_KDRI_WEBHOOK_URL
   vercel env add VITE_GOOGLE_SHEET_URL
   ```

   For each variable, you'll be prompted to:
   - Enter the value
   - Select which environments (choose Production, Preview, and Development)

4. **Deploy to Production**
   ```bash
   vercel --prod
   ```

## API Endpoints

Once deployed, your API endpoints will be available at:

- **Chat Webhook**: `https://your-project.vercel.app/api/webhook/chat`
- **Health Check**: `https://your-project.vercel.app/api/health`
- **Config**: `https://your-project.vercel.app/api/webhook/config`

## Testing Your Deployment

1. **Test the health endpoint**
   ```bash
   curl https://your-project.vercel.app/api/health
   ```

2. **Test the chat endpoint**
   ```bash
   curl -X POST https://your-project.vercel.app/api/webhook/chat \
     -H "Content-Type: application/json" \
     -d '{
       "message": "Test message",
       "module": "invoice",
       "sessionId": "test-session"
     }'
   ```

## Updating Your Frontend

If your frontend code makes API calls to the backend, update the base URL:

**Development** (local):
```javascript
const API_BASE_URL = 'http://localhost:3001';
```

**Production** (Vercel):
```javascript
const API_BASE_URL = import.meta.env.PROD
  ? '/api'
  : 'http://localhost:3001';
```

Or use environment variables:
```javascript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
```

## Troubleshooting

### Build Fails

1. Check the build logs in Vercel dashboard
2. Ensure all dependencies are in `package.json`
3. Make sure `vercel-build` script exists in `package.json`

### API Endpoints Return 404

1. Verify the `vercel.json` file exists in your project root
2. Check that API files are in the `/api` directory
3. Redeploy the project

### Environment Variables Not Working

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Verify all variables are set for the correct environments
3. Redeploy after adding/changing environment variables

### CORS Errors

The API functions include CORS headers. If you still face issues:
1. Check browser console for specific errors
2. Verify the API endpoint URL is correct
3. Make sure you're not blocking cross-origin requests in your browser

## Custom Domain (Optional)

1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add your custom domain
3. Update your DNS records as instructed by Vercel
4. Wait for DNS propagation (can take up to 48 hours)

## Continuous Deployment

Vercel automatically:
- Deploys your `main` branch to production
- Creates preview deployments for pull requests
- Runs builds on every push

To disable auto-deployment:
1. Go to Project Settings → Git
2. Disable "Automatic Deployments"

## Local Development

For local development with the serverless functions:

```bash
# Install Vercel CLI
npm install -g vercel

# Run development server
vercel dev
```

This will:
- Start Vite dev server
- Run serverless functions locally
- Mirror the production environment

## Cost

The free tier includes:
- 100 GB bandwidth per month
- Unlimited deployments
- Automatic HTTPS
- 100 GB-hours of serverless function execution

This should be sufficient for most small to medium projects.

## Support

If you encounter issues:
1. Check [Vercel Documentation](https://vercel.com/docs)
2. Visit [Vercel Community](https://github.com/vercel/vercel/discussions)
3. Check the [Vite Documentation](https://vitejs.dev/)

## Next Steps

After successful deployment:
1. Test all functionality thoroughly
2. Set up custom domain (optional)
3. Configure monitoring and analytics
4. Set up proper error tracking (e.g., Sentry)
5. Add environment-specific configurations as needed
