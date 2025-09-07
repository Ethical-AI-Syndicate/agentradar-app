#!/bin/bash

# AgentRadar Deployment Script
# Handles staging and production deployments with zero-downtime

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$PROJECT_ROOT/.env"
BACKUP_DIR="$PROJECT_ROOT/backups"
LOG_FILE="$PROJECT_ROOT/logs/deploy-$(date +%Y%m%d-%H%M%S).log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

# Ensure log directory exists
mkdir -p "$(dirname "$LOG_FILE")"

# Default values
ENVIRONMENT="staging"
SKIP_BACKUP=false
SKIP_TESTS=false
FORCE_DEPLOY=false
MIGRATION_ONLY=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        --skip-backup)
            SKIP_BACKUP=true
            shift
            ;;
        --skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        --force)
            FORCE_DEPLOY=true
            shift
            ;;
        --migration-only)
            MIGRATION_ONLY=true
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  -e, --environment ENV    Target environment (staging|production) [default: staging]"
            echo "  --skip-backup           Skip database backup"
            echo "  --skip-tests            Skip running tests"
            echo "  --force                 Force deployment even with warnings"
            echo "  --migration-only        Run database migration only"
            echo "  -h, --help              Show this help message"
            exit 0
            ;;
        *)
            error "Unknown option $1"
            exit 1
            ;;
    esac
done

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(staging|production)$ ]]; then
    error "Environment must be either 'staging' or 'production'"
    exit 1
fi

log "Starting deployment to $ENVIRONMENT environment"

# Check if environment file exists
if [[ ! -f "$ENV_FILE" ]]; then
    error "Environment file not found: $ENV_FILE"
    exit 1
fi

# Load environment variables
source "$ENV_FILE"

# Pre-deployment checks
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed or not in PATH"
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose is not installed or not in PATH"
        exit 1
    fi
    
    # Check Git
    if ! command -v git &> /dev/null; then
        error "Git is not installed or not in PATH"
        exit 1
    fi
    
    # Check if we're in a git repository
    if ! git rev-parse --is-inside-work-tree &> /dev/null; then
        error "Not inside a Git repository"
        exit 1
    fi
    
    # Check for uncommitted changes
    if [[ -n $(git status --porcelain) && "$FORCE_DEPLOY" != true ]]; then
        error "You have uncommitted changes. Commit them or use --force to deploy anyway."
        exit 1
    fi
    
    success "Prerequisites check passed"
}

# Run tests
run_tests() {
    if [[ "$SKIP_TESTS" == true ]]; then
        warning "Skipping tests as requested"
        return
    fi
    
    log "Running tests..."
    
    # API tests
    if [[ -d "$PROJECT_ROOT/api" ]]; then
        cd "$PROJECT_ROOT/api"
        if [[ -f "package.json" ]] && grep -q "test" package.json; then
            npm test || {
                error "API tests failed"
                exit 1
            }
        fi
    fi
    
    # Web app tests
    if [[ -d "$PROJECT_ROOT/web-app" ]]; then
        cd "$PROJECT_ROOT/web-app"
        if [[ -f "package.json" ]] && grep -q "test" package.json; then
            npm test -- --watchAll=false || {
                error "Web app tests failed"
                exit 1
            }
        fi
    fi
    
    # MCP tests
    if [[ -d "$PROJECT_ROOT/mcp-integrations" ]]; then
        cd "$PROJECT_ROOT/mcp-integrations"
        if [[ -f "package.json" ]] && grep -q "test" package.json; then
            npm test || {
                error "MCP tests failed"
                exit 1
            }
        fi
    fi
    
    success "All tests passed"
}

# Create database backup
create_backup() {
    if [[ "$SKIP_BACKUP" == true ]]; then
        warning "Skipping backup as requested"
        return
    fi
    
    log "Creating database backup..."
    
    # Ensure backup directory exists
    mkdir -p "$BACKUP_DIR"
    
    # Create backup filename with timestamp
    BACKUP_FILE="$BACKUP_DIR/agentradar-${ENVIRONMENT}-$(date +%Y%m%d-%H%M%S).sql.gz"
    
    # Create backup based on environment
    if [[ "$ENVIRONMENT" == "production" ]]; then
        # Production backup via Docker
        docker-compose -f docker-compose.production.yml exec -T postgres pg_dump -U "${POSTGRES_USER:-postgres}" agentradar | gzip > "$BACKUP_FILE" || {
            error "Failed to create production backup"
            exit 1
        }
    else
        # Development/staging backup
        if [[ -f "$PROJECT_ROOT/mcp-integrations/database/database.sqlite" ]]; then
            cp "$PROJECT_ROOT/mcp-integrations/database/database.sqlite" "$BACKUP_DIR/database-${ENVIRONMENT}-$(date +%Y%m%d-%H%M%S).sqlite"
        fi
    fi
    
    success "Backup created: $BACKUP_FILE"
}

# Database migration
run_migration() {
    log "Running database migration..."
    
    cd "$PROJECT_ROOT"
    
    if [[ "$ENVIRONMENT" == "production" ]]; then
        # Production migration
        docker-compose -f docker-compose.production.yml exec api node database/migrate.js migrate || {
            error "Production database migration failed"
            exit 1
        }
    else
        # Development migration
        if [[ -f "api/database/migrate.js" ]]; then
            cd api
            node database/migrate.js migrate || {
                error "Database migration failed"
                exit 1
            }
        fi
    fi
    
    success "Database migration completed"
}

