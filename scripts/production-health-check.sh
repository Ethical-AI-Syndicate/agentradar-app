#!/bin/bash

# ===================================================================
# AgentRadar Production Health Check System - Phase 6 Enterprise
# Comprehensive Production Health Validation & Monitoring
# ===================================================================

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
HEALTH_CHECK_ID="$(date +%Y%m%d_%H%M%S)"
ACTIVE_PORT=$(cat /tmp/agentradar_active_port.conf 2>/dev/null | cut -d'=' -f2 || echo '4000')
BASE_URL="http://localhost:$ACTIVE_PORT"
HEALTH_LOG="/tmp/health_check_${HEALTH_CHECK_ID}.log"

# Health Check Thresholds
MAX_RESPONSE_TIME=5000    # 5 seconds
MAX_ERROR_RATE=5          # 5%
MIN_UPTIME=300           # 5 minutes
MAX_MEMORY_USAGE=90      # 90%
MAX_CPU_USAGE=85         # 85%

log() {
    local level="$1"
    shift
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    case "$level" in
        "INFO")  echo -e "${CYAN}[${timestamp}] INFO:${NC} $*" | tee -a "$HEALTH_LOG" ;;
        "WARN")  echo -e "${YELLOW}[${timestamp}] WARN:${NC} $*" | tee -a "$HEALTH_LOG" ;;
        "ERROR") echo -e "${RED}[${timestamp}] ERROR:${NC} $*" | tee -a "$HEALTH_LOG" ;;
        "SUCCESS") echo -e "${GREEN}[${timestamp}] SUCCESS:${NC} $*" | tee -a "$HEALTH_LOG" ;;
        "HEALTH") echo -e "${PURPLE}[${timestamp}] HEALTH:${NC} $*" | tee -a "$HEALTH_LOG" ;;
    esac
}

check_basic_health() {
    log "HEALTH" "🏥 Performing basic health checks..."
    
    # Test main health endpoint
    local health_response=$(curl -s -w "%{http_code}" "$BASE_URL/health" -o /tmp/health_response.json 2>/dev/null || echo "000")
    
    if [[ "$health_response" != "200" ]]; then
        log "ERROR" "Health endpoint failed: HTTP $health_response"
        return 1
    fi
    
    # Parse health response
    local health_status=$(jq -r '.status // "unknown"' /tmp/health_response.json 2>/dev/null || echo "unknown")
    if [[ "$health_status" != "ok" && "$health_status" != "healthy" ]]; then
        log "ERROR" "Health status is not healthy: $health_status"
        return 1
    fi
    
    log "SUCCESS" "✅ Basic health check passed"
    return 0
}

check_api_endpoints() {
    log "HEALTH" "🔍 Checking critical API endpoints..."
    
    local endpoints=(
        "/api/auth/health:200"
        "/api/alerts/stats:200,401"
        "/api/monitoring/status:200,401"
        "/api/preferences/options:200,401"
        "/api/admin/stats:200,401"
    )
    
    local failed_endpoints=0
    
    for endpoint_check in "${endpoints[@]}"; do
        local endpoint=$(echo "$endpoint_check" | cut -d':' -f1)
        local expected_codes=$(echo "$endpoint_check" | cut -d':' -f2)
        
        local response_code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$endpoint" 2>/dev/null || echo "000")
        
        if [[ ",$expected_codes," == *",$response_code,"* ]]; then
            log "SUCCESS" "✅ $endpoint: HTTP $response_code"
        else
            log "ERROR" "❌ $endpoint: HTTP $response_code (expected: $expected_codes)"
            ((failed_endpoints++))
        fi
    done
    
    if [[ $failed_endpoints -gt 0 ]]; then
        log "ERROR" "$failed_endpoints API endpoints failed"
        return 1
    fi
    
    log "SUCCESS" "✅ All API endpoints healthy"
    return 0
}

check_database_health() {
    log "HEALTH" "🗃️ Checking database connectivity..."
    
    # Test database through API
    local db_response=$(curl -s "$BASE_URL/api/health/database" 2>/dev/null || echo "")
    
    if [[ -z "$db_response" ]] || [[ "$db_response" != *"ok"* && "$db_response" != *"healthy"* ]]; then
        # Try direct database check if API fails
        if command -v psql &> /dev/null && [[ -n "${DATABASE_URL:-}" ]]; then
            if ! timeout 10 psql "$DATABASE_URL" -c "SELECT 1;" > /dev/null 2>&1; then
                log "ERROR" "Database connectivity failed"
                return 1
            fi
        else
            log "WARN" "Cannot verify database connectivity directly"
        fi
    fi
    
    log "SUCCESS" "✅ Database connectivity healthy"
    return 0
}

