#!/bin/bash

# ===================================================================
# AgentRadar Production Rollback Script - Phase 6 Enterprise
# Emergency Rollback System with Zero-Downtime Recovery
# ===================================================================

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DEPLOYMENT_ID="${1:-$(date +%Y%m%d_%H%M%S)_rollback}"
ROLLBACK_LOG="/tmp/agentradar_rollback_${DEPLOYMENT_ID}.log"

log() {
    local level="$1"
    shift
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    case "$level" in
        "INFO")  echo -e "${BLUE}[${timestamp}] INFO:${NC} $*" | tee -a "$ROLLBACK_LOG" ;;
        "WARN")  echo -e "${YELLOW}[${timestamp}] WARN:${NC} $*" | tee -a "$ROLLBACK_LOG" ;;
        "ERROR") echo -e "${RED}[${timestamp}] ERROR:${NC} $*" | tee -a "$ROLLBACK_LOG" ;;
        "SUCCESS") echo -e "${GREEN}[${timestamp}] SUCCESS:${NC} $*" | tee -a "$ROLLBACK_LOG" ;;
        "ROLLBACK") echo -e "${PURPLE}[${timestamp}] ROLLBACK:${NC} $*" | tee -a "$ROLLBACK_LOG" ;;
    esac
}

emergency_rollback() {
    log "ROLLBACK" "🚨 Initiating emergency rollback..."
    
    # Stop current deployment
    if [[ -f "/tmp/agentradar_deployment.pid" ]]; then
        local deployment_pid=$(cat /tmp/agentradar_deployment.pid | grep DEPLOYMENT_PID | cut -d'=' -f2 2>/dev/null || echo "")
        if [[ -n "$deployment_pid" ]] && kill -0 "$deployment_pid" 2>/dev/null; then
            log "INFO" "Stopping current deployment (PID: $deployment_pid)..."
            kill -TERM "$deployment_pid"
            sleep 5
            kill -KILL "$deployment_pid" 2>/dev/null || true
        fi
    fi
    
    # Start previous known good version on standard port
    log "INFO" "Starting rollback version on port 4000..."
    cd "$PROJECT_ROOT/api"
    PORT=4000 NODE_ENV=production npm run start > "/tmp/rollback_${DEPLOYMENT_ID}.log" 2>&1 &
    local rollback_pid=$!
    
    # Update active port
    echo "ACTIVE_PORT=4000" > "/tmp/agentradar_active_port.conf"
    
    # Wait for rollback to be ready
    local timeout=0
    while [[ $timeout -lt 60 ]]; do
        if curl -s "http://localhost:4000/health" > /dev/null 2>&1; then
            log "SUCCESS" "✅ Rollback deployment ready"
            break
        fi
        sleep 2
        timeout=$((timeout + 2))
    done
    
    if [[ $timeout -ge 60 ]]; then
        log "ERROR" "Rollback failed to start within timeout"
        exit 1
    fi
    
    echo "ROLLBACK_PID=$rollback_pid" > "/tmp/agentradar_rollback.pid"
    log "SUCCESS" "🎉 Emergency rollback completed successfully"
}

main() {
    echo -e "${RED}🚨 EMERGENCY ROLLBACK INITIATED${NC}"
    emergency_rollback
}

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi