# Claude Code Instructions - AgentRadar Command Library

## 🚀 Quick Reference for Claude Code

This document helps you (Claude Code) efficiently use the AgentRadar command library and project structure.

## Primary Resources

1. **CLAUDE.md** - Complete project specification and architecture
2. **COMMANDS.md** - Comprehensive command library (this document's companion)
3. **package.scripts.json** - Executable npm scripts
4. **setup-agentradar.sh** - One-command project initialization

## Command Execution Priority

### When Starting Development
```bash
# First time setup (run once)
./setup-agentradar.sh --platform web

# Daily startup
npm run daily:startup

# Start development
npm run dev:all
```

### When Building Features
```bash
# Use the macro for complete feature development
npm run feature:create <feature-name>

# Or step by step:
1. npm run db:migrate                    # Create migration
2. npm run generate:api <endpoint>       # Create API
3. npm run generate:component <n>   # Create UI
4. npm run test:watch                    # Test as you code
```

### When Debugging Issues
```bash
# Check health first
npm run health:check

# View relevant logs
npm run logs:all | grep ERROR

# Clean and rebuild if needed
npm run clean:all && npm run build:all
```

## Platform-Specific Workflows

### Web Development (Immediate Focus)
```bash
# Standard web development flow
cd web-app
npm run dev                    # Start dev server
npm run generate:page <route> # Create new page
npm run build                  # Build for production
npm run deploy:web:preview    # Deploy preview
```

### Mobile Development (Month 2)
```bash
# iOS development
npm run build:mobile:ios
npm run test:mobile
fastlane ios beta

# Android development  
npm run build:mobile:android
fastlane android beta
```

### Desktop Development (Month 3)
```bash
# Desktop development
npm run build:desktop:all
npm run test:desktop
npm run dist:win
npm run dist:mac
```

## Scraper Management

### Daily Scraper Operations
```bash
# Morning routine
npm run scraper:status         # Check health
npm run scraper:all           # Run all scrapers
npm run logs:scrapers         # Monitor output

# Troubleshooting
npm run scraper:test power-of-sale  # Test specific scraper
npm run scraper:logs | grep ERROR   # Find issues
```

### Adding New Market
```bash
# Use the market launch macro
npm run market:launch vancouver

# This automatically:
# 1. Creates locale config
# 2. Sets up scrapers
# 3. Configures database
# 4. Deploys landing page
```

## Database Operations

### Common Database Tasks
```bash
# Development
npm run db:studio              # Visual database editor
npm run db:migrate             # Apply migrations
npm run db:seed                # Add test data

# Production
npm run db:backup              # Backup before changes
npm run db:migrate:prod       # Deploy migrations
npm run db:optimize           # Performance tuning
```

## Testing Strategy

### Before Every Commit
```bash
npm run test:unit              # Quick unit tests
npm run lint:all              # Fix linting issues
```

### Before Deployment
```bash
npm run test:complete         # Full test suite
npm run security:audit       # Security check
npm run build:all           # Verify builds
```

## Deployment Checklist

### Web Deployment (Priority)
```bash
1. npm run test:complete      # Run all tests
2. npm run build:web          # Build production
3. npm run deploy:web:preview # Deploy preview
4. npm run health:check       # Verify deployment
5. npm run deploy:web:prod    # Deploy to production
```

### Mobile Release
```bash
1. npm run test:mobile
2. npm run build:mobile:ios
3. npm run build:mobile:android
4. fastlane ios release
5. fastlane android release
```

## Error Recovery

### When Things Break
```bash
# Web app won't start
npm run clean:web && npm run setup:web

# Database issues
npm run db:reset && npm run db:seed

# Scraper failures
npm run scraper:status
npm run scraper:test <scraper-name>

# Complete reset
npm run clean:all && npm run setup:dev
```

## Performance Optimization

### Regular Maintenance
```bash
# Weekly
npm run maintenance:db        # Optimize database
npm run maintenance:cache     # Clear caches
npm run update:deps          # Update dependencies

# Monthly
npm run analyze:bundle       # Check bundle size
npm run security:audit      # Security scan
npm run test:load          # Load testing
```

## Monitoring Production

### Daily Monitoring
```bash
npm run health:check         # Service health
npm run metrics:collect     # Gather metrics
npm run report:daily       # Generate report
npm run logs:errors       # Check for errors
```

## Best Practices for Claude Code

### 1. Always Check Health First
Before making changes, run `npm run health:check` to ensure all services are running.

### 2. Use Macros for Complex Operations
Instead of running multiple commands, use workflow macros:
- `npm run feature:create` for new features
- `npm run release:production` for deployments
- `npm run market:launch` for new markets

### 3. Test Incrementally
- Run `npm run test:watch` while developing
- Use `npm run test:unit` for quick checks
- Run `npm run test:complete` before major changes

### 4. Monitor Logs
Keep `npm run logs:all` running in a separate terminal to catch issues early.

### 5. Document Commands Used
When creating new workflows, add them to COMMANDS.md for future reference.

## Command Aliases for Efficiency

```bash
# Add to your shell profile
alias ar='npm run'                    # AgentRadar run
alias ard='npm run dev:'              # AgentRadar dev
alias art='npm run test:'             # AgentRadar test
alias arb='npm run build:'            # AgentRadar build
alias ars='npm run scraper:'          # AgentRadar scraper
```

## Project Structure Quick Reference

```
agentradar/
├── web-app/          # Next.js web application (PRIORITY)
├── mobile/           # React Native app (Month 2)
├── desktop/          # Electron app (Month 3)
├── api/              # Express API server
├── scrapers/         # Data scrapers
│   ├── gta/         # Toronto scrapers (PRIORITY)
│   ├── vancouver/   # Vancouver scrapers
│   └── nyc/         # NYC scrapers
├── scripts/          # Automation scripts
├── infrastructure/   # Docker, K8s configs
└── docs/            # Documentation
```

## Environment Variables

Always ensure these are set before running commands:
```bash
# Development
cp .env.example .env.local

# Key variables to configure
DATABASE_URL          # PostgreSQL connection
REDIS_URL            # Redis connection
STRIPE_SECRET_KEY    # Payment processing
SENDGRID_API_KEY    # Email sending
```

## Common Command Patterns

### Pattern 1: Feature Development
```bash
feature:create → test:watch → build → deploy:preview
```

### Pattern 2: Bug Fix
```bash
logs:errors → debug → test:unit → hotfix:deploy
```

### Pattern 3: New Market Launch
```bash
market:launch → scraper:test → deploy:web → monitor
```

### Pattern 4: Production Release
```bash
test:complete → build:all → deploy:prod → health:check
```

## Getting Help

If a command fails:
1. Check `npm run logs:all` for errors
2. Run `npm run health:check` for service status
3. Consult COMMANDS.md for command details
4. Use `npm run clean:all` as last resort

## Remember

- **Web first**: Focus on web-app development initially
- **Test always**: Run tests before deployments
- **Monitor logs**: Keep logs running during development
- **Use macros**: Leverage workflow macros for efficiency
- **Document new commands**: Add to COMMANDS.md

---

*This instruction set helps Claude Code navigate the AgentRadar project efficiently. Update as new patterns emerge.*
