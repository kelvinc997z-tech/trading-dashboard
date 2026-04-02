import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { fetchCoinglassOHLC, fetchCoinglassSpotOHLC } from "@/lib/coinglass";
import { db } from "@/lib/db";

// Only allow admin/pro users (or you can use a simple token for now)
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "secret-token";

export async function POST(request: NextRequest) {
  // Simple auth via header
  const token = request.headers.get("x-admin-token");
  if (token !== ADMIN_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { symbol, timeframe, source = "coinglass" } = body;

    if (!symbol || !timeframe) {
      return NextResponse.json({ error: "Symbol and timeframe required" }, { status: 400 });
    }

    let ohlcData;
    if (source === "coinglass") {
      // Try futures endpoint first
      const result = await fetchCoinglassOHLC(symbol, timeframe, 1000);
      if (!result) {
        // Fallback to spot
        const spot = await fetchCoinglassSpotOHLC(symbol, timeframe, 1000);
        if (!spot) throw new Error("Coinglass spot and futures both failed");
        ohlcData = spot;
      } else {
        ohlcData = result;
      }
    } else if (source === "binance") {
      // Binance public endpoint (no key)
      const binanceSymbol = symbol.toUpperCase() === 'XAUT' ? 'XAUTUSDT' : `${symbol.toUpperCase()}USDT`;
      const intervalMap: Record<string, string> = {
        '1h': '1h', '4h': '4h', '1d': '1d', '15m': '15m', '5m': '5m', '1m': '1m'
      };
      const interval = intervalMap[timeframe];
      if (!interval) throw new Error(`Unsupported timeframe: ${timeframe}`);
      const url = `https://api.binance.com/api/v3/klines?symbol=${binanceSymbol}&interval=${interval}&limit=1000`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Binance error: ${res.status}`);
      const data = await res.json();
      ohlcData = {
        symbol: symbol.toUpperCase(),
        timeframe,
        data: data.map((k: any[]) => [
          k[0], // timestamp ms
          Number(k[1]),
          Number(k[2]),
          Number(k[3]),
          Number(k[4]),
          Number(k[5])
        ])
      };
    } else {
      return NextResponse.json({ error: "Invalid source" }, { status: 400 });
    }

    // Optionally save to database
    // await saveToDB(ohlcData);

    // Return as CSV
    const headers = [
      'timestamp','open','high','low','close','volume',
      'rsi','macd','macd_signal','macd_hist',
      'sma_20','sma_50','sma_200','ema_12','ema_26',
      'bollinger_upper','bollinger_middle','bollinger_lower',
      'atr','adx','stoch_k','stoch_d','williams_r','cci','mfi','obv'
    ];

    // We'll compute indicators client-side after download, so just return raw OHLC for now
    const rows = ohlcData.data.map((candle: any[]) => {
      // candle: [timestamp, open, high, low, close, volume]
      return [
        new Date(candle[0]).toISOString(),
        candle[1], candle[2], candle[3], candle[4], candle[5],
        // indicators omitted (empty)
        ...Array(20).fill('')
      ].join(',');
    });

    const csv = [headers.join(',')].concat(rows).join('\n');

    return NextResponse.redirect(new URL(`/api/admin/fetch-data/download?symbol=${symbol}&timeframe=${timeframe}`, request.url));

    // Or directly return file:
    // return new NextResponse(csv, {
    //   headers: {
    //     'Content-Type': 'text/csv',
    //     'Content-Disposition': `attachment; filename="${symbol.toLowerCase()}_${timeframe}.csv"`,
    //   },
    // });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// We'll implement a separate GET route for download if needed
