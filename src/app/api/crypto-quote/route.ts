import { NextRequest, NextResponse } from "next/server";

// GET /api/crypto-quote?symbol=BTC
// Returns real-time crypto price from Binance 24hr ticker
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol");

  if (!symbol) {
    return NextResponse.json(
      { error: "Symbol parameter is required" },
      { status: 400 }
    );
  }

  const binanceSymbol = symbol === "XAUT" ? "XAUUSDT" : `${symbol.toUpperCase()}USDT`;

  try {
    const url = `https://api.binance.com/api/v3/ticker/24hr?symbol=${binanceSymbol}`;
    const res = await fetch(url, { next: { revalidate: 30 } });

    if (!res.ok) {
      console.warn(`[CryptoQuote] Binance error for ${symbol}: ${res.status}`);
      // Try CoinGecko fallback
      return await fetchCoinGeckoQuote(symbol);
    }

    const data = await res.json();

    // Binance returns price with high precision, use lastPrice
    const price = parseFloat(data.lastPrice);
    const changePercent = parseFloat(data.priceChangePercent);

    if (isNaN(price)) {
      throw new Error("Invalid price data");
    }

    return NextResponse.json({
      symbol: symbol.toUpperCase(),
      price,
      change: parseFloat(data.priceChange),
      changePercent,
      volume: parseFloat(data.volume),
      source: "Binance",
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error(`[CryptoQuote] Error for ${symbol}:`, error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch crypto quote" },
      { status: 500 }
    );
  }
}

// Fallback to CoinGecko if Binance fails
async function fetchCoinGeckoQuote(symbol: string) {
  const idMap: Record<string, string> = {
    BTC: "bitcoin",
    ETH: "ethereum",
    SOL: "solana",
    XRP: "ripple",
    XAUT: "tether-gold",
    KAS: "kaspa",
    DOGE: "dogecoin",
  };

  const coinId = idMap[symbol.toUpperCase()];
  if (!coinId) {
    return NextResponse.json(
      { error: `Unsupported crypto symbol: ${symbol}` },
      { status: 400 }
    );
  }

  try {
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true`;
    const res = await fetch(url, { next: { revalidate: 30 } });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch from CoinGecko" },
        { status: 500 }
      );
    }

    const data = await res.json();
    const coinData = data[coinId];

    return NextResponse.json({
      symbol: symbol.toUpperCase(),
      price: coinData.usd,
      change: 0, // CoinGecko gives percent, calculate change if needed
      changePercent: coinData.usd_24h_change || 0,
      source: "CoinGecko",
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error(`[CryptoQuote] CoinGecko fallback error for ${symbol}:`, error);
    return NextResponse.json(
      { error: "All sources failed" },
      { status: 500 }
    );
  }
}