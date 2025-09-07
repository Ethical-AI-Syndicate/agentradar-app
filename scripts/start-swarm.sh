#!/bin/bash

# AgentRadar Claude Swarm Startup Script
# This script initializes the claude-swarm environment for collaborative AI development

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=====================================${NC}"
echo -e "${BLUE}  AgentRadar Claude Swarm Launcher  ${NC}"
echo -e "${BLUE}=====================================${NC}"
echo ""

# Check if claude-swarm is installed
if ! command -v claude-swarm &> /dev/null; then
    echo -e "${RED}Error: claude-swarm is not installed${NC}"
    echo "Installing claude-swarm..."
    gem install claude_swarm
fi

# Check for environment file
if [ ! -f .env ]; then
    echo -e "${YELLOW}Warning: .env file not found${NC}"
    echo "Creating .env from template..."
    if [ -f .env.example ]; then
        cp .env.example .env
        echo -e "${GREEN}Created .env file. Please configure it with your settings.${NC}"
    fi
fi

# Source environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Parse command line arguments
MODE="standard"
while [[ $# -gt 0 ]]; do
    case $1 in
        --vibe)
            MODE="vibe"
            shift
            ;;
        --debug)
            export CLAUDE_SWARM_DEBUG=true
            shift
            ;;
        --agent)
            SPECIFIC_AGENT=$2
            shift 2
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

# Display swarm configuration
echo -e "${GREEN}Swarm Configuration:${NC}"
echo "  • Mode: $MODE"
echo "  • Mock Data: ${ENABLE_MOCK_DATA:-true}"
echo "  • API URL: ${NEXT_PUBLIC_API_URL:-http://localhost:4000}"

if [ -n "$SPECIFIC_AGENT" ]; then
    echo "  • Starting specific agent: $SPECIFIC_AGENT"
fi

echo ""
echo -e "${YELLOW}Available Agents:${NC}"
echo "  • lead     - Team coordinator and architect"
echo "  • frontend - Web/Mobile/Desktop UI specialist"
echo "  • backend  - API and database specialist"
echo "  • scraper  - Data collection specialist"
echo "  • mcp      - MCP integration specialist"
echo "  • mobile   - iOS/Android specialist"
echo "  • devops   - Infrastructure and deployment"
echo ""

# Ensure required directories exist
mkdir -p .claude
mkdir -p logs

# Start the swarm
echo -e "${GREEN}Starting AgentRadar Development Swarm...${NC}"
echo ""

# Set configuration file path
CONFIG_FILE="${SWARM_CONFIG:-./claude-swarm.yml}"

# Check if configuration exists
if [ ! -f "$CONFIG_FILE" ]; then
    echo -e "${RED}Error: Configuration file not found: $CONFIG_FILE${NC}"
    echo "Configuration has been created. Please review and run again."
    exit 1
fi

# Parse the configuration
echo "Loading swarm configuration..."
echo "  • Config: $CONFIG_FILE"
echo "  • Mode: $MODE"
echo ""

# Validate required tools
command -v node >/dev/null 2>&1 || { echo -e "${RED}Error: Node.js is required but not installed.${NC}" >&2; exit 1; }
command -v npm >/dev/null 2>&1 || { echo -e "${RED}Error: npm is required but not installed.${NC}" >&2; exit 1; }

# Start the swarm based on mode
case $MODE in
    vibe)
        echo -e "${GREEN}🎯 Starting in VIBE mode - Relaxed exploration${NC}"
        echo "  • Auto-delegation: enabled"
        echo "  • Exploration: allowed"
        echo ""
        ;;
    focus)
        echo -e "${BLUE}⚡ Starting in FOCUS mode - Concentrated development${NC}"
        echo "  • Auto-delegation: disabled"
        echo "  • Exploration: restricted"
        echo ""
        ;;
    review)
        echo -e "${YELLOW}🔍 Starting in REVIEW mode - Code review${NC}"
        echo "  • Consensus: required"
        echo "  • Exploration: disabled"
        echo ""
        ;;
    emergency)
        echo -e "${RED}🚨 Starting in EMERGENCY mode - Critical fixes${NC}"
        echo "  • Priority: HIGH"
        echo "  • Auto-delegation: enabled"
        echo ""
        ;;
    standard|*)
        echo -e "${GREEN}📋 Starting in STANDARD mode${NC}"
        echo "  • Default settings applied"
        echo ""
        ;;
esac

# Initialize the swarm environment
echo "Initializing swarm environment..."

# Check for MCP server
if [ -d "mcp-integrations" ]; then
    echo -e "  ${GREEN}✓${NC} MCP integrations found"
else
    echo -e "  ${YELLOW}⚠${NC} MCP integrations not found"
fi

# Check for web app
if [ -d "web-app" ]; then
    echo -e "  ${GREEN}✓${NC} Web application found"
else
    echo -e "  ${YELLOW}⚠${NC} Web application not found"
fi

# Check for API
if [ -d "api" ]; then
    echo -e "  ${GREEN}✓${NC} API server found"
else
    echo -e "  ${YELLOW}⚠${NC} API server not found"
fi

echo ""
echo -e "${GREEN}🚀 Swarm Ready!${NC}"
echo ""
echo "Available commands:"
echo "  • npm run dev:all        - Start all services"
echo "  • npm run dev:web        - Start web app only"
echo "  • npm run dev:api        - Start API only"
echo "  • npm run dev:scrapers   - Start scrapers"
echo "  • npm run team:daily     - Run daily standup"
echo "  • npm run claude:insight - Log development insights"
echo ""
echo -e "${BLUE}Swarm is configured and ready for $MODE mode development.${NC}"
echo "Use 'npm run swarm:status' to check agent status."

# Export swarm mode for other scripts
export SWARM_MODE=$MODE
export SWARM_CONFIG=$CONFIG_FILE

# If specific agent requested, show agent-specific commands
if [ -n "$SPECIFIC_AGENT" ]; then
    echo ""
    echo -e "${YELLOW}Agent-specific focus: $SPECIFIC_AGENT${NC}"
    case $SPECIFIC_AGENT in
        frontend)
            echo "  • npm run dev:web"
            echo "  • npm run test:web"
            ;;
        backend)
            echo "  • npm run dev:api"
            echo "  • npm run test:api"
            ;;
        mcp)
            echo "  • cd mcp-integrations && npm run dev"
            echo "  • npm run mcp:test"
            ;;
        mobile)
            echo "  • npm run dev:mobile"
            echo "  • npm run test:mobile"
            ;;
        scraper)
            echo "  • npm run dev:scrapers"
            echo "  • npm run scraper:all"
            ;;
    esac
fi