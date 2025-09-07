# COMMANDS.md - AgentRadar Project Command Library

> A comprehensive command reference for Claude Code to efficiently develop, test, and deploy the AgentRadar platform across web, mobile, and desktop.

## Table of Contents
- [Quick Start Commands](#quick-start-commands)
- [Development Commands](#development-commands)
- [Database Commands](#database-commands)
- [Scraper Commands](#scraper-commands)
- [Testing Commands](#testing-commands)
- [Deployment Commands](#deployment-commands)
- [Platform-Specific Commands](#platform-specific-commands)
- [Monitoring & Debugging](#monitoring--debugging)
- [Utility Scripts](#utility-scripts)
- [Workflow Macros](#workflow-macros)

---

## Quick Start Commands

### 🚀 Initial Project Setup
```bash
# Complete project initialization
npm create agentradar-app -- --all-platforms

# Or step by step:
npx create-next-app@latest web-app --typescript --tailwind --app
cd web-app && npm install @prisma/client prisma @supabase/supabase-js
npx create-expo-app mobile --template blank-typescript
npx create-electron-app desktop --template=typescript-webpack
```

### 🏃 Quick Launch Commands
```bash
# Launch everything in development
npm run dev:all

# Launch specific platforms
npm run dev:web        # Start web app on :3000
npm run dev:mobile     # Start Expo on :19000
npm run dev:desktop    # Start Electron app
npm run dev:api        # Start API server on :4000
npm run dev:scrapers   # Start scraper workers
```

---

## Development Commands

### Web Application Commands
```bash
# Web app development
cd web-app
npm run dev                    # Start Next.js dev server
npm run build                  # Build for production
npm run lint                   # Run ESLint
npm run type-check            # TypeScript validation
npm run analyze               # Bundle analyzer

# Component generation
npm run generate:component <name>    # Generate new component
npm run generate:page <route>        # Generate new page
npm run generate:api <endpoint>      # Generate API route

# Tailwind utilities
npx tailwindcss init -p              # Initialize Tailwind
npm run build:css                    # Build CSS
```

### API Development Commands
```bash
# API server
cd api
npm run dev                    # Start with nodemon
npm run build                  # Build TypeScript
npm run start                  # Production start
npm run swagger                # Generate Swagger docs

# GraphQL specific
npm run codegen               # Generate GraphQL types
npm run schema:validate       # Validate schema
npm run playground            # Start GraphQL playground
```

### Real-time Features
```bash
# WebSocket server
npm run ws:dev                # Start WebSocket server
npm run ws:test              # Test WebSocket connections
npm run ws:monitor           # Monitor active connections

# Server-sent events
npm run sse:dev              # Start SSE server
npm run sse:test            # Test SSE streams
```

---

## Database Commands

### Prisma Operations
```bash
# Database setup
npx prisma init
npx prisma migrate dev --name init    # Create initial migration
npx prisma migrate deploy             # Deploy migrations to production
npx prisma generate                   # Generate Prisma client
npx prisma studio                     # Open Prisma Studio GUI

# Migration management
npx prisma migrate dev --name add_<feature>    # Create new migration
npx prisma migrate reset                       # Reset database
npx prisma migrate status                      # Check migration status
npx prisma db push                            # Push schema changes (dev only)

# Seeding
npx prisma db seed                   # Run seed script
npm run seed:dev                      # Seed development data
npm run seed:test                     # Seed test data
npm run seed:demo                     # Seed demo data for presentations
```

### Direct Database Commands
```bash
# PostgreSQL with PostGIS
psql -U postgres -c "CREATE DATABASE agentradar;"
psql -U postgres -d agentradar -c "CREATE EXTENSION postgis;"

# Backup and restore
pg_dump -U postgres agentradar > backup_$(date +%Y%m%d).sql
psql -U postgres agentradar < backup_20240101.sql

# Redis operations
redis-cli FLUSHDB              # Clear current database
redis-cli --scan --pattern "alert:*"    # Scan for patterns
redis-cli MONITOR              # Monitor commands in real-time
```

### Database Utilities
```bash
# Custom database scripts
npm run db:backup              # Backup database
npm run db:restore <file>      # Restore from backup
npm run db:optimize            # Run optimization queries
npm run db:analyze             # Analyze table statistics
npm run db:clean               # Clean old records
npm run db:export:csv          # Export data to CSV
```

---

## Scraper Commands

### GTA-Specific Scrapers
```bash
# Run individual scrapers
npm run scraper:power-of-sale      # Ontario court bulletins
npm run scraper:development        # Toronto development applications
npm run scraper:mpac              # MPAC assessments
npm run scraper:treb              # TREB pre-market data
npm run scraper:school            # School rankings

# Scraper management
npm run scraper:all              # Run all scrapers
npm run scraper:test <name>      # Test specific scraper
npm run scraper:schedule          # Set up cron jobs
npm run scraper:logs             # View scraper logs
npm run scraper:status           # Check scraper health
```

### Scraper Development
```bash
# Generate new scraper
npm run generate:scraper <locale> <source>
# Example: npm run generate:scraper vancouver court

# Puppeteer utilities
npm run puppet:debug             # Launch with headful browser
npm run puppet:screenshot <url>  # Take screenshot for debugging
npm run puppet:trace <url>      # Generate performance trace
```

### Data Processing
```bash
# Parse and validate scraped data
npm run parse:validate <file>    # Validate scraped data
npm run parse:geocode            # Geocode addresses
npm run parse:normalize          # Normalize data format
npm run parse:dedupe            # Remove duplicates
```

---

## Testing Commands

### Unit & Integration Tests
```bash
# Run all tests
npm test                        # Run all test suites
npm run test:watch             # Watch mode
npm run test:coverage          # Generate coverage report

# Platform-specific tests
npm run test:web               # Web app tests
npm run test:mobile           # Mobile app tests
npm run test:desktop          # Desktop app tests
npm run test:api              # API tests
npm run test:scrapers         # Scraper tests
```

### E2E Testing
```bash
# Playwright tests (Web)
npx playwright test                    # Run all E2E tests
npx playwright test --ui              # Run with UI mode
npx playwright test --debug           # Debug mode
npx playwright codegen                # Generate test code

# Detox tests (Mobile)
detox build -c ios.sim.debug
detox test -c ios.sim.debug
detox build -c android.emu.debug
detox test -c android.emu.debug

# Spectron tests (Desktop)
npm run test:desktop:e2e
```

### Performance Testing
```bash
# Load testing
npm run test:load              # Run k6 load tests
npm run test:stress           # Stress test API
npm run lighthouse            # Run Lighthouse audit

# Performance monitoring
npm run perf:web             # Analyze web performance
npm run perf:api             # API performance metrics
npm run perf:db              # Database query analysis
```

---

## Deployment Commands

### Web Deployment
```bash
# Vercel deployment
vercel                         # Deploy to preview
vercel --prod                 # Deploy to production
vercel env pull              # Pull environment variables
vercel logs                  # View function logs

# Alternative: Netlify
netlify deploy               # Deploy to draft URL
netlify deploy --prod       # Deploy to production
netlify env:import .env     # Import environment variables
```

### Mobile Deployment
```bash
# iOS deployment
cd mobile
eas build --platform ios              # Build with EAS
eas submit --platform ios            # Submit to App Store
fastlane ios beta                    # Deploy to TestFlight
fastlane ios release                 # Release to App Store

# Android deployment
eas build --platform android         # Build with EAS
eas submit --platform android       # Submit to Play Store
fastlane android beta               # Deploy to Play Console Beta
fastlane android production         # Release to Play Store

# Over-the-air updates
expo publish                        # Publish OTA update
eas update --branch production     # EAS Update
```

### Desktop Deployment
```bash
# Build for all platforms
npm run build:desktop:all

# Platform-specific builds
npm run build:win              # Build for Windows
npm run build:mac              # Build for macOS
npm run build:linux            # Build for Linux

# Code signing
npm run sign:win              # Sign Windows executable
npm run notarize:mac         # Notarize macOS app
npm run sign:linux           # Sign Linux package

# Create installers
npm run dist:win             # Create Windows installer
npm run dist:mac             # Create DMG/PKG
npm run dist:linux           # Create AppImage/Snap

# Auto-update
npm run publish:desktop      # Publish to auto-update server
```

### Docker Deployment
```bash
# Build and run containers
docker-compose up -d          # Start all services
docker-compose down          # Stop all services
docker-compose logs -f       # Follow logs
docker-compose ps           # List running containers

# Individual services
docker-compose up -d web     # Start web app only
docker-compose up -d api     # Start API only
docker-compose up -d scrapers # Start scrapers only

# Production deployment
docker build -t agentradar:latest .
docker push agentradar/web:latest
kubectl apply -f k8s/
kubectl rollout status deployment/agentradar-web
```

---

## Platform-Specific Commands

### iOS Specific
```bash
# iOS development
cd mobile/ios
pod install                          # Install CocoaPods
xcodebuild -workspace AgentRadar.xcworkspace -scheme AgentRadar
xcrun simctl list                   # List simulators
npm run ios -- --device "iPhone 14 Pro"

# iOS utilities
npm run ios:clean                   # Clean build folder
npm run ios:reset                   # Reset simulator
npm run ios:logs                    # View device logs
```

### Android Specific
```bash
# Android development
cd mobile/android
./gradlew clean
./gradlew assembleDebug
./gradlew assembleRelease
adb devices                         # List connected devices
npm run android -- --deviceId emulator-5554

# Android utilities
npm run android:clean               # Clean build
npm run android:logcat             # View device logs
npm run android:shake              # Open dev menu
```

### Windows Specific
```bash
# Windows development
npm run build:win32               # 32-bit build
npm run build:win64               # 64-bit build
npm run sign:win:ev              # EV code signing
npm run msi:build                # Create MSI installer

# Windows Store
npm run appx:build               # Build for Windows Store
npm run appx:submit             # Submit to Windows Store
```

### macOS Specific
```bash
# macOS development
npm run build:mac:universal     # Universal binary (M1 + Intel)
npm run build:mac:mas           # Mac App Store build
npm run notarize:mac            # Notarize with Apple

# macOS utilities
npm run mac:clean               # Clean build
npm run mac:icon               # Generate app icons
npm run mac:dmg                # Create DMG installer
```

---

## Monitoring & Debugging

### Logging Commands
```bash
# View logs
npm run logs:web               # Web app logs
npm run logs:api               # API server logs
npm run logs:scrapers          # Scraper logs
npm run logs:db                # Database logs
npm run logs:all               # All logs combined

# Log analysis
npm run logs:errors            # Filter error logs
npm run logs:search <term>     # Search logs
npm run logs:export            # Export logs to file
```

### Monitoring
```bash
# Health checks
npm run health:check           # Check all services
npm run health:api            # API health check
npm run health:db             # Database health check
npm run health:scrapers       # Scraper health check

# Metrics
npm run metrics:collect       # Collect metrics
npm run metrics:export       # Export to monitoring service
npm run metrics:dashboard    # Open metrics dashboard
```

### Debugging
```bash
# Debug modes
npm run dev:debug            # Start with debugger
npm run debug:api           # Debug API server
npm run debug:scraper <name> # Debug specific scraper
npm run debug:mobile        # React Native debugger

# Chrome DevTools
npm run devtools:web        # Open for web app
npm run devtools:desktop    # Open for Electron app
npm run devtools:mobile     # Open for React Native
```

---

## Utility Scripts

### Data Management
```bash
# Import/Export
npm run data:import <file>          # Import data from file
npm run data:export <format>        # Export data (csv/json/excel)
npm run data:migrate <source>       # Migrate from another system
npm run data:validate               # Validate all data

# Geocoding
npm run geo:batch <file>           # Batch geocode addresses
npm run geo:validate              # Validate coordinates
npm run geo:reverse <lat,lng>    # Reverse geocode
```

### Report Generation
```bash
# Generate reports
npm run report:weekly              # Generate weekly report
npm run report:monthly            # Generate monthly report
npm run report:custom <params>   # Custom report
npm run report:email <recipients> # Email report
```

### Notification Testing
```bash
# Test notifications
npm run notify:test:email <to>        # Test email
npm run notify:test:push <token>      # Test push notification
npm run notify:test:sms <number>      # Test SMS
npm run notify:test:all               # Test all channels
```

### API Testing
```bash
# API utilities
npm run api:docs                     # Generate API documentation
npm run api:mock                     # Start mock server
npm run api:playground              # Open API playground
npm run api:test:auth              # Test authentication
npm run api:test:endpoints         # Test all endpoints
```

---

## White-Label Deployment Commands

### 🏢 Brokerage Setup & Configuration
```bash
# Initialize white-label instance
npm run whitelabel:init <brokerage-id>
# Example: npm run whitelabel:init remax-toronto

# Configure white-label settings
npm run whitelabel:config <brokerage-id>
npm run whitelabel:config:branding <brokerage-id>
npm run whitelabel:config:domain <brokerage-id> <domain>
npm run whitelabel:config:features <brokerage-id>
npm run whitelabel:config:pricing <brokerage-id>

# Generate white-label assets
npm run whitelabel:generate:assets <brokerage-id>
npm run whitelabel:generate:logos <brokerage-id> <logo-file>
npm run whitelabel:generate:theme <brokerage-id> <colors-json>
npm run whitelabel:generate:emails <brokerage-id>
```

### White-Label Infrastructure
```bash
# Deploy white-label instance
npm run whitelabel:deploy <brokerage-id>
npm run whitelabel:deploy:staging <brokerage-id>
npm run whitelabel:deploy:production <brokerage-id>

# Subdomain management
npm run whitelabel:domain:setup <brokerage-id> <subdomain>
npm run whitelabel:domain:ssl <brokerage-id>
npm run whitelabel:domain:verify <brokerage-id>

# Database isolation
npm run whitelabel:db:create <brokerage-id>
npm run whitelabel:db:migrate <brokerage-id>
npm run whitelabel:db:seed <brokerage-id>
npm run whitelabel:db:backup <brokerage-id>
```

### White-Label App Builds
```bash
# Web application customization
npm run whitelabel:build:web <brokerage-id>
npm run whitelabel:preview:web <brokerage-id>

# Mobile app white-labeling
npm run whitelabel:build:ios <brokerage-id>
npm run whitelabel:build:android <brokerage-id>
npm run whitelabel:submit:ios <brokerage-id>
npm run whitelabel:submit:android <brokerage-id>

# Desktop app white-labeling
npm run whitelabel:build:desktop <brokerage-id>
npm run whitelabel:sign:desktop <brokerage-id>
npm run whitelabel:distribute:desktop <brokerage-id>
```

### White-Label Management
```bash
# Instance management
npm run whitelabel:list                     # List all white-label instances
npm run whitelabel:status <brokerage-id>    # Check instance status
npm run whitelabel:health <brokerage-id>    # Health check
npm run whitelabel:metrics <brokerage-id>   # View metrics
npm run whitelabel:logs <brokerage-id>      # View logs

# Updates and maintenance
npm run whitelabel:update <brokerage-id>    # Update instance
npm run whitelabel:update:all               # Update all instances
npm run whitelabel:maintenance:enable <id>  # Enable maintenance mode
npm run whitelabel:maintenance:disable <id> # Disable maintenance mode

# Billing and usage
npm run whitelabel:billing:setup <brokerage-id>
npm run whitelabel:billing:usage <brokerage-id>
npm run whitelabel:billing:invoice <brokerage-id>
```

---

## Brokerage Onboarding Commands

### 🚀 Initial Onboarding Setup
```bash
# Complete brokerage onboarding
npm run brokerage:onboard <n> <email>
# Example: npm run brokerage:onboard "RE/MAX Toronto" admin@remax-toronto.ca

# Step-by-step onboarding
npm run brokerage:create <n>              # Create brokerage account
npm run brokerage:verify <id>                    # Verify brokerage details
npm run brokerage:approve <id>                   # Approve brokerage
npm run brokerage:activate <id>                  # Activate account

# Documentation and contracts
npm run brokerage:generate:contract <id>         # Generate contract
npm run brokerage:send:contract <id>            # Send contract for signature
npm run brokerage:check:contract <id>           # Check contract status
npm run brokerage:generate:invoice <id>         # Generate setup invoice
```

### Agent Management
```bash
# Bulk agent operations
npm run brokerage:agents:import <id> <csv-file>  # Import agents from CSV
npm run brokerage:agents:invite <id>             # Send bulk invitations
npm run brokerage:agents:list <id>               # List all agents
npm run brokerage:agents:export <id>             # Export agent list

# Agent permissions
npm run brokerage:agents:roles <id>              # Configure role hierarchy
npm run brokerage:agents:permissions <id>        # Set permissions
npm run brokerage:agents:teams:create <id>       # Create agent teams
npm run brokerage:agents:teams:assign <id>       # Assign agents to teams

# Agent monitoring
npm run brokerage:agents:activity <id>           # View agent activity
npm run brokerage:agents:performance <id>        # Performance metrics
npm run brokerage:agents:usage <id>              # Usage statistics
```

### Brokerage Configuration
```bash
# Regional configuration
npm run brokerage:regions:set <id> <regions>     # Set covered regions
npm run brokerage:regions:add <id> <region>      # Add new region
npm run brokerage:regions:remove <id> <region>   # Remove region
npm run brokerage:regions:import <id> <file>     # Import regions from file

# Alert preferences
npm run brokerage:alerts:configure <id>          # Configure alert types
npm run brokerage:alerts:priorities <id>         # Set alert priorities
npm run brokerage:alerts:routing <id>            # Configure alert routing
npm run brokerage:alerts:templates <id>          # Customize alert templates

# Integration setup
npm run brokerage:integrate:crm <id> <crm>      # CRM integration
npm run brokerage:integrate:mls <id>             # MLS integration
npm run brokerage:integrate:email <id>           # Email system integration
npm run brokerage:integrate:calendar <id>        # Calendar integration
```

### Training & Support
```bash
# Training materials
npm run brokerage:training:generate <id>         # Generate training docs
npm run brokerage:training:videos <id>           # Create video tutorials
npm run brokerage:training:schedule <id>         # Schedule training session
npm run brokerage:training:webinar <id>          # Set up webinar

# Support setup
npm run brokerage:support:ticket <id>            # Create support ticket
npm run brokerage:support:priority <id>          # Set priority support
npm run brokerage:support:contact <id>           # Assign support contact
npm run brokerage:support:docs <id>              # Generate support docs

# Onboarding tracking
npm run brokerage:onboarding:status <id>         # Check onboarding status
npm run brokerage:onboarding:checklist <id>      # View checklist
npm run brokerage:onboarding:complete <id>       # Mark as complete
npm run brokerage:onboarding:report <id>         # Generate report
```

### Brokerage Analytics & Reporting
```bash
# Usage analytics
npm run brokerage:analytics:usage <id>           # Usage statistics
npm run brokerage:analytics:adoption <id>        # Adoption metrics
npm run brokerage:analytics:roi <id>             # ROI analysis
npm run brokerage:analytics:compare               # Compare brokerages

# Custom reporting
npm run brokerage:report:generate <id> <type>    # Generate custom report
npm run brokerage:report:schedule <id>           # Schedule reports
npm run brokerage:report:export <id> <format>    # Export reports
npm run brokerage:report:email <id> <recipients> # Email reports

# Performance monitoring
npm run brokerage:monitor:performance <id>       # Performance metrics
npm run brokerage:monitor:alerts <id>            # Alert effectiveness
npm run brokerage:monitor:agents <id>            # Agent performance
```

### Billing & Subscription Management
```bash
# Subscription management
npm run brokerage:billing:create <id> <plan>     # Create subscription
npm run brokerage:billing:upgrade <id> <plan>    # Upgrade plan
npm run brokerage:billing:downgrade <id> <plan>  # Downgrade plan
npm run brokerage:billing:cancel <id>            # Cancel subscription

# Payment processing
npm run brokerage:payment:setup <id>             # Setup payment method
npm run brokerage:payment:charge <id>            # Process payment
npm run brokerage:payment:invoice <id>           # Generate invoice
npm run brokerage:payment:history <id>           # Payment history

# Usage-based billing
npm run brokerage:billing:usage <id>             # Calculate usage
npm run brokerage:billing:overage <id>           # Calculate overages
npm run brokerage:billing:credits <id> <amount>  # Add credits
```

---

## Enterprise Deployment Commands

### 🏗️ Multi-Tenant Infrastructure
```bash
# Tenant management
npm run tenant:create <tenant-id>                # Create new tenant
npm run tenant:configure <tenant-id>             # Configure tenant
npm run tenant:isolate <tenant-id>              # Ensure data isolation
npm run tenant:migrate <tenant-id>              # Run tenant migrations

# Resource allocation
npm run tenant:resources:allocate <tenant-id>    # Allocate resources
npm run tenant:resources:scale <tenant-id>       # Scale resources
npm run tenant:resources:limit <tenant-id>       # Set resource limits
npm run tenant:resources:monitor <tenant-id>     # Monitor usage

# Network isolation
npm run tenant:network:vlan <tenant-id>          # Configure VLAN
npm run tenant:network:firewall <tenant-id>      # Setup firewall rules
npm run tenant:network:cdn <tenant-id>           # Configure CDN
```

### Compliance & Security
```bash
# Compliance checks
npm run compliance:audit <brokerage-id>          # Run compliance audit
npm run compliance:gdpr <brokerage-id>           # GDPR compliance check
npm run compliance:pipeda <brokerage-id>         # PIPEDA compliance check
npm run compliance:report <brokerage-id>         # Generate compliance report

# Security measures
npm run security:audit <brokerage-id>            # Security audit
npm run security:penetration <brokerage-id>      # Penetration testing
npm run security:encrypt <brokerage-id>          # Enable encryption
npm run security:2fa <brokerage-id>              # Enable 2FA
npm run security:sso <brokerage-id>              # Configure SSO
```

### Migration Tools
```bash
# Data migration from competitor platforms
npm run migrate:from:competitor <brokerage-id> <platform>
npm run migrate:validate <brokerage-id>          # Validate migrated data
npm run migrate:rollback <brokerage-id>          # Rollback migration
npm run migrate:report <brokerage-id>            # Migration report

# Bulk imports
npm run import:properties <brokerage-id> <file>  # Import properties
npm run import:agents <brokerage-id> <file>      # Import agents
npm run import:history <brokerage-id> <file>     # Import historical data
```

---

## Workflow Macros

### 🏢 Complete White-Label Setup
```bash
# Macro: Full white-label deployment
npm run whitelabel:complete <brokerage-id>

# This runs:
# 1. Create white-label instance
# 2. Configure branding
# 3. Setup custom domain
# 4. Deploy infrastructure
# 5. Configure features
# 6. Import agents
# 7. Setup billing
# 8. Generate documentation
# 9. Schedule training
# 10. Go live
```

### 🎯 Brokerage Quick Launch
```bash
# Macro: 48-hour brokerage launch
npm run brokerage:quick-launch <name> <domain>

# This runs:
# 1. Create brokerage account
# 2. Setup subdomain
# 3. Configure regions
# 4. Import agent list
# 5. Deploy white-label site
# 6. Configure billing
# 7. Send onboarding emails
# 8. Schedule training call
```

### 📊 Enterprise Migration
```bash
# Macro: Migrate from competitor
npm run enterprise:migrate <brokerage-id> <competitor-platform>

# This runs:
# 1. Analyze competitor data
# 2. Map data structures
# 3. Export from competitor
# 4. Transform data
# 5. Import to AgentRadar
# 6. Validate migration
# 7. Setup redirects
# 8. Train agents
# 9. Monitor adoption
```

### 🔄 Multi-Brokerage Update
```bash
# Macro: Update all white-label instances
npm run whitelabel:mass-update

# This runs:
# 1. Backup all instances
# 2. Put in maintenance mode
# 3. Update core platform
# 4. Update each instance
# 5. Run health checks
# 6. Disable maintenance mode
# 7. Send update notifications
```

### 🔥 Complete Feature Development
```bash
# Macro: Create new feature end-to-end
npm run feature:create <name>

# This runs:
# 1. Create database migration
# 2. Generate API endpoint
# 3. Create web components
# 4. Generate mobile screens
# 5. Add desktop support
# 6. Create tests
# 7. Update documentation
```

### 🚢 Production Release
```bash
# Macro: Full production release
npm run release:production

# This runs:
# 1. Run all tests
# 2. Build all platforms
# 3. Deploy web to production
# 4. Submit mobile to stores
# 5. Release desktop updates
# 6. Run database migrations
# 7. Clear caches
# 8. Send release notes
```

### 🏃 Quick Hotfix
```bash
# Macro: Emergency hotfix deployment
npm run hotfix:deploy <fix-description>

# This runs:
# 1. Create hotfix branch
# 2. Apply fix
# 3. Run critical tests
# 4. Deploy to staging
# 5. Quick smoke test
# 6. Deploy to production
# 7. Monitor for issues
```

### 📊 Daily Operations
```bash
# Macro: Morning startup routine
npm run daily:startup

# This runs:
# 1. Check service health
# 2. Run scrapers
# 3. Process new data
# 4. Send morning alerts
# 5. Generate daily report
# 6. Backup database
# 7. Clean old logs
```

### 🔍 New Market Launch
```bash
# Macro: Launch in new market
npm run market:launch <locale>

# This runs:
# 1. Create locale config
# 2. Set up data sources
# 3. Configure scrapers
# 4. Create landing page
# 5. Set up payment processing
# 6. Deploy to region
# 7. Run initial data collection
```

### 🧪 Testing Suite
```bash
# Macro: Complete test suite
npm run test:complete

# This runs:
# 1. Unit tests (all platforms)
# 2. Integration tests
# 3. E2E tests (web)
# 4. Mobile app tests
# 5. Desktop app tests
# 6. API tests
# 7. Performance tests
# 8. Security scan
# 9. Generate coverage report
```

### 🔧 Maintenance Mode
```bash
# Enable maintenance mode
npm run maintenance:enable

# Disable maintenance mode
npm run maintenance:disable

# Maintenance operations
npm run maintenance:db           # Database maintenance
npm run maintenance:cache        # Clear all caches
npm run maintenance:optimize    # Optimize all services
```

---

## Environment Setup Commands

### Development Environment
```bash
# Setup complete dev environment
npm run setup:dev

# Individual setup commands
npm run setup:web
npm run setup:mobile
npm run setup:desktop
npm run setup:api
npm run setup:db
npm run setup:redis
```

### CI/CD Pipeline
```bash
# GitHub Actions
npm run ci:setup                # Setup CI environment
npm run ci:test                # Run CI tests
npm run ci:build               # CI build process
npm run ci:deploy              # CI deployment

# Pre-commit hooks
npm run hooks:install          # Install git hooks
npm run hooks:pre-commit      # Run pre-commit checks
npm run hooks:pre-push        # Run pre-push checks
```

---

## Custom Aliases for Claude Code

### Productivity Aliases
```bash
# Quick commands for Claude Code
alias ar='npm run'                    # AgentRadar run
alias ard='npm run dev:'              # AgentRadar dev
alias art='npm run test:'             # AgentRadar test
alias arb='npm run build:'            # AgentRadar build
alias ars='npm run scraper:'          # AgentRadar scraper
alias ardb='npm run db:'              # AgentRadar database

# Complex operations
alias ar-fresh='npm run clean && npm install && npm run setup:dev'
alias ar-deploy='npm run test:complete && npm run build:all && npm run deploy:all'
alias ar-update='git pull && npm install && npx prisma migrate deploy && npm run build:all'
```

---

## Error Recovery Commands

### Common Fixes
```bash
# Clean and rebuild
npm run clean:all              # Clean all build artifacts
npm run rebuild:all           # Rebuild everything
npm run reset:all            # Factory reset

# Fix common issues
npm run fix:deps             # Fix dependency issues
npm run fix:types           # Fix TypeScript errors
npm run fix:lint            # Auto-fix linting issues
npm run fix:db              # Fix database issues
npm run fix:cache           # Clear all caches
```

---

## Notes for Claude Code

1. **Always run tests before deployment**: `npm run test:complete`
2. **Check scraper health daily**: `npm run scraper:status`
3. **Backup database before migrations**: `npm run db:backup`
4. **Use workflow macros for complex operations**
5. **Monitor logs after deployment**: `npm run logs:all`
6. **Run security scan weekly**: `npm audit fix`
7. **Keep dependencies updated**: `npm run update:check`

---

*This command library is designed to accelerate AgentRadar development. Update these commands as the project evolves.*