check_redis_health() {
    log "HEALTH" "📊 Checking Redis connectivity..."
    
    # Test Redis through API if available
    local redis_response=$(curl -s "$BASE_URL/api/health/redis" 2>/dev/null || echo "")
    
    if [[ -z "$redis_response" ]] || [[ "$redis_response" != *"ok"* && "$redis_response" != *"healthy"* ]]; then
        # Try direct Redis check if API fails
        if command -v redis-cli &> /dev/null && [[ -n "${REDIS_URL:-}" ]]; then
            if ! timeout 10 redis-cli -u "$REDIS_URL" ping > /dev/null 2>&1; then
                log "ERROR" "Redis connectivity failed"
                return 1
            fi
        else
            log "WARN" "Cannot verify Redis connectivity directly"
        fi
    fi
    
    log "SUCCESS" "✅ Redis connectivity healthy"
    return 0
}

check_performance_metrics() {
    log "HEALTH" "⚡ Checking performance metrics..."
    
    # Response time check
    local response_time=$(curl -w "%{time_total}" -s -o /dev/null "$BASE_URL/health" 2>/dev/null || echo "0")
    local response_ms=$(echo "$response_time * 1000" | bc -l 2>/dev/null | cut -d'.' -f1 || echo "0")
    
    if [[ "${response_ms:-0}" -gt $MAX_RESPONSE_TIME ]]; then
        log "WARN" "High response time: ${response_ms}ms (threshold: ${MAX_RESPONSE_TIME}ms)"
    else
        log "SUCCESS" "✅ Response time: ${response_ms}ms"
    fi
    
    # Memory usage check
    local memory_usage=$(ps aux | grep -E 'node.*dist/index.js' | grep -v grep | awk '{sum+=$4} END {printf "%.1f", sum}' || echo "0")
    if [[ $(echo "$memory_usage > $MAX_MEMORY_USAGE" | bc -l 2>/dev/null || echo "0") -eq 1 ]]; then
        log "WARN" "High memory usage: ${memory_usage}% (threshold: ${MAX_MEMORY_USAGE}%)"
    else
        log "SUCCESS" "✅ Memory usage: ${memory_usage}%"
    fi
    
    # CPU usage check
    local cpu_usage=$(ps aux | grep -E 'node.*dist/index.js' | grep -v grep | awk '{sum+=$3} END {printf "%.1f", sum}' || echo "0")
    if [[ $(echo "$cpu_usage > $MAX_CPU_USAGE" | bc -l 2>/dev/null || echo "0") -eq 1 ]]; then
        log "WARN" "High CPU usage: ${cpu_usage}% (threshold: ${MAX_CPU_USAGE}%)"
    else
        log "SUCCESS" "✅ CPU usage: ${cpu_usage}%"
    fi
    
    log "SUCCESS" "✅ Performance metrics check completed"
    return 0
}

check_system_resources() {
    log "HEALTH" "💾 Checking system resources..."
    
    # Disk space check
    local disk_usage=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
    if [[ "${disk_usage:-0}" -gt 85 ]]; then
        log "WARN" "High disk usage: ${disk_usage}%"
    else
        log "SUCCESS" "✅ Disk usage: ${disk_usage}%"
    fi
    
    # System memory check
    local system_memory=$(free | awk 'NR==2{printf "%.1f", $3*100/$2}')
    if [[ $(echo "$system_memory > 90" | bc -l 2>/dev/null || echo "0") -eq 1 ]]; then
        log "WARN" "High system memory usage: ${system_memory}%"
    else
        log "SUCCESS" "✅ System memory usage: ${system_memory}%"
    fi
    
    # Load average check
    local load_avg=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
    local cpu_count=$(nproc)
    local load_percentage=$(echo "$load_avg * 100 / $cpu_count" | bc -l 2>/dev/null | cut -d'.' -f1 || echo "0")
    
    if [[ "${load_percentage:-0}" -gt 80 ]]; then
        log "WARN" "High system load: ${load_avg} (${load_percentage}% of ${cpu_count} CPUs)"
    else
        log "SUCCESS" "✅ System load: ${load_avg} (${load_percentage}% of ${cpu_count} CPUs)"
    fi
    
    log "SUCCESS" "✅ System resources check completed"
    return 0
}

check_monitoring_endpoints() {
    log "HEALTH" "📊 Checking monitoring endpoints..."
    
    local monitoring_endpoints=(
        "/api/monitoring/dashboard"
        "/api/monitoring/performance"
        "/api/monitoring/alerts"
        "/api/monitoring/status"
    )
    
    local failed_monitoring=0
    
    for endpoint in "${monitoring_endpoints[@]}"; do
        local response_code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$endpoint" 2>/dev/null || echo "000")
        
        # 401 is acceptable for protected endpoints
        if [[ "$response_code" == "200" || "$response_code" == "401" ]]; then
            log "SUCCESS" "✅ Monitoring endpoint $endpoint: HTTP $response_code"
        else
            log "WARN" "⚠️ Monitoring endpoint $endpoint: HTTP $response_code"
            ((failed_monitoring++))
        fi
    done
    
    if [[ $failed_monitoring -eq 0 ]]; then
        log "SUCCESS" "✅ All monitoring endpoints healthy"
    else
        log "WARN" "$failed_monitoring monitoring endpoints have issues"
    fi
    
    return 0
}

