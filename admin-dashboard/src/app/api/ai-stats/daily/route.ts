import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Simulate some processing time
    await new Promise(resolve => setTimeout(resolve, 500));

    const dailyStats = {
      totalTokens: Math.floor(Math.random() * 50000) + 30000,
      totalCost: Math.round((Math.random() * 5 + 1) * 100) / 100,
      totalCalls: Math.floor(Math.random() * 100) + 80,
      successRate: Math.round((Math.random() * 0.1 + 0.9) * 1000) / 1000,
      averageLatency: Math.floor(Math.random() * 2000) + 1500,
      date: new Date().toDateString(),
      get costFormatted() { return `$${this.totalCost.toFixed(4)}`; },
      get successRateFormatted() { return `${(this.successRate * 100).toFixed(1)}%`; },
      get averageLatencyFormatted() { return `${this.averageLatency}ms`; }
    };

    return NextResponse.json({
      success: true,
      data: dailyStats
    });
  } catch (error) {
    console.error('AI stats daily error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch daily AI statistics' },
      { status: 500 }
    );
  }
}