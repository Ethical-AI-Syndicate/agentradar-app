import { NextRequest, NextResponse } from 'next/server';
import { AIMarketPredictionEngine } from '../../../services/aiMarketPrediction';

const marketPredictionEngine = new AIMarketPredictionEngine();

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const { location, timeframe = '6_MONTHS' } = await request.json();
    
    if (!location) {
      return NextResponse.json({
        error: 'Invalid request',
        message: 'Location is required for market prediction'
      }, { status: 400 });
    }

    console.log(`AI Market Prediction requested for: ${location} (${timeframe})`);

    const prediction = await marketPredictionEngine.generateMarketForecast(location, timeframe);
    const processingTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      data: prediction,
      performance: {
        processingTimeMs: processingTime,
        processingTimeSeconds: (processingTime / 1000).toFixed(2)
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('AI Market Prediction error:', error);
    
    return NextResponse.json({
      error: 'Internal server error',
      message: 'Market prediction failed',
      processingTime: `${processingTime}ms`
    }, { status: 500 });
  }
}