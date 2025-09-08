import { NextRequest, NextResponse } from 'next/server';
import { AICMAGenerationEngine } from '../../../../services/aiCMAGeneration';

const cmaGenerationEngine = new AICMAGenerationEngine();

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const cmaRequest = await request.json();
    
    if (!cmaRequest.propertyAddress || !cmaRequest.radius) {
      return NextResponse.json({
        error: 'Invalid request',
        message: 'Property address and search radius are required for CMA generation'
      }, { status: 400 });
    }

    console.log(`AI CMA Generation requested for: ${cmaRequest.propertyAddress}`);

    const cmaReport = await cmaGenerationEngine.generateCMAReport(cmaRequest);
    const processingTime = Date.now() - startTime;

    const targetTime = 30000; // 30 seconds target
    const isWithinTarget = processingTime <= targetTime;

    return NextResponse.json({
      success: true,
      data: cmaReport,
      performance: {
        processingTimeMs: processingTime,
        processingTimeSeconds: (processingTime / 1000).toFixed(2),
        targetTimeMs: targetTime,
        targetTimeSeconds: 30,
        withinTarget: isWithinTarget,
        speedClaim: '30-second CMA generation',
        speedVerification: isWithinTarget ? 'PASSED' : 'FAILED'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('AI CMA Generation error:', error);
    
    return NextResponse.json({
      error: 'Internal server error',
      message: 'CMA generation failed',
      processingTime: `${processingTime}ms`
    }, { status: 500 });
  }
}