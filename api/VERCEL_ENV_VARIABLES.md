# AgentRadar API - Vercel Environment Variables Configuration

## 🚀 Production Deployment Environment Variables

Configure these environment variables in the Vercel Dashboard (Project Settings > Environment Variables):

### Database Configuration

```
DATABASE_URL=postgresql://user:password@host:5432/agentradar_production
REDIS_URL=redis://host:6379/0
```

### Security & Authentication

```
JWT_SECRET=prod_jwt_secret_secure_key_agentradar_$(random)
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d
```

### API Configuration

```
NODE_ENV=production
API_VERSION=1.0.0
API_BASE_URL=https://agentradar-api-production.vercel.app
```

### Rate Limiting (Production)

```
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000
```

### CORS Configuration

```
CORS_ORIGIN=https://agentradar.com,https://app.agentradar.com
```

### Email Service (SendGrid Production)

```
SENDGRID_API_KEY=SG.production_key_here
EMAIL_FROM=AgentRadar <noreply@agentradar.com>
```

### Real AI Services (PRODUCTION)

```
OPENAI_API_KEY=sk-production_openai_key_here
ANTHROPIC_API_KEY=production_anthropic_key_here
```

### Payment Processing (PRODUCTION)

```
STRIPE_SECRET_KEY=sk_live_production_stripe_key
STRIPE_WEBHOOK_SECRET=whsec_production_webhook_secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_production_publishable_key
```

### MLS Integration (PRODUCTION)

```
REPLIERS_API_KEY=production_repliers_api_key_here
REPLIERS_ENDPOINT=https://api.repliers.ca/v1
REPLIERS_REGION=GTA
REPLIERS_RATE_LIMIT=500
```

### Logging & Monitoring

```
LOG_LEVEL=info
ENABLE_REQUEST_LOGGING=true
ENABLE_ERROR_TRACKING=true
```

### SSL Configuration

```
FORCE_HTTPS=true
TRUST_PROXY=true
```

### Health Check & Metrics

```
HEALTH_CHECK_ENDPOINT=/health
ENABLE_METRICS=true
```

### Production Flags

```
ENABLE_MOCK_DATA=false
DEBUG_MODE=false
MAINTENANCE_MODE=false
```

## 📋 Vercel CLI Commands for Environment Variables

### Set all environment variables via CLI:

```bash
# Database
vercel env add DATABASE_URL production
vercel env add REDIS_URL production

# Security
vercel env add JWT_SECRET production
vercel env add JWT_EXPIRES_IN production
vercel env add JWT_REFRESH_EXPIRES_IN production

# API Config
vercel env add API_VERSION production
vercel env add API_BASE_URL production

# Rate Limiting
vercel env add RATE_LIMIT_WINDOW_MS production
vercel env add RATE_LIMIT_MAX_REQUESTS production

# CORS
vercel env add CORS_ORIGIN production

# Email
vercel env add SENDGRID_API_KEY production
vercel env add EMAIL_FROM production

# AI Services
vercel env add OPENAI_API_KEY production
vercel env add ANTHROPIC_API_KEY production

# Payments
vercel env add STRIPE_SECRET_KEY production
vercel env add STRIPE_WEBHOOK_SECRET production
vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY production

# MLS
vercel env add REPLIERS_API_KEY production
vercel env add REPLIERS_ENDPOINT production
vercel env add REPLIERS_REGION production
vercel env add REPLIERS_RATE_LIMIT production

# Monitoring
vercel env add LOG_LEVEL production
vercel env add ENABLE_REQUEST_LOGGING production
vercel env add ENABLE_ERROR_TRACKING production

# SSL
vercel env add FORCE_HTTPS production
vercel env add TRUST_PROXY production

# Health Check
vercel env add HEALTH_CHECK_ENDPOINT production
vercel env add ENABLE_METRICS production

# Production Flags
vercel env add ENABLE_MOCK_DATA production
vercel env add DEBUG_MODE production
vercel env add MAINTENANCE_MODE production
```

## 🚀 Deployment Commands

```bash
# Install Vercel CLI (if not installed)
npm i -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod

# Check deployment status
vercel ls

# View logs
vercel logs
```

## ✅ Environment Variable Checklist

- [ ] Database connection (PostgreSQL + Redis)
- [ ] JWT authentication secrets
- [ ] API configuration
- [ ] Rate limiting settings
- [ ] CORS origins
- [ ] SendGrid email service
- [ ] OpenAI + Anthropic API keys
- [ ] Stripe payment processing
- [ ] Repliers MLS integration
- [ ] Monitoring & logging
- [ ] SSL configuration
- [ ] Health check settings
- [ ] Production flags

## 🔍 Post-Deployment Verification

After deployment, test these endpoints:

- https://your-domain.vercel.app/health
- https://your-domain.vercel.app/api/auth/register
- https://your-domain.vercel.app/api/alerts
- https://your-domain.vercel.app/api
