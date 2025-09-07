# AgentRadar Vercel Deployment Guide

## Quick Deployment Steps

### 1. Create New Vercel Project

1. Go to [vercel.com](https://vercel.com) and log in
2. Click "New Project" 
3. Import from GitHub: `Ethical-AI-Syndicate/agentradar-app`
4. **Framework Preset**: Next.js
5. **Root Directory**: `web-app`
6. **Build Command**: `npm run build`
7. **Output Directory**: `.next` (default)

### 2. Environment Variables

Add these environment variables in Vercel dashboard:

```bash
# Database
DATABASE_URL=postgresql://neondb_owner:npg_MkmTsgf5hRL6@ep-damp-band-ado7eaqx-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
REDIS_URL=redis://:@redis-16816.c98.us-east-1-4.ec2.redns.redis-cloud.com:16816

# API Configuration  
NEXT_PUBLIC_API_URL=https://agentradar-app.vercel.app/api

# Authentication
JWT_SECRET=d07a1f569eee07e08043877dfea4517bc9e50d69153d68da1072b00adcdcbfc6c80add92a6092b3a956dc767621a77f5599bdd7852430252336b3fb06fa7b368
SESSION_SECRET=77e60c460895ee78356e5e6ce925475d451f5a63a260f0e890aec435ea80c794

# Stripe Payment Processing  
STRIPE_SECRET_KEY=[Get from Stripe Dashboard - Test Key]
STRIPE_WEBHOOK_SECRET=[Configure after setting up webhooks]
STRIPE_RECOVERY_CODE=[From Stripe Recovery Codes]
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=[Get from Stripe Dashboard - Publishable Key]

# Email Service
EMAIL_API_KEY=[Get from SendGrid API Keys]
EMAIL_FROM=noreply@agentradar.app

# Push Notifications
EXPO_PUSH_TOKEN=[Get from Expo Developer Account]
FCM_SERVER_KEY=[Get from Firebase Console]

# Court Data Processing
COURT_BULLETIN_URL=https://www.canlii.org/en/on/onsc/rss_new.xml
ONCA_FEED_URL=https://www.canlii.org/en/on/onca/rss_new.xml
ONCJ_FEED_URL=https://www.canlii.org/en/on/oncj/rss_new.xml
ONSCDC_FEED_URL=https://www.canlii.org/en/on/onscdc/rss_new.xml
OLT_FEED_URL=https://www.canlii.org/en/on/onolt/rss_new.xml
ONTARIO_NEWSROOM_URL=https://news.ontario.ca/api/newsroom/en

# Court Processing Configuration
COURT_POLLING_INTERVAL=45
NER_PROCESSING_ENABLED=true
CASE_CLASSIFICATION_ENABLED=true

# External APIs  
GOOGLE_MAPS_API_KEY=[Get from Google Cloud Console]
REPLIERS_API_KEY=[Get from Repliers.com Dashboard]

# Monitoring
SENTRY_DSN=[Get from Sentry.io Project Settings]

# Deployment
NODE_ENV=production
```

### 3. Domain Configuration

1. In Vercel project settings → Domains
2. Add custom domain: `agentradar.app`
3. Add www redirect: `www.agentradar.app` → `agentradar.app`

### 4. Build Configuration

Ensure these settings in Vercel:
- **Framework**: Next.js
- **Node.js Version**: 18.x or 20.x
- **Install Command**: `npm install`
- **Build Command**: `npm run build`
- **Root Directory**: `web-app`

## Serverless Functions Setup

For API routes to work properly in Vercel, the API structure will be:
- Web app: `agentradar.app`
- API routes: `agentradar.app/api/*`

The Next.js app router will handle API routes automatically.

## Post-Deployment Steps

1. **Database Migration**: Run `npx prisma migrate deploy` in Vercel Functions
2. **Test API Health**: Check `https://agentradar.app/api/health`
3. **Court Processing**: Verify court data polling starts automatically
4. **SSL Certificate**: Should auto-provision via Vercel + Cloudflare

## Database Migration for Production

After deployment, run migrations:

```bash
# In Vercel Functions Console or local with production DB
npx prisma migrate deploy
npx prisma generate
```

## Monitoring & Health Checks

- Health endpoint: `https://agentradar.app/api/health`
- Court processing stats: `https://agentradar.app/api/court-processing/stats`
- API documentation: `https://agentradar.app/api`