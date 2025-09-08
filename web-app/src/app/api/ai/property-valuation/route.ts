import { NextRequest, NextResponse } from 'next/server';
import { AIPropertyValuationEngine } from '../../../../services/aiPropertyValuation';

const propertyValuationEngine = new AIPropertyValuationEngine();

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const propertyData = await request.json();
    
    if (!propertyData.address || !propertyData.city) {
      return NextResponse.json({
        error: 'Invalid request',
        message: 'Property address and city are required'
      }, { status: 400 });
    }

    console.log(`AI Property Valuation requested for: ${propertyData.address}, ${propertyData.city}`);

    const valuation = await propertyValuationEngine.generateValuation(propertyData);
    const processingTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      data: valuation,
      performance: {
        processingTimeMs: processingTime,
        processingTimeSeconds: (processingTime / 1000).toFixed(2)
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('AI Property Valuation error:', error);
    
    return NextResponse.json({
      error: 'Internal server error',
      message: 'Property valuation failed',
      processingTime: `${processingTime}ms`
    }, { status: 500 });
  }
}