# AI Performance Monitoring with Sentry Integration

This document describes the comprehensive AI performance monitoring system implemented for AgentRadar's AI services, including OpenAI GPT-4 calls and custom AI workflows.

## Overview

The AI Performance Monitoring system provides:

- **Real-time Performance Tracking**: Monitor latency, token usage, and costs for all AI operations
- **Sentry Integration**: Automatic error reporting and performance traces sent to Sentry
- **Cost Monitoring**: Track daily AI spending and get alerts for high costs
- **Success Rate Tracking**: Monitor AI operation success rates and identify failure patterns
- **Custom Metrics**: Track business-specific metrics like lead quality scores, property valuations, etc.
- **Daily Summaries**: Automated daily reports sent to Sentry with usage statistics

## Architecture

### Core Components

1. **AIPerformanceMonitor** (`/api/src/lib/aiPerformanceMonitor.ts`)
   - Singleton class that manages all AI monitoring
   - Integrates with Sentry for traces and error reporting
   - Tracks token usage, costs, and performance metrics

2. **Monitoring Wrapper** (`withAIMonitoring()`)
   - Wraps AI operations with comprehensive monitoring
   - Automatically captures performance data and errors
   - Sends traces to Sentry with detailed context

3. **Service Integration**
   - All AI services updated to use monitoring wrapper
   - Custom metrics tracked for business-specific insights
   - Consistent monitoring across all AI operations

## Features

### 1. Automatic Performance Tracking

Every AI operation is automatically tracked with:

```typescript
const result = await withAIMonitoring(
  'property-analysis',
  {
    operation: 'property-analysis',
    model: 'gpt-4-turbo',
    temperature: 0.3,
    maxTokens: 2000,
    inputData: propertyData
  },
  async () => {
    return await openai.chat.completions.create({...});
  }
);
```

**Tracked Metrics:**
- Latency (response time)
- Token usage (prompt, completion, total)
- Cost calculation (based on current OpenAI pricing)
- Success/failure status
- Error details (if any)

### 2. Sentry Integration

**Performance Traces:**
- Each AI operation creates a Sentry transaction
- Detailed spans for individual AI calls
- Tags and context for filtering and analysis

**Error Reporting:**
- Automatic exception capture with AI context
- Scope information including operation type and model
- Stack traces and error details

**Custom Events:**
- Daily usage summaries
- Cost alerts for high spending
- Success rate warnings for low performance

### 3. Cost Monitoring

**Real-time Cost Tracking:**
- Automatic cost calculation based on token usage
- Support for all OpenAI models (GPT-4, GPT-3.5, etc.)
- Daily cost accumulation and reset

**Cost Alerts:**
- Sentry alerts when daily costs exceed $50
- Console warnings at 80% of daily budget
- Cost breakdown by operation type

### 4. Custom Metrics

Business-specific metrics are tracked for insights:

```typescript
// Property valuation metrics
trackAIMetric('property-valuation', 'comparable_properties_analyzed', count);
trackAIMetric('property-valuation', 'opportunity_score', score);

// Lead generation metrics
trackAIMetric('lead-generation', 'hot_leads_count', hotLeads);
trackAIMetric('lead-generation', 'conversion_probability', probability);

// Market prediction metrics
trackAIMetric('market-prediction', 'price_change_percent', changePercent);
trackAIMetric('market-prediction', 'prediction_confidence', confidence);
```

## API Endpoints

### Daily Statistics
```
GET /api/ai-stats/daily
```

Returns:
```json
{
  "success": true,
  "data": {
    "totalTokens": 45230,
    "totalCost": 2.34,
    "totalCalls": 127,
    "successRate": 0.96,
    "averageLatency": 1850,
    "date": "Wed Jan 10 2024",
    "costFormatted": "$2.3400",
    "successRateFormatted": "96.0%",
    "averageLatencyFormatted": "1850ms"
  }
}
```

### Operation-Specific Statistics
```
GET /api/ai-stats/operation/property-analysis?hours=24
```

Returns:
```json
{
  "success": true,
  "data": {
    "operation": "property-analysis",
    "timeframe": "24 hours",
    "totalCalls": 23,
    "successRate": 1.0,
    "averageLatency": 2100,
    "totalTokens": 8900,
    "totalCost": 0.67,
    "errors": []
  }
}
```

### All Operations Overview
```
GET /api/ai-stats/operations
```

Returns statistics for all AI operations with recent activity.

### Manual Daily Summary
```
POST /api/ai-stats/summary
```

Manually triggers the daily summary report to Sentry.

## Monitored AI Operations

### OpenAI Service Operations
1. **property-analysis** - Property investment analysis using GPT-4
2. **document-extraction** - Legal document data extraction 
3. **lead-analysis** - Lead qualification and scoring
4. **market-report** - Market analysis report generation
5. **general-completion** - General purpose GPT completions

### Custom AI Workflows
1. **property-valuation** - Complete property valuation process
2. **property-report** - Detailed property analysis reports
3. **cma-generation** - Comparative Market Analysis generation
4. **market-prediction** - Market forecasting and trends
5. **lead-generation** - AI-powered lead generation and qualification

