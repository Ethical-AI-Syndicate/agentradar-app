-- AI Performance Monitoring Database Schema
-- Migration for adding AI metrics tracking tables

-- AI Service Metrics table
CREATE TABLE IF NOT EXISTS "AiServiceMetrics" (
    id SERIAL PRIMARY KEY,
    serviceName VARCHAR(100) NOT NULL,
    operationType VARCHAR(100) NOT NULL,
    responseTime INTEGER NOT NULL,
    success BOOLEAN NOT NULL DEFAULT true,
    accuracy DECIMAL(5,4),
    confidence DECIMAL(5,4),
    promptTokens INTEGER,
    completionTokens INTEGER,
    totalTokens INTEGER,
    cost DECIMAL(10,4),
    errorMessage TEXT,
    validatedAccuracy DECIMAL(5,4),
    validatedAt TIMESTAMP,
    timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
    
    -- Indexes for performance
    INDEX idx_service_operation (serviceName, operationType),
    INDEX idx_timestamp (timestamp),
    INDEX idx_service_timestamp (serviceName, timestamp),
    INDEX idx_operation_timestamp (operationType, timestamp)
);

-- AI Performance Summary table (aggregated stats)
CREATE TABLE IF NOT EXISTS "AiPerformanceSummary" (
    id SERIAL PRIMARY KEY,
    serviceName VARCHAR(100) NOT NULL,
    operationType VARCHAR(100) NOT NULL,
    period VARCHAR(10) NOT NULL, -- '1h', '24h', '7d', '30d'
    periodStart TIMESTAMP NOT NULL,
    periodEnd TIMESTAMP NOT NULL,
    totalRequests INTEGER NOT NULL DEFAULT 0,
    successfulRequests INTEGER NOT NULL DEFAULT 0,
    failedRequests INTEGER NOT NULL DEFAULT 0,
    successRate DECIMAL(5,4) NOT NULL DEFAULT 0,
    averageResponseTime DECIMAL(8,2) NOT NULL DEFAULT 0,
    averageAccuracy DECIMAL(5,4),
    averageConfidence DECIMAL(5,4),
    totalTokensUsed INTEGER NOT NULL DEFAULT 0,
    totalCost DECIMAL(10,4) NOT NULL DEFAULT 0,
    p95ResponseTime INTEGER NOT NULL DEFAULT 0,
    p99ResponseTime INTEGER NOT NULL DEFAULT 0,
    createdAt TIMESTAMP NOT NULL DEFAULT NOW(),
    updatedAt TIMESTAMP NOT NULL DEFAULT NOW(),
    
    -- Indexes
    INDEX idx_service_period (serviceName, period),
    INDEX idx_operation_period (operationType, period),
    INDEX idx_period_range (period, periodStart, periodEnd),
    UNIQUE KEY uk_service_operation_period (serviceName, operationType, period, periodStart)
);

-- Property Validation Results table
CREATE TABLE IF NOT EXISTS "PropertyValidationResults" (
    id SERIAL PRIMARY KEY,
    requestId VARCHAR(255) NOT NULL UNIQUE,
    propertyId VARCHAR(255),
    predictedValue DECIMAL(12,2),
    actualValue DECIMAL(12,2),
    predictedCapRate DECIMAL(5,4),
    actualCapRate DECIMAL(5,4),
    predictedRentPerSqft DECIMAL(8,2),
    actualRentPerSqft DECIMAL(8,2),
    accuracy DECIMAL(5,4) NOT NULL,
    confidence DECIMAL(5,4),
    validatedAt TIMESTAMP NOT NULL DEFAULT NOW(),
    
    -- Indexes
    INDEX idx_property_id (propertyId),
    INDEX idx_validated_at (validatedAt),
    INDEX idx_accuracy (accuracy)
);

-- Market Prediction Validations table
CREATE TABLE IF NOT EXISTS "MarketPredictionValidations" (
    id SERIAL PRIMARY KEY,
    requestId VARCHAR(255) NOT NULL UNIQUE,
    marketArea VARCHAR(255),
    timeframe VARCHAR(50), -- '3m', '6m', '1y', '2y'
    predictedGrowthRate DECIMAL(6,4),
    actualGrowthRate DECIMAL(6,4),
    predictedMedianPrice DECIMAL(12,2),
    actualMedianPrice DECIMAL(12,2),
    accuracy DECIMAL(5,4) NOT NULL,
    confidence DECIMAL(5,4),
    validatedAt TIMESTAMP NOT NULL DEFAULT NOW(),
    
    -- Indexes
    INDEX idx_market_area (marketArea),
    INDEX idx_timeframe (timeframe),
    INDEX idx_validated_at (validatedAt)
);

