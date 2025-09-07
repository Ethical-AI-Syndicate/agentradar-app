# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

AgentRadar MCP Server - A Model Context Protocol (MCP) server providing real estate intelligence tools for the Greater Toronto Area market. The server exposes 8 specialized tools for property analysis, court filing monitoring, and investment opportunity detection.

## Commands

### Development
```bash
# Start the MCP server in development mode with auto-restart
npm run dev

# Start the MCP server in production mode
npm start

# Run connection and tool tests
npm test

# View server logs
npm run logs
```

### Testing Individual Tools
```bash
# Test MCP connection and all tools
node tests/test-connection.js

# The test will validate all 8 tools:
# - scrape_court_filings
# - analyze_property
# - get_system_status
# - search_estate_sales
# - monitor_development_apps
# - daily_pipeline
# - deploy_component
# - generate_market_report
```

## Architecture

### Core Components

**MCP Server (`core/server.js`)**
- Implements MCP protocol using stdio transport
- Exposes 8 real estate intelligence tools via JSON-RPC 2.0
- Currently operates in mock mode (`ENABLE_MOCK_DATA=true`)
- Each tool returns comprehensive mock data for development/testing

**Scraping Engine (`scrapers/tools.js`)**
- `ScraperTools` class handles web data extraction
- Supports Ontario regions: GTA, Toronto, York, Peel, Durham, Halton
- Priority scoring algorithm for opportunity ranking
- Mock data includes realistic court filings, estate sales, and development applications

**Property Analyzer (`scrapers/analyzer.js`)**
- `PropertyAnalyzer` class provides investment analysis
- Calculates ROI, cap rate, cash flow projections
- Generates market valuations with confidence intervals
- Provides AI-powered recommendations based on investment criteria

**Workflow Engine (`chains/workflow-engine.js`)**
- Orchestrates multi-step data acquisition pipelines
- Coordinates parallel scraping across multiple regions
- Handles alert generation and report distribution
- Tracks execution metrics and error handling

**System Monitor (`monitoring/monitor.js`)**
- Real-time health monitoring of all services
- Tracks performance metrics (response time, error rates)
- Reports on 24-hour operational statistics

**Deployment Manager (`deployment/manager.js`)**
- Manages deployments to development/staging/production
- Includes test execution before deployment
- Provides deployment URLs and rollback capability

### Data Flow

1. **MCP Client** → Makes tool call via JSON-RPC
2. **Server** → Routes to appropriate handler
3. **Handler** → Executes tool logic (currently using mock data)
4. **Response** → Returns structured data to client

### Tool Response Structure

All tools return consistent response structures:
- Success responses include relevant data and metadata
- Error responses include error message and debugging info
- Mock data is deterministic based on input parameters

## Environment Configuration

Key environment variables (see `.env.example`):

```bash
# Core Configuration
NODE_ENV=development          # development|staging|production
ENABLE_MOCK_DATA=true         # Use mock data instead of real scraping
LOG_LEVEL=info               # error|warn|info|debug

# Service URLs (for future integration)
DATABASE_URL=postgresql://... # Not yet integrated
REDIS_URL=redis://...        # Not yet integrated

# API Keys (for future features)
OPENAI_API_KEY=...           # For AI-powered analysis
GOOGLE_MAPS_API_KEY=...      # For location services

# Scraping Configuration
SCRAPER_TIMEOUT=30000        # Timeout in milliseconds
SCRAPER_CONCURRENT_REQUESTS=5 # Parallel request limit
```

## MCP Integration

### Claude Desktop Configuration

Add to `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "agentradar": {
      "command": "node",
      "args": ["/path/to/mcp-integrations/core/server.js"],
      "env": {
        "NODE_ENV": "development",
        "ENABLE_MOCK_DATA": "true"
      }
    }
  }
}
```

### Available MCP Tools

1. **scrape_court_filings** - Extract power of sale/foreclosure filings
   - Parameters: `region` (required), `dateRange`, `testMode`
   - Returns: Array of court filings with priority scores

2. **analyze_property** - Investment analysis for a specific property
   - Parameters: `address` (required), `includeComps`, `checkLiens`, `historicalData`
   - Returns: Valuation, metrics, recommendations

3. **get_system_status** - Health check and metrics
   - Parameters: `detailed` (optional)
   - Returns: Service status, performance metrics, 24h statistics

4. **search_estate_sales** - Find probate/estate properties
   - Parameters: `area` (required), `daysBack`, `radius`
   - Returns: Estate sales with executor contacts

5. **monitor_development_apps** - Track municipal applications
   - Parameters: `municipality` (required), `types`
   - Returns: Development applications affecting nearby properties

6. **daily_pipeline** - Run automated data acquisition
   - Parameters: `regions`, `sendAlerts`, `generateReport`
   - Returns: Pipeline execution results

7. **deploy_component** - Deploy application components
   - Parameters: `component` (required), `environment`, `runTests`
   - Returns: Deployment status and URLs

8. **generate_market_report** - Create market analysis
   - Parameters: `region` (required), `period`, `metrics`
   - Returns: Comprehensive market report with charts

## Testing Strategy

### Unit Testing
Currently, the project has connection tests (`tests/test-connection.js`) that validate:
- MCP server startup and connection
- Tool availability and parameter validation
- Response format compliance
- Mock data generation

### Adding New Tests
Place new test files in `tests/` directory following the pattern:
```javascript
import MCPClient from '@modelcontextprotocol/sdk/client/index.js';
// Test implementation
```

## Development Workflow

### Adding New Tools
1. Define tool schema in `core/server.js` handler map
2. Implement tool logic in appropriate module (scrapers/, monitoring/, etc.)
3. Add mock data generation for development mode
4. Update tests in `tests/test-connection.js`
5. Document tool in this file

### Modifying Existing Tools
1. Update tool implementation in relevant module
2. Ensure mock data reflects changes
3. Run `npm test` to validate changes
4. Update parameter documentation if changed

### Production Readiness Checklist
Before enabling production mode (`ENABLE_MOCK_DATA=false`):
- [ ] Implement real web scraping logic in `scrapers/tools.js`
- [ ] Add database integration for data persistence
- [ ] Configure Redis for caching
- [ ] Set up proper error handling and retry logic
- [ ] Add rate limiting for external API calls
- [ ] Implement authentication for sensitive operations
- [ ] Add comprehensive logging and monitoring

## Current Limitations

1. **Mock Data Mode**: All tools currently return mock data. Real integrations pending.
2. **No Database**: Data is not persisted between sessions
3. **No Caching**: Each request processes independently
4. **Limited Error Handling**: Basic error responses, needs enhancement
5. **No Authentication**: MCP server accepts all requests

## Important Notes

- The server uses ES modules (`"type": "module"` in package.json)
- All imports must use `.js` extensions even for JavaScript files
- Mock data is deterministic based on input parameters for testing consistency
- The MCP server communicates via stdio, not HTTP
- Tool responses follow JSON-RPC 2.0 specification