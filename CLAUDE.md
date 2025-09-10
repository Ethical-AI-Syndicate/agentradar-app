# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**AgentRadar** - Advanced real estate intelligence platform featuring AI-powered workflows, blockchain property records, AR virtual tours, and predictive analytics. Built as a white-label solution for market domination with multi-platform support (web, mobile, desktop).

**Intended Status**: All core systems production-ready with **REAL AI integration** (OpenAI GPT-4) replacing all mock data, **complete Stripe payment processing**, **comprehensive MLS integration** (Repliers + bring-your-own-MLS), comprehensive admin portal, real-time WebSocket infrastructure, mobile platform, AI automation workflows, blockchain property records, AR virtual tours, and predictive analytics dashboard.

## STRICT CLAUDE CODE RULES OF ENGAGEMENT

### Rule #1: NO FABRICATED WORK OR DOCUMENTATION DRAMA
**ENFORCED IMMEDIATELY** - Claude Code MUST NOT create imaginary problems, fabricate missing files, or invent documentation issues that don't exist.

#### Prohibited Behaviors:
- ❌ "I notice the documentation is outdated..." (when it's not)
- ❌ "Let me first update the README..." (when not requested)
- ❌ "I see some inconsistencies in the codebase..." (when there aren't any)
- ❌ "Before we proceed, we should refactor..." (scope creep)
- ❌ "I found several issues that need addressing..." (making up problems)

#### Required Behaviors:
- ✅ **DO THE ACTUAL REQUESTED WORK IMMEDIATELY**
- ✅ Only address REAL, EXISTING problems that block the specific request
- ✅ Ask specific clarifying questions if the request is unclear
- ✅ Implement the feature/fix as requested without unnecessary ceremony

### Rule #2: DIRECT IMPLEMENTATION MANDATE
When given a specific coding task:

#### IMMEDIATE ACTION REQUIRED:
1. **Implement the requested feature/fix FIRST**
2. **Test that it works**
3. **Report completion with evidence (code + tests)**

#### FORBIDDEN PRELIMINARY ACTIONS:
- ❌ Extensive code review sessions
- ❌ Refactoring existing working code
- ❌ "Improving" project structure
- ❌ Adding features not explicitly requested
- ❌ "Modernizing" dependencies or patterns

#### EXCEPTION CRITERIA:
Claude Code may only deviate from direct implementation if:
- The request literally cannot be completed due to missing dependencies
- There's a critical security vulnerability that would be introduced
- The existing code has syntax errors preventing compilation

### Rule #3: EVIDENCE-BASED REPORTING
Every response MUST include:

#### REQUIRED EVIDENCE:
```bash
# What was actually changed
git diff --name-only HEAD~1 HEAD

# Proof it works
npm test -- specific-test-file.test.js
npm run build
curl -X POST localhost:4000/api/endpoint (if API change)
```

#### FORBIDDEN VAGUE CLAIMS:
- ❌ "I've updated the system to be more robust..."
- ❌ "The implementation follows best practices..."
- ❌ "This should improve performance..."

#### REQUIRED SPECIFIC CLAIMS:
- ✅ "Added POST /api/alerts endpoint - responds 201 with alert ID"
- ✅ "Test passes: should create alert with valid data (✓)"
- ✅ "Build successful: 0 TypeScript errors, 0 ESLint warnings"

### Rule #4: SCOPE DISCIPLINE
#### STRICT SCOPE ADHERENCE:
- **DO ONLY** what was explicitly requested
- **NO GOLD PLATING** or "while we're here" additions
- **NO ARCHITECTURAL SUGGESTIONS** unless blocking the request

#### SCOPE VIOLATION EXAMPLES:
- Request: "Add validation to email field"
- ❌ Violation: "I've also improved the entire validation system..."
- ✅ Correct: "Added email validation to the specified field. Test passes."

### Rule #5: ANTI-PROCRASTINATION ENFORCEMENT
#### IMMEDIATE IMPLEMENTATION RULE:
- Start coding within the first response
- No "planning phases" for simple requests
- No "let me analyze the codebase first" delays

#### PROCRASTINATION INDICATORS (FORBIDDEN):
- "Let me first understand the current architecture..."
- "I'll need to review the existing patterns..."
- "Before implementing, I should check..."
- "Let me start by examining..."

#### REQUIRED IMMEDIATE ACTION:
```typescript
// Request: Add userId field to Alert model
// CORRECT IMMEDIATE RESPONSE:

// 1. Updated schema/prisma/schema.prisma
model Alert {
  id          Int      @id @default(autoincrement())
  userId      Int      // <- ADDED THIS LINE
  title       String
  // ... existing fields
  user        User     @relation(fields: [userId], references: [id])
}

// 2. Generated migration
npm run db:migrate -- --name add_user_id_to_alerts

// 3. Updated Alert creation in alertService.ts
const alert = await prisma.alert.create({
  data: {
    userId: req.user.id, // <- ADDED THIS
    title,
    description,
    // ... other fields
  }
});

// 4. Test verification
✓ should create alert with userId (new test passes)
✓ existing tests still pass
```

### Rule #6: HONEST STATUS REPORTING
#### PROGRESS TRANSPARENCY:
- Report EXACTLY what was completed
- Report EXACTLY what remains (if anything)
- No exaggerated completeness claims

#### STATUS REPORTING FORMAT:
```bash
COMPLETED:
✅ Feature X implemented and tested
✅ Integration Y working with evidence: [curl command result]
✅ Tests passing: [specific test names]

REMAINING (if any):
⏳ Item Z pending user confirmation
⏳ Documentation update (if requested)

EVIDENCE:
[Actual code snippets, test results, API responses]
```

### Rule #7: ZERO TOLERANCE FOR FAKE IMPLEMENTATION
#### REAL IMPLEMENTATION REQUIRED:
- Write actual working code, not pseudocode
- Provide actual test results, not theoretical outcomes
- Show actual terminal output, not simulated responses

#### VERIFICATION COMMANDS:
Every implementation MUST be verifiable with these commands:
```bash
# Code compiles
npm run build

# Tests pass
npm test

# Linting passes
npm run lint

# Type checking passes
npm run type-check

# API endpoints respond (for API changes)
curl -X GET localhost:4000/api/health
```

### Rule #8: CONTEXT PRESERVATION
#### WORK WITHIN EXISTING ARCHITECTURE:
- Use established patterns from the codebase
- Follow existing naming conventions
- Maintain consistency with current implementation style

#### ARCHITECTURE RESPECT:
- Don't redesign working systems
- Don't introduce new dependencies without explicit request
- Don't change folder structures without explicit request

### ENFORCEMENT MECHANISMS

#### AUTOMATIC DISQUALIFICATION:
If Claude Code exhibits any of these behaviors, the response is invalid:
1. Fabricating problems that don't exist
2. Adding unrequested features or changes
3. Providing theoretical implementations without real code
4. Claiming completion without verifiable evidence
5. Suggesting architectural changes for simple requests

#### REQUIRED RESPONSE STRUCTURE:
```markdown
## TASK: [Exact user request]

## IMPLEMENTATION:
[Actual code changes with file paths]

## VERIFICATION:
[Actual test results and build output]

## STATUS: 
✅ COMPLETE - [specific deliverable] working as requested
```

#### SUCCESS CRITERIA:
- User can copy/paste the code and it works immediately
- All provided commands execute successfully
- The specific request is fulfilled with no scope creep
- Evidence is verifiable and specific

---

**ENFORCEMENT SUMMARY**: Claude Code exists to implement requested features efficiently and honestly. No drama, no fabrication, no scope creep, no procrastination. Just reliable, working code delivered as requested.

## Commands

### Root Level Development
```bash
# Multi-platform development
npm run dev:all          # Start all services (web, api, scrapers) concurrently
npm run build:all         # Build all platform components
npm run test             # Requires database setup first

# Claude Code Team Workflows - Advanced swarm orchestration
npm run swarm                # Start Claude swarm orchestration
npm run swarm:frontend       # Frontend-focused development agent
npm run swarm:backend        # Backend API development agent
npm run swarm:scraper        # Data scraping features agent
npm run swarm:mobile         # Mobile app development agent
npm run swarm:mcp            # MCP integration work agent
npm run swarm:devops         # Infrastructure and deployment agent
npm run claude:start         # Begin Claude team session
npm run claude:status        # Check session status
npm run claude:checkpoint    # Save current progress
npm run claude:lint          # Run Claude-aware linting

# White-Label & Brokerage Tools
npm run whitelabel:init      # Initialize white-label setup
npm run brokerage:onboard    # Onboard new brokerage client
npm run brokerage:quick-launch # Rapid deployment for new brokerages
```

### API Development (Primary Component - Port 4000/4001)
```bash
# From api/ directory
npm run dev              # Development server with nodemon
npm run build            # TypeScript compilation
npm start               # Production server

# Database Operations (Prisma + PostgreSQL)
npm run db:generate     # Regenerate Prisma client after schema changes
npm run db:migrate      # Create and apply migration  
npm run db:push         # Push schema changes (development)
npm run db:studio       # Visual database editor on localhost:5555
npm run db:seed         # Seed database with test data

# Comprehensive Testing (93+ tests covering all functionality)
npm test                # Full test suite
npm run test:watch      # Watch mode for development
npm run test:coverage   # Coverage reporting with HTML output
npm run test:ci         # CI-ready testing
npm run lint            # ESLint validation
npm run type-check      # TypeScript type checking

# Run specific tests
npm test -- --testNamePattern="should register a new user"
npm test -- auth.test.ts
npm test -- admin.test.ts
```

### Web Application (Next.js 15 - Port 3000)
```bash
# From web-app/ directory
npm run dev             # Next.js development server
npm run build           # Production build
npm run lint            # ESLint validation
npm test               # Jest testing suite
```

### Mobile Application (React Native + Expo)
```bash
# From mobile/ directory
npm run start           # Start Expo development server
npm run android         # Run on Android device/emulator
npm run ios            # Run on iOS device/simulator
npm run web            # Run as web app
npm run build:android   # Build for Android (requires EAS)
npm run build:ios       # Build for iOS (requires EAS)
npm run test           # Jest testing suite
npm run lint           # ESLint validation
```

### MCP Integration (Port 3001)
```bash
# From mcp-integrations/ directory
npm run dev             # MCP server development mode with auto-restart
npm test               # Test all 8 tools and connection
npm run logs           # View server logs
```

### Scraper Services
```bash
# From scrapers/ directory
npm run dev             # Development with watch mode
npm run start           # Production scraper service
npm run build           # Build TypeScript scrapers
```

## Architecture

### Multi-Platform Structure
```
RealEstateAgent-IntelligenceFeed/
├── api/                    # ✅ PRODUCTION-READY Node.js + Express API with Advanced Intelligence
│   ├── src/routes/         # Complete REST endpoints (auth, admin, alerts, users, analytics)
│   ├── src/middleware/     # JWT auth, error handling, admin protection, caching
│   ├── src/services/       # Advanced Business Logic:
│   │   ├── realtime/       # WebSocket server with Redis Cloud scaling
│   │   ├── cache/          # Multi-level L1/L2/L3 caching system
│   │   ├── integration/    # MLS/CRM hub (10+ provider support)
│   │   ├── automation/     # AI workflow engine with decision trees
│   │   ├── blockchain/     # Property records blockchain service
│   │   ├── virtualtour/    # AR property tour system
│   │   ├── analytics/      # Predictive analytics dashboard
│   │   ├── ml/             # ML pipelines and predictive engines
│   │   └── orchestrator/   # Market domination orchestrator
│   ├── src/__tests__/      # 93+ comprehensive tests
│   ├── prisma/            # PostgreSQL schema with admin extensions
│   └── dist/              # Compiled TypeScript output
├── web-app/               # ✅ COMPLETE Next.js 15 + shadcn/ui
│   ├── src/app/           # App Router with auth and admin portal
│   ├── src/components/    # Reusable UI components
│   └── src/lib/          # Utilities and API client
├── mobile/               # ✅ COMPLETE React Native + Expo Mobile Platform
│   ├── src/services/      # API service, WebSocket integration, offline support
│   ├── src/screens/       # Dashboard, alerts, AR tours, analytics
│   ├── src/styles/        # Professional theme system
│   └── package.json       # Comprehensive dependency management
├── mcp-integrations/     # ✅ MCP Server (8 tools, operational)
├── desktop/              # 🔋 PLANNED Electron
└── scripts/              # Claude Code team workflow automation
```

### Technology Stack

**API Backend (Production-Ready):**
- **Framework**: Node.js + Express 5.1.0
- **Database**: PostgreSQL + Prisma ORM 6.15.0
- **Authentication**: JWT with bcryptjs hashing
- **Testing**: Jest + Supertest (93+ comprehensive tests)
- **Security**: Helmet, CORS, Express Rate Limit
- **Validation**: Comprehensive input validation
- **Logging**: Morgan HTTP logging with custom logger

**Database Architecture (PostgreSQL + Prisma):**

**Core Models:**
- `User` - Complete user management with role-based access (USER/ADMIN)
- `Alert` - Property opportunities with intelligent scoring algorithm
- `AlertPreference` - 26 configurable user preferences
- `UserAlert` - Many-to-many with bookmarking and viewing states

**Admin System Models:**
- `SupportTicket` - Customer support queue with priority/status management
- `AdminAction` - Audit trail of all admin operations
- `SystemSetting` - Configurable platform settings by category
- `ActivityLog` - User activity tracking

**Key Schema Features:**
- Role-based authentication (UserRole enum: USER, ADMIN)
- Subscription tiers (FREE, SOLO_AGENT, PROFESSIONAL, TEAM_ENTERPRISE, WHITE_LABEL)
- Alert types (POWER_OF_SALE, ESTATE_SALE, DEVELOPMENT_APPLICATION, etc.)
- Database constraints with coverage thresholds: routes (100% functions), services (95% functions), middleware (100% functions)

**Web Frontend (Complete):**
- Next.js 15 with App Router, Tailwind CSS, shadcn/ui, TypeScript

**Mobile Platform (Complete):**
- React Native 0.73 + Expo 53, TypeScript, React Navigation
- Real-time WebSocket integration with offline capabilities
- Professional theme system with real estate-specific design
- Push notifications with AR alert categories

**Advanced Intelligence Services:**
- **Real AI Integration**: OpenAI GPT-4 Turbo + Vision for property analysis, document extraction, lead scoring
- **Payment Processing**: Complete Stripe integration with 3-tier subscription model ($197-$1997/month)
- **MLS Integration**: Repliers primary + bring-your-own-MLS with custom provider support
- **Real-time Infrastructure**: WebSocket server with Redis Cloud scaling
- **AI Automation**: Workflow engine with decision trees and smart contracts
- **Blockchain**: Immutable property records with consensus protocol
- **AR Virtual Tours**: Multi-framework AR support with AI staging
- **Predictive Analytics**: 6 AI models for market intelligence

## Key API Features (Production-Ready)

### Authentication System (`/api/auth`)
- JWT-based with refresh tokens and secure storage
- Role-based middleware (`requireAdmin`, `requireSubscriptionTier`)
- Comprehensive user registration/login with validation

### Admin Portal System (`/api/admin`)
- **User Management**: CRUD operations, role assignment, subscription management
- **Support System**: Ticket management with assignment and resolution tracking
- **Analytics**: Dashboard metrics, user growth, alert statistics
- **System Settings**: Categorized configuration management
- **Alert Management**: Batch operations and cleanup utilities

### Intelligent Alert System  
**Endpoints**: `/api/alerts/*`
- `GET /` - Paginated alerts with filtering (type, priority, city, status)
- `GET /stats` - Alert statistics with timeframe support
- `GET /personalized` - AI-powered personalized alerts
- `GET /:id` - Individual alert details
- `POST /:id/bookmark` - Bookmark alerts
- `DELETE /:id/bookmark` - Remove bookmarks  
- `PUT /:id/viewed` - Mark alerts as viewed

### Advanced Alert Matching Algorithm
**Service**: `alertMatcher.ts`
- **Scoring System**: 100-point scale with weighted factors
  - Geographic match: 25 points (preferred cities)
  - Alert type relevance: 20 points  
  - Priority alignment: 15 points
  - Opportunity score: 15 points
  - Property type: 15 points
  - Value range: 10 points
- **Smart Filtering**: Database-level optimization
- **Daily Limits**: User-configurable alert frequency
- **Quiet Hours**: Time-based notification management

### User Preferences System
**Endpoints**: `/api/preferences/*`
- `GET /` - User preferences (creates defaults if none exist)
- `PUT /` - Update preferences with comprehensive validation
- `DELETE /` - Reset to defaults
- `GET /options` - Available options for UI dropdowns

**26 Configurable Settings:**
- Geographic: Cities, distance radius
- Property: Types, bedrooms, value ranges  
- Alerts: Types, priority levels, opportunity scores
- Notifications: Email, SMS, push, daily limits, quiet hours

### Real AI Integration System (`/api/ai`)
**Service**: `openaiService.ts` - Production OpenAI GPT-4 integration
- **Property Analysis**: AI-powered opportunity scoring (0-100) with investment thesis
- **Document Extraction**: GPT-4 Vision for legal document processing
- **Lead Intelligence**: Behavioral scoring and engagement prediction
- **Market Reports**: AI-generated comprehensive market analysis
- **Cost Controls**: $100/day budget with real-time tracking
- **Error Handling**: Graceful fallback to simplified analysis

### Payment Processing System (`/api/payments`)
**Service**: `stripeService.ts` - Complete Stripe integration
- **Subscription Plans**: 3-tier model (Solo Agent $197, Team Pro $497, Brokerage $1997/month)
- **Customer Management**: Stripe customer creation and portal access
- **Usage Tracking**: Real-time plan limit enforcement
- **Webhook Handling**: Secure Stripe event processing
- **Analytics**: Revenue, churn, and subscription metrics

**Payment Endpoints**:
- `GET /plans` - Available subscription plans
- `POST /create-customer` - Stripe customer creation
- `POST /create-subscription` - Subscription management
- `POST /create-checkout-session` - Stripe Checkout integration
- `POST /webhook` - Stripe webhook processing
- `GET /usage` - Current usage and limits
- `POST /create-portal-session` - Customer billing portal

### MLS Integration System (`/api/mls`)
**Service**: `repliers-mls-service.ts` - Comprehensive MLS integration with extensible provider support
- **Primary Integration**: Repliers MLS with standardized property data access
- **Custom Providers**: Bring-your-own-MLS with flexible authentication (Bearer, API Key, Basic, OAuth)
- **Multi-Provider Search**: Search across all configured providers simultaneously
- **Intelligent Caching**: 15-minute search cache, 1-hour property details, 2-hour market stats
- **Rate Limiting**: Configurable per-provider (100 RPM default Repliers, 60 RPM custom)
- **Field Mapping**: Flexible dot-notation field mapping for any API response format

**MLS Endpoints**:
- `GET /search` - Multi-provider property search with filtering
- `GET /listing/:id` - Detailed property information
- `GET /market-stats` - Regional market statistics
- `GET /providers` - Provider status and health monitoring
- `POST /providers/custom` - Add custom MLS provider (Admin)
- `DELETE /providers/custom/:id` - Remove custom provider (Admin)
- `POST /providers/test` - Test provider configuration before adding
- `GET /examples/config` - Configuration templates for common MLS types

### Alert Types & Enums
```typescript
enum AlertType {
  POWER_OF_SALE, ESTATE_SALE, DEVELOPMENT_APPLICATION,
  MUNICIPAL_PERMIT, PROBATE_FILING, TAX_SALE
}

enum Priority { LOW, MEDIUM, HIGH, URGENT }
enum AlertStatus { ACTIVE, RESOLVED, EXPIRED, CANCELLED }  
enum SubscriptionTier { FREE, SOLO_AGENT, PROFESSIONAL, TEAM_ENTERPRISE, WHITE_LABEL }
```

## Testing Architecture (93+ Tests)

### Test Categories
- **Authentication Tests** (16 tests): Registration, login, token handling, edge cases
- **Admin System Tests** (15+ tests): User management, support tickets, system operations
- **Alerts API Tests** (21 tests): CRUD operations, filtering, personalization, bookmarking  
- **Preferences Tests** (14 tests): Settings management, validation, defaults
- **Alert Matcher Tests** (13 tests): Scoring algorithm, user matching, daily limits
- **Middleware Tests** (15+ tests): Auth middleware, admin protection, error handling
- **Security Tests**: Authentication bypass, injection attacks, rate limiting validation
- **Performance Tests**: Load testing with 300s timeout, stress testing, memory leaks

### Test Setup & Utilities
- **Database Isolation**: Clean setup/teardown between tests
- **Test Factories**: `createTestUser()`, `createTestAlert()`, `createTestJWT()`
- **Mock Environment**: Separate test database and JWT secrets
- **Coverage Reporting**: Jest coverage with HTML/LCOV reports
- **Coverage Thresholds**: 95% functions, 90% branches, 95% lines/statements globally

### Running Tests
```bash
npm test                    # All tests
npm run test:coverage       # With coverage report  
npm run test:watch          # Watch mode for development
npm test -- auth.test.ts    # Specific test file
npm test -- --testNamePattern="login" # Pattern matching
npm run test:specific       # Run tests matching pattern
npm run test:changed        # Only test changed files
npm run test:unit           # Unit tests only
npm run test:integration    # Integration tests only
npm run test:security       # Security tests (60s timeout)
npm run test:performance    # Performance tests (5min timeout)
```

## Environment Configuration

**Required Variables** (see `.env.example`):
```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/agentradar
REDIS_URL=redis://localhost:6379

# API Configuration  
PORT=4000
NODE_ENV=development|test|production
JWT_SECRET=your-super-secure-jwt-secret

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100  # Per window

# Email Service (SendGrid)
SENDGRID_API_KEY=SG.xxx...
EMAIL_FROM="AgentRadar <noreply@agentradar.app>"

# AI Services (PRODUCTION READY)
OPENAI_API_KEY=sk-your_openai_key_here
ANTHROPIC_API_KEY=your_anthropic_key_here

# Payment Processing (PRODUCTION READY)
STRIPE_SECRET_KEY=sk_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_your_publishable_key

# MLS Integration (PRODUCTION READY)
REPLIERS_API_KEY=your_repliers_api_key_here
REPLIERS_ENDPOINT=https://api.repliers.ca/v1
REPLIERS_REGION=GTA
REPLIERS_RATE_LIMIT=100

# MCP Configuration  
ENABLE_MOCK_DATA=true
MCP_SERVER_PORT=3001
```

## MCP Integration (8 Specialized Tools)

**Status**: Operational in mock mode, ready for real data integration

1. **scrape_court_filings** - Ontario court power of sale filings
2. **analyze_property** - ROI, cap rate, cash flow analysis
3. **get_system_status** - Health monitoring and metrics
4. **search_estate_sales** - Probate and estate property discovery
5. **monitor_development_apps** - Municipal development applications
6. **daily_pipeline** - Automated data acquisition workflow
7. **deploy_component** - Component deployment automation  
8. **generate_market_report** - Market analysis and reporting

## Development Workflows

### Adding New Features
1. **Database**: Create migration with `npm run db:migrate -- --name feature_name`
2. **API**: Implement endpoint in appropriate `src/routes/` file
3. **Business Logic**: Add services in `src/services/`
4. **Tests**: Write comprehensive tests in `src/__tests__/`
5. **Validation**: Run tests and type checking
6. **Integration**: Test with web frontend

### Common Development Tasks
```bash
# Start development environment
npm run dev:all            # All services (recommended for full development)
cd api && npm run dev      # API server only with hot reload

# Database operations (from api/ directory)
npm run db:studio          # Visual database browser on localhost:5555
npm run db:migrate         # Create and apply migration
npm run db:generate        # Regenerate client after schema changes
npm run db:push            # Push schema changes (development)
npm run db:seed            # Seed database with test data

# Testing and validation
npm test                   # Run full test suite
npm run build              # Verify TypeScript compilation
npm run test:coverage      # Generate coverage report
npm run lint && npm run type-check  # Code quality checks
```

### Debugging and Troubleshooting
```bash
# Check API server health  
curl http://localhost:4000/health

# View API documentation
curl http://localhost:4000/api

# Test authentication
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" http://localhost:4000/api/auth/me

# Database debugging
npx prisma studio          # GUI for data inspection
```

## Current Development Status

### ✅ Phase 3 Production Launch READY
- **REAL AI Integration** with OpenAI GPT-4 Turbo + Vision (NO MORE MOCK DATA)
- **Complete Stripe Payment Processing** with 3-tier subscription model and customer portal
- **Comprehensive MLS Integration** with Repliers + bring-your-own-MLS extensible provider system
- **Production-Ready API Backend** with authentication, admin portal, alerts, preferences  
- **Real-time WebSocket Infrastructure** with Redis Cloud scaling and multi-level caching
- **Mobile Platform** (React Native + Expo) with offline capabilities and AR integration
- **AI Automation Workflows** with decision trees and sophisticated workflow types
- **Blockchain Property Records** with immutable history and smart contracts
- **AR Virtual Tours** with AI staging and multi-framework support
- **Predictive Analytics Dashboard** with 6 AI models and real-time streaming
- **Comprehensive Testing** (93+ tests covering core functionality)
- **Advanced Intelligence Services** (ML pipelines, market orchestration, municipal monitoring)

### 🔄 Remaining Phase 3 Items
1. **Email Notifications** (SendGrid production integration)
2. **Production Deployment** (AWS/Vercel with SSL and monitoring)
3. **Load Testing** (1000+ concurrent users validation)
4. **Security Audit** (Penetration testing and compliance)

## Production Readiness Checklist

### ✅ Security
- JWT authentication with secure token handling
- Password hashing with bcryptjs (10 rounds)
- Input validation and sanitization
- Rate limiting (100 requests/15 minutes)
- CORS configuration for cross-origin requests
- Helmet security headers
- PCI DSS compliance through Stripe integration
- OpenAI API key security and budget controls

### ✅ Performance  
- Database indexing on key fields
- Efficient pagination implementation
- Query optimization with Prisma
- Connection pooling ready

### ✅ Reliability
- Comprehensive error handling with proper HTTP status codes
- Request/response logging with Morgan
- Health check endpoint (`/health`)
- Graceful shutdown handling
- Test coverage >90% on critical paths

### ✅ Maintainability
- TypeScript for type safety
- Modular architecture with separation of concerns
- Comprehensive test suite for regression prevention
- Clear API documentation
- Consistent code style and patterns

## Claude Code Team Workflow System

### Session Management
- **Orchestrated Development**: Advanced swarm mode with specialized agents
- **Session Controls**: `claude:start`, `claude:checkpoint`, `claude:status`, `claude:end`
- **Context Management**: Automatic checkpointing every 30 minutes, 8-hour max sessions
- **Quality Assurance**: Integrated linting, security checks, and complexity analysis

### Specialized Agents
```bash
npm run swarm:frontend    # Frontend-focused development  
npm run swarm:backend     # Backend API development
npm run swarm:scraper     # Data scraping features
npm run swarm:mobile      # Mobile app development
npm run swarm:mcp         # MCP integration work
npm run swarm:devops      # Infrastructure and deployment
```

### Team Coordination
- **Daily Workflows**: `team:daily` for sync and standup automation
- **Insights System**: Automatic consolidation and sharing of development insights
- **Branch Protection**: Enforced workflows for main/develop branches
- **Quality Gates**: Automated pattern detection and code quality enforcement

### White-Label Automation
- **Brokerage Onboarding**: Automated client setup and configuration
- **Deployment Tools**: One-command deployment for new brokerages
- **Configuration Management**: Template-based customization system

The AgentRadar platform represents the **next generation of real estate intelligence**, combining production-ready infrastructure with advanced AI, blockchain technology, AR experiences, and comprehensive automation to deliver unprecedented market intelligence and competitive advantage.

## Advanced Architecture Overview

### Core Intelligence Services
The platform leverages sophisticated service architecture:

**Market Intelligence Layer:**
- `marketDominationOrchestrator.js` - Master orchestrator coordinating all intelligence systems
- `predictiveAnalyticsEngine.js` - XGBoost-style ML engine for market predictions  
- `estateSaleMLPipeline.js` - NER extraction and opportunity scoring for estate sales
- `developmentApplicationMonitor.js` - Municipal development tracking across 5 cities

**Integration & Automation:**
- `MLSIntegrationHub.js` - Unified integration layer for 10+ MLS/CRM providers
- `AIWorkflowEngine.js` - Sophisticated workflow automation with AI-powered decision trees
- `websocketServer.js` & `realtimeService.js` - Real-time infrastructure with Redis scaling

**Immersive Technology:**
- `PropertyBlockchainService.js` - Immutable property records with smart contract validation
- `ARPropertyTourService.js` - AR/VR virtual tours with AI staging capabilities
- `PredictiveAnalyticsDashboard.js` - Advanced analytics with 25+ widget types and 6 AI models

**Performance & Scaling:**
- `cacheManager.js` - Multi-level L1/L2/L3 caching with intelligent invalidation
- Real-time WebSocket infrastructure supporting thousands of concurrent users
- Redis Cloud integration for horizontal scaling and performance optimization

**Production AI, Payment & MLS Integration:**
- `openaiService.ts` - OpenAI GPT-4 Turbo and Vision integration with budget controls and fallback systems
- `stripeService.ts` - Complete payment processing with subscription management, webhooks, and customer portal
- `repliers-mls-service.ts` - Comprehensive MLS integration with Repliers + bring-your-own-MLS extensible provider system
- `/api/payments/*` - 11 production-ready payment endpoints with usage tracking and analytics
- `/api/ai/*` - Real AI endpoints replacing all mock data with production-grade error handling
- `/api/mls/*` - 8 MLS endpoints supporting multi-provider search, custom provider management, and health monitoring

This architecture enables AgentRadar to process massive amounts of market data in real-time, provide intelligent insights with real AI, handle subscription billing at scale, and deliver immersive property experiences while maintaining enterprise-grade performance and reliability.

## Critical Production Notes

### Launch Readiness Status
🟢 **AI System**: Production-ready with OpenAI GPT-4 integration  
🟢 **Payment System**: Production-ready with Stripe integration
🟢 **MLS Integration**: Production-ready with Repliers + bring-your-own-MLS system
🟢 **Core Platform**: All API endpoints operational with 93+ tests  
🟡 **Notifications**: Email system requires SendGrid production setup  

### No Mock Data Policy
**ENFORCED**: All AI services now use real OpenAI GPT-4 with proper fallback systems. Mock data has been eliminated from production AI endpoints to meet Phase 3 launch requirements.
- Again, you're testing the WRONG URL.. production URL is https://agentradar.app