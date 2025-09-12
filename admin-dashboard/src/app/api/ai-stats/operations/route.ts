import { NextResponse } from 'next/server';

const operationTypes = [
  'property-analysis',
  'document-extraction', 
  'lead-analysis',
  'market-report',
  'cma-generation',
  'property-valuation',
  'market-prediction',
  'general-completion',
  'lead-generation',
  'property-report'
];

const possibleErrors = [
  'Rate limit exceeded',
  'Token limit exceeded',
  'Invalid input format',
  'API timeout',
  'Model overloaded',
  'Authentication error'
];

export async function GET() {
  try {
    // Simulate some processing time
    await new Promise(resolve => setTimeout(resolve, 300));

    const operations = operationTypes.slice(0, Math.floor(Math.random() * 6) + 4).map(operation => {
      const totalCalls = Math.floor(Math.random() * 50) + 5;
      const successRate = Math.round((Math.random() * 0.15 + 0.85) * 1000) / 1000;
      const averageLatency = Math.floor(Math.random() * 3000) + 1000;
      const totalTokens = Math.floor(Math.random() * 20000) + 5000;
      const totalCost = Math.round((totalTokens * 0.00005) * 100) / 100;
      
      const errorCount = successRate < 0.95 ? Math.floor(Math.random() * 3) + 1 : 0;
      const errors = errorCount > 0 ? 
        Array.from({length: errorCount}, () => 
          possibleErrors[Math.floor(Math.random() * possibleErrors.length)]
        ) : [];

      return {
        operation,
        totalCalls,
        successRate,
        averageLatency,
        totalTokens,
        totalCost,
        errors,
        totalCostFormatted: `$${totalCost.toFixed(4)}`,
        successRateFormatted: `${(successRate * 100).toFixed(1)}%`,
        averageLatencyFormatted: `${averageLatency}ms`
      };
    });

    return NextResponse.json({
      success: true,
      data: operations
    });
  } catch (error) {
    console.error('AI stats operations error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch AI operations statistics' },
      { status: 500 }
    );
  }
}