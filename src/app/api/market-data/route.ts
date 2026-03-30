import { NextResponse } from "next/server";

const CRYPTO_SYMBOLS = ["XAUT/USD", "BTC/USD", "ETH/USD", "SOL/USD", "XRP/USD"];
const SUPPORTED_SYMBOLS = CRYPTO_SYMBOLS;

function generateDummy(symbol: string) {
  const basePrices: Record<string, number> = {
    "XAUT/USD": 2350,
    "BTC/USD": 65000,
    "ETH/USD": 3500,
    "SOL/USD": 150,
    "XRP/USD": 0.6,
  };
  const base = basePrices[symbol] || 100;
  const now = new Date();
  const history: any[] = [];
  let price = base + (Math.random() - 0.5) * 20;
  for (let i = 0; i < 24; i++) {
    const time = new Date(now.getTime() - (23 - i) * 60 * 60 * 1000);
    // Random walk
    price = price + (Math.random() - 0.5) * 5;
    // Clamp to positive
    price = Math.max(price, 0.1);
    history.push({
      time: time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      price: Number(price.toFixed(2)),
      datetime: time.toISOString(),
    });
  }
  const currentPrice = history[history.length - 1].price;
  const change = Number(((Math.random() - 0.5) * 10).toFixed(2));
  return {
    symbol,
    current: {
      price: currentPrice,
      change,
      changePercent: Number(((change / currentPrice) * 100).toFixed(2)),
      high: Number((currentPrice + Math.random() * 10).toFixed(2)),
      low: Number((currentPrice - Math.random() * 10).toFixed(2)),
    },
    history,
  };
}

// CoinMarketCap fetch for XAUT/USD
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
  const change = coin.quote.USD.percent_change_24h;
  // Generate dummy history (CMc doesn't provide free historical)
  const now = new Date();
  const history: any[] = [];
  let histPrice = price;
  for (let i = 0; i < 24; i++) {
    const time = new Date(now.getTime() - (23 - i) * 60 * 60 * 1000);
    histPrice = histPrice + (Math.random() - 0.5) * (price * 0.02);
    histPrice = Math.max(histPrice, 0.1);
    history.push({
      time: time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      price: Number(histPrice.toFixed(2)),
      datetime: time.toISOString(),
    });
  }
  return {
    symbol,
    current: {
      price: Number(price.toFixed(2)),
      change: Number(change.toFixed(2)),
      changePercent: Number(change.toFixed(2)),
      high: Number((price * 1.02).toFixed(2)),
      low: Number((price * 0.98).toFixed(2)),
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
        return NextResponse.json(generateDummy(symbol));
      }
    }
  }

  // Fallback to TwelveData for any symbol (if key exists)
  if (!twelveApiKey) {
    console.warn(`TWELVEDATA_API_KEY not set, returning dummy data for ${symbol}`);
    return NextResponse.json(generateDummy(symbol));
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

    // Check if TwelveData returned an error code (e.g. missing symbol)
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
      time: new Date(v.datetime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      price: parseFloat(v.close),
      datetime: v.datetime,
    })).reverse();

    // If history empty, fallback to dummy
    if (history.length === 0) {
      console.warn(`Empty history from TwelveData for ${symbol}, using dummy`);
      return NextResponse.json(generateDummy(symbol));
    }

    return NextResponse.json({
      symbol,
      current: {
        price: parseFloat(quoteData.close) || history[history.length - 1].price,
        change: parseFloat(quoteData.change) || 0,
        changePercent: parseFloat(quoteData.percent_change) || 0,
        high: parseFloat(quoteData.high) || Math.max(...history.map((h: any) => h.price)),
        low: parseFloat(quoteData.low) || Math.min(...history.map((h: any) => h.price)),
      },
      history,
    });
  } catch (error) {
    console.error(`Error fetching market data for ${symbol}:`, error);
    // Fallback to dummy data so UI still shows something
    return NextResponse.json(generateDummy(symbol));
  }
}