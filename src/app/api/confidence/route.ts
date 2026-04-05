import { NextRequest, NextResponse } from 'next/server';
import { calculateConfidence } from '@/lib/indicators';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get('symbol');
  const timeframe = searchParams.get('timeframe') || '1h';

  if (!symbol) {
    return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
  }

  try {
    // Fetch market data from existing API
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/market-data?symbol=${encodeURIComponent(symbol)}&timeframe=${timeframe}`, {
      // Cache for 30 seconds
      next: { revalidate: 30 }
    });

    if (!res.ok) {
      throw new Error(`Market data fetch failed: ${res.status}`);
    }

    const data = await res.json();

    if (!data.history || !Array.isArray(data.history) || data.history.length < 26) {
      return NextResponse.json({
        symbol,
        timeframe,
        confidence: 50,
        recommendation: 'NEUTRAL',
        error: 'Insufficient historical data for analysis',
        dataPoints: data.history?.length || 0
      });
    }

    const prices = data.history.map((h: any) => h.price || h.close);
    const analysis = calculateConfidence(prices);

    return NextResponse.json({
      symbol,
      timeframe,
      confidence: analysis.confidence,
      recommendation: analysis.recommendation,
      indicators: analysis.details,
      currentPrice: data.current?.price || data.current?.close || prices[prices.length - 1],
      updatedAt: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Confidence API error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate confidence', details: error.message },
      { status: 500 }
    );
  }
}