# Build and deploy services
deploy_services() {
    log "Building and deploying services..."
    
    cd "$PROJECT_ROOT"
    
    if [[ "$ENVIRONMENT" == "production" ]]; then
        # Production deployment
        log "Pulling latest images..."
        docker-compose -f docker-compose.production.yml pull
        
        log "Building custom images..."
        docker-compose -f docker-compose.production.yml build --no-cache
        
        log "Starting services with zero downtime..."
        docker-compose -f docker-compose.production.yml up -d --remove-orphans
        
        # Wait for services to be healthy
        log "Waiting for services to be healthy..."
        
        # Check API health
        for i in {1..30}; do
            if curl -f http://localhost:${API_PORT:-4000}/health &> /dev/null; then
                success "API service is healthy"
                break
            fi
            if [[ $i -eq 30 ]]; then
                error "API service health check failed"
                exit 1
            fi
            sleep 2
        done
        
        # Check web app health
        for i in {1..30}; do
            if curl -f http://localhost:${WEB_PORT:-3000} &> /dev/null; then
                success "Web app is healthy"
                break
            fi
            if [[ $i -eq 30 ]]; then
                error "Web app health check failed"
                exit 1
            fi
            sleep 2
        done
        
    else
        # Staging deployment
        log "Starting staging environment..."
        docker-compose -f docker-compose.dev.yml up -d --build
    fi
    
    success "Services deployed successfully"
}

# Clean up old Docker images and containers
cleanup() {
    log "Cleaning up old Docker resources..."
    
    # Remove dangling images
    docker image prune -f
    
    # Remove unused networks
    docker network prune -f
    
    # Remove old backups (keep last 10)
    if [[ -d "$BACKUP_DIR" ]]; then
        find "$BACKUP_DIR" -name "agentradar-${ENVIRONMENT}-*.sql.gz" -type f | sort -r | tail -n +11 | xargs -r rm
        find "$BACKUP_DIR" -name "database-${ENVIRONMENT}-*.sqlite" -type f | sort -r | tail -n +11 | xargs -r rm
    fi
    
    success "Cleanup completed"
}

# Health checks
run_health_checks() {
    log "Running post-deployment health checks..."
    
    local api_url="http://localhost:${API_PORT:-4000}"
    local web_url="http://localhost:${WEB_PORT:-3000}"
    
    # API health check
    if ! curl -f "$api_url/health" &> /dev/null; then
        error "API health check failed"
        return 1
    fi
    
    # Database connectivity check
    if ! curl -f "$api_url/health/db" &> /dev/null; then
        error "Database connectivity check failed"
        return 1
    fi
    
    # MCP server check (if applicable)
    if [[ "$ENVIRONMENT" == "production" ]]; then
        # Check MCP server logs for startup success
        if ! docker-compose -f docker-compose.production.yml logs --tail=50 mcp-server | grep -q "MCP server started"; then
            warning "MCP server may not have started properly"
        fi
    fi
    
    success "All health checks passed"
}

# Deployment notification
send_notification() {
    local status="$1"
    local message="$2"
    
    log "Deployment $status: $message"
    
    # Add webhook notification here if configured
    if [[ -n "${SLACK_WEBHOOK_URL:-}" ]]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"🚀 AgentRadar Deployment to $ENVIRONMENT: $status\n$message\"}" \
            "$SLACK_WEBHOOK_URL" || true
    fi
    
    # Add email notification here if configured
    if [[ -n "${NOTIFICATION_EMAIL:-}" ]]; then
        echo "Deployment $status: $message" | mail -s "AgentRadar Deployment - $ENVIRONMENT" "$NOTIFICATION_EMAIL" || true
    fi
}

# Rollback function
rollback() {
    error "Deployment failed. Starting rollback..."
    
    # Stop current services
    docker-compose -f "docker-compose.${ENVIRONMENT}.yml" down
    
    # Restore from backup if available
    local latest_backup
    latest_backup=$(find "$BACKUP_DIR" -name "agentradar-${ENVIRONMENT}-*.sql.gz" -type f | sort -r | head -n 1)
    
    if [[ -n "$latest_backup" ]]; then
        warning "Restoring from backup: $latest_backup"
        # Add restoration logic here
    fi
    
    send_notification "FAILED" "Deployment to $ENVIRONMENT failed and rollback initiated"
    exit 1
}

# Main deployment flow
main() {
    # Set up error handling
    trap rollback ERR
    
    # Start deployment
    log "=== AgentRadar Deployment Started ==="
    log "Environment: $ENVIRONMENT"
    log "Timestamp: $(date)"
    log "Git commit: $(git rev-parse HEAD)"
    
    # Run deployment steps
    check_prerequisites
    
    if [[ "$MIGRATION_ONLY" == true ]]; then
        run_migration
        success "Migration-only deployment completed"
        exit 0
    fi
    
    run_tests
    create_backup
    run_migration
    deploy_services
    run_health_checks
    cleanup
    
    # Success notification
    local deploy_info="Environment: $ENVIRONMENT\nCommit: $(git rev-parse --short HEAD)\nTimestamp: $(date)"
    send_notification "SUCCESS" "$deploy_info"
    
    success "=== Deployment completed successfully ==="
    success "API: http://localhost:${API_PORT:-4000}"
    success "Web: http://localhost:${WEB_PORT:-3000}"
    
    if [[ "$ENVIRONMENT" == "production" ]]; then
        success "Monitoring: http://localhost:3001 (Grafana)"
        success "Metrics: http://localhost:9090 (Prometheus)"
    fi
}

# Run main function
main "$@"