## Sentry Configuration

The monitoring system integrates seamlessly with your existing Sentry configuration. Ensure you have:

1. **Sentry SDK initialized** in your application
2. **Performance monitoring enabled** for traces
3. **Error tracking configured** for exception capture

### Sentry Data Structure

**Tags:**
- `ai.operation` - Type of AI operation
- `ai.model` - AI model used (e.g., gpt-4-turbo)
- `ai.success` - Whether operation succeeded
- `ai.latency_ms` - Response time in milliseconds

**Contexts:**
- `ai_call` - Detailed AI call information
- `ai_usage` - Token usage and cost data
- `ai_metrics` - Custom business metrics

**Breadcrumbs:**
- `ai.metric` - Custom metric tracking
- `ai.daily_summary` - Daily usage summaries

## Monitoring Dashboard

### Key Metrics to Monitor in Sentry

1. **Performance Metrics:**
   - Average AI operation latency
   - 95th percentile response times
   - Operations per minute

2. **Cost Metrics:**
   - Daily AI spending trends
   - Cost per operation by type
   - Token usage efficiency

3. **Quality Metrics:**
   - Success rates by operation
   - Error rates and patterns
   - Retry attempts and failures

4. **Business Metrics:**
   - Property valuation confidence scores
   - Lead generation conversion rates
   - Market prediction accuracy

### Setting Up Alerts

Create Sentry alerts for:

1. **High Cost Alert:**
   - Trigger: Daily cost > $50
   - Tag: `alert.type:high_ai_cost`

2. **Low Success Rate Alert:**
   - Trigger: Success rate < 90% with >10 calls
   - Tag: `alert.type:low_success_rate`

3. **High Latency Alert:**
   - Trigger: Average latency > 5000ms
   - Tag: `ai.latency_ms:>5000`

## Usage Examples

### Wrapping a New AI Operation

```typescript
import { withAIMonitoring, trackAIMetric } from '../lib/aiPerformanceMonitor';

async function newAIOperation(inputData: any) {
  const result = await withAIMonitoring(
    'new-operation',
    {
      operation: 'new-operation',
      model: 'gpt-4o-mini',
      temperature: 0.7,
      maxTokens: 1000,
      inputData: inputData
    },
    async () => {
      // Your AI operation here
      return await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [...],
        temperature: 0.7,
        max_tokens: 1000
      });
    }
  );

  // Track custom metrics
  trackAIMetric('new-operation', 'input_complexity', inputData.complexityScore);
  trackAIMetric('new-operation', 'output_quality', result.qualityScore);

  return result;
}
```

### Tracking Custom Business Metrics

```typescript
// Track lead quality
trackAIMetric('lead-scoring', 'lead_score', leadScore);
trackAIMetric('lead-scoring', 'conversion_probability', probability);

// Track property analysis
trackAIMetric('property-analysis', 'property_value', estimatedValue);
trackAIMetric('property-analysis', 'confidence_level', confidenceLevel);

// Track market predictions
trackAIMetric('market-forecast', 'accuracy_score', accuracyScore);
trackAIMetric('market-forecast', 'prediction_timeframe', timeframeDays);
```

## Best Practices

1. **Use Descriptive Operation Names**: Make it easy to identify operations in Sentry
2. **Track Business Metrics**: Include domain-specific metrics for insights
3. **Handle Errors Gracefully**: The wrapper will catch and report errors automatically
4. **Monitor Costs Regularly**: Set up cost alerts and review spending patterns
5. **Review Performance Trends**: Use Sentry dashboards to identify optimization opportunities

## Troubleshooting

### Common Issues

1. **Missing Token Usage Data:**
   - Ensure OpenAI response includes `usage` field
   - Check if custom AI operations return token information

2. **High Costs:**
   - Review prompt lengths and token usage
   - Consider using more cost-effective models for non-critical operations
   - Implement caching for repeated requests

3. **Low Success Rates:**
   - Check error patterns in Sentry
   - Review prompt quality and model selection
   - Verify input data validation

### Debug Mode

Enable debug logging by setting environment variable:
```bash
AI_MONITORING_DEBUG=true
```

This will log detailed information about all AI operations to the console.

## Future Enhancements

1. **Performance Optimization Suggestions**: AI-powered recommendations for improving performance
2. **Cost Optimization**: Automatic model selection based on accuracy/cost tradeoffs  
3. **A/B Testing Framework**: Built-in support for testing different AI configurations
4. **Advanced Analytics**: Machine learning insights on AI usage patterns
5. **Real-time Alerting**: Slack/Teams integration for immediate notifications

## Support

For questions or issues with the AI monitoring system:

1. Check Sentry for detailed error information
2. Review the API endpoints for current statistics
3. Examine console logs for debugging information
4. Contact the development team for assistance

---

*This monitoring system provides comprehensive visibility into AI operations, enabling data-driven optimization of performance, costs, and business outcomes.*