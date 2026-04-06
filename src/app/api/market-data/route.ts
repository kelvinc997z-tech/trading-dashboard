import { NextRequest, NextResponse } from "next/server";

const CRYPTO_SYMBOLS = ["XAUT", "BTC", "ETH", "SOL", "XRP", "KAS"];
const US_STOCKS = ["AAPL", "AMD", "NVDA", "MSFT", "GOOGL", "TSM"];
const SUPPORTED_SYMBOLS = [...CRYPTO_SYMBOLS, ...US_STOCKS];

// Normalize symbol to internal format (XAUT for gold)
function normalizeSymbol(symbol: string): string {
  if (symbol === "XAU") return "XAUT";
  return symbol;
}

// Map our symbols to CoinMarketCap format
function getCoinMarketCapSymbol(symbol: string): string {
  const map: Record<string, string> = {
    "XAUT": "XAU",
    "BTC": "BTC",
    "ETH": "ETH",
    "SOL": "SOL",
    "XRP": "XRP",
    "KAS": "KAS"
  };
  return map[symbol] || symbol;
}

// Fetch from CoinMarketCap (requires COINMARKETCAP_API_KEY)
async function fetchCoinMarketCapOHLC(symbol: string, timeframe: string = "1h", limit: number = 200) {
  const apiKey = process.env.COINMARKETCAP_API_KEY;
  if (!apiKey) {
    console.log(`[CMC] API key not set, skipping ${symbol}`);
    return null;
  }

  const cmcSymbol = getCoinMarketCapSymbol(symbol);
  console.log(`[CMC] Fetching ${symbol} (as ${cmcSymbol}) ${timeframe} (limit: ${limit})`);
  const url = new URL(`https://pro-api.coinmarketcap.com/v2/cryptocurrency/ohlcv/historical`);
  url.searchParams.append("symbol", cmcSymbol);
  url.searchParams.append("convert", "USD");
  url.searchParams.append("time_period", timeframe);
  url.searchParams.append("time_start", new Date(Date.now() - limit * 60 * 60 * 1000).toISOString());
  url.searchParams.append("time_end", new Date().toISOString());
  url.searchParams.append("count", limit.toString());

  try {
    const res = await fetch(url.toString(), {
      headers: {
        "X-CMC_PRO_API_KEY": apiKey,
        "Accept": "application/json"
      }
    });
    if (!res.ok) {
      if (res.status === 429) {
        console.warn(`[MarketData] CMC rate limit hit for ${symbol}`);
      } else {
        console.error(`[MarketData] CMC fetch error ${symbol}: ${res.status}`);
      }
      return null;
    }
    const data: any = await res.json();
    console.log(`[CMC] Response for ${symbol}:`, { status: res.status, quotesCount: data?.data?.quotes?.length || 0 });
    const quotes = data?.data?.quotes || [];
    if (!Array.isArray(quotes) || quotes.length === 0) return null;

    const history = quotes.map((q: any) => ({
      time: q.timestamp,
      open: Number(q.open),
      high: Number(q.high),
      low: Number(q.low),
      close: Number(q.close),
      price: Number(q.close),
      volume: Number(q.volume),
    })).sort((a, b) => a.time.localeCompare(b.time));

    if (history.length === 0) return null;

    const current = history[history.length - 1];
    const previous = history.length > 1 ? history[history.length - 2] : current;
    const change = current.close - previous.close;
    const changePercent = (change / previous.close) * 100;

    return {
      symbol,
      source: "CoinMarketCap",
      current: {
        price: current.close,
        close: current.close,
        change: Number(change.toFixed(2)),
        changePercent: Number(changePercent.toFixed(2)),
        high: current.high,
        low: current.low,
      },
      history,
    };
  } catch (e) {
    console.error(`[MarketData] CoinMarketCap fetch exception for ${symbol}:`, e);
    return null;
  }
}