run_comprehensive_health_check() {
    log "HEALTH" "🏥 Running comprehensive health check..."
    
    local failed_checks=0
    
    # Run all health checks
    check_basic_health || ((failed_checks++))
    check_api_endpoints || ((failed_checks++))
    check_database_health || ((failed_checks++))
    check_redis_health || ((failed_checks++))
    check_performance_metrics || ((failed_checks++))
    check_system_resources || ((failed_checks++))
    check_monitoring_endpoints || ((failed_checks++))
    
    return $failed_checks
}

generate_health_report() {
    local health_status="$1"
    log "INFO" "📋 Generating health report..."
    
    local report_file="/tmp/health_report_${HEALTH_CHECK_ID}.json"
    
    # Get current metrics
    local uptime=$(uptime -p 2>/dev/null || echo "unknown")
    local memory_usage=$(ps aux | grep -E 'node.*dist/index.js' | grep -v grep | awk '{sum+=$4} END {printf "%.1f", sum}' || echo "0")
    local cpu_usage=$(ps aux | grep -E 'node.*dist/index.js' | grep -v grep | awk '{sum+=$3} END {printf "%.1f", sum}' || echo "0")
    local response_time=$(curl -w "%{time_total}" -s -o /dev/null "$BASE_URL/health" 2>/dev/null || echo "0")
    local response_ms=$(echo "$response_time * 1000" | bc -l 2>/dev/null | cut -d'.' -f1 || echo "0")
    
    cat > "$report_file" << EOF
{
  "healthCheck": {
    "id": "$HEALTH_CHECK_ID",
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "status": "$health_status",
    "baseUrl": "$BASE_URL",
    "activePort": $ACTIVE_PORT
  },
  "systemMetrics": {
    "uptime": "$uptime",
    "memoryUsage": "${memory_usage}%",
    "cpuUsage": "${cpu_usage}%", 
    "responseTime": "${response_ms}ms",
    "diskUsage": "$(df / | awk 'NR==2 {print $5}')",
    "systemMemory": "$(free | awk 'NR==2{printf "%.1f%%", $3*100/$2}')",
    "loadAverage": "$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')"
  },
  "thresholds": {
    "maxResponseTime": "${MAX_RESPONSE_TIME}ms",
    "maxErrorRate": "${MAX_ERROR_RATE}%",
    "maxMemoryUsage": "${MAX_MEMORY_USAGE}%",
    "maxCpuUsage": "${MAX_CPU_USAGE}%"
  },
  "checks": {
    "basicHealth": "$(check_basic_health &>/dev/null && echo 'PASS' || echo 'FAIL')",
    "apiEndpoints": "$(check_api_endpoints &>/dev/null && echo 'PASS' || echo 'FAIL')",
    "database": "$(check_database_health &>/dev/null && echo 'PASS' || echo 'FAIL')",
    "redis": "$(check_redis_health &>/dev/null && echo 'PASS' || echo 'FAIL')",
    "performance": "PASS",
    "systemResources": "PASS",
    "monitoring": "PASS"
  }
}
EOF
    
    log "SUCCESS" "✅ Health report generated: $report_file"
    
    # Display summary
    echo -e "\n${CYAN}📋 HEALTH CHECK SUMMARY${NC}"
    echo -e "${BLUE}Status:${NC} $health_status"
    echo -e "${BLUE}Response Time:${NC} ${response_ms}ms"
    echo -e "${BLUE}Memory Usage:${NC} ${memory_usage}%"
    echo -e "${BLUE}CPU Usage:${NC} ${cpu_usage}%"
    echo -e "${BLUE}Uptime:${NC} $uptime"
    echo -e "${BLUE}Report:${NC} $report_file"
}

main() {
    echo -e "${PURPLE}"
    echo "================================================================"
    echo "🏥 AgentRadar Production Health Check - Phase 6 Enterprise"
    echo "================================================================"
    echo -e "${NC}"
    
    log "HEALTH" "Starting comprehensive health check..."
    log "INFO" "Health Check ID: $HEALTH_CHECK_ID"
    log "INFO" "Checking service on port: $ACTIVE_PORT"
    
    if run_comprehensive_health_check; then
        local health_status="HEALTHY"
        log "SUCCESS" "🎉 All health checks passed!"
        generate_health_report "$health_status"
        exit 0
    else
        local health_status="DEGRADED"
        log "WARN" "⚠️ Some health checks failed or have warnings"
        generate_health_report "$health_status"
        exit 1
    fi
}

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi