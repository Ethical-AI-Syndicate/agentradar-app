# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**AgentRadar** - Multi-platform real estate intelligence system for identifying properties before they hit MLS. Built as a white-label platform for brokerages with web, mobile, and desktop applications.

**Current Status**: **API Backend Production-Ready** with comprehensive admin portal, authentication system, intelligent alert matching, and 93+ test suite. Web app complete with admin management interface. MCP integration operational in mock mode.

## Commands

### Root Level Development
```bash
# Multi-platform development
npm run dev:all          # Start all services (web, api, scrapers) concurrently
npm run build:all         # Build all platform components
npm run test             # Requires database setup first

# Claude Code Team Workflows
npm run swarm                # Start Claude swarm orchestration
npm run claude:start        # Begin Claude team session
npm run claude:status       # Check session status
npm run claude:checkpoint   # Save current progress
npm run claude:lint         # Run Claude-aware linting

# White-Label & Brokerage Tools
npm run whitelabel:init     # Initialize white-label setup
npm run brokerage:onboard   # Onboard new brokerage client
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

# Comprehensive Testing (93+ tests covering all functionality)
npm test                # Full test suite
npm run test:watch      # Watch mode for development
npm run test:coverage   # Coverage reporting with HTML output
npm run test:ci         # CI-ready testing

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

### MCP Integration (Port 3001)
```bash
# From mcp-integrations/ directory
npm run dev             # MCP server development mode with auto-restart
npm test               # Test all 8 tools and connection
npm run logs           # View server logs
```

## Architecture

### Multi-Platform Structure
```
RealEstateAgent-IntelligenceFeed/
├── api/                    # ✅ PRODUCTION-READY Node.js + Express API
│   ├── src/routes/         # Complete REST endpoints (auth, admin, alerts, users)
│   ├── src/middleware/     # JWT auth, error handling, admin protection
│   ├── src/services/       # Business logic (alertMatcher, admin operations)
│   ├── src/__tests__/      # 93+ comprehensive tests
│   ├── prisma/            # PostgreSQL schema with admin extensions
│   └── dist/              # Compiled TypeScript output
├── web-app/               # ✅ COMPLETE Next.js 15 + shadcn/ui
│   ├── src/app/           # App Router with auth and admin portal
│   ├── src/components/    # Reusable UI components
│   └── src/lib/          # Utilities and API client
├── mcp-integrations/     # ✅ MCP Server (8 tools, mock mode)
├── mobile/               # 📋 PLANNED React Native + Expo
├── desktop/              # 📋 PLANNED Electron
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

**Web Frontend (Complete):**
- Next.js 15 with App Router, Tailwind CSS, shadcn/ui, TypeScript

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

### Test Setup & Utilities
- **Database Isolation**: Clean setup/teardown between tests
- **Test Factories**: `createTestUser()`, `createTestAlert()`, `createTestJWT()`
- **Mock Environment**: Separate test database and JWT secrets
- **Coverage Reporting**: Jest coverage with HTML/LCOV reports

### Running Tests
```bash
npm test                    # All tests
npm run test:coverage       # With coverage report
npm test -- auth.test.ts    # Specific test file
npm test -- --testNamePattern="login" # Pattern matching
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
npm run dev                 # API server with hot reload

# Database operations
npx prisma studio          # Visual database browser
npx prisma migrate dev     # Create and apply migration
npx prisma generate        # Regenerate client after schema changes
npx prisma db push         # Push schema changes (development)

# Testing and validation
npm test                   # Run full test suite
npm run build              # Verify TypeScript compilation
npm run test:coverage      # Generate coverage report
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

### ✅ Completed (Production-Ready)
- **Complete API Backend** with authentication, admin portal, alerts, preferences  
- **Comprehensive Admin System** with user management, support tickets, analytics
- **Comprehensive Testing** (93+ tests covering all functionality including admin)
- **Database Schema** with role-based access and admin extensions
- **JWT Security** with proper validation and admin middleware
- **Intelligent Matching** algorithm with sophisticated scoring
- **Web Application** with complete admin management interface

### 🔄 Next Priority: Real Data Integration
1. **Transition MCP from mock to real data** scraping
2. **Implement court filing scrapers** for Ontario
3. **Connect real property data** to alert system
4. **Test end-to-end workflows** with live data

### 📋 Future Development
- **Mobile Applications** (React Native + Expo)
- **Desktop Applications** (Electron)
- **Real-time Notifications** (WebSocket integration)
- **Advanced Analytics** and reporting
- **White-label Automation** for brokerage deployment

## Production Readiness Checklist

### ✅ Security
- JWT authentication with secure token handling
- Password hashing with bcryptjs (10 rounds)
- Input validation and sanitization
- Rate limiting (100 requests/15 minutes)
- CORS configuration for cross-origin requests
- Helmet security headers

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

The AgentRadar platform combines **production-ready API backend** with **comprehensive admin capabilities** and **advanced Claude Code team orchestration** for scalable real estate intelligence platform development.