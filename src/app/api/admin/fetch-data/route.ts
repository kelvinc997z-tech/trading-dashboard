import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { fetchCoinglassOHLC, fetchCoinglassSpotOHLC } from "@/lib/coinglass";
import { fetchCoinGeckoOHLC } from "@/lib/coingecko";
import { db } from "@/lib/db";
import { saveOHLCData } from "@/lib/quant-ai/data-collector";

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
    const { symbol, timeframe, source = "coinglass", limit = 1000 } = body;

    if (!symbol || !timeframe) {
      return NextResponse.json({ error: "Symbol and timeframe required" }, { status: 400 });
    }

    let ohlcData: { symbol: string; timeframe: string; data: any[] };

    if (source === "coinglass") {
      // Try futures endpoint first
      const result = await fetchCoinglassOHLC(symbol, timeframe, limit);
      if (!result) {
        // Fallback to spot
        const spot = await fetchCoinglassSpotOHLC(symbol, timeframe, limit);
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
      const url = `https://api.binance.com/api/v3/klines?symbol=${binanceSymbol}&interval=${interval}&limit=${limit}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Binance error: ${res.status}`);
      const data = await res.json();
      ohlcData = {
        symbol: binanceSymbol,
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
    } else if (source === "coingecko") {
      // CoinGecko: no API key required, but limited historical depth
      const cgData = await fetchCoinGeckoOHLC(symbol, timeframe, limit);
      // CoinGecko OHLC does not include volume, we'll set it to 0
      ohlcData = {
        symbol: symbol.toUpperCase(),
        timeframe,
        data: cgData.data.map((candle: any[]) => [
          candle[0], // timestamp ms
          Number(candle[1]),
          Number(candle[2]),
          Number(candle[3]),
          Number(candle[4]),
          0 // volume placeholder (not available)
        ])
      };
    } else {
      return NextResponse.json({ error: "Invalid source. Supported: coinglass, binance, coingecko" }, { status: 400 });
    }

    // Immediately save to database
    const records = ohlcData.data.map((candle: any[]) => ({
      symbol: ohlcData.symbol,
      timeframe: ohlcData.timeframe,
      timestamp: new Date(candle[0]),
      open: Number(candle[1]),
      high: Number(candle[2]),
      low: Number(candle[3]),
      close: Number(candle[4]),
      volume: Number(candle[5]),
    }));
    const saved = await saveOHLCData(records);

    // Generate CSV for download
    const headers = [
      'timestamp','open','high','low','close','volume',
      'rsi','macd','macd_signal','macd_hist',
      'sma_20','sma_50','sma_200','ema_12','ema_26',
      'bollinger_upper','bollinger_middle','bollinger_lower',
      'atr','adx','stoch_k','stoch_d','williams_r','cci','mfi','obv'
    ];

    const rows = ohlcData.data.map((candle: any[]) => {
      return [
        new Date(candle[0]).toISOString(),
        candle[1], candle[2], candle[3], candle[4], candle[5],
        ...Array(20).fill('')
      ].join(',');
    });

    const csv = [headers.join(',')].concat(rows).join('\n');

    // Return JSON with saved count and CSV download URL
    return NextResponse.json({
      success: true,
      saved: saved,
      total: records.length,
      source: source,
      symbol: ohlcData.symbol,
      timeframe: ohlcData.timeframe,
      downloadUrl: `/api/admin/fetch-data/download?symbol=${encodeURIComponent(symbol)}&timeframe=${timeframe}&source=${source}`,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET route to download CSV
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const symbol = searchParams.get('symbol');
  const timeframe = searchParams.get('timeframe');
  const source = searchParams.get('source');

  if (!symbol || !timeframe) {
    return NextResponse.json({ error: "Symbol and timeframe required" }, { status: 400 });
  }

  try {
    // Re-fetch data based on source
    let ohlcData: { symbol: string; timeframe: string; data: any[] };

    if (source === "coinglass") {
      const result = await fetchCoinglassOHLC(symbol, timeframe, 1000);
      if (!result) throw new Error("Coinglass fetch failed");
      ohlcData = result;
    } else if (source === "binance") {
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
        symbol: binanceSymbol,
        timeframe,
        data: data.map((k: any[]) => [k[0], Number(k[1]), Number(k[2]), Number(k[3]), Number(k[4]), Number(k[5])])
      };
    } else if (source === "coingecko") {
      const cgData = await fetchCoinGeckoOHLC(symbol, timeframe, 1000);
      ohlcData = {
        symbol: symbol.toUpperCase(),
        timeframe,
        data: cgData.data.map((candle: any[]) => [candle[0], candle[1], candle[2], candle[3], candle[4], 0])
      };
    } else {
      return NextResponse.json({ error: "Invalid source" }, { status: 400 });
    }

    const headers = [
      'timestamp','open','high','low','close','volume',
      'rsi','macd','macd_signal','macd_hist',
      'sma_20','sma_50','sma_200','ema_12','ema_26',
      'bollinger_upper','bollinger_middle','bollinger_lower',
      'atr','adx','stoch_k','stoch_d','williams_r','cci','mfi','obv'
    ];

    const rows = ohlcData.data.map((candle: any[]) => {
      return [
        new Date(candle[0]).toISOString(),
        candle[1], candle[2], candle[3], candle[4], candle[5],
        ...Array(20).fill('')
      ].join(',');
    });

    const csv = [headers.join(',')].concat(rows).join('\n');

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${symbol.toLowerCase()}_${timeframe}_${source}.csv"`,
      },
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
