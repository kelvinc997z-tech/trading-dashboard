import { NextResponse } from "next/server";

const CRYPTO_SYMBOLS = ["XAUT/USD", "BTC/USD", "ETH/USD", "SOL/USD", "XRP/USD"];
const SUPPORTED_SYMBOLS = CRYPTO_SYMBOLS;

// Generate OHLC history and compute current stats
function generateOHLC(symbol: string) {
  const basePrices: Record<string, number> = {
    "XAUT/USD": 2350,
    "BTC/USD": 65000,
    "ETH/USD": 3500,
    "SOL/USD": 150,
    "XRP/USD": 0.6,
  };
  const base = basePrices[symbol] || 100;
  const now = new Date();
  const history: Array<{ time: string; open: number; high: number; low: number; close: number; volume: number }> = [];
  let lastClose = base + (Math.random() - 0.5) * 20;
  for (let i = 0; i < 24; i++) {
    const time = new Date(now.getTime() - (23 - i) * 60 * 60 * 1000);
    const open = lastClose;
    let close = open + (Math.random() - 0.5) * base * 0.02;
    close = Math.max(close, 0.1);
    const high = Math.max(open, close) + Math.random() * base * 0.01;
    const low = Math.min(open, close) - Math.random() * base * 0.01;
    const volume = Math.floor(Math.random() * 1000) + 100;
    history.push({
      time: time.toISOString(),
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
      volume,
    });
    lastClose = close;
  }
  // Compute change from previous close (use previous day if available)
  const current = history[history.length - 1];
  const previous = history.length > 1 ? history[history.length - 2] : current;
  const change = current.close - previous.close;
  const changePercent = (change / previous.close) * 100;
  return {
    symbol,
    current: {
      close: current.close,
      change: Number(change.toFixed(2)),
      changePercent: Number(changePercent.toFixed(2)),
      high: current.high,
      low: current.low,
    },
    history,
  };
}

async function fetchCoinMarketCap(symbol: string, apiKey: string) {
  const cmcSymbol = symbol === "XAUT/USD" ? "XAUT" : symbol.replace("/", "");
  const url = `https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest?symbol=${cmcSymbol}&convert=USD`;
  const res = await fetch(url, {
    headers: { 'X-CMC_PRO_API_KEY': apiKey },
    next: { revalidate: 30 }
  });
  if (!res.ok) throw new Error(`CoinMarketCap error: ${res.status}`);
  const data = await res.json();
  const coin = data.data[cmcSymbol][0];
  const price = coin.quote.USD.price;
  // Generate OHLC history based on current price
  const now = new Date();
  const history: Array<{ time: string; open: number; high: number; low: number; close: number; volume: number }> = [];
  let lastClose = price;
  for (let i = 0; i < 24; i++) {
    const time = new Date(now.getTime() - (23 - i) * 60 * 60 * 1000);
    const open = lastClose;
    let close = open + (Math.random() - 0.5) * (price * 0.02);
    const high = Math.max(open, close) + Math.random() * (price * 0.01);
    const low = Math.min(open, close) - Math.random() * (price * 0.01);
    history.push({
      time: time.toISOString(),
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
      volume: Math.floor(Math.random() * 1000) + 100,
    });
    lastClose = close;
  }
  const current = history[history.length - 1];
  const previous = history.length > 1 ? history[history.length - 2] : current;
  const change = current.close - previous.close;
  const changePercent = (change / previous.close) * 100;
  return {
    symbol,
    current: {
      close: current.close,
      change: Number(change.toFixed(2)),
      changePercent: Number(changePercent.toFixed(2)),
      high: current.high,
      low: current.low,
    },
    history,
  };
}

export async function GET(request: Request) {
  const twelveApiKey = process.env.TWELVEDATA_API_KEY;
  const cmcApiKey = process.env.COINMARKETCAP_API_KEY;
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol") || "XAUT/USD";

  if (!SUPPORTED_SYMBOLS.includes(symbol)) {
    return NextResponse.json(
      { error: `Unsupported symbol. Supported: ${SUPPORTED_SYMBOLS.join(", ")}` },
      { status: 400 }
    );
  }

  // Use CoinMarketCap for all crypto symbols if API key available
  if (cmcApiKey && CRYPTO_SYMBOLS.includes(symbol)) {
    try {
      return NextResponse.json(await fetchCoinMarketCap(symbol, cmcApiKey));
    } catch (error) {
      console.error(`CoinMarketCap error for ${symbol}:`, error);
      // fallback to TwelveData if CMC fails and TwelveData key exists
      if (twelveApiKey) {
        console.warn(`Falling back to TwelveData for ${symbol}`);
      } else {
        return NextResponse.json(generateOHLC(symbol));
      }
    }
  }

  // Fallback to TwelveData for any symbol (if key exists)
  if (!twelveApiKey) {
    console.warn(`TWELVEDATA_API_KEY not set, returning dummy data for ${symbol}`);
    return NextResponse.json(generateOHLC(symbol));
  }

  try {
    const quoteRes = await fetch(
      `https://api.twelvedata.com/quote?symbol=${symbol}&interval=1h&apikey=${twelveApiKey}`,
      { next: { revalidate: 30 } }
    );

    if (!quoteRes.ok) {
      throw new Error(`Twelvedata error: ${quoteRes.status} ${quoteRes.statusText}`);
    }

    const quoteData = await quoteRes.json();

    if (quoteData.code) {
      throw new Error(quoteData.message || "Twelvedata returned error");
    }

    const tsRes = await fetch(
      `https://api.twelvedata.com/time_series?symbol=${symbol}&interval=1h&outputsize=24&apikey=${twelveApiKey}`,
      { next: { revalidate: 30 } }
    );

    let tsData: any = { values: [] };
    if (tsRes.ok) {
      tsData = await tsRes.json();
      if (tsData.code) {
        throw new Error(tsData.message || "Twelvedata time_series error");
      }
    } else {
      throw new Error(`Time series request failed: ${tsRes.status}`);
    }

    const history = (tsData.values || []).map((v: any) => ({
      time: new Date(v.datetime).toISOString(),
      open: parseFloat(v.open),
      high: parseFloat(v.high),
      low: parseFloat(v.low),
      close: parseFloat(v.close),
      volume: parseFloat(v.volume) || 0,
    })).reverse();

    // If history empty, fallback to dummy
    if (history.length === 0) {
      console.warn(`Empty history from TwelveData for ${symbol}, using dummy`);
      return NextResponse.json(generateOHLC(symbol));
    }

    const last = history[history.length - 1];
    // Use TwelveData quote for change/percent if available, else compute from history
    const change = parseFloat(quoteData.change) || (last.close - (history.length > 1 ? history[history.length - 2].close : last.close));
    const changePercent = parseFloat(quoteData.percent_change) || ((change / (history.length > 1 ? history[history.length - 2].close : last.close)) * 100);

    return NextResponse.json({
      symbol,
      current: {
        close: last.close,
        change: Number(change.toFixed(2)),
        changePercent: Number(changePercent.toFixed(2)),
        high: last.high,
        low: last.low,
      },
      history,
    });
  } catch (error) {
    console.error(`Error fetching market data for ${symbol}:`, error);
    // Fallback to dummy data so UI still shows something
    return NextResponse.json(generateOHLC(symbol));
  }
}