// Fetch from Binance (no API key required)
async function fetchBinanceOHLC(symbol: string, timeframe: string = "1h", limit: number = 200) {
  const binanceSymbol = symbol === "XAUT" ? "XAUUSDT" : `${symbol}USDT`;
  const binanceSymbolUpper = binanceSymbol.toUpperCase();

  const intervalMap: Record<string, string> = {
    "1m": "1m", "5m": "5m", "15m": "15m", "30m": "30m",
    "1h": "1h", "2h": "2h", "4h": "4h", "6h": "6h", "8h": "8h", "12h": "12h",
    "1d": "1d", "3d": "3d", "1w": "1w", "1M": "1M"
  };
  const interval = intervalMap[timeframe];
  if (!interval) {
    console.warn(`[MarketData] Binance: timeframe ${timeframe} not supported`);
    return null;
  }

  const safeLimit = Math.min(limit, 1000);
  const url = `https://api.binance.com/api/v3/klines?symbol=${binanceSymbolUpper}&interval=${interval}&limit=${safeLimit}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.error(`[MarketData] Binance fetch error ${symbol}: ${res.status}`);
      return null;
    }
    const data: any[][] = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;

    const history = data.map(candle => ({
      time: new Date(Number(candle[0])).toISOString(),
      open: Number(candle[1]),
      high: Number(candle[2]),
      low: Number(candle[3]),
      close: Number(candle[4]),
      price: Number(candle[4]),
      volume: Number(candle[5]),
    }));

    if (history.length === 0) return null;

    const current = history[history.length - 1];
    const previous = history.length > 1 ? history[history.length - 2] : current;
    const change = current.close - previous.close;
    const changePercent = (change / previous.close) * 100;

    return {
      symbol,
      source: "Binance",
      current: {
        price: current.close,
        close: current.close,
        change: Number(change.toFixed(2)),
        changePercent: Number(changePercent.toFixed(2)),
        high: current.high,
        low: current.low,
      },
      history,
    };
  } catch (e) {
    console.error(`[MarketData] Binance fetch exception for ${symbol}:`, e);
    return null;
  }
}

// Fetch aggregated OHLC from multiple exchanges
async function fetchAggregatedOHLC(symbol: string, timeframe: string = "1h", limit: number = 200) {
  const exchanges = [
    { name: "binance", fetch: (s: string, t: string, l: number) => fetchBinanceOHLC(s, t, l) },
    { name: "coingecko", fetch: (s: string, t: string, l: number) => fetchCoinGeckoOHLC(s, t, l) },
    { name: "coinglass_spot", fetch: (s: string, t: string, l: number) => fetchCoinglassSpotOHLC(s, t, l) },
    { name: "coinglass_futures", fetch: (s: string, t: string, l: number) => fetchCoinglassFuturesOHLC(s, t, l) },
  ];

  const results = await Promise.allSettled(
    exchanges.map(async (ex) => {
      try {
        const data = await ex.fetch(symbol, timeframe, limit);
        if (data) return { source: ex.name, data };
      } catch (e) {
        console.warn(`[Aggregated] ${ex.name} failed for ${symbol}:`, e);
      }
      return null;
    })
  );

  const validResults = results
    .filter((r): r is PromiseFulfilledResult<{ source: string; data: any }> => r.status === "fulfilled" && r.value !== null)
    .map((r) => r.value);

  if (validResults.length === 0) {
    console.log(`[Aggregated] No exchange returned data for ${symbol}`);
    return null;
  }

  const bestData = validResults.sort((a, b) => b.data.history.length - a.data.history.length)[0].data;

  if (validResults.length > 1) {
    const prices = validResults.map((r) => r.data.current.price);
    const avgPrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;
    const maxDeviation = Math.max(...prices.map((p) => Math.abs(p - avgPrice) / avgPrice));
    if (maxDeviation > 0.02) {
      console.warn(`[Aggregated] Price divergence for ${symbol}:`, 
        validResults.map((r) => ({ source: r.source, price: r.data.current.price })),
        `avg: ${avgPrice.toFixed(2)}`
      );
    }
    bestData.current.price = Number(avgPrice.toFixed(2));
    bestData.current.close = bestData.current.price;
    bestData.source = "Aggregated";
  } else {
    bestData.source = validResults[0].source;
  }

  return bestData;
}

// Other fetch functions (CoinGecko, Coinglass, CoinAPI, FreeCryptoAPI) remain unchanged...
// [Include all other fetch functions as they were]

function getPeriodHours(timeframe: string): number {
  switch (timeframe) {
    case "1m": return 1/60;
    case "5m": return 5/60;
    case "15m": return 15/60;
    case "30m": return 30/60;
    case "1h": return 1;
    case "2h": return 2;
    case "4h": return 4;
    case "6h": return 6;
    case "8h": return 8;
    case "12h": return 12;
    case "1d": return 24;
    case "3d": return 72;
    case "1w": return 168;
    case "1M": return 730;
    default: return 1;
  }
}

function generateOHLC(symbol: string, timeframe: string = "1h", source: string = "synthetic") {
  const basePrices: Record<string, number> = {
    "XAUT": 2350, "BTC": 65000, "ETH": 3500, "SOL": 150,
    "XRP": 0.6, "KAS": 0.17, "AAPL": 170, "AMD": 120,
    "NVDA": 240, "MSFT": 330, "GOOGL": 140,
  };
  const base = basePrices[symbol] || 100;
  
  let count = 24;
  let intervalMs = 60 * 60 * 1000;
  switch (timeframe) {
    case "4h": count = 30; intervalMs = 4 * 60 * 60 * 1000; break;
    case "1d": count = 30; intervalMs = 24 * 60 * 60 * 1000; break;
    case "1w": count = 12; intervalMs = 7 * 24 * 60 * 60 * 1000; break;
    case "1m": count = 60; intervalMs = 60 * 1000; break;
    case "5m": count = 100; intervalMs = 5 * 60 * 1000; break;
    case "15m": count = 100; intervalMs = 15 * 60 * 1000; break;
  }

  const now = new Date();
  const history: Array<{ time: string; open: number; high: number; low: number; close: number; price: number; volume: number }> = [];
  let lastClose = base + (Math.random() - 0.5) * 20;
  for (let i = 0; i < count; i++) {
    const time = new Date(now.getTime() - (count - 1 - i) * intervalMs);
    const open = lastClose;
    const volatilityFactor = intervalMs / (60 * 60 * 1000);
    let close = open + (Math.random() - 0.5) * base * 0.02 * Math.sqrt(volatilityFactor);
    close = Math.max(close, 0.1);
    const high = Math.max(open, close) + Math.random() * base * 0.01 * volatilityFactor;
    const low = Math.min(open, close) - Math.random() * base * 0.01 * volatilityFactor;
    const volume = Math.floor(Math.random() * 1000) + 100;
    history.push({
      time: time.toISOString(),
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
      price: Number(close.toFixed(2)),
      volume,
    });
    lastClose = close;
  }
  const current = history[history.length - 1];
  const previous = history.length > 1 ? history[history.length - 2] : current;
  const change = current.close - previous.close;
  const changePercent = (change / previous.close) * 100;
  return {
    symbol,
    source,
    current: {
      price: current.close,
      close: current.close,
      change: Number(change.toFixed(2)),
      changePercent: Number(changePercent.toFixed(2)),
      high: current.high,
      low: current.low,
    },
    history,
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol") || "XAUT";
  const timeframe = searchParams.get("timeframe") || "1h";

  if (!SUPPORTED_SYMBOLS.includes(symbol)) {
    return NextResponse.json(
      { error: `Unsupported symbol. Supported: ${SUPPORTED_SYMBOLS.join(", ")}` },
      { status: 400 }
    );
  }

  const normalizedSymbol = normalizeSymbol(symbol);

  try {
    if (CRYPTO_SYMBOLS.includes(normalizedSymbol)) {
      // 1. CoinMarketCap (primary)
      const cmcData = await fetchCoinMarketCapOHLC(symbol, timeframe, 200);
      if (cmcData) {
        console.log(`[MarketData] ${symbol} served from CoinMarketCap`);
        return NextResponse.json(cmcData);
      }

      // 2. Binance
      const binanceData = await fetchBinanceOHLC(symbol, timeframe, 200);
      if (binanceData) {
        console.log(`[MarketData] ${symbol} served from Binance`);
        return NextResponse.json(binanceData);
      }

      // 3. Aggregated
      const aggData = await fetchAggregatedOHLC(normalizedSymbol, timeframe, 200);
      if (aggData) {
        console.log(`[MarketData] ${symbol} served from Aggregated (multi-exchange)`);
        return NextResponse.json(aggData);
      }

      // 4. CoinGecko
      const cgData = await fetchCoinGeckoOHLC(normalizedSymbol, timeframe, 200);
      if (cgData) {
        console.log(`[MarketData] ${symbol} served from CoinGecko`);
        return NextResponse.json(cgData);
      }

      // 5. FreeCryptoAPI
      const freeCryptoData = await fetchFreeCryptoAPIOHLC(normalizedSymbol, timeframe, 200);
      if (freeCryptoData) {
        console.log(`[MarketData] ${symbol} served from FreeCryptoAPI`);
        return NextResponse.json(freeCryptoData);
      }

      // 6. CoinAPI
      const coinAPIData = await fetchCoinAPIOHLC(normalizedSymbol, timeframe, 200);
      if (coinAPIData) {
        console.log(`[MarketData] ${symbol} served from CoinAPI`);
        return NextResponse.json(coinAPIData);
      }

      // 7. Synthetic fallback
      console.warn(`[MarketData] All sources failed for ${symbol}, returning synthetic`);
    } else {
      console.log(`[MarketData] ${symbol} is stock, returning synthetic`);
    }

    const synthetic = generateOHLC(symbol, timeframe, "synthetic");
    return NextResponse.json(synthetic);
  } catch (error: any) {
    console.error(`[MarketData] Error for ${symbol}:`, error);
    return NextResponse.json({ error: error.message || "Unknown error" }, { status: 500 });
  }
}
