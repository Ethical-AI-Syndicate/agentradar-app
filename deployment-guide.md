# AgentRadar AWS Deployment Guide

## Quick Deployment Steps

### 1. AWS Infrastructure Setup

1. **Create AWS Account** and configure AWS CLI
2. **Create ECS Cluster** for containerized deployment
3. **Set up Application Load Balancer (ALB)** for traffic routing
4. **Configure Route 53** for DNS management (optional)
5. **Set up RDS** for PostgreSQL database
6. **Configure ElastiCache** for Redis caching
7. **Create ECR repositories** for Docker images

### 2. Environment Variables

Add these environment variables in AWS ECS Task Definition or via AWS Systems Manager Parameter Store:

```bash
# Database
DATABASE_URL=postgresql://neondb_owner:npg_MkmTsgf5hRL6@ep-damp-band-ado7eaqx-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
REDIS_URL=redis://:@redis-16816.c98.us-east-1-4.ec2.redns.redis-cloud.com:16816

# API Configuration  
NEXT_PUBLIC_API_URL=https://api.agentradar.app

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

1. Configure DNS records in Cloudflare (see cloudflare-dns-setup.md)
2. Set up AWS Application Load Balancer with SSL certificate
3. Configure Route 53 hosted zone (if using AWS DNS)
4. Add all required subdomains:
   - `agentradar.app` (main site)
   - `api.agentradar.app` (API)
   - `admin.agentradar.app` (admin dashboard)
   - `dash.agentradar.app` (customer dashboard)
   - `support.agentradar.app` (support portal)
   - `docs.agentradar.app` (documentation)
   - `blog.agentradar.app` (blog)
   - `community.agentradar.app` (community hub)
   - `status.agentradar.app` (status monitor)
   - `careers.agentradar.app` (careers portal)

### 4. Docker Container Build

The platform uses Docker containers for deployment:
- **Build Process**: `docker-compose -f docker-compose.production.yml build`
- **Node.js Version**: 20.x (specified in Dockerfile)
- **Multi-stage builds**: Development, production, and testing stages
- **Container orchestration**: AWS ECS with Docker Compose
- **Image registry**: AWS ECR

## Container Architecture

The AWS deployment uses a multi-container architecture:
- **Web App**: `agentradar.app` (Next.js frontend)
- **API Server**: `api.agentradar.app` (Express.js backend)
- **Database**: PostgreSQL on AWS RDS
- **Cache**: Redis on AWS ElastiCache
- **Load Balancer**: AWS ALB with SSL termination
- **Service Discovery**: AWS ECS Service Connect

## Post-Deployment Steps

1. **Database Migration**: Run `./scripts/deploy.sh --migration-only`
2. **Test API Health**: Check `https://api.agentradar.app/health`
3. **Verify All Services**: Check all subdomain health endpoints
4. **Court Processing**: Verify court data polling starts automatically
5. **SSL Certificate**: Configure in AWS ALB + Cloudflare

## Database Migration for Production

After deployment, run migrations:

```bash
# Using the deployment script
./scripts/deploy.sh --environment production --migration-only

# Or manually via Docker
docker-compose -f docker-compose.production.yml exec api npx prisma migrate deploy
docker-compose -f docker-compose.production.yml exec api npx prisma generate
```

## Monitoring & Health Checks

- API Health: `https://api.agentradar.app/health`
- Court processing stats: `https://api.agentradar.app/court-processing/stats`
- API documentation: `https://api.agentradar.app/api`
- Grafana Dashboard: `http://localhost:3001` (or configured domain)
- Prometheus Metrics: `http://localhost:9090` (or configured domain)
- All service endpoints:
  - Main site: `https://agentradar.app`
  - Admin: `https://admin.agentradar.app`
  - Customer Dashboard: `https://dash.agentradar.app`
  - Support: `https://support.agentradar.app`
  - Docs: `https://docs.agentradar.app`
  - Blog: `https://blog.agentradar.app`
  - Community: `https://community.agentradar.app`
  - Status: `https://status.agentradar.app`
  - Careers: `https://careers.agentradar.app`