-- Lead Scoring Validations table
CREATE TABLE IF NOT EXISTS "LeadScoringValidations" (
    id SERIAL PRIMARY KEY,
    requestId VARCHAR(255) NOT NULL UNIQUE,
    leadId VARCHAR(255),
    predictedScore INTEGER,
    predictedConversion BOOLEAN,
    actualConversion BOOLEAN,
    conversionTime TIMESTAMP,
    accuracy DECIMAL(5,4) NOT NULL,
    confidence DECIMAL(5,4),
    validatedAt TIMESTAMP NOT NULL DEFAULT NOW(),
    
    -- Indexes
    INDEX idx_lead_id (leadId),
    INDEX idx_predicted_score (predictedScore),
    INDEX idx_actual_conversion (actualConversion),
    INDEX idx_validated_at (validatedAt)
);

-- System Health Metrics table
CREATE TABLE IF NOT EXISTS "SystemHealthMetrics" (
    id SERIAL PRIMARY KEY,
    metricName VARCHAR(100) NOT NULL,
    metricValue DECIMAL(12,4) NOT NULL,
    unit VARCHAR(50),
    tags JSON,
    timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
    
    -- Indexes
    INDEX idx_metric_name (metricName),
    INDEX idx_timestamp (timestamp),
    INDEX idx_metric_timestamp (metricName, timestamp)
);

-- Views for easier querying
CREATE OR REPLACE VIEW "AIPerformanceDashboard" AS
SELECT 
    serviceName,
    operationType,
    COUNT(*) as totalRequests,
    COUNT(CASE WHEN success = true THEN 1 END) as successfulRequests,
    COUNT(CASE WHEN success = false THEN 1 END) as failedRequests,
    ROUND(AVG(responseTime), 2) as avgResponseTime,
    ROUND(AVG(CASE WHEN validatedAccuracy IS NOT NULL THEN validatedAccuracy ELSE accuracy END), 4) as avgAccuracy,
    ROUND(AVG(confidence), 4) as avgConfidence,
    SUM(totalTokens) as totalTokens,
    ROUND(SUM(cost), 2) as totalCost,
    DATE(timestamp) as date
FROM "AiServiceMetrics" 
WHERE timestamp >= NOW() - INTERVAL '30 days'
GROUP BY serviceName, operationType, DATE(timestamp)
ORDER BY date DESC, serviceName, operationType;

CREATE OR REPLACE VIEW "RecentPerformanceStats" AS
SELECT 
    serviceName,
    operationType,
    COUNT(*) as requests24h,
    ROUND(AVG(responseTime), 2) as avgResponseTime,
    ROUND(COUNT(CASE WHEN success = true THEN 1 END) * 100.0 / COUNT(*), 2) as successRate,
    ROUND(AVG(CASE WHEN validatedAccuracy IS NOT NULL THEN validatedAccuracy ELSE accuracy END), 4) as avgAccuracy,
    SUM(totalTokens) as totalTokens24h,
    ROUND(SUM(cost), 2) as totalCost24h
FROM "AiServiceMetrics" 
WHERE timestamp >= NOW() - INTERVAL '24 hours'
GROUP BY serviceName, operationType;

-- Stored procedure for cleaning old metrics
DELIMITER //
CREATE PROCEDURE CleanupOldAIMetrics()
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION 
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;
    
    -- Delete metrics older than 90 days
    DELETE FROM "AiServiceMetrics" 
    WHERE timestamp < NOW() - INTERVAL '90 days';
    
    -- Delete old validation results older than 1 year
    DELETE FROM "PropertyValidationResults" 
    WHERE validatedAt < NOW() - INTERVAL '1 year';
    
    DELETE FROM "MarketPredictionValidations" 
    WHERE validatedAt < NOW() - INTERVAL '1 year';
    
    DELETE FROM "LeadScoringValidations" 
    WHERE validatedAt < NOW() - INTERVAL '1 year';
    
    -- Delete old system health metrics older than 30 days
    DELETE FROM "SystemHealthMetrics" 
    WHERE timestamp < NOW() - INTERVAL '30 days';
    
    COMMIT;
END //
DELIMITER ;

-- Event scheduler for automatic cleanup (runs daily at 2 AM)
CREATE EVENT IF NOT EXISTS daily_ai_metrics_cleanup
ON SCHEDULE EVERY 1 DAY
STARTS DATE_ADD(DATE_ADD(CURDATE(), INTERVAL 1 DAY), INTERVAL 2 HOUR)
DO
  CALL CleanupOldAIMetrics();