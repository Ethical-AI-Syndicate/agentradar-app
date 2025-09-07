# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**AgentRadar** - Multi-platform real estate intelligence system for identifying properties before they hit MLS. Built as a white-label platform for brokerages with web, mobile, and desktop applications.

**Current Status**: **API Backend Completed** with production-ready authentication, intelligent alert system, user preferences, and comprehensive testing. Web MVP completed with all marketing pages. MCP integration ready (mock mode).

## Commands

### API Development (Primary Active Component)
```bash
# Development
npm run dev          # API server with nodemon on :4000
npm run build        # TypeScript compilation  
npm start           # Production server

# Database Operations
npm run db:generate     # Generate Prisma client
npm run db:migrate      # Create and apply migration
npm run db:push         # Push schema changes (dev)
npm run db:studio       # Visual database editor

# Testing (Comprehensive Suite)  
npm test                # Full test suite (93+ tests)
npm run test:watch      # Watch mode for development
npm run test:coverage   # Coverage reporting
npm run test:ci         # CI-ready testing

# Single test patterns
npm test -- --testNamePattern="should register a new user"
npm test -- auth.test.ts
```

### Web Application (Complete)
```bash
# From web-app directory
npm run dev         # Next.js development server on :3000
npm run build       # Production build
npm run lint        # ESLint validation
```

### MCP Integration (Mock Mode)
```bash
# From mcp-integrations directory
npm run dev         # MCP server development mode
npm test           # MCP connection and tool tests
npm run logs       # View server logs
```

## Architecture

### Repository Structure
```
RealEstateAgent-IntelligenceFeed/
├── api/                    # ✅ PRODUCTION-READY Node.js API
│   ├── src/routes/         # Complete REST API endpoints
│   │   ├── auth.ts         # JWT authentication (register, login, refresh, me)
│   │   ├── alerts.ts       # Alert management (list, stats, personalized, CRUD)
│   │   ├── preferences.ts  # User alert preferences (full CRUD)
│   │   ├── admin.ts        # Admin operations
│   │   ├── properties.ts   # Property management
│   │   ├── users.ts        # User management
│   │   └── early-adopters.ts # Early adopter registration
│   ├── src/services/       # Business logic services
│   │   └── alertMatcher.ts # Intelligent alert matching algorithm
│   ├── src/middleware/     # Express middleware
│   │   ├── auth.ts         # JWT authentication & authorization
│   │   ├── errorHandler.ts # Centralized error handling
│   │   └── notFound.ts     # 404 handling
│   ├── src/__tests__/      # Comprehensive test suite (93+ tests)
│   │   ├── auth.test.ts    # Authentication testing
│   │   ├── alerts.test.ts  # Alert API testing
│   │   ├── preferences.test.ts # Preferences testing
│   │   ├── middleware.test.ts  # Middleware testing
│   │   ├── alertMatcher.test.ts # Business logic testing
│   │   └── setup.ts        # Test utilities and database setup
│   ├── prisma/            # Database schema and migrations
│   │   └── schema.prisma  # Complete schema (users, alerts, preferences)
│   └── jest.config.js     # Jest testing configuration
├── web-app/               # ✅ COMPLETE Next.js 14 application
├── mcp-integrations/      # ✅ MCP server (mock mode, 8 tools)
├── mobile/                # 📋 PLANNED React Native
└── desktop/               # 📋 PLANNED Electron
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

**Database Schema (Fully Implemented):**
- `users` - Complete user management with subscription tiers
- `alerts` - Property opportunities with intelligent scoring
- `alert_preferences` - Sophisticated user preference system
- `user_alerts` - Many-to-many relationship with bookmarking/viewing
- `saved_properties` - User saved properties
- `activity_logs` - User activity tracking
- `early_adopter_tokens` - Early adopter program

**Web Frontend (Complete):**
- Next.js 14 with App Router, Tailwind CSS, shadcn/ui, TypeScript

## Key API Features (Production-Ready)

### Authentication System
**Endpoints**: `/api/auth/*`
- `POST /register` - User registration with validation
- `POST /login` - JWT-based login 
- `POST /refresh` - Token refresh
- `GET /me` - Current user profile
- **Security**: Bcrypt password hashing, JWT tokens, rate limiting
- **Validation**: Email format, password strength, required fields

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
- **Alerts API Tests** (21 tests): CRUD operations, filtering, personalization, bookmarking  
- **Preferences Tests** (14 tests): Settings management, validation, defaults
- **Alert Matcher Tests** (13 tests): Scoring algorithm, user matching, daily limits
- **Middleware Tests** (15+ tests): Auth middleware, error handling, rate limiting

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
- **Complete API Backend** with authentication, alerts, preferences  
- **Comprehensive Testing** (93+ tests covering all functionality)
- **Database Schema** with all core tables and relationships
- **JWT Security** with proper validation and middleware
- **Intelligent Matching** algorithm with sophisticated scoring
- **Web Application** with complete marketing pages

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

The AgentRadar API backend is **production-ready** and can be deployed with confidence. The intelligent alert system, user preferences, and authentication are fully functional with enterprise-grade security and testing.