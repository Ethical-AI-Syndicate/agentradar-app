import { NextResponse } from 'next/server';

interface HistoricalDataPoint {
  date: string;
  totalCost: number;
  totalTokens: number;
  totalCalls: number;
  successRate: number;
  averageLatency: number;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');

    // Generate historical data for the specified number of days
    const historicalData: HistoricalDataPoint[] = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      
      // Generate realistic historical data with trends
      const baseMultiplier = 1 + (Math.random() - 0.5) * 0.3; // ±15% variation
      const weekendReduction = date.getDay() === 0 || date.getDay() === 6 ? 0.6 : 1.0; // Weekend reduction
      
      historicalData.push({
        date: date.toISOString().split('T')[0],
        totalCost: Math.round((Math.random() * 8 + 2) * baseMultiplier * weekendReduction * 100) / 100,
        totalTokens: Math.floor((Math.random() * 60000 + 20000) * baseMultiplier * weekendReduction),
        totalCalls: Math.floor((Math.random() * 150 + 50) * baseMultiplier * weekendReduction),
        successRate: Math.round((Math.random() * 0.1 + 0.9) * 1000) / 1000,
        averageLatency: Math.floor((Math.random() * 1500 + 1200) * (2 - baseMultiplier))
      });
    }

    // Extract arrays for charting
    const response = {
      dates: historicalData.map(d => d.date),
      costs: historicalData.map(d => d.totalCost),
      tokens: historicalData.map(d => d.totalTokens),
      calls: historicalData.map(d => d.totalCalls),
      successRates: historicalData.map(d => d.successRate),
      latencies: historicalData.map(d => d.averageLatency),
      rawData: historicalData
    };

    return NextResponse.json({
      success: true,
      data: response
    });
  } catch (error) {
    console.error('Historical stats error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch historical AI statistics' },
      { status: 500 }
    );
  }
}